# WTF — Shed Happens v0.5.0 Field Test

This is the owner-testable pass for the **WTF Stupid Simple** interaction model, multi-project system, Cloudflare AI, voice, image understanding, cloud backup, and app-only web research.

## Test it like this

1. Open the public app in a fresh/private browser window. The first thing should be **Start with 24 × 16. What's your fucking idea?**
2. Choose **START WITH 24 × 16**. Confirm it creates a 24 × 16 shed project without asking a pile of questions.
3. Create another build with your own dimensions and type. Switch back and forth. Confirm each project keeps its own materials, notes, stage and settings.
4. Give the URL to a friend. Their project should stay separate from yours because their browser has its own anonymous identity and Durable Object vault.
5. Open **PLAN**. Change joist spacing and runner count. Confirm the diagram and counts visibly change.
6. Open **MY SHIT**. Add real lumber, blocks, Marketplace finds, free material, or barter material.
7. Press **ASK WTF**. Ask a normal-language construction question and check whether the answer uses your current build as context without assuming trade vocabulary.
8. Press **TALK**. Speak a question. Tap again to stop. The app should use Cloudflare Whisper STT when available and fall back to browser speech recognition if needed.
9. Leave talk-back on and ask a question. The answer should be spoken with Cloudflare MeloTTS when available and fall back to browser speech synthesis if needed.
10. Try voice commands such as **open plan**, **open my shit**, **read this**, and **stop talking**.
11. Open **LOOK**. Take/upload a picture or PDF, ask what you are looking at, and confirm the app distinguishes visible facts from things it cannot verify.
12. Open **RESEARCH A PAGE**. Paste a manufacturer or DIY/building URL. Confirm unrelated pages are rejected or marked outside the app's content scope.
13. Tap **WHAT'S LIVE?** and verify the runtime panel truthfully reports which Cloudflare services are actually active.
14. Turn off network access after loading once and confirm the app shell still opens from the PWA cache. Cloud AI/research should naturally require network access.

## Tell me what pisses you off

Good bugs to report are things like:

- I don't know what this button means.
- Too much shit on this screen.
- I expected this to be a picture.
- This explanation still assumes I know carpentry.
- This should be one tap, not three.
- The voice heard me wrong.
- Talk-back is annoying or too slow.
- The AI answer is too long.
- My friend's build appeared in mine.
- My build disappeared after an update.
- The cloud status says something is live when it is not.
- I need this outside and the text is too small.
- I can't tell which board the diagram is talking about.
- The math or layout looks wrong.

## Known intentional limits in v0.5.0

- The floor diagram is a planning/teaching diagram, not a stamped structural plan.
- The real instructional-photo library is still incomplete and must use owned/licensed/public-domain imagery with provenance.
- R2, D1, KV, Vectorize and Queues are not production-bound until those account resources actually exist.
- Cloud voice depends on browser microphone permission and Cloudflare Workers AI availability/quota.
- Browser Run research only accepts public HTTP/HTTPS pages and is intentionally scoped to project/build content.
- Walls, roof, deck, plumbing, electrical and interior knowledge modules are not pretending to be complete yet.

## Pass condition

V0.5.0 passes if a beginner can create their own build, understand the current step, ask questions by voice or text, save their own shit, and use the same public URL as a friend without either person's project overwriting the other.
