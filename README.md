# Ear Trainer

Interactive ear training app for intervals and triads. No signup, works offline after the first load, free forever.

Part of the [open-music-education](https://github.com/open-music-education) family.

## Features

- **Phase 1** — Interval recognition (Unison through Major 9th)
- **Phase 2** — Triad identification (Maj, Min, Dim, Aug, Sus2, Sus4, Maj7, Min7, Dom7)
- Real sampled instruments (Choir, Voice, Piano, Violin)
- Piano keyboard + guitar fretboard visualization
- 12-key selector, I–IV–V cadence priming, ascending/descending mode
- Score tracking with streak, accuracy, and a weekly training timer
- Reference sheet with song mnemonics and chord formulas

## Tech

Vite + React + TypeScript. Soundfont samples are shipped as a static JSON asset (2.8 MB, loaded once, cached in memory).

```
src/
├── audio/           # AudioContext, soundfont loader, cadence
├── data/            # constants (intervals, chords, levels, etc.)
├── exercises/       # pluggable exercise types (see CONTRIBUTING.md)
├── hooks/           # useQuizState, useTrainingTimer
├── components/      # UI primitives
├── pages/           # TrainPage, ReferencePage
├── App.tsx          # root, owns settings state
└── main.tsx         # entry
public/
└── soundfont.json   # 4 instruments × 23 samples (A3–G5)
```

## Run locally

```sh
npm install
npm run dev        # hot-reload dev server on http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Deploy to GitHub Pages

A GitHub Actions workflow is pre-configured (`.github/workflows/deploy.yml`):

1. Push to `main`.
2. In repo **Settings → Pages**, set Source to **GitHub Actions**.
3. The workflow builds with the correct subpath and deploys.

The site will live at `https://<user>.github.io/<repo>/`.

For deployment to any other static host, just run `npm run build` and upload the `dist/` folder. If your host serves the app at the root, no config change is needed; if it's a subpath, set `VITE_BASE` accordingly.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the exercise plug-in pattern — adding a new exercise type is one file.

## License

MIT.
