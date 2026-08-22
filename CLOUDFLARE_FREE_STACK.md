# Cloudflare Free-First Stack — WTF Shed Happens

This project intentionally uses Cloudflare features only when they add a real user benefit. **No fake binding, no dead button, no resource name invented just to say we used a product.**

## Active in v0.4.0

### Workers + Static Assets
Runs the API at `/api/*` and serves the app/PWA assets.

### Durable Objects — SQLite backend
`ProjectVault` gives each anonymous browser/device ID its own cloud snapshot. Friends using the same public URL do not share project state.

`MetabolicEngine` remains available as a bounded intent/queue engine and is now keyed per client instead of using one global object.

### Workers AI
Used for:
- ASK WTF construction assistant
- project-aware plain-English answers
- summarizing Browser Run research
- image/document conversion and description through `AI.toMarkdown()`

Text generation currently targets `@cf/zai-org/glm-4.7-flash`, selected because it remains available to Workers Free accounts as of the v0.4 build.

### AI Gateway
Workers AI calls use the `default` gateway so Cloudflare can provide gateway-level observability/cache behavior without another provider API key.

### Browser Run
Used only inside the app's project research flow. A user supplies a public URL; Browser Run renders it and converts it to Markdown. The app is not trying to become an unrestricted general-purpose web browser.

### Workers Analytics Engine
Writes small aggregate events such as AI, research, vision, and cloud actions. No project note text or uploaded photo content is intentionally written to Analytics Engine.

### PWA / browser platform
- Service Worker offline shell
- localStorage as immediate local-first state
- Web Speech Recognition when supported for STT
- `speechSynthesis` for free browser-native TTS/talk-back

## Useful free-tier services intentionally NOT bound yet

These are supported by the architecture but require account resources or a concrete data model before enabling them in the production Wrangler config.

### R2
Best next use: original project photos, blueprint exports, PDFs, and other large binary media. V0.4 analyzes uploads but does not permanently store the original binary in Cloudflare.

### D1
Best next use: searchable structured records when anonymous project snapshots outgrow the simple Durable Object model, or when public/shared libraries need relational querying.

### KV
Best next use: cached reference cards, terminology, small public content, and low-write app configuration.

### Vectorize / AI Search
Best next use: semantic search over the curated construction library, manufacturer references, and saved project research. AI Search is especially attractive for the public reference library because it can manage crawling/indexing.

### Queues
Best next use: background ingestion of uploaded reference material, image processing jobs, or library refresh tasks so the user does not wait on slow work.

### Workflows
Best next use: multi-step ingestion pipelines (fetch → convert → summarize → index → publish) when that pipeline actually exists.

## Rule for enabling another Cloudflare service

A service gets bound only when all three are true:

1. There is a real feature that needs it.
2. The resource can be provisioned without breaking the live Worker.
3. The UI truthfully reports whether the capability is actually active.

The `/api/health` endpoint is the source of truth for currently active runtime capabilities.
