# WTF — Shed Happens
## Stupid Simple Builder

**Complication is the enemy. Simple is the solution.**

**Start with 24 × 16. What's your fucking idea?**

V0.5 turns the original shed notebook into a multi-project, beginner-first builder with Cloudflare AI, cloud voice, anonymous project backup, image/document understanding, project-only web research, and a searchable shared reference library.

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
- KV caching for repeat research
- D1 structured reference-library metadata
- R2 storage for accepted research Markdown
- Queues for background research indexing
- AI Search managed semantic search with D1 fallback
- Workers Analytics Engine event tracking
- AI Gateway default gateway for Workers AI calls
- Runtime **WHAT'S LIVE?** panel driven by `/api/health`
- PWA / offline shell caching
- GitHub CI syntax + Wrangler dry-run checks

## Cloudflare free-first stack wired in the repository

- Workers + Static Assets
- SQLite-backed Durable Objects
- Workers AI
- AI Gateway
- Browser Run
- KV
- D1
- R2
- Queues
- AI Search namespace
- Workers Analytics Engine
- PWA/browser voice fallbacks

Modern Wrangler automatic provisioning is used for the account resources that support it, so the repository does not need somebody's D1/KV/R2 IDs hard-coded into GitHub. See `CLOUDFLARE_FREE_STACK.md` for what each service actually does and why duplicate/dead services are not forced into the app just to check a box.

## Run

```bash
npm install
npm run dev
```

`npm run dev` uses remote bindings because Workers AI, Browser Run and AI Search are Cloudflare-hosted services.

## Deploy

```bash
npm install
npm run deploy
```

On a first Cloudflare deployment, Wrangler may provision the draft KV, D1, R2 and Queue resources and bind them to the Worker.

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
- Shared library storage is for accepted public research content, not private project notes.

## Product strategy

Build this one by using it. If a beginner has to leave the app and ask what a button, board, measurement, or instruction means, treat that as a product bug.
