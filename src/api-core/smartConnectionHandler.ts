import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getGeminiFirstCascade } from '../lib/ai/cascadeProfiles';

export interface ExplainConnectionPayload {
  noteA: {
    title: string;
    summary?: string;
    concepts?: string[];
    emotion?: string;
  };
  noteB: {
    title: string;
    summary?: string;
    concepts?: string[];
    emotion?: string;
  };
  sharedConcepts?: string[];
  sharedKeywords?: string[];
  customKeys?: Partial<Record<KeySlotId, string>>;
}

export async function handleExplainConnection(
  payload: ExplainConnectionPayload,
  customKeys?: Partial<Record<KeySlotId, string>>,
  envObj: Record<string, string | undefined> = (typeof process !== 'undefined' ? process.env : {})
) {
  const { noteA, noteB, sharedConcepts = [], sharedKeywords = [] } = payload;

  return executeWithFailover(
    { cascade: getGeminiFirstCascade(), customKeys: customKeys || payload.customKeys, envObj },
    async (client, _slotId, model) => {
      const prompt = `Kamu adalah mesin penemu wawasan cerdas di Noesis Knowledge Vault.
Tugasmu adalah menganalisis dua catatan yang memiliki hubungan tersembunyi dan merumuskan benang merah atau sintesis filosofis/konseptual yang menghubungkan keduanya.

Catatan 1:
- Judul: "${noteA.title}"
- Ringkasan: "${noteA.summary || 'Tidak ada ringkasan'}"
- Konsep: "${noteA.concepts?.join(', ') || '-'}"
- Emosi/Nada: "${noteA.emotion || '-'}"

Catatan 2:
- Judul: "${noteB.title}"
- Ringkasan: "${noteB.summary || 'Tidak ada ringkasan'}"
- Konsep: "${noteB.concepts?.join(', ') || '-'}"
- Emosi/Nada: "${noteB.emotion || '-'}"

Irisan Konsep: ${sharedConcepts.length > 0 ? sharedConcepts.join(', ') : '-'}
Irisan Kata Kunci: ${sharedKeywords.length > 0 ? sharedKeywords.join(', ') : '-'}

Instruksi:
Tuliskan 1 hingga MAKSIMAL 2 kalimat padat, tajam, dan elegan dalam Bahasa Indonesia yang menjelaskan korelasi intelektual atau sintesis pemikiran yang lahir jika kedua catatan ini disatukan. Jangan gunakan basa-basi pembuka, langsung jelaskan inti benang merahnya.`;

      const response = await client.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      const explanation = (response.text || '').trim();
      return { explanation, modelUsed: model };
    }
  );
}
