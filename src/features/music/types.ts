export type MusicProductionStatus = 
  | 'idea' 
  | 'demo' 
  | 'recording' 
  | 'mixing' 
  | 'ready' 
  | 'released';

export type MusicProjectType = 'single' | 'ep' | 'album';

export interface SongMetadata {
  key?: string;
  bpm?: number;
  timeSignature?: string;
  tuning?: string;
  capo?: number;
  project?: string; // Album or EP name/id
  theme?: string;
  genre?: string;
  targetReleaseDate?: string;
  hasAudioMemo?: boolean;
}

export interface SongItem {
  id: string;
  title: string;
  status: MusicProductionStatus;
  progress?: number;
  key?: string;
  bpm?: number;
  timeSignature?: string;
  tuning?: string;
  capo?: number;
  project?: string;
  theme?: string;
  genre?: string;
  tags?: string[];
  snippet?: string;
  hasAudioMemo?: boolean;
  updatedAt: number;
  createdAt: number;
}

export interface MusicProject {
  id: string;
  title: string;
  type: MusicProjectType;
  status: MusicProductionStatus;
  releaseDate?: string;
  theme?: string;
  genre?: string;
  coverUrl?: string;
  description?: string;
  songs: SongItem[];
  updatedAt: number;
  createdAt: number;
}

export interface MusicReleaseItem {
  id: string;
  kind: 'song' | 'project';
  type: MusicProjectType;
  title: string;
  status: MusicProductionStatus;
  theme?: string;
  coverUrl?: string;
  progress?: number;
  progressNote?: string;
  trackCount?: number;
  updatedAt: number;
  createdAt: number;
}

export const PRODUCTION_STAGES: {
  id: MusicProductionStatus;
  label: string;
  color: string;
  bgLight: string;
  icon: string;
}[] = [
  { id: 'idea', label: 'Ide & Draft', color: 'text-amber-500', bgLight: 'bg-amber-500/10', icon: '💡' },
  { id: 'demo', label: 'Demo & Guide', color: 'text-blue-500', bgLight: 'bg-blue-500/10', icon: '🎙️' },
  { id: 'recording', label: 'Recording', color: 'text-purple-500', bgLight: 'bg-purple-500/10', icon: '🎛️' },
  { id: 'mixing', label: 'Mix & Master', color: 'text-indigo-500', bgLight: 'bg-indigo-500/10', icon: '🎚️' },
  { id: 'ready', label: 'Ready', color: 'text-emerald-500', bgLight: 'bg-emerald-500/10', icon: '✨' },
  { id: 'released', label: 'Released', color: 'text-teal-500', bgLight: 'bg-teal-500/10', icon: '🚀' },
];
