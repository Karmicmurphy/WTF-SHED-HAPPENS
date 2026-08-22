# WTF — Shed Happens v0.5.0 Field Test

This is the owner-testable pass for the **WTF Stupid Simple** interaction model, multi-project system, Cloudflare AI, voice, image understanding, cloud backup, app-only web research, and the shared WTF reference library.

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
13. Research a useful build/manufacturer page, then return to **LIBRARY** and use **WTF REFERENCE SEARCH**. The first indexing pass can take a little time; D1 text search is the fallback while AI Search catches up.
14. Research the exact same URL/question again. It should be eligible for the KV cache instead of spending Browser Run + AI on identical content again.
15. Tap **WHAT'S LIVE?**. After the first successful Cloudflare deployment/provisioning pass, verify Durable Objects, AI, Browser Run, KV, D1, R2, Queues, AI Search and Analytics report truthfully from the live Worker.
16. Turn off network access after loading once and confirm the app shell still opens from the PWA cache. Cloud AI/research naturally requires network access.

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
- Research accepted a page that has nothing to do with the build.
- The reference search can't find something I just researched.
- I need this outside and the text is too small.
- I can't tell which board the diagram is talking about.
- The math or layout looks wrong.

## Known intentional limits in v0.5.0

- The floor diagram is a planning/teaching diagram, not a stamped structural plan.
- The real instructional-photo library is still incomplete and must use owned/licensed/public-domain imagery with provenance.
- KV, D1 and R2 use Wrangler automatic provisioning; Queues and the AI Search namespace are also configured in the Cloudflare deployment. The first deployment is the one that proves what the account actually provisions and binds.
- Unrelated researched pages can be negatively cached to save quota, but they are not intentionally promoted into R2/D1/Queues/AI Search shared library content.
- Cloud voice depends on browser microphone permission and Cloudflare Workers AI availability/quota.
- Browser Run research only accepts public HTTP/HTTPS pages and is intentionally scoped to project/build content.
- Raw Vectorize is not separately used because AI Search already supplies the semantic index for the shared reference library.
- Workflows are not added yet because Queues already cover the current background indexing job; adding a second durable executor would be complexity without a user benefit right now.
- Walls, roof, deck, plumbing, electrical and interior knowledge modules are not pretending to be complete yet.

## Pass condition

V0.5.0 passes if a beginner can create their own build, understand the current step, ask questions by voice or text, save their own shit, use app-only web research, find useful saved references again, and use the same public URL as a friend without either person's project overwriting the other.
