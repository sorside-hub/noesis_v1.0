export const SUPABASE_NOESIS_SQL = `-- ========================================================
-- NOESIS SUPABASE COMPLETE SCHEMA SETUP (TABLES + RLS + RAG)
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- ========================================================

-- 1. AKTIFKAN EKSTENSI VECTOR (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. TABEL CATATAN & FOLDER (Local-First Cloud Sync)
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  "parentId" TEXT,
  content TEXT,
  metadata JSONB,
  "createdAt" BIGINT,
  "updatedAt" BIGINT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE nodes ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nodes' AND policyname = 'Users can manage their own nodes'
  ) THEN
    CREATE POLICY "Users can manage their own nodes" 
    ON nodes FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. TABEL METADATA AI (Ringkasan, Konsep, Kata Kunci)
CREATE TABLE IF NOT EXISTS note_metadata (
  note_id TEXT PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  summary TEXT,
  keywords TEXT[],
  concepts TEXT[],
  emotion TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  DELETE FROM note_metadata WHERE note_id NOT IN (SELECT id FROM nodes);
  ALTER TABLE note_metadata DROP CONSTRAINT IF EXISTS fk_note_metadata_nodes;
  ALTER TABLE note_metadata
    ADD CONSTRAINT fk_note_metadata_nodes
    FOREIGN KEY (note_id) REFERENCES nodes(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


ALTER TABLE note_metadata ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'note_metadata' AND policyname = 'Users can manage their own note metadata'
  ) THEN
    CREATE POLICY "Users can manage their own note metadata" 
    ON note_metadata FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. TABEL VEKTOR EMBEDDING (RAG Vector Database - BAAI/bge-m3 1024 Dimensi)
CREATE TABLE IF NOT EXISTS note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  source_type TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1024) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'note_embeddings' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE note_embeddings ALTER COLUMN embedding TYPE vector(1024);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DELETE FROM note_embeddings WHERE note_id NOT IN (SELECT id FROM nodes);
  ALTER TABLE note_embeddings DROP CONSTRAINT IF EXISTS fk_note_embeddings_nodes;
  ALTER TABLE note_embeddings
    ADD CONSTRAINT fk_note_embeddings_nodes
    FOREIGN KEY (note_id) REFERENCES nodes(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE note_embeddings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'note_embeddings' AND policyname = 'Users can manage their own note embeddings'
  ) THEN
    CREATE POLICY "Users can manage their own note embeddings" 
    ON note_embeddings FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. FUNGSI PENCARI VEKTOR PINTAR (RPC match_note_embeddings 1024-dimensi)
CREATE OR REPLACE FUNCTION match_note_embeddings (
  query_embedding vector(1024),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  "noteId" text,
  "chunkIndex" integer,
  "sourceType" text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    note_id as "noteId",
    chunk_index as "chunkIndex",
    source_type as "sourceType",
    note_embeddings.content,
    1 - (note_embeddings.embedding <=> query_embedding) AS similarity
  FROM note_embeddings
  WHERE 1 - (note_embeddings.embedding <=> query_embedding) > match_threshold
    AND user_id = auth.uid()
  ORDER BY note_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. TABEL RIWAYAT CHAT (Local-First Cloud Sync)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "isPinned" BOOLEAN DEFAULT false,
  "memorySummary" TEXT,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Migrasi jika tabel chat_sessions sudah ada sebelumnya
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS "memorySummary" TEXT;

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_sessions' AND policyname = 'Users can manage their own chat sessions'
  ) THEN
    CREATE POLICY "Users can manage their own chat sessions" 
    ON chat_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


CREATE TABLE IF NOT EXISTS media_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  type text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at timestamp with time zone
);

-- RLS for media_attachments
ALTER TABLE media_attachments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Drop legacy individual policies if exist to prevent ERROR 42710
  DROP POLICY IF EXISTS "Users can insert their own media attachments" ON media_attachments;
  DROP POLICY IF EXISTS "Users can read their own media attachments" ON media_attachments;
  DROP POLICY IF EXISTS "Users can update their own media attachments" ON media_attachments;
  DROP POLICY IF EXISTS "Users can delete their own media attachments" ON media_attachments;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media_attachments' AND policyname = 'Users can manage their own media attachments'
  ) THEN
    CREATE POLICY "Users can manage their own media attachments" 
    ON media_attachments FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,
  chunks JSONB,
  "createdAt" BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can manage their own chat messages'
  ) THEN
    CREATE POLICY "Users can manage their own chat messages" 
    ON chat_messages FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7. TABEL VEKTOR EMBEDDING SESI CHAT (RAG Memory - BAAI/bge-m3 1024 Dimensi)
CREATE TABLE IF NOT EXISTS chat_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1024) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_embeddings' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE chat_embeddings ALTER COLUMN embedding TYPE vector(1024);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DELETE FROM chat_embeddings WHERE session_id NOT IN (SELECT id FROM chat_sessions);
  ALTER TABLE chat_embeddings DROP CONSTRAINT IF EXISTS fk_chat_embeddings_sessions;
  ALTER TABLE chat_embeddings
    ADD CONSTRAINT fk_chat_embeddings_sessions
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE chat_embeddings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_embeddings' AND policyname = 'Users can manage their own chat embeddings'
  ) THEN
    CREATE POLICY "Users can manage their own chat embeddings" 
    ON chat_embeddings FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 8. FUNGSI PENCARI VEKTOR CHAT (RPC match_chat_embeddings 1024-dimensi)
CREATE OR REPLACE FUNCTION match_chat_embeddings (
  query_embedding vector(1024),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  "sessionId" text,
  "chunkIndex" integer,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    session_id as "sessionId",
    chunk_index as "chunkIndex",
    chat_embeddings.content,
    1 - (chat_embeddings.embedding <=> query_embedding) AS similarity
  FROM chat_embeddings
  WHERE 1 - (chat_embeddings.embedding <=> query_embedding) > match_threshold
    AND user_id = auth.uid()
  ORDER BY chat_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 9. AKTIFKAN SUPABASE REALTIME (Sinkronisasi Antar Device)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'nodes') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE nodes';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_sessions') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'media_attachments') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE media_attachments';
  END IF;
END $$;
`;

