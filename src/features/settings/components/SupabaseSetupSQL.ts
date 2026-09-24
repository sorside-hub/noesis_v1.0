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

CREATE POLICY "Users can insert their own media attachments" ON media_attachments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read their own media attachments" ON media_attachments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own media attachments" ON media_attachments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own media attachments" ON media_attachments FOR DELETE USING (auth.uid() = user_id);

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

export const SUPABASE_SETUP_SQL = SUPABASE_NOESIS_SQL;
