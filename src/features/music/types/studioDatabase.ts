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
