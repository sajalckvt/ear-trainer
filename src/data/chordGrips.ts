/**
 * Movable guitar chord grips — a small dictionary of real, playable voicings
 * per chord quality. Replaces the CAGED-major-only display so every supported
 * quality shows correct notes on the fretboard.
 *
 * HOW GRIPS ARE STORED
 * Each grip is defined by the INTERVAL above the chord root played on each
 * string (low E → high e), or null for a muted/unplayed string. Because the
 * grip is expressed in intervals-from-root, transposing to any root is just:
 *   absoluteFret(string) = rootFretOnThatString + (interval - lowestInterval...)
 * In practice we anchor each grip to a "root fret" — the fret where the chord
 * root sits on its lowest root-bearing string — and store each string's fret
 * RELATIVE to that anchor. Transposing = shifting the anchor.
 *
 * This representation makes correctness checkable: a grip is valid for a
 * quality iff every played string's interval (mod 12) is one of the quality's
 * chord intervals. We assert this at module load in dev via verifyGrips().
 *
 * Intervals: 0=R, 3=m3, 4=M3, 6=♭5, 7=P5, 8=#5, 10=♭7, 11=M7, 2=M2(sus2),
 * 5=P4(sus4).
 */

// low E, A, D, G, B, high e
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];

export interface Grip {
  /** Human label for the grip's shape/position, e.g. "E-shape", "A-shape". */
  name: string;
  /**
   * Fret per string (low E → high e) for the grip when the chord ROOT is at
   * fret `anchorFret` on string `anchorString`. -1 = muted.
   * Stored in ABSOLUTE example frets for one concrete root, plus the anchor,
   * so transposition is a single subtraction+addition.
   */
  frets: number[];
  /** string index (0..5, low E→high e) holding the lowest root */
  anchorString: number;
  /** fret of the root on the anchor string, in the stored example */
  anchorFret: number;
}

/**
 * Grip dictionary. Each quality lists 2–3 movable grips, authored from known
 * chord charts. The stored example uses a convenient root; transposition
 * moves the whole grip so the anchor lands on the target root.
 *
 * Voicings deliberately use adjacent-string, playable shapes.
 */
export const GRIPS: Record<string, Grip[]> = {
  // ── Triads ────────────────────────────────────────────────────────────
  maj: [
    // E-shape barre (example: F major, root low-E fret 1)
    { name: 'E-shape', frets: [1, 3, 3, 2, 1, 1], anchorString: 0, anchorFret: 1 },
    // A-shape barre (example: C major, root A-string fret 3)
    { name: 'A-shape', frets: [-1, 3, 5, 5, 5, 3], anchorString: 1, anchorFret: 3 },
    // D-shape (example: D major area, root D-string fret 0 → use fret 5 for F)
    { name: 'D-shape', frets: [-1, -1, 3, 5, 6, 5], anchorString: 2, anchorFret: 3 },
  ],
  min: [
    // Em-shape barre (example: Fm, root low-E fret 1)
    { name: 'Em-shape', frets: [1, 3, 3, 1, 1, 1], anchorString: 0, anchorFret: 1 },
    // Am-shape barre (example: Cm, root A-string fret 3)
    { name: 'Am-shape', frets: [-1, 3, 5, 5, 4, 3], anchorString: 1, anchorFret: 3 },
    // Dm-shape (example: Fm, root D-string fret 3)
    { name: 'Dm-shape', frets: [-1, -1, 3, 5, 6, 4], anchorString: 2, anchorFret: 3 },
  ],
  dim: [
    // A-rooted dim triad (example C dim: C Eb Gb, root A-string fret 3).
    // strings A D G B = C(0) Eb(m3) Gb(♭5) Eb — all three tones present.
    { name: 'A-root', frets: [-1, 3, 4, 5, 4, -1], anchorString: 1, anchorFret: 3 },
    // E-rooted dim triad (example F dim: F Ab Cb, root low-E fret 1).
    // strings E A D G = F(0) Ab(m3) Cb=B(♭5) F — all three tones present.
    { name: 'E-root', frets: [1, 2, 3, 1, -1, -1], anchorString: 0, anchorFret: 1 },
  ],
  aug: [
    // A-rooted aug triad (example C aug: C E G#, root A-string fret 3).
    // strings A D G B = C(0) E(M3) G#(#5) C — all three tones present.
    { name: 'A-root', frets: [-1, 3, 6, 5, 5, -1], anchorString: 1, anchorFret: 3 },
    // E-rooted aug triad (example F aug: F A C#, root low-E fret 1).
    // strings E A D G = F(0) A(M3) C#(#5) F — all three tones present.
    { name: 'E-root', frets: [1, 4, 3, 2, -1, -1], anchorString: 0, anchorFret: 1 },
  ],
  pwr: [
    // E-shape power chord (example F5: F C, root low-E fret 1).
    { name: 'E-root', frets: [1, 3, 3, -1, -1, -1], anchorString: 0, anchorFret: 1 },
    // A-shape power chord (example C5: C G C, root A-string fret 3).
    { name: 'A-root', frets: [-1, 3, 5, 5, -1, -1], anchorString: 1, anchorFret: 3 },
  ],
  sus2: [
    // Asus2-style (example C sus2, root A-string fret 3: C D G)
    { name: 'A-root', frets: [-1, 3, 5, 5, 3, 3], anchorString: 1, anchorFret: 3 },
    // Esus2-style (example F sus2, root low-E fret 1: F G C)
    { name: 'E-root', frets: [1, 3, 3, 0, 1, 1], anchorString: 0, anchorFret: 1 },
  ],
  sus4: [
    // Asus4 barre (example C sus4, root A-string fret 3: C F G)
    { name: 'A-root', frets: [-1, 3, 5, 5, 6, 3], anchorString: 1, anchorFret: 3 },
    // Esus4 barre (example F sus4, root low-E fret 1: F Bb C)
    { name: 'E-root', frets: [1, 3, 3, 3, 1, 1], anchorString: 0, anchorFret: 1 },
  ],
  // ── Common 7ths ─────────────────────────────────────────────────────────
  maj7: [
    // Emaj7-shape (example Fmaj7, root low-E fret 1: F A C E)
    { name: 'E-shape', frets: [1, -1, 2, 2, 1, -1], anchorString: 0, anchorFret: 1 },
    // Amaj7-shape (example Cmaj7, root A-string fret 3: C E G B)
    { name: 'A-shape', frets: [-1, 3, 5, 4, 5, -1], anchorString: 1, anchorFret: 3 },
  ],
  min7: [
    // Em7-shape (example Fm7, root low-E fret 1: F Ab C Eb)
    { name: 'Em7-shape', frets: [1, 3, 1, 1, 1, 1], anchorString: 0, anchorFret: 1 },
    // Am7-shape (example Cm7, root A-string fret 3: C Eb G Bb)
    { name: 'Am7-shape', frets: [-1, 3, 5, 3, 4, 3], anchorString: 1, anchorFret: 3 },
  ],
  dom7: [
    // E7-shape (example F7, root low-E fret 1: F A C Eb)
    { name: 'E7-shape', frets: [1, 3, 1, 2, 1, 1], anchorString: 0, anchorFret: 1 },
    // A7-shape (example C7, root A-string fret 3: C E G Bb)
    { name: 'A7-shape', frets: [-1, 3, 5, 3, 5, 3], anchorString: 1, anchorFret: 3 },
  ],
};

