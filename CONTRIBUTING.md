# Contributing to Ear Trainer

Thank you for considering contributing! The whole point of the v2 architecture was to make new exercises easy to add.

## Adding a new exercise type

An exercise is anything that asks the user to identify something from audio — intervals, chords, modes, chord progressions, rhythms, you name it.

Every exercise implements the `Exercise` interface from `src/exercises/types.ts`:

```ts
interface Exercise<TPayload> {
  id: string;
  name: string;
  levels: ReadonlyArray<{ n: string }>;
  usesDirection: boolean;
  generate(opts): Question & { payload: TPayload; pickId };
  play(q, instId): void;
  answers(levelIndex): AnswerOption[];
  isCorrect(q, guess): boolean;
  feedback(answerId): FeedbackInfo;
}
```

### Step 1 — create your exercise file

Copy `src/exercises/interval.ts` as a starting template. Change:

- `id` and `name` to something unique (`'mode'`, `'Phase 3: Modes'`).
- `levels` — the level presets the user can pick.
- `generate()` — pick a question at random, compute which MIDI notes should play and which note is "root".
- `play()` — how to sound the question: arpeggio, chord, melody, whatever.
- `answers()` — which buttons appear in the answer grid for each level.
- `isCorrect()` — compare the user's guess against the question's payload.
- `feedback()` — the label, color, and reference hint shown after a guess.

All the **scoring, streak tracking, anti-repeat history, cadence priming, and piano/fretboard highlighting come for free** — `useQuizState` handles them.

### Step 2 — register it

Add a line to `src/exercises/index.ts`:

```ts
import { modeExercise } from './mode';

export const EXERCISES = [
  intervalExercise,
  triadExercise,
  modeExercise,   // ← new
] as const;
```

That's it. It now appears as a phase button in the UI.

### Step 3 — open a PR

Include:
- A short description of what the exercise teaches
- Screenshots or a screen recording if it's visually distinctive
- If you added any music-theory data to `src/data/constants.ts`, note that

## Code style

- TypeScript, strict mode — we run `tsc` in CI.
- React functional components, hooks only.
- No external UI libraries in the exercise framework — keeps the bundle small and the learning curve flat for musicians who code.

## Running tests

There aren't any yet. If you add meaningful logic (e.g., scale theory helpers), adding unit tests for it is very welcome — Vitest is the preferred runner.

## Reporting bugs

Open an issue with:
- Browser + OS
- What you expected vs. what happened
- Audio console errors, if any (iOS audio is notoriously fussy; we care about it working there)
