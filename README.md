# Fraza.dev — Portfolio

Personal portfolio of **Franshin Mizar Husain**, Frontend Developer.

The hero is a procedural 3D koi pond built with Three.js: three koi (orange, kohaku and showa) are generated entirely in code — no model files — swim with a travelling body wave, follow the cursor, and race to eat food when you click the pond. Light and dark themes are supported and remembered.

## Stack

- React 19 + TypeScript
- Vite
- Three.js

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Edit the content

All text (projects, skills, about, contact) lives in [`src/data/portfolio.ts`](src/data/portfolio.ts). Add a project by copying one block in `projects`. Use the live website link in `liveUrl`, or leave it empty to show "Live demo soon".

The koi pond lives in [`src/koi/KoiPond.ts`](src/koi/KoiPond.ts).
