// ==========================================
// CHORD THEORY & PROGRESSION GENERATOR ENGINE
// Accurate diatonic harmony, mood mappings, and Web Audio synth preview
// ==========================================

export interface ProgressionTemplate {
  id: string;
  name: string;
  mood: string;
  scaleType: 'Major' | 'Natural Minor' | 'Dorian' | 'Mixolydian' | 'Phrygian' | 'Harmonic Minor';
  romans: string[];
  description: string;
  defaultBpm: number;
  genre: string;
  tags: string[];
}

export const ROOT_KEYS = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'
] as const;

export type RootKey = typeof ROOT_KEYS[number];

export const SCALE_TYPES = [
  'Major',
  'Natural Minor',
  'Dorian',
  'Mixolydian',
  'Harmonic Minor',
  'Phrygian',
] as const;

export type ScaleType = typeof SCALE_TYPES[number];

export const MOOD_CATEGORIES = [
  { id: 'Melankolis', label: 'Melankolis & Emosional', color: 'indigo', emoji: '🌧️', desc: 'Sentuhan sedih, reflektif, menyayat hati' },
  { id: 'Heroik & Epik', label: 'Heroik & Epik', color: 'amber', emoji: '⚔️', desc: 'Megah, penuh harapan, sinematik, kemenangan' },
  { id: 'Nostalgia', label: 'Nostalgia & Romantis', color: 'cyan', emoji: '📻', desc: 'Hangat, kenangan masa lalu, manis bersahaja' },
  { id: 'Ceria & Enerjik', label: 'Ceria & Enerjik', color: 'emerald', emoji: '☀️', desc: 'Penuh semangat, cerah, optimis, memicu senyum' },
  { id: 'Gelap & Tegang', label: 'Gelap & Tegang', color: 'rose', emoji: '⚡', desc: 'Mencekam, misteri kelam, intensitas tinggi' },
  { id: 'Misterius', label: 'Misterius & Psychedelic', color: 'purple', emoji: '🔮', desc: 'Melayang, ambigu, magis, tidak tertebak' },
  { id: 'Tenang & Santai', label: 'Tenang & Santai', color: 'teal', emoji: '☕', desc: 'Akustik sore, lo-fi, damai mengalir' },
] as const;

export type MoodId = typeof MOOD_CATEGORIES[number]['id'];

// Semitone intervals from root
const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ENHARMONIC_FLAT_MAP: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
};
const PREFERRED_FLATS: Record<string, string> = {
  'C#': 'Db',
  'D#': 'Eb',
  'G#': 'Ab',
  'A#': 'Bb',
};

// Scale interval steps (in semitones)
const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
};

// Diatonic chord qualities per scale degree
const DIATONIC_QUALITIES: Record<ScaleType, string[]> = {
  'Major': ['', 'm', 'm', '', '', 'm', 'dim'],
  'Natural Minor': ['m', 'dim', '', 'm', 'm', '', ''],
  'Dorian': ['m', 'm', '', '', 'm', 'dim', ''],
  'Mixolydian': ['', 'm', 'dim', '', 'm', 'm', ''],
  'Harmonic Minor': ['m', 'dim', 'aug', 'm', '', '', 'dim'],
  'Phrygian': ['m', '', '', 'm', 'dim', '', 'm'],
};

// Standard Roman numerals per scale degree
const DIATONIC_ROMANS: Record<ScaleType, string[]> = {
  'Major': ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  'Natural Minor': ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
  'Dorian': ['i', 'ii', 'bIII', 'IV', 'v', 'vi°', 'bVII'],
  'Mixolydian': ['I', 'ii', 'iii°', 'IV', 'v', 'vi', 'bVII'],
  'Harmonic Minor': ['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°'],
  'Phrygian': ['i', 'bII', 'bIII', 'iv', 'v°', 'bVI', 'bvii'],
};

// Normalize note representation
function normalizeNote(note: string): string {
  return ENHARMONIC_FLAT_MAP[note] || note;
}

