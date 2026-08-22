# Cloudflare Free-First Stack — WTF Shed Happens

This project uses Cloudflare features only when they create a real user benefit. **No fake binding, no dead button, no resource name invented just to say we used a product.**

## Wired into v0.5.0

### Workers + Static Assets
Runs `/api/*`, serves the app/PWA, and keeps the public `workers.dev` deployment simple.

### Durable Objects — SQLite backend
`ProjectVault` gives each anonymous browser/device ID its own cloud snapshot. Friends using the same public URL do not share project state.

`MetabolicEngine` remains available as a bounded per-client intent queue.

### Workers AI
Used for:
- ASK WTF project-aware construction explanations
- image/document understanding via `AI.toMarkdown()`
- research-page summarization and relevance checks
- Cloudflare STT with `@cf/openai/whisper-large-v3-turbo`
- Cloudflare TTS with `@cf/myshell-ai/melotts`

The main assistant currently targets `@cf/zai-org/glm-4.7-flash`.

### AI Gateway
Workers AI calls use Cloudflare's `default` AI Gateway. Cloudflare can create the default gateway automatically on the first authenticated Workers AI request, so no separate provider key is required.

### Browser Run
Used only inside the app's project research flow. A user supplies a public URL; Browser Run renders it and converts it to Markdown. The AI layer checks whether the page is relevant to DIY/building before presenting it as app content. The app is not an unrestricted general-purpose browser.

### KV (`APP_KV`) — automatically provisioned
Caches previously researched public build/manufacturer pages so repeat questions do not need to re-render and re-summarize the same page every time.

### D1 (`DB`) — automatically provisioned
Stores structured metadata for the shared WTF reference library: source URL, title/question, summary, storage key, relevance flag and timestamps. The schema is created lazily by the Worker.

### R2 (`MEDIA`) — automatically provisioned
Stores the extracted Markdown behind accepted public research pages. It is app/reference content storage; private project notes are not intentionally written here.

### Queues (`JOBS`) — automatically provisioned
Research ingestion can hand semantic indexing work to a background queue instead of making the person wait on the page. The same Worker is configured as producer and consumer.

### AI Search namespace (`AI_SEARCH`)
Uses Cloudflare AI Search's default namespace. The Worker lazily creates a `wtf-shed-happens-library` instance and uploads accepted research content so the **WTF REFERENCE SEARCH** can use managed semantic search. If AI Search is unavailable or not indexed yet, the search endpoint falls back to D1 text search.

### Workers Analytics Engine
Writes small aggregate events such as AI, research, search, vision, STT, TTS and cloud actions. Project note text and uploaded binaries are not intentionally written to Analytics Engine.

### PWA / browser platform
- service-worker offline shell
- localStorage for immediate local-first state
- Cloudflare STT/TTS first when available
- browser Web Speech / `speechSynthesis` fallback
- push-to-talk voice commands and talk-back

### Runtime truth panel
`/api/health` and `/api/stack` report what is actually bound and live. The UI exposes this through **WHAT'S LIVE?** so a feature is never silently pretended to exist.

## Why the repo can create storage without account IDs

Wrangler v4.45+ supports automatic provisioning for KV, D1 and R2, and current Wrangler also supports automatic provisioning for Queues and several newer resources. The repository uses draft bindings for KV/D1/R2 so a Cloudflare Git deployment can create and bind the account resources without hard-coding somebody's account IDs into GitHub. The project pins Wrangler to a modern v4 release range for this reason.

## Not forced in just for a checkbox

### Raw Vectorize (`VECTORIZE`)
Not separately bound right now because AI Search already provides the managed semantic index used by the app reference library. Adding a second vector database would duplicate the same job without making the app simpler.

### Workflows
Not bound yet because the current ingestion pipeline is small enough for Queue consumers. If it grows into a true multi-step long-running pipeline, Workflows becomes useful.

### Images / Media Transformations
Original image/PDF analysis already goes through Workers AI. A dedicated image-transformation pipeline should be added when the app begins permanently storing original project photos in R2 rather than bolted on as a dead feature.

## Rule for enabling another Cloudflare service

A service gets bound only when all three are true:

1. There is a real feature that needs it.
2. It can be provisioned without breaking the live Worker.
3. The UI truthfully reports whether the capability is actually active.

The `/api/health` endpoint is the source of truth for currently active runtime capabilities.