export interface ResolvedGrip {
  name: string;
  /** absolute fret per string (low E → high e); -1 = muted */
  frets: number[];
  /** lowest fret used (for sorting by neck position) */
  lowFret: number;
}

/**
 * Resolve all grips for a quality + root pitch class, transposed onto the
 * neck and sorted by position (low → high). Returns [] if the quality has no
 * grips (caller should fall back to showing played notes).
 */
export function resolveGrips(chordId: string, rootPc: number): ResolvedGrip[] {
  const grips = GRIPS[chordId];
  if (!grips) return [];

  return grips
    .map((g) => {
      // Pitch class of the stored anchor root:
      const anchorRootPc =
        ((OPEN_STRING_MIDI[g.anchorString] + g.anchorFret) % 12 + 12) % 12;
      // Smallest non-negative shift to move anchor root → target root.
      let shift = (((rootPc - anchorRootPc) % 12) + 12) % 12;

      const apply = (sh: number) => g.frets.map((f) => (f < 0 ? -1 : f + sh));
      let frets = apply(shift);
      // Keep on the neck: if everything sits very high, try an octave lower.
      const played = () => frets.filter((f) => f >= 0);
      while (Math.max(...played()) > 15 && shift >= 12) {
        shift -= 12;
        frets = apply(shift);
      }
      // If any played string is below 0 (shouldn't happen with non-neg shift), bump up.
      while (Math.min(...played()) < 0) {
        shift += 12;
        frets = apply(shift);
      }
      return { name: g.name, frets, lowFret: Math.min(...played()) };
    })
    .sort((a, b) => a.lowFret - b.lowFret);
}

/**
 * Dev-time correctness check: every played string of every grip must be a
 * chord tone of its quality. `intervalsByQuality` is passed in from the
 * caller (which has the CHORDS data) to avoid a circular import.
 * Returns a list of human-readable problems (empty = all valid).
 */
export function verifyGrips(
  intervalsByQuality: Record<string, number[]>,
): string[] {
  const problems: string[] = [];
  for (const [chordId, grips] of Object.entries(GRIPS)) {
    const ivs = intervalsByQuality[chordId];
    if (!ivs) { problems.push(`${chordId}: no interval data`); continue; }
    const allowed = new Set(ivs.map((i) => ((i % 12) + 12) % 12));
    for (const g of grips) {
      const rootPc =
        ((OPEN_STRING_MIDI[g.anchorString] + g.anchorFret) % 12 + 12) % 12;
      const present = new Set<number>();
      g.frets.forEach((f, si) => {
        if (f < 0) return;
        const pc = ((OPEN_STRING_MIDI[si] + f) % 12 + 12) % 12;
        const interval = ((pc - rootPc) % 12 + 12) % 12;
        present.add(interval);
        if (!allowed.has(interval)) {
          problems.push(
            `${chordId} "${g.name}" string${si} fret${f}: stray interval ${interval} not in [${[...allowed].join(',')}]`,
          );
        }
      });
      // Completeness: every chord tone must appear at least once.
      for (const iv of allowed) {
        if (!present.has(iv)) {
          problems.push(`${chordId} "${g.name}": MISSING chord tone (interval ${iv})`);
        }
      }
    }
  }
  return problems;
}


// ── Dev-only self-check ──────────────────────────────────────────────────
// Runs once on import in dev builds; logs any invalid/incomplete grip so
// authoring mistakes surface immediately instead of shipping silently.
if (import.meta.env && import.meta.env.DEV) {
  const DEV_INTERVALS: Record<string, number[]> = {
    maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8],
    sus2: [0, 2, 7], sus4: [0, 5, 7], pwr: [0, 7],
    maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], dom7: [0, 4, 7, 10],
  };
  const issues = verifyGrips(DEV_INTERVALS);
  if (issues.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[chordGrips] invalid grips:\n' + issues.join('\n'));
  }
}