// Convert semitone index to pitch name, respecting flats for flat keys
function indexToNote(index: number, useFlats = false): string {
  const norm = (index % 12 + 12) % 12;
  const standard = CHROMATIC_NOTES[norm];
  if (useFlats && PREFERRED_FLATS[standard]) {
    return PREFERRED_FLATS[standard];
  }
  return standard;
}

// Check if a key conventionally uses flat notation
function isFlatKey(key: string): boolean {
  return ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm'].some((k) => key.startsWith(k));
}

// Calculate the 7 scale notes for a given root & scale
export function getScaleNotes(root: string, scale: ScaleType = 'Major'): string[] {
  const normRoot = normalizeNote(root);
  const rootIdx = CHROMATIC_NOTES.indexOf(normRoot);
  if (rootIdx === -1) return [];

  const intervals = SCALE_INTERVALS[scale] || SCALE_INTERVALS['Major'];
  const preferFlats = isFlatKey(root);

  return intervals.map((interval) => {
    return indexToNote(rootIdx + interval, preferFlats);
  });
}

// Calculate diatonic chord for a Roman numeral in a specific key & scale
export function romanToChord(roman: string, rootKey: string, scale: ScaleType = 'Major'): string {
  const cleanRoman = roman.trim();
  const scaleNotes = getScaleNotes(rootKey, scale);
  const scaleRomans = DIATONIC_ROMANS[scale] || DIATONIC_ROMANS['Major'];
  const qualities = DIATONIC_QUALITIES[scale] || DIATONIC_QUALITIES['Major'];

  // Exact match in scale table
  const foundIdx = scaleRomans.findIndex(
    (r) => r.toLowerCase().replace(/[^a-z]/g, '') === cleanRoman.toLowerCase().replace(/[^a-z]/g, '')
  );

  if (foundIdx !== -1 && scaleNotes[foundIdx]) {
    const note = scaleNotes[foundIdx];
    const quality = qualities[foundIdx];

    // If roman explicitly has 7 or maj7
    if (cleanRoman.includes('maj7')) return `${note}maj7`;
    if (cleanRoman.includes('7')) return `${note}7`;
    if (cleanRoman.includes('sus4')) return `${note}sus4`;
    if (cleanRoman.includes('add9')) return `${note}add9`;
    return `${note}${quality}`;
  }

  // Fallback heuristic: roman numerals I-VII
  const romanMap: Record<string, number> = {
    'i': 0, 'ii': 1, 'iii': 2, 'iv': 3, 'v': 4, 'vi': 5, 'vii': 6,
  };
  const baseLetter = cleanRoman.toLowerCase().replace(/[^iv]/g, '');
  const step = romanMap[baseLetter];
  if (step !== undefined && scaleNotes[step]) {
    const isMinor = cleanRoman[0] === cleanRoman[0].toLowerCase();
    const suffix = isMinor ? 'm' : '';
    return `${scaleNotes[step]}${suffix}`;
  }

  return cleanRoman;
}

// Convert array of Roman numerals to array of chords for given Key & Scale
export function convertRomansToChords(romans: string[], rootKey: string, scale: ScaleType = 'Major'): string[] {
  return romans.map((r) => romanToChord(r, rootKey, scale));
}

// ==========================================
// FAMILY CHORDS & DIATONIC HARMONY ENGINE
// ==========================================

export interface SpicedChordVariant {
  chord: string;
  suffix: string; // 'maj7', 'add9', 'sus4', '7', 'm7', 'sus2'
  label: string;
  flavor: string;
}

export interface FamilyChordDegree {
  degreeIndex: number; // 0 to 6
  roman: string;       // 'I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'
  chord: string;       // 'C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'
  rootNote: string;    // 'C', 'D', 'E', ...
  role: string;        // 'Tonik', 'Supertonik', 'Median', 'Subdominan', 'Dominan', 'Submedian', 'Leading Tone'
  quality: 'major' | 'minor' | 'diminished' | 'augmented';
  spicedVariants: SpicedChordVariant[];
}

