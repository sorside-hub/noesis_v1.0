import { MusicProductionStatus, MusicProjectType } from '../types';

export interface StudioProjectRecord {
  id: string;
  title: string;
  type: MusicProjectType;
  status?: MusicProductionStatus;
  theme?: string; // Tema besar album / EP
  genre?: string;
  targetReleaseDate?: string;
  coverUrl?: string;
  description?: string;
  progressNote?: string; // Catatan/komen progres album (misal: "3/6 track beres")
  createdAt: string;
  updatedAt: string;
  deletedAt?: number;
}

export interface StudioSongRecord {
  id: string;
  projectId?: string;
  releaseType?: MusicProjectType;
  trackNumber?: number;
  title: string;
  contentLyrics?: string;
  status: MusicProductionStatus;
  musicalKey?: string;
  bpm?: number;
  capo?: number;
  timeSignature?: string;
  tuning?: string;
  theme?: string; // Tema lagu
  genre?: string;
  targetReleaseDate?: string;
  premise?: string; // Konsep / Premis / Cerita lagu
  scratchpad: string; // Raw bars & ide mentah
  progress?: number; // Manual progress 0 - 100%
  progressNote?: string; // Catatan/komen progres (misal: "chorus kurang mantab")
  referenceLink?: string;
  audioUrl?: string;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: number;
}

export interface StudioLyricVersionRecord {
  id: string;
  songId: string;
  versionName: string;
  content: string;
  isFocused?: boolean; // Penanda versi aktif / sedang dikerjakan
  isFinal?: boolean; // Penanda versi final / master
  musicalKey?: string;
  bpm?: number;
  capo?: number;
  timeSignature?: string;
  tuning?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StudioBarRecord {
  id: string;
  title: string;
  content: string; // Teks baris lirik & chord
  theme?: string; // Tema / vibe (Cinta, Melankolis, Kritik, dll)
  topic?: string; // Topik / subjek cerita spesifik (Ditinggal nikah, LDR, dll)
  rhymeScheme?: string; // Skema rima (AABB, ABAB, Bebas, dll)
  barCount?: number; // Jumlah bar (misal 4, 8, 16)
  status: 'available' | 'used'; // Status penggunaan
  usedInSongId?: string | null; // Id lagu jika sudah terpakai
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: number;
}

export interface ChordProgressionSection {
  id: string;
  name: string;             // e.g. "Verse 1", "Verse 2", "Chorus", "Bridge", "Intro", "Outro"
  chords: string[];         // e.g. ["Em", "D", "C", "G"]
  romans: string[];         // e.g. ["vi", "V", "IV", "I"]
  notes?: string;           // Catatan / aransemen seksi
}

export interface StudioChordProgressionRecord {
  id: string;
  title: string;
  key: string;              // e.g. "C", "Am", "G", "F#m"
  scale: string;            // e.g. "Major", "Natural Minor", "Dorian", "Mixolydian"
  mood: string;             // e.g. "Melankolis", "Heroik & Epik", "Nostalgia", "Ceria & Enerjik", "Gelap & Tegang", "Misterius", "Tenang & Santai"
  romans: string[];         // e.g. ["I", "V", "vi", "IV"]
  chords: string[];         // e.g. ["C", "G", "Am", "F"]
  sections?: ChordProgressionSection[]; // Multi-bagian lagu (Verse 1, Verse 2, Chorus, dll)
  description?: string;     // Penjelasan harmoni & karakter emosional
  bpm?: number;             // Rekomendasi tempo
  genre?: string;           // Rekomendasi genre (Pop, Rock, Ballad, Indie, dll)
  tags?: string[];
  notes?: string;           // Catatan musisi
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: number;
}

export type LyricBrainstormToneStyle = 'raw' | 'indie_folk' | 'poetic' | 'pop_urban' | 'hiphop';

export type LyricBrainstormMode = 'metaphor' | 'rhyme' | 'variations' | 'imagery';

export interface LyricBrainstormSuggestion {
  id: string;
  text: string;
  tag?: string;             // e.g. "Slant Rhyme", "Citraan Visual", "Sarkasme Tajam"
  nuance?: string;          // Catatan rasa bahasa / penjelasan
}

export interface StudioLyricBrainstormRecord {
  id: string;
  songId: string;           // ID lagu induk
  versionId?: string;       // ID versi lirik pemanggil
  mode: LyricBrainstormMode;
  toneStyle: LyricBrainstormToneStyle;
  keyword: string;          // Kata kunci / baris yang dieksplorasi
  contextSnippet?: string;  // Konteks lirik / tema lagu
  suggestions: LyricBrainstormSuggestion[];
  createdAt: string;
  updatedAt?: string;
  deletedAt?: number;
}

