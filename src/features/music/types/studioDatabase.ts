import { MusicProductionStatus, MusicProjectType } from '../types';

export interface StudioProjectRecord {
  id: string;
  title: string;
  type: MusicProjectType;
  genre?: string;
  targetReleaseDate?: string;
  coverUrl?: string;
  description?: string;
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
  contentLyrics: string;
  status: MusicProductionStatus;
  musicalKey: string;
  bpm: number;
  capo: number;
  timeSignature: string;
  tuning: string;
  genre?: string;
  targetReleaseDate?: string;
  premise?: string; // Konsep / Premis / Cerita lagu
  scratchpad: string; // Raw bars & ide mentah
  referenceLink?: string;
  audioUrl?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: number;
}

export interface StudioLyricVersionRecord {
  id: string;
  songId: string;
  versionName: string;
  content: string;
  isFinal?: boolean; // Penanda versi final / master
  createdAt: string;
}
