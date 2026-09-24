import { EnrichedNoteItem } from '../types';

export type SmartConnectionType = 'conceptual' | 'emotional' | 'cross_disciplinary' | 'hybrid';

export interface SmartConnectionPair {
  id: string; // Unique pair identifier e.g. "idA_idB"
  sourceNote: EnrichedNoteItem;
  targetNote: EnrichedNoteItem;
  score: number; // 0 to 100
  connectionType: SmartConnectionType;
  sharedConcepts: string[];
  sharedKeywords: string[];
  sharedTags: string[];
  sharedCustomProps: Array<{ key: string; value: string }>;
  emotionMatch?: {
    sourceEmotion: string;
    targetEmotion: string;
    isCompatible: boolean;
  };
  alreadyLinked: boolean;
  aiExplanation?: string;
}

export interface SmartConnectionFilter {
  type: 'all' | 'conceptual' | 'emotional' | 'cross_disciplinary';
  minScore: number;
  hideAlreadyLinked: boolean;
  searchQuery: string;
}
