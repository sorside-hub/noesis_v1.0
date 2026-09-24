import { EnrichedNoteItem } from '../types';
import { SmartConnectionPair, SmartConnectionType } from '../types/smartConnection';

const CACHE_PREFIX = 'noesis_sc_exp_';

/**
 * Normalizes string for fuzzy comparison
 */
function normalize(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * Checks if two sets of strings have intersections
 */
function getIntersection(arrA: string[] = [], arrB: string[] = []): string[] {
  const setB = new Set(arrB.map(normalize));
  const seen = new Set<string>();
  const intersection: string[] = [];

  for (const item of arrA) {
    const norm = normalize(item);
    if (setB.has(norm) && !seen.has(norm)) {
      seen.add(norm);
      intersection.push(item);
    }
  }

  return intersection;
}

/**
 * Checks if two emotions resonate with each other
 */
function checkEmotionResonance(emotionA?: string, emotionB?: string): { isCompatible: boolean; score: number } {
  if (!emotionA || !emotionB) return { isCompatible: false, score: 0 };
  const a = normalize(emotionA);
  const b = normalize(emotionB);

  if (a === 'neutral' || b === 'neutral') return { isCompatible: false, score: 0 };
  if (a === b) return { isCompatible: true, score: 20 };

  // Compatible emotional clusters
  const contemplativeCluster = ['reflektif', 'filosofis', 'kontemplatif', 'melankolis', 'cemas', 'ragu'];
  const energeticCluster = ['antusias', 'optimis', 'ambisius', 'kreatif', 'bersemangat', 'defiant'];
  const analyticalCluster = ['analitis', 'kritis', 'skeptis', 'terstruktur', 'logis'];

  const inSameCluster =
    (contemplativeCluster.includes(a) && contemplativeCluster.includes(b)) ||
    (energeticCluster.includes(a) && energeticCluster.includes(b)) ||
    (analyticalCluster.includes(a) && analyticalCluster.includes(b));

  if (inSameCluster) {
    return { isCompatible: true, score: 14 };
  }

  return { isCompatible: false, score: 0 };
}

/**
 * Tests if noteA already links to noteB or vice versa in its raw markdown content
 */
function checkAlreadyLinked(noteA: EnrichedNoteItem, noteB: EnrichedNoteItem): boolean {
  const titleA = normalize(noteA.title);
  const titleB = normalize(noteB.title);
  const contentA = normalize(noteA.node.content || '');
  const contentB = normalize(noteB.node.content || '');

  const aLinksB = contentA.includes(`[[${titleB}`) || (noteB.aliases || []).some(al => contentA.includes(`[[${normalize(al)}`));
  const bLinksA = contentB.includes(`[[${titleA}`) || (noteA.aliases || []).some(al => contentB.includes(`[[${normalize(al)}`));

  return aLinksB || bLinksA;
}

export class SmartConnectionEngine {
  /**
   * Generates a stable unique pair ID sorted alphabetically
   */
  static getPairId(idA: string, idB: string): string {
    return [idA, idB].sort().join('___');
  }

  /**
   * Retrieves cached AI explanation from local storage
   */
  static getCachedExplanation(pairId: string): string | undefined {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${pairId}`);
      return cached || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Saves AI explanation to local storage permanently
   */
  static setCachedExplanation(pairId: string, explanation: string): void {
    try {
      localStorage.setItem(`${CACHE_PREFIX}${pairId}`, explanation.trim());
    } catch (err) {
      console.warn('[SmartConnectionEngine] Failed to cache explanation:', err);
    }
  }

  /**
   * Core multi-layer matching algorithm.
   * Runs in milliseconds entirely in memory across enriched notes.
   */
  static computeConnections(notes: EnrichedNoteItem[]): SmartConnectionPair[] {
    if (!notes || notes.length < 2) return [];

    const pairs: SmartConnectionPair[] = [];

    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const noteA = notes[i];
        const noteB = notes[j];

        // 1. Check if already linked
        const alreadyLinked = checkAlreadyLinked(noteA, noteB);

        // 2. Conceptual Overlap Layer (Highest weight: 35% max)
        const sharedConcepts = getIntersection(noteA.concepts, noteB.concepts);
        const conceptScore = Math.min(sharedConcepts.length * 15, 35);

        // 3. Keyword Overlap Layer (20% max)
        const sharedKeywords = getIntersection(noteA.keywords, noteB.keywords);
        const keywordScore = Math.min(sharedKeywords.length * 7, 20);

        // 4. Tag Overlap Layer (15% max)
        const sharedTags = getIntersection(noteA.tags, noteB.tags);
        const tagScore = Math.min(sharedTags.length * 8, 15);

        // 5. Emotional Resonance Layer (15% max)
        const emotionRes = checkEmotionResonance(noteA.emotion, noteB.emotion);
        const emotionScore = Math.min(emotionRes.score, 15);

        // 6. Custom Property Matching (10% max)
        const sharedCustomProps: Array<{ key: string; value: string }> = [];
        let customPropScore = 0;
        const propsA = noteA.properties || {};
        const propsB = noteB.properties || {};

        for (const [key, valA] of Object.entries(propsA)) {
          if (['title', 'type', 'status', 'tags', 'aliases', 'summary', 'keywords', 'concepts', 'emotion'].includes(key)) continue;
          const valB = propsB[key];
          if (valA && valB && normalize(String(valA)) === normalize(String(valB))) {
            sharedCustomProps.push({ key, value: String(valA) });
            customPropScore += 5;
          }
        }
        customPropScore = Math.min(customPropScore, 10);

        // 7. Cross-Disciplinary & Serendipity Bonus (Up to +12)
        // Bonus for notes from different folders or note types that share strong concepts
        let crossBonus = 0;
        const isDifferentFolder = noteA.node.parentId !== noteB.node.parentId;
        const isDifferentType = noteA.type && noteB.type && noteA.type !== noteB.type;
        if ((isDifferentFolder || isDifferentType) && (sharedConcepts.length > 0 || sharedKeywords.length > 1)) {
          crossBonus = 12;
        }

        // Total calculated score
        let totalScore = conceptScore + keywordScore + tagScore + emotionScore + customPropScore + crossBonus;

        // Cap at 99
        totalScore = Math.min(Math.round(totalScore), 99);

        // Minimum threshold to be considered an insight
        if (totalScore >= 24) {
          // Determine dominant connection type
          let connectionType: SmartConnectionType = 'hybrid';
          if (conceptScore >= 25 || (sharedConcepts.length >= 2 && conceptScore > emotionScore)) {
            connectionType = 'conceptual';
          } else if (emotionScore >= 12 && emotionRes.isCompatible) {
            connectionType = 'emotional';
          } else if (crossBonus > 0 && (isDifferentFolder || isDifferentType)) {
            connectionType = 'cross_disciplinary';
          }

          const pairId = SmartConnectionEngine.getPairId(noteA.id, noteB.id);
          const cachedExplanation = SmartConnectionEngine.getCachedExplanation(pairId);

          pairs.push({
            id: pairId,
            sourceNote: noteA,
            targetNote: noteB,
            score: totalScore,
            connectionType,
            sharedConcepts,
            sharedKeywords,
            sharedTags,
            sharedCustomProps,
            emotionMatch: {
              sourceEmotion: noteA.emotion || '',
              targetEmotion: noteB.emotion || '',
              isCompatible: emotionRes.isCompatible,
            },
            alreadyLinked,
            aiExplanation: cachedExplanation,
          });
        }
      }
    }

    // Sort: Unlinked connections first, then highest score descending
    return pairs.sort((a, b) => {
      if (a.alreadyLinked !== b.alreadyLinked) {
        return a.alreadyLinked ? 1 : -1;
      }
      return b.score - a.score;
    });
  }

  /**
   * Calls AI endpoint on-demand to formulate the synthesis bridge
   */
  static async requestAiExplanation(
    pair: SmartConnectionPair,
    customKeys?: any
  ): Promise<string> {
    // Return cached if already available
    const existing = SmartConnectionEngine.getCachedExplanation(pair.id);
    if (existing) return existing;

    const payload = {
      noteA: {
        title: pair.sourceNote.title,
        summary: pair.sourceNote.summary,
        concepts: pair.sourceNote.concepts,
        emotion: pair.sourceNote.emotion,
      },
      noteB: {
        title: pair.targetNote.title,
        summary: pair.targetNote.summary,
        concepts: pair.targetNote.concepts,
        emotion: pair.targetNote.emotion,
      },
      sharedConcepts: pair.sharedConcepts,
      sharedKeywords: pair.sharedKeywords,
      customKeys,
    };

    const res = await fetch('/api/smart-connections/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to generate explanation (Status ${res.status})`);
    }

    const json = await res.json();
    if (!json.success || !json.data?.explanation) {
      throw new Error(json.attempts?.[json.attempts.length - 1]?.error || 'Failed to generate explanation');
    }

    const explanation = json.data.explanation as string;
    SmartConnectionEngine.setCachedExplanation(pair.id, explanation);
    return explanation;
  }
}
