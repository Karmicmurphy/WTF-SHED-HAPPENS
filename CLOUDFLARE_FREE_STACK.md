# Cloudflare Free-First Stack — WTF Shed Happens

This project uses Cloudflare features only when they create a real user benefit. **No fake binding, no dead button, no resource name invented just to say we used a product.**

## Active in v0.5.0

### Workers + Static Assets
Runs `/api/*`, serves the app/PWA, and keeps the public `workers.dev` deployment simple.

### Durable Objects — SQLite backend
`ProjectVault` gives each anonymous browser/device ID its own cloud snapshot. Friends using the same public URL do not share project state.

`MetabolicEngine` remains available as a bounded per-client intent queue.

### Workers AI
Used for:
- ASK WTF project-aware construction explanations
- image/document understanding via `AI.toMarkdown()`
- research-page summarization
- Cloudflare STT with `@cf/openai/whisper-large-v3-turbo`
- Cloudflare TTS with `@cf/myshell-ai/melotts`

The main assistant currently targets `@cf/zai-org/glm-4.7-flash`.

### AI Gateway
Workers AI calls use Cloudflare's `default` AI Gateway for logging/observability and cache-aware requests without another provider API key.

### Browser Run
Used only inside the app's project research flow. A user supplies a public URL; Browser Run renders it and converts it to Markdown. The AI layer checks whether the page is relevant to DIY/building before presenting it as app content. The app is not an unrestricted general-purpose browser.

### Workers Analytics Engine
Writes small aggregate events such as AI, research, vision, STT, TTS, and cloud actions. Project note text and uploaded binaries are not intentionally written to Analytics Engine.

### PWA / browser platform
- service-worker offline shell
- localStorage for immediate local-first state
- Cloudflare STT/TTS first when available
- browser Web Speech / `speechSynthesis` fallback
- push-to-talk voice commands and talk-back

### Runtime truth panel
`/api/health` and `/api/stack` report what is actually bound and live. The UI exposes this through **WHAT'S LIVE?** so a feature is never silently pretended to exist.

## Free-tier services scaffolded but not bound in production yet

These require real account resources/IDs before Wrangler can bind them safely. The Worker health response already detects the names below if they are added later.

### R2 (`MEDIA`)
Best use: original project photos, blueprints, PDFs, generated diagrams, and other binary media.

### D1 (`DB`)
Best use: structured public reference-library data, searchable material records, and shared metadata that outgrows per-user Durable Object snapshots.

### KV (`APP_KV`)
Best use: cached terminology cards, public app configuration, reference snippets, and low-write content.

### Vectorize (`VECTORIZE`)
Best use: semantic search across curated building references and saved research.

### Queues (`JOBS`)
Best use: background ingestion, conversion, indexing, image processing, and slow reference-library jobs.

### Workflows
Best use: multi-step ingestion pipelines such as fetch → convert → summarize → index → publish once those jobs become real.

## Rule for enabling another Cloudflare service

A service gets bound only when all three are true:

1. There is a real feature that needs it.
2. The account resource exists and can be provisioned without breaking the live Worker.
3. The UI truthfully reports whether the capability is actually active.

The `/api/health` endpoint is the source of truth for currently active runtime capabilities.
