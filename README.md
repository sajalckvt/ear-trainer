# 🎵 Ear Trainer

An open-source ear training app for intervals, chords, chord progressions, and melodies. No signup, runs in the browser, works offline after the first load, free forever.

**Try it live: [sajalckvt.github.io/ear-trainer](https://sajalckvt.github.io/ear-trainer/)**

Part of the [open-music-education](https://github.com/sajalckvt) family.

---

## Exercises

Five exercises, each with its own progression of levels. Pick an instrument (Choir / Voice / Piano / Violin), a key, an optional I-IV-V cadence intro to anchor the ear, and start training.

### Intervals
Hear two notes, identify the gap between them.
- **5 levels** from Beginner (P1/M3/P5/P8) up to Expert
- **Expert** focuses on second-octave intervals — m9, M9, m10, M10, P11 — once first-octave intervals are second nature
- Asc / Desc direction toggle

### Distance
Same as Intervals but the gap is the answer itself, not its musical name. Useful for raw ear calibration.
- **6 levels** culminating in an Octave-specific level for near-octave discrimination
- Asc / Desc / Both direction toggle

### Chords
Hear a chord, identify its quality.
- **6 levels**: Beginner (maj/min) → Easy (+ sus2/sus4/power chord) → Medium (+ dim/aug) → Hard (dim/aug + maj7/min7/dom7) → Difficult (m7♭5/dim7/mMaj7) → Expert (dom7/dom7♭9/dom7♯9)
- **Spread voicing toggle** — chord tones scattered across an octave to defeat shape memorization and force quality-based recognition
- **Arpeggio toggle** — play note-by-note first, or just the stacked chord
- **Playable song references** — every chord has 3 song mnemonics with ▶ play buttons that transpose the actual song hook to the current question's key (e.g. tap "Purple Haze" to hear the dom7♯9 in the key you're training in)

### Progressions
Hear a 3–4 chord progression, identify each chord by Roman numeral. Slot-by-slot answer entry with an animated playback that lights up the current chord on the piano and slot bar in sync. After answering, tap any slot to re-hear that chord alone.
- **4 levels**: Simple Triads (I/IV/V) → Pop Triads (+vi) → All Triads (full diatonic) → Triads + 7ths

### Melodies
Identify well-known melodies played on a tap-to-place piano roll. 24 melodies across 7 artists, Ableton-style note tiles.

---

## Reference page

A separate page (tab at top) for studying without the quiz:
- Instrument sampler — play any note or interval from C4
- Interval reference sheet grouped by category (Seconds, Thirds, Perfect, Sixths, Sevenths)
- Chord reference for every chord quality
- **Chord function explainer** — tonic / subdominant / dominant with tappable progression demos ("V → I", "V → vi deceptive resolution", etc.)
- **Diatonic chord reference** — every Roman-numeral chord in C major (I, ii, iii…, plus the 7th-chord variants), tappable
- Cadence voicings for the I-IV-V cadence primer

---

## Screenshots

*(Add screenshots / a short GIF here.)*

---

## Tech

Vite + React + TypeScript. No backend. Soundfont samples are shipped as a static JSON asset (~2.8 MB, loaded once, cached in memory).

```
src/
├── audio/           # AudioContext, soundfont loader, cadence, per-note gain
├── data/            # constants (intervals, chords, levels, progressions)
├── exercises/       # one file per exercise — pluggable via the Exercise interface
├── hooks/           # useQuizState, useTrainingTimer
├── components/      # UI primitives (Piano, Fretboard, AnswerGrid, ProgressionAnswerBuilder, MelodyBoard…)
├── pages/           # TrainPage, ReferencePage
├── App.tsx          # root, owns settings state
└── main.tsx         # entry
public/
└── soundfont.json   # 4 instruments × 23 samples (A3–G5)
```

---

## Run locally

```sh
npm install
npm run dev        # hot-reload dev server on http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
npm run lint       # eslint
```

---

## Deploy

A GitHub Actions workflow is pre-configured at `.github/workflows/deploy.yml`. To self-host on GitHub Pages:

1. Push to `main`
2. In repo **Settings → Pages**, set Source to **GitHub Actions**
3. The workflow builds with the correct subpath and deploys

For other static hosts (Vercel, Netlify, your own server) just run `npm run build` and upload `dist/`. If your host serves the app at a subpath, set `VITE_BASE` accordingly.

---

## Contributing

**Contributions of any size are welcome.** A few directions in increasing order of involvement:

### Add song references (easiest — 30 seconds of typing)

Every chord in `src/data/constants.ts` and every chord in `src/data/progressions.ts` has a `songs: SongRef[]` array. Adding a new mnemonic is just one entry:

```ts
{
  title: '"Your Song" — Artist',
  hint: 'Where to listen — e.g. "the chorus stab on the word X"',
  phrase: [0, 4, 7, 11],   // optional — semitone offsets from chord root
  bpm: 100,                 // optional — defaults to 110
}
```

If you include a `phrase`, the FeedbackSheet renders a ▶ button that plays your hook in whatever key the question is in, on whatever instrument the user picked. **The best chord references are bone-simple, instantly recognisable, and outline the chord's defining intervals.** Pop songs, nursery rhymes, cartoon cues — all fair game.

### Add reference content

The Reference page is wide-open. Good additions:
- Modes (Dorian, Mixolydian, Phrygian etc.) and modal melody examples
- Secondary dominants — V/V, V/vi, etc. (the "any chord can be approached by its 5th" trick)
- Borrowed chords from parallel minor (iv, ♭VII, ♭VI)
- More cadence types (plagal, deceptive, half cadence)
- Rhythm patterns / time-signature explainers

### Better animations or visuals

The progression playback animation, the melody board piano roll, the FeedbackSheet — all can be polished. New visualization ideas (interval Lissajous figures? Chord-circle of fifths overlay? Anything that helps the ear learn through the eye) are welcome.

### Better soundfont

The current samples are functional but not pristine. Some notes (Ab4 in particular) had loudness issues we patched with per-note gain compensation. A higher-quality, level-matched soundfont — ideally one that's openly licensed — would lift everything at once. The format is just `{ instrument: { noteName: dataUrl } }` in `public/soundfont.json`.

### New exercises

The whole v2 architecture exists to make adding a new exercise type one file. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the `Exercise` interface and an example. Ideas:
- Scale identification (major / natural minor / harmonic minor / each mode)
- Functional ear training — chord progression establishes a key, then a single note plays, identify its scale degree (1, 2, ♭3, ♯4, etc.)
- Rhythm dictation
- Cadence type identification (authentic / plagal / deceptive / half)

### Bug reports & feature requests

Open an issue. Include browser / OS, what you did, what you heard or saw, what you expected.

---

## License

MIT.