export const SUPABASE_MUSIC_STUDIO_SQL = `-- ========================================================
-- NOESIS MUSIC STUDIO SCHEMA SETUP
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- ========================================================

-- 1. TABEL PROYEK MUSIK (Album, EP, Single)
CREATE TABLE IF NOT EXISTS studio_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'album', -- 'album' | 'ep' | 'single'
  status TEXT NOT NULL DEFAULT 'idea', -- 'idea' | 'demo' | 'recording' | 'mixing' | 'ready' | 'released'
  theme TEXT, -- Tema besar album / EP
  genre TEXT,
  target_release_date TEXT,
  cover_url TEXT,
  description TEXT, -- Premis / konsep cerita album
  progress_note TEXT, -- Catatan progres album (misal: "3/6 track beres")
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pastikan kolom baru tetap ada jika tabel sudah dibuat sebelumnya (Auto-migration)
ALTER TABLE studio_projects 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'idea',
  ADD COLUMN IF NOT EXISTS theme TEXT,
  ADD COLUMN IF NOT EXISTS progress_note TEXT;

ALTER TABLE studio_projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their own studio projects" ON studio_projects;
  CREATE POLICY "Users can manage their own studio projects" 
  ON studio_projects FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
END $$;

-- 2. TABEL LAGU STUDIO (Songs: Single & Track Album)
CREATE TABLE IF NOT EXISTS studio_songs (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES studio_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  premise TEXT DEFAULT '', -- Premis & konsep cerita lagu
  scratchpad TEXT DEFAULT '', -- Raw bars & ide rima mentah
  content_lyrics TEXT DEFAULT '', -- Lirik aktif & chord
  status TEXT NOT NULL DEFAULT 'idea', -- 'idea' | 'demo' | 'recording' | 'mixing' | 'ready' | 'released'
  progress INTEGER DEFAULT 0, -- Progres manual 0 - 100%
  progress_note TEXT, -- Catatan progres lagu
  release_type TEXT DEFAULT 'single', -- 'single' | 'ep' | 'album'
  track_number INTEGER,
  musical_key TEXT DEFAULT 'C',
  bpm INTEGER DEFAULT 120,
  capo INTEGER DEFAULT 0,
  time_signature TEXT DEFAULT '4/4',
  tuning TEXT DEFAULT 'Standard (E A D G B E)',
  theme TEXT, -- Tema lagu
  genre TEXT,
  target_release_date TEXT,
  reference_link TEXT,
  audio_url TEXT,
  cover_url TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pastikan kolom baru tetap ada jika tabel sudah dibuat sebelumnya (Auto-migration)
ALTER TABLE studio_songs 
  ADD COLUMN IF NOT EXISTS premise TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_note TEXT,
  ADD COLUMN IF NOT EXISTS theme TEXT,
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

ALTER TABLE studio_songs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their own studio songs" ON studio_songs;
  CREATE POLICY "Users can manage their own studio songs" 
  ON studio_songs FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
END $$;

-- 3. TABEL VERSI LIRIK & DRAFT (Lyric Versions)
CREATE TABLE IF NOT EXISTS studio_lyric_versions (
  id TEXT PRIMARY KEY,
  song_id TEXT NOT NULL REFERENCES studio_songs(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_focused BOOLEAN DEFAULT FALSE, -- Penanda versi aktif / sedang dikerjakan
  is_final BOOLEAN DEFAULT FALSE, -- Penanda versi master release
  musical_key TEXT DEFAULT 'C',
  bpm INTEGER DEFAULT 120,
  capo INTEGER DEFAULT 0,
  time_signature TEXT DEFAULT '4/4',
  tuning TEXT DEFAULT 'Standard (E A D G B E)',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pastikan kolom baru tetap ada jika tabel sudah dibuat sebelumnya (Auto-migration)
ALTER TABLE studio_lyric_versions 
  ADD COLUMN IF NOT EXISTS is_focused BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS musical_key TEXT DEFAULT 'C',
  ADD COLUMN IF NOT EXISTS bpm INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS capo INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_signature TEXT DEFAULT '4/4',
  ADD COLUMN IF NOT EXISTS tuning TEXT DEFAULT 'Standard (E A D G B E)',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE studio_lyric_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their own lyric versions" ON studio_lyric_versions;
  CREATE POLICY "Users can manage their own lyric versions" 
  ON studio_lyric_versions FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
END $$;

-- 4. INDEKS PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_studio_songs_project_id ON studio_songs(project_id);
CREATE INDEX IF NOT EXISTS idx_studio_lyric_versions_song_id ON studio_lyric_versions(song_id);

-- 5. AKTIFKAN SUPABASE REALTIME UNTUK STUDIO MUSIK
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'studio_projects') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE studio_projects';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'studio_songs') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE studio_songs';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'studio_lyric_versions') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE studio_lyric_versions';
  END IF;
END $$;
`;

export const SUPABASE_SETUP_SQL = SUPABASE_NOESIS_SQL;

