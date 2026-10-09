/**
 * Utility functions for Music Studio Bars (Idea Bank)
 */

/**
 * Calculates the actual bar count from lyric text/HTML.
 * - Ignores empty lines, blank paragraphs (<p><br></p>, &nbsp;)
 * - Ignores standalone chord lines (e.g. "[C] [G] [Am] [F]" or "Am - F - C - G")
 * - Ignores section headers (e.g. "[Intro]", "[Verse 1]", "[Chorus]", "[Reff]")
 * - If chords are embedded inline with lyrics (e.g. "[C] Menatap senja [G]"), it counts as 1 bar
 * - Fallback: If the text contains ONLY chords (e.g. chord chart without lyrics), counts chord lines
 */
export function calculateBarCount(content?: string): number {
  if (!content) return 0;

  // 1. Convert HTML tags and entities to clean text lines
  const clean = content
    .replace(/&nbsp;/g, ' ')
    .replace(/[\u200B\u00A0]/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, ''); // strip any remaining HTML tags

  // 2. Split into raw lines and trim
  const rawLines = clean
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) return 0;

  // Regex to detect if a line is a section header:
  // e.g. "[Intro]", "[Verse 1]", "[Chorus]", "(Bridge)", "[Reff]"
  const isSectionHeader = (line: string): boolean => {
    return /^((\[|\()(intro|verse|chorus|reff|bridge|pre-chorus|solo|outro|hook|interlude|instrumental|drop|beat|part\s*\d*).*?(\]|\)))$/i.test(
      line
    );
  };

  // Regex to detect if a line consists entirely of chord brackets or chord notation:
  // e.g. "[C] [G] [Am] [F]", "[C]", "[Am7] - [D7] - [Gmaj7]", "| C | G | Am | F |"
  const isPureChordLine = (line: string): boolean => {
    // 1. Strip bracketed chords: e.g. [C], [Am7], [F#m], [Bb/D]
    let stripped = line.replace(/\[[A-G][b#]?(m|maj|min|dim|aug|sus\d*|\d)*(\/[A-G][b#]?)?\]/gi, '');
    // Strip common chord symbols, separators, and spaces: e.g. |, -, /, ,, :
    stripped = stripped.replace(/[|\-/,:;\s]/g, '');
    if (stripped.length === 0) return true;

    // 2. Also check if the line consists entirely of bare chords without brackets:
    // e.g. "C G Am F", "Am7 - D7 - Gmaj7", "| C | G | Am | F |"
    const tokens = line
      .split(/[\s|\-/,:;]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tokens.length > 0) {
      const chordTokenRegex = /^(\[)?[A-G][b#]?(m|maj|min|dim|aug|sus\d*|\d)*(\/[A-G][b#]?)?(\])?$/i;
      const allTokensAreChords = tokens.every((token) => chordTokenRegex.test(token));
      if (allTokensAreChords) return true;
    }

    return false;
  };

  // 3. Filter lines to count actual lyrical/musical bars
  const barLines = rawLines.filter((line) => {
    if (!line) return false;
    if (isSectionHeader(line)) return false;
    if (isPureChordLine(line)) return false;
    return true;
  });

  // 4. Fallback: If the user wrote ONLY chords (e.g. chord chart without lyrics), count those chord lines!
  if (barLines.length === 0 && rawLines.length > 0) {
    const nonHeaderLines = rawLines.filter((l) => !isSectionHeader(l));
    return nonHeaderLines.length;
  }

  return barLines.length;
}
