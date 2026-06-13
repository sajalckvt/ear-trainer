/**
 * Song-based progression quizzes — "name the progression from the real recording".
 *
 * Unlike the synthesized `progression` exercise, these play the ACTUAL
 * recording via an embedded YouTube clip (see YouTubeClip.tsx) and ask the
 * user to name the chords by ear.
 *
 * A TRACK is one YouTube video; it can hold MANY exercises (intro, chorus,
 * bridge…), each playing a different [start,end] window of the same video.
 *
 * Answer model (current level): we TELL the user the key and keep the palette
 * diatonic. If the true progression contains a non-diatonic chord, that slot
 * is marked `given: true` — pre-filled and revealed, so the user is never
 * asked to guess something outside the diatonic palette.
 *
 * Chords are referenced by their roman-numeral id from PROGRESSION_CHORD_MAP
 * (data/progressions.ts) so colours / labels / voicings stay consistent with
 * the synthesized progression exercise.
 */

export interface SongQuizSlot {
  /** roman-numeral chord id, e.g. 'I', 'bVII' (must exist in PROGRESSION_CHORD_MAP) */
  chord: string;
  /** if true this slot is revealed up-front (used for non-diatonic chords) */
  given?: boolean;
}

export interface SongExercise {
  id: string;
  /** section label shown to the user, e.g. 'Intro', 'Chorus' */
  section: string;
  /** clip window in whole seconds within the track's video */
  start: number;
  end: number;
  /** tonic note name, e.g. 'F' (palette is built diatonic to this major key) */
  key: string;
  /** human note about the key/mode, shown under the key chip */
  keyNote?: string;
  /** the full progression, in order; slots may be marked given */
  slots: SongQuizSlot[];
  /** difficulty tier (1 = easy) — informational for now */
  tier: number;
}

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  /** YouTube video id (the part after watch?v= / youtu.be/) */
  videoId: string;
  exercises: SongExercise[];
}

export const SONG_TRACKS: SongTrack[] = [
  {
    id: 'goose-hungersite',
    title: 'Hungersite',
    artist: 'Goose',
    videoId: 'ktjYcMyW9H0',
    exercises: [
      {
        id: 'goose-hungersite-intro',
        section: 'Intro',
        start: 0,
        end: 29,
        key: 'F',
        keyNote: 'F Mixolydian — the ♭VII (E♭) is borrowed, so it is given to you',
        // F  E♭  E♭  F  =  I  ♭VII  ♭VII  I
        slots: [
          { chord: 'I' },
          { chord: 'bVII', given: true },
          { chord: 'bVII', given: true },
          { chord: 'I' },
        ],
        tier: 2,
      },
      // NOTE: the chorus (1:11–1:40, "Can we step out of the wreckage yet…")
      // is a SECOND exercise on THIS SAME track. Left out until its chords are
      // transcribed and verified — we do not ship un-checked theory.
    ],
  },
];

export const ALL_SONG_EXERCISES: { track: SongTrack; ex: SongExercise }[] =
  SONG_TRACKS.flatMap((t) => t.exercises.map((ex) => ({ track: t, ex })));
