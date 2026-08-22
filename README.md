# WTF — Shed Happens
## Stupid Simple Builder

**Complication is the enemy. Simple is the solution.**

**Start with 24 × 16. What's your fucking idea?**

V0.5 turns the original shed notebook into a multi-project, beginner-first builder with Cloudflare AI, cloud voice, anonymous project backup, image/document understanding, and project-only web research.

## What works now

- New blue / white / purple full-width WTF banner and blueprint shed-frame logo
- Multi-project **MY BUILDS** system
- 24 × 16 quick starter plus **WHAT'S YOUR FUCKING IDEA?** custom setup
- Shed, cabin/tiny house, house, workshop, garage, deck, chicken coop, or custom build shells
- Project-specific stages based on what is actually being built
- Dynamic floor planning diagram and 16 / 24 in O.C. planning counts
- **MY SHIT** inventory for bought, free, Marketplace, barter, found, or existing material
- Field notes attached to each project
- Anonymous per-browser Cloudflare Durable Object backup so friends do not overwrite each other's builds
- Workers AI **ASK WTF** assistant using project size, stage, priority, materials, and recent notes
- Workers AI image/document understanding through `AI.toMarkdown()`
- Cloudflare STT using `@cf/openai/whisper-large-v3-turbo`
- Cloudflare TTS / talk-back using `@cf/myshell-ai/melotts`
- Browser speech recognition and `speechSynthesis` fallback when cloud voice is unavailable
- Push-to-talk voice commands for the core app navigation
- Browser Run webpage-to-Markdown research for app/build content only
- AI relevance check and summaries of researched pages
- Workers Analytics Engine event tracking
- AI Gateway default gateway for Workers AI calls
- Runtime **WHAT'S LIVE?** panel driven by `/api/health`
- PWA / offline shell caching
- GitHub CI syntax + Wrangler dry-run checks

## Cloudflare free-first stack currently wired

- Workers + Static Assets
- SQLite-backed Durable Objects
- Workers AI
- AI Gateway
- Browser Run
- Workers Analytics Engine
- Cloudflare-hosted STT and TTS models through the Workers AI binding

The Worker also reports whether optional D1, R2, KV, Vectorize, and Queues bindings exist. Those resource-backed services are intentionally not hard-coded into the production Wrangler config until the corresponding account resources exist, because fake bindings would break deployment. See `CLOUDFLARE_FREE_STACK.md`.

## Run

```bash
npm install
npm run dev
```

`npm run dev` uses remote bindings because Workers AI and Browser Run are Cloudflare-hosted services.

## Deploy

```bash
npm install
npm run deploy
```

## Core interaction model

**SEE → NAME → DO → CHECK → NEXT**

Information depth:

1. WTF?
2. Show Me
3. Tell Me How
4. Why?
5. Nerd Shit

## Truth rules

- **REAL PHOTO** means an actual photograph.
- **DIAGRAM** means an instructional drawing.
- **YOUR BLUEPRINT** is project-specific and states assumptions.
- **CONCEPT** means visualization only.
- AI does not quietly present generated imagery as construction proof.
- Image analysis describes visible content; it does not prove hidden condition or structural adequacy.
- Cheap, used, free, reclaimed, Marketplace, barter, and scrap are legitimate inputs when condition is suitable.
- Cheap is never permission to fake structural certainty.
- Web research is for project/app content, not a general-purpose unrestricted browser.

## Product strategy

Build this one by using it. If a beginner has to leave the app and ask what a button, board, measurement, or instruction means, treat that as a product bug.
