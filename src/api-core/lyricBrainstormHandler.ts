import { KeySlotId } from '../lib/ai/types';
import { executeWithFailover } from '../lib/ai/failoverAdapter';
import { getGeminiFirstCascade } from '../lib/ai/cascadeProfiles';
import { 
  LyricBrainstormMode, 
  LyricBrainstormToneStyle, 
  LyricBrainstormSuggestion 
} from '../features/music/types/studioDatabase';

export interface LyricBrainstormRequest {
  keyword: string;
  mode: LyricBrainstormMode;
  toneStyle: LyricBrainstormToneStyle;
  contextSnippet?: string;
  songTitle?: string;
  genre?: string;
  premise?: string;
}

const TONE_INSTRUCTIONS: Record<LyricBrainstormToneStyle, string> = {
  raw: `Kamu adalah lyricist rock/punk/grunge/alternative.
TUGAS: Hasilkan diksi, metafora, atau variasi lirik yang MENTAH, TAJAM, LUGAS, SARKASTIK, dan BERANI.
ATURAN EMAS:
1. DILARANG KERAS menggunakan bahasa puitis menye-menye, bunga-bunga, atau klise romantis usang.
2. Gunakan objek konkret dunia nyata yang kasar dan jujur (aspal basah, kaca retak, tagihan menumpuk, puntung rokok, kebisingan kota, knalpot, kerah kotor).
3. Beri sentuhan sarkasme, frustrasi, atau amarah nyata tanpa basa-basi santun.
4. Ritme suku kata harus tegas, menghentak, dan enak diteriakkan di mikrofon panggung rock/punk.`,

  indie_folk: `Kamu adalah songwriter indie-folk/folk-pop realis keseharian.
TUGAS: Hasilkan diksi, metafora, atau baris lirik yang MEMBUMI, JUJUR, HANGAT, dan REFLEKTIF.
ATURAN EMAS:
1. HINDARI klise usang "senja, kopi, semesta, rintik hujan" yang membosankan.
2. Angkat detail keseharian yang sangat spesifik dan personal (jam dinding tua, kipas angin berdecit, teh manis dingin, helm basah, percakapan canggung).
3. Buat pendengar merasa: "ini adalah rekaman jujur tentang hidup nyata yang sangat dekat denganku".
4. Nada bicara santai seperti bertutur kepada kawan dekat.`,

  poetic: `Kamu adalah sastrawan musik dan penulis lirik puitis kontemporer.
TUGAS: Hasilkan metafora segar dan diksi sastra yang ELEGAN, AMBIGU, dan MEMILIKI LAPISAN MAKNA MENDALAM.
ATURAN EMAS:
1. DILARANG KERAS menggunakan klise basi: "derai air mata", "rembulan malam", "terhempas badai", "lilin redup", "merasuk sukma".
2. Gunakan citraan multi-indera (perubahan suhu udara, aroma tanah, tekstur kain lama, gema lorong, frekuensi suara).
3. Analogi harus segar, filosofis, tidak murahan, dan memancing kontemplasi pendengar.`,

  pop_urban: `Kamu adalah songwriter pop kontemporer / R&B modern.
TUGAS: Hasilkan baris lirik yang CATCHY, NATURAL, MEMIKAT, dan BERGAYA OBROLAN MASA KINI.
ATURAN EMAS:
1. Gunakan bahasa percakapan sehari-hari yang luwes, tidak kaku, dan mudah diingat setelah satu kali dengar.
2. Hindari kata-kata arkais atau istilah yang terdengar asing bagi pendengar playlist streaming hari ini.
3. Ritme lirik harus mengalir mulus (smooth flow) mengikuti denyut ketukan beat modern.`,

  hiphop: `Kamu adalah lyricist Hip-Hop & Rap rima padat.
TUGAS: Hasilkan baris lirik dengan rima ganda (multisyllabic rhyme), punchline tajam, dan flow beritme rapat.
ATURAN EMAS:
1. Utamakan rima dalam (internal rhyme) dan asonansi vokal yang tajam.
2. Sertakan wordplay cerdas, analogi kontemporer, dan punchline yang memukul telak.
3. Rancang panjang suku kata agar pas diletakkan di dalam birama ketukan drum hip-hop.`
};

