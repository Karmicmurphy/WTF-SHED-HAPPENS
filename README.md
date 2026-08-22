# WTF — Shed Happens
## Stupid Simple Builder

**Complication is the enemy. Simple is the solution.**

**Start with 24 × 16. What's your fucking idea?**

V0.4 turns the original shed notebook into a multi-project, beginner-first builder. A fresh visitor can use the 24 × 16 starter or create their own shed, cabin/tiny house, house, workshop, garage, deck, chicken coop, or custom project. Each browser gets its own anonymous project identity and Cloudflare Durable Object backup.

## What works now

- Blue / white / purple full-width WTF banner and new shed-frame logo
- Multi-project **MY BUILDS** system
- 24 × 16 quick starter plus **WHAT'S YOUR FUCKING IDEA?** custom setup
- Project-specific stages based on what is being built
- Dynamic floor planning diagram and 16 / 24 in O.C. planning counts
- **MY SHIT** material inventory for bought, free, Marketplace, barter, found, or existing material
- Field notes attached to each project
- Cloudflare Durable Object anonymous cloud backup per browser/device identity
- Workers AI **ASK WTF** assistant using project context
- Workers AI image/document understanding through `AI.toMarkdown()`
- Browser Run webpage-to-Markdown research for app/build content only
- AI summaries of researched pages
- Browser-native STT voice input where supported
- Browser-native TTS / talk-back
- Voice commands: home, build, plan, my shit, look, library, research, notes, new build, read this, stop talking
- Workers Analytics Engine event tracking
- PWA / offline shell caching
- GitHub CI syntax + Wrangler dry-run checks

## Cloudflare free-first stack currently wired

- Workers + Static Assets
- SQLite-backed Durable Objects
- Workers AI
- AI Gateway default gateway
- Browser Run
- Workers Analytics Engine

The code is also structured so D1, R2, KV, Vectorize, Queues and AI Search can be added without replacing the app. Those resource-backed services require account resources/bindings to exist before they can be safely enabled in the main deploy config. See `CLOUDFLARE_FREE_STACK.md`.

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