export interface CategorizedSpicedChord {
  chord: string;
  degreeRoman: string;
  category: '7th' | 'sus' | 'add9' | 'warna';
  label: string;
  flavor: string;
}

export interface FamilyChordsResult {
  rootKey: string;
  scale: ScaleType;
  scaleNotes: string[];
  degrees: FamilyChordDegree[];
  categorizedSpiced: CategorizedSpicedChord[];
}

const DEGREE_ROLE_NAMES = [
  'Tonik (Akor Pusat)',
  'Supertonik (Jembatan)',
  'Median (Reflektif)',
  'Subdominan (Transisi)',
  'Dominan (Puncak Tensi)',
  'Submedian (Relatif)',
  'Leading Tone (Sensitif)',
];

export function getFamilyChords(rootKey: string, scale: ScaleType = 'Major'): FamilyChordsResult {
  const scaleNotes = getScaleNotes(rootKey, scale);
  const scaleRomans = DIATONIC_ROMANS[scale] || DIATONIC_ROMANS['Major'];
  const qualities = DIATONIC_QUALITIES[scale] || DIATONIC_QUALITIES['Major'];

  const degrees: FamilyChordDegree[] = scaleNotes.map((note, idx) => {
    const roman = scaleRomans[idx] || `${idx + 1}`;
    const rawQuality = qualities[idx] || '';
    let quality: 'major' | 'minor' | 'diminished' | 'augmented' = 'major';
    if (rawQuality === 'm') quality = 'minor';
    else if (rawQuality === 'dim') quality = 'diminished';
    else if (rawQuality === 'aug') quality = 'augmented';

    const baseChord = `${note}${rawQuality}`;
    const spicedVariants: SpicedChordVariant[] = [];

    if (quality === 'major') {
      spicedVariants.push({
        chord: `${note}maj7`,
        suffix: 'maj7',
        label: `${note}maj7`,
        flavor: 'Mewah, syahdu, neo-soul',
      });
      spicedVariants.push({
        chord: `${note}add9`,
        suffix: 'add9',
        label: `${note}add9`,
        flavor: 'Hangat, akustik modern',
      });
      spicedVariants.push({
        chord: `${note}sus4`,
        suffix: 'sus4',
        label: `${note}sus4`,
        flavor: 'Menggantung, mengalir indah',
      });
      spicedVariants.push({
        chord: `${note}sus2`,
        suffix: 'sus2',
        label: `${note}sus2`,
        flavor: 'Lembut, udara terbuka',
      });
      if (idx === 4 || scale === 'Mixolydian') {
        // Dominant degree V gets dominant 7
        spicedVariants.push({
          chord: `${note}7`,
          suffix: '7',
          label: `${note}7`,
          flavor: 'Tensi blues/pop kuat',
        });
      }
    } else if (quality === 'minor') {
      spicedVariants.push({
        chord: `${note}m7`,
        suffix: 'm7',
        label: `${note}m7`,
        flavor: 'Melankolis halus, jazz/lofi',
      });
      spicedVariants.push({
        chord: `${note}sus2`,
        suffix: 'sus2',
        label: `${note}sus2`,
        flavor: 'Sentuhan hening, folk akustik',
      });
      spicedVariants.push({
        chord: `${note}m(add9)`,
        suffix: 'm(add9)',
        label: `${note}m(add9)`,
        flavor: 'Emosional mendalam',
      });
    } else if (quality === 'diminished') {
      spicedVariants.push({
        chord: `${note}m7b5`,
        suffix: 'm7b5',
        label: `${note}m7b5`,
        flavor: 'Half-diminished, tensi elegan',
      });
    }

    return {
      degreeIndex: idx,
      roman,
      chord: baseChord,
      rootNote: note,
      role: DEGREE_ROLE_NAMES[idx] || `Derajat ${idx + 1}`,
      quality,
      spicedVariants,
    };
  });

  // Group spiced chords into categorized view for fast picking
  const categorizedSpiced: CategorizedSpicedChord[] = [];

  degrees.forEach((deg) => {
    deg.spicedVariants.forEach((v) => {
      let category: '7th' | 'sus' | 'add9' | 'warna' = 'warna';
      if (v.suffix.includes('7') || v.suffix.includes('maj7')) category = '7th';
      else if (v.suffix.includes('sus')) category = 'sus';
      else if (v.suffix.includes('add9')) category = 'add9';

      categorizedSpiced.push({
        chord: v.chord,
        degreeRoman: deg.roman,
        category,
        label: v.label,
        flavor: v.flavor,
      });
    });
  });

  return {
    rootKey,
    scale,
    scaleNotes,
    degrees,
    categorizedSpiced,
  };
}

