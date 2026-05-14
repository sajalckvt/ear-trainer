# Backlog

Items deferred from active development. Each entry has enough context to
pick up without re-reading the full chat history.

---

## 1 · Sing-back exercises (mic input + pitch detection)

**Status:** Designed, not started. Decision: build interval singing first as POC.

### What it is
A new exercise category where the user sings into the mic and gets real-time
feedback. Two planned variants:

**1a · Sing the Interval**
App plays a root note, names the target interval (e.g. "Major 3rd"),
user sings the interval above (or below) it. Most reliable to build —
one discrete note to detect, known reference.

**1b · Sing the Scale / Mode**
App establishes a tonic, names a mode (e.g. "D Dorian"), user sings the
scale ascending. Detector segments the sung notes and matches the interval
pattern against the target mode's intervals. Works well for clear singers.

### Tech stack (fully native, no backend)
```
getUserMedia (browser mic)
  → Web Audio API AnalyserNode (2048-sample buffer)
  → pitchy@4 (McLeod Pitch Method, returns [hz, clarity 0–1])
  → Hz → MIDI: Math.round(12 * Math.log2(freq / 440) + 69)
  → compare to expected note(s)
```

Install: `npm install pitchy`

### Key implementation notes
- **Clarity threshold:** only accept a pitch reading when `clarity > 0.9`
  for at least 200–300ms (lock-on time). Avoids false triggers on vowel
  onsets and breath noise.
- **Tolerance:** ±25 cents for normal, ±50 cents for beginner mode.
- **Octave flexibility:** if target is C4 but user sings C3, count it
  correct — same pitch class, different octave. Essential for male voices.
- **Live visual tuner:** a moving needle or colored pitch bar must be
  shown while the user is singing. Otherwise it feels like shouting into
  a void. This is not optional UX polish — it's required for the exercise
  to feel usable.
- **Scale segmentation:** detect note boundaries by thresholding RMS
  amplitude below a silence floor (~-50dB). Notes separated by silence
  > 80ms are treated as separate pitches.

### Architecture plan
Three new files:
- `src/audio/pitchDetector.ts` — `usePitchDetector` hook wrapping
  getUserMedia + Web Audio + pitchy loop running in rAF
- `src/components/TunerNeedle.tsx` — live pitch visualisation
- `src/exercises/singInterval.ts` — the Exercise impl

Fits into the existing Exercise interface. `generate()` picks a root +
interval. `play()` plays the root note as reference. New concept: the
exercise has a `listenForAnswer(q, cb)` method that the mic hook feeds
into, rather than the user tapping an answer button.

### UX flow
1. Question generated (e.g. root = E4, target interval = min3)
2. App plays E4 twice as reference
3. "Now sing the minor 3rd above E4" shown on screen
4. Live tuner needle appears — user can see their pitch in real time
5. When stable pitch detected for 300ms → lock in → score → next

### Known limitations
- Background noise in a bedroom mic will cause false readings. Accept
  this for v1 — add noise gate option later.
- Octave detection errors on male singing voices (second harmonic
  dominates fundamental) are a known pitchy limitation. Octave
  flexibility rule above handles this.
- No Android/iOS native mic access via web — `getUserMedia` works fine
  in Chrome, Safari ≥ 14.1, Firefox. Not usable in in-app browsers.

---

## 2 · Melodies exercise (redesign)

**Status:** Code exists (`src/exercises/melody.ts`, `src/components/MelodyBoard.tsx`)
but removed from nav (`src/exercises/index.ts`) because the UX is poor.
The exercise and all song data are preserved — it just isn't accessible.

### What exists
- 24 melodies across 7 artists in `src/data/melodies.ts`
- Ableton-style piano roll UI (`MelodyBoard`) where the user taps note
  tiles to reveal the melody
- Scoring: completed clean vs completed with retries

### Why it was hidden
The piano roll tap-to-reveal mechanic doesn't train the ear — it's more
of a memory / visual game. The user reads the piano roll rather than
listening. Core problem: **the exercise doesn't require listening to
identify anything.**

### What a better version looks like
Two directions to explore:

**2a · Melodic dictation (harder)**
App plays a short melody (3–5 notes). User must reconstruct it by
tapping notes on the piano in the correct order. No visual hint during
playback. Measures ear-to-note mapping.

**2b · Melody identification (easier, what the current exercise intended)**
App plays a melody. User picks which song it is from 4 options. Like
a "name that tune" game. The answer grid is 4 song titles, not a piano
roll. Much simpler to build and more clearly an *ear training* exercise.

**Recommendation:** build 2b first (low effort, clearly correct), then
consider 2a as a harder variant later.

### Re-enabling
To put Melodies back in the nav, add `melodyExercise` back to
`src/exercises/index.ts` EXERCISES array and add a roadmap entry in
`src/pages/TrainPage.tsx`. The code is all there — it just needs the
exercise redesigned first.

### Songs already in the data
`src/data/melodies.ts` — 24 entries, each with MIDI note sequences.
Artists include Beatles, ABBA, Mozart, and others. Reusable for 2b
if the mechanic is changed.

---

## 3 · Song-reference audit (chords + modes + scales)

**Status:** Partially done for dom7, min7, dim, dim7. Many others
not yet audited — confirmed accurate but phrases may not be recognisable.

### What needs doing
Every chord/interval/mode/scale has `songs: SongRef[]` arrays.
The phrases (semitone offset arrays) were written from memory and some
are wrong or not recognisable as the song they claim to be.

### Audit needed for
- **Chords (`src/data/constants.ts`):** maj, min, aug, sus2, sus4, pwr,
  maj7, mMaj7, m7b5, dom7b9, dom7sharp9 (dom7/min7/dim/dim7 already done)
- **Modes (`src/data/modes.ts`):** all 7 — the song refs exist but
  phrases haven't been play-tested
- **Scales (`src/data/scales.ts`):** all 11 — song refs exist,
  no phrases added yet (intentional — scales don't lend themselves to
  2–3 note hooks the way chords do)

### How to audit
For each chord/mode, tap the ▶ button on the Reference page and ask:
"does this sound like the claimed song?" If not, either:
- Fix the `phrase` array (re-encode the actual hook)
- Change the `title` to a song that the current phrase actually sounds like
- Remove the phrase entirely (leave title + hint as text-only mnemonic)

### Scale refs — no phrases needed?
Scales are harder to represent in a 3–5 note phrase because they're
*scales*, not hooks. The reference entries in `src/data/scales.ts`
currently have title + hint only (no `phrase`). This is probably fine —
the Reference section plays the full scale via the ▶ Scale button.
Consider adding a 2–3 note *melodic motif* from the song instead of
trying to quote the scale itself.

---

## Notes on branch state

All completed work lives on `refactor/reference-page-nav` branch.
Main reflects what's been merged via PRs. When resuming, check:

```bash
git log --oneline origin/main..HEAD   # what's not yet merged to main
git log --oneline -10                 # recent commit history
```

To push everything to GitHub and merge:
```bash
git push -u origin refactor/reference-page-nav
# then open PR on GitHub and merge
```
