/**
 * Utility functions for detecting, validating, and parsing musical chords in lyrics.
 */

// Strict musical root notes (case insensitive for detection, e.g. C, C#, Db, F##, Bbb)
// Musical qualities/extensions: m, min, maj, dim, aug, sus, add, numbers 2-13, alterations (b5, #9, etc.)
// Optional slash bass: /G, /F#, /Bb
export const STRICT_CHORD_REGEX = /^[A-Ga-g](?:##|bb|[#b])?(?:maj|min|dim|aug|sus|add|m|M)?[0-9]*(?:(?:b|#|\+|-)[0-9]+)*(?:\/[A-Ga-g](?:##|bb|[#b])?)?$/;

// Regex for matching inline chord tokens in text: [C], [G/B], [Am7]
export const INLINE_CHORD_REGEX = /\[([A-Ga-g][a-zA-Z0-9#\/b\+\-]*?)\]/g;

// List of non-chord words that might accidentally slip through
const EXCLUDED_WORDS = new Set([
  'a', 'an', 'and', 'am', 'as', 'at', 'be', 'by', 'do', 'go', 'he', 'if', 'in', 'is', 'it', 'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'us', 'we'
]);

/**
 * Validates if a string is a valid musical chord name (strictly rejecting normal human language words).
 */
export function isValidChordName(chordStr: string): boolean {
  if (!chordStr) return false;
  const trimmed = chordStr.trim();
  if (!trimmed || trimmed.length > 12) return false;

  // Reject single common lower-case words
  if (EXCLUDED_WORDS.has(trimmed.toLowerCase()) && trimmed === trimmed.toLowerCase()) {
    return false;
  }

  // Reject if it contains spaces or unexpected characters
  if (/\s/.test(trimmed)) return false;

  return STRICT_CHORD_REGEX.test(trimmed);
}