// Reverse inference: given a chord and key/scale, guess its Roman numeral
export function inferRomanFromChord(chord: string, rootKey: string, scale: ScaleType = 'Major'): string {
  const clean = chord.trim();
  if (!clean) return '';

  const family = getFamilyChords(rootKey, scale);

  // Exact base degree match
  const exactDeg = family.degrees.find((d) => d.chord.toLowerCase() === clean.toLowerCase());
  if (exactDeg) return exactDeg.roman;

  // Spiced variant match
  for (const deg of family.degrees) {
    for (const sp of deg.spicedVariants) {
      if (sp.chord.toLowerCase() === clean.toLowerCase()) {
        const isUpper = deg.roman[0] === deg.roman[0].toUpperCase();
        if (sp.suffix === 'maj7') return `${deg.roman}maj7`;
        if (sp.suffix === 'm7') return `${deg.roman}7`;
        if (sp.suffix === '7') return isUpper ? `${deg.roman}7` : `${deg.roman}7`;
        if (sp.suffix === 'sus4') return `${deg.roman}sus4`;
        if (sp.suffix === 'sus2') return `${deg.roman}sus2`;
        if (sp.suffix === 'add9') return `${deg.roman}add9`;
        return `${deg.roman}(${sp.suffix})`;
      }
    }
  }

  // Root note match
  const match = clean.match(/^([A-G][#b]?)(.*)$/);
  if (match) {
    const root = match[1];
    const suffix = match[2];
    const degIdx = family.scaleNotes.findIndex((n) => n.toLowerCase() === root.toLowerCase());
    if (degIdx !== -1 && family.degrees[degIdx]) {
      const baseRom = family.degrees[degIdx].roman;
      return suffix ? `${baseRom}${suffix}` : baseRom;
    }
  }

  return clean;
}

// ==========================================
// CURATED PROGRESSION TEMPLATES BY MOOD
// ==========================================
export const PROGRESSION_TEMPLATES: ProgressionTemplate[] = [
  // --- MELANKOLIS & EMOSIONAL ---
  {
    id: 'mel_axis',
    name: 'Emotional Axis (Sad Pop Ballad)',
    mood: 'Melankolis',
    scaleType: 'Major',
    romans: ['vi', 'IV', 'I', 'V'],
    description: 'Progresi paling ikonik untuk lagu balada emosional menyayat hati. Membuka dengan luka lalu menemukan sedikit resolusi.',
    defaultBpm: 72,
    genre: 'Pop Ballad / Indonesian Pop',
    tags: ['Ballad', 'Emosional', 'Selingkuh/Patah Hati'],
  },
  {
    id: 'mel_minor_descent',
    name: 'Natural Minor Sorrow',
    mood: 'Melankolis',
    scaleType: 'Natural Minor',
    romans: ['i', 'VI', 'III', 'VII'],
    description: 'Nuansa kesedihan mendalam dan kepasrahan. Sangat kuat untuk lagu akustik melankolis atau slow rock.',
    defaultBpm: 68,
    genre: 'Acoustic Folk / Indie',
    tags: ['Akustik', 'Duka', 'Hujan'],
  },
  {
    id: 'mel_sentimental_sigh',
    name: 'Sentimental Sigh',
    mood: 'Melankolis',
    scaleType: 'Natural Minor',
    romans: ['i', 'iv', 'v', 'i'],
    description: 'Progresi minor murni klasik yang intim dan tenang, cocok untuk bait lirik curahan hati yang sunyi.',
    defaultBpm: 65,
    genre: 'Indie Folk / Lo-fi',
    tags: ['Sunyi', 'Malam', 'Refleksi'],
  },
  {
    id: 'mel_andalusian',
    name: 'Dramatic Descent (Flamenco Tears)',
    mood: 'Melankolis',
    scaleType: 'Natural Minor',
    romans: ['i', 'VII', 'VI', 'V'],
    description: 'Turun bertahap yang dramatis. Memberikan rasa penyesalan tak berujung dan ketegasan emosi.',
    defaultBpm: 78,
    genre: 'Dramatic Pop / Classic Rock',
    tags: ['Dramatis', 'Penyesalan'],
  },

  // --- HEROIK & EPIK ---
  {
    id: 'hero_anthem',
    name: 'Triumphant Pop-Rock Anthem',
    mood: 'Heroik & Epik',
    scaleType: 'Major',
    romans: ['I', 'V', 'vi', 'IV'],
    description: 'Progresi 4-chord legendaris dunia. Memberi dorongan kemenangan, semangat tak terpatahkan, dan energi besar di chorus.',
    defaultBpm: 120,
    genre: 'Pop Rock / Stadium Anthem',
    tags: ['Anthem', 'Semangat', 'Chorus Megah'],
  },
  {
    id: 'hero_warrior',
    name: 'Warrior’s Ascent',
    mood: 'Heroik & Epik',
    scaleType: 'Natural Minor',
    romans: ['i', 'VI', 'VII', 'i'],
    description: 'Nuansa ksatria bangkit dari kekalahan. Sangat megah untuk tema perjuangan hidup dan sinematik.',
    defaultBpm: 110,
    genre: 'Cinematic / Alternative Rock',
    tags: ['Perjuangan', 'Bangkit', 'Megah'],
  },
  {
    id: 'hero_lift',
    name: 'Heartfelt Hope Lift',
    mood: 'Heroik & Epik',
    scaleType: 'Major',
    romans: ['I', 'IV', 'vi', 'V'],
    description: 'Perjalanan nada yang optimis dan penuh tekad. Cocok untuk lirik harapan baru dan keberanian melangkah.',
    defaultBpm: 95,
    genre: 'Modern Pop / Indie Rock',
    tags: ['Optimis', 'Keberanian'],
  },

  // --- NOSTALGIA & ROMANTIS ---
  {
    id: 'nost_50s_doowop',
    name: 'Classic 50s Doo-Wop Romance',
    mood: 'Nostalgia',
    scaleType: 'Major',
    romans: ['I', 'vi', 'IV', 'V'],
    description: 'Aroma cinta klasik nan manis tahun 50-an. Sangat hangat, bersahaja, dan membangkitkan senyuman kenangan masa sekolah.',
    defaultBpm: 85,
    genre: 'Classic Pop / Vintage Ballad',
    tags: ['Cinta Manis', 'Vintage', 'Masa Lalu'],
  },
  {
    id: 'nost_citypop',
    name: 'City Pop / Shibuya Twilight',
    mood: 'Nostalgia',
    scaleType: 'Major',
    romans: ['IV', 'iii', 'vi', 'I'],
    description: 'Royal road progression (Oudou shinkou) ala musik pop Jepang/City Pop 80-an yang manis bercampur rindu gemerlap kota.',
    defaultBpm: 104,
    genre: 'City Pop / Neo-Soul / J-Pop',
    tags: ['City Pop', 'Rindu', 'Senja'],
  },
  {
    id: 'nost_warm_daydream',
    name: 'Warm Afternoon Daydream',
    mood: 'Nostalgia',
    scaleType: 'Major',
    romans: ['I', 'iii', 'IV', 'V'],
    description: 'Gerakan lembut ke minor ke-3 (iii) menghadirkan nuansa lamunan indah di sore hari.',
    defaultBpm: 80,
    genre: 'Bedroom Pop / Akustik',
    tags: ['Lamunan', 'Hangat'],
  },

  // --- CERIA & ENERJIK ---
  {
    id: 'ceria_sunshine',
    name: 'Sunshine Energy Bounce',
    mood: 'Ceria & Enerjik',
    scaleType: 'Major',
    romans: ['I', 'IV', 'V', 'I'],
    description: 'Progresi dasar rock & roll dan folk ceria. Penuh kepolosan, tawa, dan energi yang mengundang joget santai.',
    defaultBpm: 128,
    genre: 'Upbeat Pop / Folk Pop',
    tags: ['Gembira', 'Cerah', 'Lompat'],
  },
  {
    id: 'ceria_summer',
    name: 'Summer Festival Groove',
    mood: 'Ceria & Enerjik',
    scaleType: 'Major',
    romans: ['I', 'V', 'IV', 'V'],
    description: 'Irama liburan musim panas di tepi pantai. Sangat cocok untuk hook lagu yang gampang diingat.',
    defaultBpm: 118,
    genre: 'Indie Pop / Reggae Pop',
    tags: ['Pantai', 'Liburan', 'Catchy'],
  },
  {
    id: 'ceria_mixolydian',
    name: 'Mixolydian Rock Euphoria',
    mood: 'Ceria & Enerjik',
    scaleType: 'Mixolydian',
    romans: ['I', 'bVII', 'IV', 'I'],
    description: 'Penggunaan flat-VII memberikan aksen retro rock enerjik tanpa rasa kaku, ala The Beatles atau Oasis.',
    defaultBpm: 122,
    genre: 'Classic Rock / Britpop',
    tags: ['Retro', 'Semangat', 'Bebas'],
  },

  // --- GELAP & TEGANG ---
  {
    id: 'dark_phrygian',
    name: 'Phrygian Sinister Pulse',
    mood: 'Gelap & Tegang',
    scaleType: 'Phrygian',
    romans: ['i', 'bII', 'i', 'bII'],
    description: 'Aksen bII (setengah nada di atas root) menciptakan tensi mencekam, bahaya mengintai, dan ketegangan psikologis.',
    defaultBpm: 90,
    genre: 'Dark Trap / Metal / Cinematic Score',
    tags: ['Mencekam', 'Bahaya', 'Tegang'],
  },
  {
    id: 'dark_harmonic_thriller',
    name: 'Harmonic Minor Suspense',
    mood: 'Gelap & Tegang',
    scaleType: 'Harmonic Minor',
    romans: ['i', 'iv', 'V', 'i'],
    description: 'Kombinasi minor dengan akor mayor V yang tajam menciptakan misteri kelam ala film detektif atau gothic rock.',
    defaultBpm: 84,
    genre: 'Gothic Rock / Noir / Tango',
    tags: ['Misteri Kelam', 'Detektif'],
  },

  // --- MISTERIUS & PSYCHEDELIC ---
  {
    id: 'myst_dorian',
    name: 'Dorian Space Voyage',
    mood: 'Misterius',
    scaleType: 'Dorian',
    romans: ['i', 'IV', 'i', 'IV'],
    description: 'Mayor ke-4 dalam tangga minor menciptakan efek melayang tanpa gravitasi ala Pink Floyd atau Santana.',
    defaultBpm: 88,
    genre: 'Psychedelic Rock / Funk / Ambient',
    tags: ['Melayang', 'Misterius', 'Groove'],
  },
  {
    id: 'myst_dream_haze',
    name: 'Dream Pop Haze',
    mood: 'Misterius',
    scaleType: 'Natural Minor',
    romans: ['i', 'VII', 'v', 'VI'],
    description: 'Kabut impian yang surealis. Nada minor 5 menghadirkan rasa dingin yang mempesona.',
    defaultBpm: 76,
    genre: 'Dream Pop / Shoegaze',
    tags: ['Mimpi', 'Surealis', 'Kabut'],
  },

  // --- TENANG & SANTAI ---
  {
    id: 'chill_campfire',
    name: 'Campfire Acoustic Breeze',
    mood: 'Tenang & Santai',
    scaleType: 'Major',
    romans: ['I', 'IV', 'I', 'IV'],
    description: 'Dua akor sederhana yang membuai jiwa. Pas untuk nyanyian santai di teras rumah saat gerimis sore.',
    defaultBpm: 75,
    genre: 'Acoustic / Lo-fi Chill',
    tags: ['Santai', 'Sore', 'Kopi'],
  },
  {
    id: 'chill_neo_soul',
    name: 'Smooth Coffee Lounge (ii - V - I)',
    mood: 'Tenang & Santai',
    scaleType: 'Major',
    romans: ['ii', 'V', 'I', 'vi'],
    description: 'Keluarga progresi jazz paling halus di dunia. Memberi rasa elegan, hangat, dan sangat rileks.',
    defaultBpm: 78,
    genre: 'Neo-Soul / Jazz Pop / R&B',
    tags: ['Elegan', 'Halus', 'Kafe'],
  },
];

// Generator function
export function generateProgression({
  mood,
  rootKey = 'C',
  scaleType,
  count = 4,
}: {
  mood?: string;
  rootKey?: string;
  scaleType?: ScaleType;
  count?: number;
}): {
  title: string;
  key: string;
  scale: string;
  mood: string;
  romans: string[];
  chords: string[];
  description: string;
  bpm: number;
  genre: string;
  tags: string[];
} {
  // 1. Filter templates by mood if provided
  let pool = PROGRESSION_TEMPLATES;
  if (mood && mood !== 'all') {
    const matched = PROGRESSION_TEMPLATES.filter((t) => t.mood.toLowerCase() === mood.toLowerCase());
    if (matched.length > 0) pool = matched;
  }

  // 2. Filter by scaleType if specified
  if (scaleType) {
    const scaleMatched = pool.filter((t) => t.scaleType === scaleType);
    if (scaleMatched.length > 0) pool = scaleMatched;
  }

  // 3. Pick random template from filtered pool
  const template = pool[Math.floor(Math.random() * pool.length)];

  // 4. Adapt romans to count if needed
  let romans = [...template.romans];
  if (count === 8) {
    // Duplicate or extend
    romans = [...romans, ...romans];
  } else if (count === 6) {
    if (romans.length === 4) {
      romans = [romans[0], romans[1], romans[2], romans[3], romans[1], romans[3]];
    }
  }

  // 5. Convert to chords in rootKey
  const chosenScale = scaleType || template.scaleType;
  const chords = convertRomansToChords(romans, rootKey, chosenScale);

  const title = `${template.name} (${rootKey} ${chosenScale})`;

  return {
    title,
    key: rootKey,
    scale: chosenScale,
    mood: template.mood,
    romans,
    chords,
    description: template.description,
    bpm: template.defaultBpm,
    genre: template.genre,
    tags: [...template.tags],
  };
}

// ==========================================
// WEB AUDIO SYNTHESIZER ENGINE (Polyphonic)
// Zero external sound files, pure Web Audio
// ==========================================

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Note frequencies map (A4 = 440Hz standard)
const NOTE_BASE_SEMITONES: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
};

function noteToFrequency(noteName: string, octave = 4): number {
  const norm = normalizeNote(noteName);
  const semi = NOTE_BASE_SEMITONES[norm];
  if (semi === undefined) return 440;
  // A4 is octave 4, semitone 9 -> 440 Hz
  const semitonesFromA4 = (octave - 4) * 12 + (semi - 9);
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

// Parse chord into component notes
export function parseChordNotes(chordName: string): { root: string; freqs: number[] } {
  const clean = chordName.trim();
  // Extract root note
  const match = clean.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return { root: 'C', freqs: [261.63, 329.63, 392.00] };

  const root = match[1];
  const suffix = match[2].toLowerCase();

  const rootBase = normalizeNote(root);
  const rootSemi = NOTE_BASE_SEMITONES[rootBase] ?? 0;

  // Decide octave (root between C3 and B3 for warm fullness)
  const baseOctave = rootSemi < 5 ? 4 : 3;

  let intervals: number[] = [0, 4, 7]; // Default major triad (Root, 3rd, 5th)

  if (suffix.includes('m') && !suffix.includes('maj')) {
    intervals = [0, 3, 7]; // Minor triad
  }
  if (suffix.includes('dim')) {
    intervals = [0, 3, 6]; // Diminished triad
  }
  if (suffix.includes('aug')) {
    intervals = [0, 4, 8]; // Augmented triad
  }
  if (suffix.includes('sus4')) {
    intervals = [0, 5, 7]; // Sus4
  }
  if (suffix.includes('sus2')) {
    intervals = [0, 2, 7]; // Sus2
  }
  if (suffix.includes('maj7')) {
    intervals = [0, 4, 7, 11]; // Major 7th
  } else if (suffix.includes('7')) {
    intervals = suffix.includes('m') ? [0, 3, 7, 10] : [0, 4, 7, 10]; // Dominant 7th or Minor 7th
  }
  if (suffix.includes('add9')) {
    intervals = [...intervals, 14];
  }

  // Convert intervals to frequencies
  const freqs = intervals.map((interval) => {
    const totalSemitone = (baseOctave - 4) * 12 + (rootSemi - 9) + interval;
    return 440 * Math.pow(2, totalSemitone / 12);
  });

  return { root, freqs };
}

// Play a single chord sound (Warm electric piano emulation)
export function playChordSound(chordName: string, durationSeconds = 1.0): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const { freqs } = parseChordNotes(chordName);

    // Master gain for chord
    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.2, now);
    chordGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);
    chordGain.connect(ctx.destination);

    freqs.forEach((freq, idx) => {
      // Stagger slightly by 15ms for organic acoustic strum feeling
      const noteStart = now + idx * 0.015;

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      // Triangle + Lowpass filter gives Rhodes/Electric Piano vibe
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);

      // Filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, noteStart);
      filter.frequency.exponentialRampToValueAtTime(400, noteStart + durationSeconds);

      // Envelope
      oscGain.gain.setValueAtTime(0.001, noteStart);
      oscGain.gain.exponentialRampToValueAtTime(0.3, noteStart + 0.03); // Quick attack
      oscGain.gain.exponentialRampToValueAtTime(0.15, noteStart + 0.2); // Decay
      oscGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + durationSeconds);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(chordGain);

      osc.start(noteStart);
      osc.stop(noteStart + durationSeconds);
    });
  } catch (err) {
    console.warn('[ChordAudio] Playback error:', err);
  }
}