const MODE_INSTRUCTIONS: Record<LyricBrainstormMode, string> = {
  metaphor: `FOKUS MODE: METAFORA SEGAR & ANALOGI UNIK.
Cari perumpamaan, kiasan, atau simbol tak terduga yang menggambarkan topik/kata kunci tersebut. Hindari analogi klise.`,

  rhyme: `FOKUS MODE: DIKSI & RIMA KATA (RHYME BANK).
Hasilkan pasangan kata atau frasa berima (baik rima sempurna maupun slant/half-rhyme alami) yang cocok dipadukan dengan kata kunci. Beri contoh baris pendek pengaplikasiannya.`,

  variations: `FOKUS MODE: VARIASI BARIS ALTERNATIF.
Tuliskan 4–5 variasi alternatif penulisan untuk mengekspresikan maksud yang sama dengan sudut pandang, ritme, dan pilihan kata yang berbeda-beda.`,

  imagery: `FOKUS MODE: CITRAAN INDERA & DETAIL VISUAL (SENSORY IMAGERY).
Gambarkan adegan fisik konkret yang melibatkan indera penglihatan, pendengaran, sentuhan, atau penciuman untuk membuat lirik terasa seperti adegan film hidup.`
};

export async function handleLyricBrainstorm(
  payload: LyricBrainstormRequest,
  customKeys?: Partial<Record<KeySlotId, string>>,
  envObj: Record<string, string | undefined> = (typeof process !== 'undefined' ? process.env : {})
) {
  const { keyword, mode, toneStyle, contextSnippet, songTitle, genre, premise } = payload;

  const toneRule = TONE_INSTRUCTIONS[toneStyle] || TONE_INSTRUCTIONS.raw;
  const modeRule = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.metaphor;

  const prompt = `Anda adalah studio lyricist brainstorming companion profesional.
Bahasa: Bahasa Indonesia (bisa dicampur slang / istilah natural sesuai karakter nada).

${toneRule}

${modeRule}

KONTEKS LAGU:
- Judul Lagu: ${songTitle || 'Tanpa Judul'}
${genre ? `- Genre: ${genre}` : ''}
${premise ? `- Premis / Cerita Lagu: ${premise}` : ''}
${contextSnippet ? `- Potongan Lirik / Sekitar: "${contextSnippet}"` : ''}

KATA KUNCI / BARIS YANG SEDANG DIBRAINSTORM:
"${keyword}"

FORMAT OUTPUT WAJIB:
Kembalikan HANYA format JSON valid tanpa kata pengantar atau penutup. 
Hasilkan tepat 4 sampai 5 saran ide terbaik.
JSON Schema:
{
  "suggestions": [
    {
      "id": "1",
      "text": "Baris atau diksi lirik yang dihasilkan",
      "tag": "Label pendek gaya/kategori (misal: 'Sarkasme Tajam', 'Objek Nyata', 'Slant Rhyme', 'Citraan Suara', dll - maks 3 kata)",
      "nuance": "Penjelasan singkat rasa bahasa atau cara menempatkannya (1 kalimat pendek)"
    }
  ]
}

JANGAN gunakan markdown code block (\`\`\`json) jika memungkinkan, langsung keluarkan objek JSON.`;

  return executeWithFailover(
    { cascade: getGeminiFirstCascade(), customKeys, envObj },
    async (client, _slotId, model) => {
      const response = await client.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          temperature: 0.85,
        }
      });

      let rawText = response.text || '';
      // Strip markdown code fences if present
      rawText = rawText.trim();
      if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      let parsed: { suggestions: LyricBrainstormSuggestion[] };
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        // Fallback simple line extractor if JSON parsing fails
        const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
        const fallbackSuggestions: LyricBrainstormSuggestion[] = lines.slice(0, 5).map((l, idx) => ({
          id: String(idx + 1),
          text: l.replace(/^[-*•\d.]+\s*/, '').trim(),
          tag: 'Ide Lirik',
          nuance: 'Saran penulisan lirik'
        }));
        parsed = { suggestions: fallbackSuggestions };
      }

      if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
        throw new Error('Format respon AI tidak memuat daftar saran lirik');
      }

      return {
        suggestions: parsed.suggestions,
        modelUsed: model,
      };
    }
  );
}
