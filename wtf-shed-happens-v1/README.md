# WTF — Shed Happens
## Stupid Simple Builder

**Complication is the enemy. Simple is the solution.**

This is V1 of the visual, beginner-first builder app. It is deliberately built around one real project first: **a 24' × 16' shed**, starting with the **floor**.

### What already works

- Dark-only workbench UI
- Mobile-first navigation
- PWA/installable behavior
- Real project site photos
- Floor concept blueprint
- WTF terminology translator
- Build Mode
- My Shit material inventory
- Local persistence with `localStorage`
- Photo/question capture screen
- Alternatives library shell
- Cloudflare Worker health endpoint
- Cloudflare Static Assets deployment
- D1 and R2 architecture slots reserved without making deployment depend on them

### Content truth rules

1. **REAL PHOTO** means an actual photograph.
2. **DIAGRAM** means an instructional drawing.
3. **YOUR BLUEPRINT** is project-specific and must state assumptions.
4. **CONCEPT** means visualization only.
5. AI must never quietly pretend a generated construction image is proof of correct construction.
6. Cheap, used, free, reclaimed, Marketplace, barter, and scrap are legitimate inputs.
7. Cheap is never permission to fake structural certainty.

### Run locally

```bash
npm install
npm run dev
```

Wrangler will print a local URL.

### Deploy to Cloudflare

1. Push these files to your GitHub repository.
2. In Cloudflare, create/import a Worker from that GitHub repository.
3. Build command: `npm install`
4. Deploy command: `npx wrangler deploy`

Or deploy from a terminal:

```bash
npm install
npx wrangler login
npm run deploy
```

### Current architecture

```text
Browser / PWA
├── Static UI (public/)
├── localStorage (V1 project state)
├── Service Worker (offline shell)
└── /api/* → Cloudflare Worker

Cloudflare Worker
├── Static Assets binding
├── /api/health
├── /api/project
├── D1 slot (next pass)
└── R2 slot (next pass)
```

### Next build passes

**Pass 2 — Floor becomes real**
- Lock the actual floor framing method.
- Correct board quantities and exact support locations.
- Make floor components individually selectable.
- Add a true materials calculation engine.
- Add installation checklist and completion photos.
- Add `Have / Need / Found / Free / Bartered / Bought / Used / Installed`.

**Pass 3 — Cloud persistence**
- D1 schema for projects, parts, inventory, notes, build steps.
- R2 for project photos and blueprint/media files.
- Sync between devices.
- Export/import project JSON.

**Pass 4 — Visual reference library**
- Properly licensed/public-domain/owned real construction photos.
- Labeled arrows/hotspots.
- Technical diagrams.
- Source/provenance fields for every instructional asset.

**Pass 5 — AI assistance**
- “What am I looking at?” photo assistance.
- Material identification suggestions.
- Ask for missing measurements instead of guessing.
- Never auto-approve structural decisions from an image.

### Core interaction model

**SEE → NAME → DO → CHECK → NEXT**

Default information depth:

1. WTF?
2. Show Me
3. Tell Me How
4. Why?
5. Nerd Shit

The app should never require Level 5 knowledge to understand Level 1 instructions.