// Progression Sequence Player
export function playProgressionSequence({
  chords,
  bpm = 80,
  onStepChange,
  onComplete,
}: {
  chords: string[];
  bpm?: number;
  onStepChange?: (index: number) => void;
  onComplete?: () => void;
}): () => void {
  let isCancelled = false;
  const timerIds: any[] = [];

  // Duration per chord (e.g. 2 beats per chord at given BPM)
  const safeBpm = Math.max(40, Math.min(220, bpm));
  const chordDurationMs = (60000 / safeBpm) * 2; // 2 beats
  const chordDurationSec = chordDurationMs / 1000;

  chords.forEach((chord, i) => {
    const timer = setTimeout(() => {
      if (isCancelled) return;
      onStepChange?.(i);
      playChordSound(chord, chordDurationSec * 0.95);

      if (i === chords.length - 1) {
        // Last chord finished
        const finishTimer = setTimeout(() => {
          if (!isCancelled) {
            onStepChange?.(-1);
            onComplete?.();
          }
        }, chordDurationMs);
        timerIds.push(finishTimer);
      }
    }, i * chordDurationMs);

    timerIds.push(timer);
  });

  // Return stop / cancel callback
  return () => {
    isCancelled = true;
    timerIds.forEach(clearTimeout);
    onStepChange?.(-1);
  };
}
