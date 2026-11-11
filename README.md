# Sourdough Tracker

A small offline-first web app for sourdough: recipe calculator, bake log and (later) a fermentation planner for two loaves from one bulk. See [docs/PLAN.md](docs/PLAN.md).

## Run locally

```sh
npm install
npm run dev     # development server
npm test        # unit tests for the calculations
npm run build   # production build in dist/
```

## Deploy

Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
One-time setup: in the repository settings, under Pages, set the source to "GitHub Actions".

Data is stored in the browser on your device (IndexedDB). Use Data → Export for backups.
