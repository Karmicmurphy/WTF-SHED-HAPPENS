# WTF — Shed Happens v0.2.0 Field Test

This is the first owner-testable pass. The goal is not to prove the whole construction library is finished. The goal is to prove that the **WTF Stupid Simple interaction model** works while you are actually standing outside trying to build.

## Test it like this

1. Open the app on your phone.
2. Start on **MY BUILD** and see whether you immediately understand what to do next.
3. Open **PLAN**. Tap every legend term. If any explanation still sounds like carpenter bullshit, note it.
4. Switch joist spacing between **24 in O.C.** and **16 in O.C.** and confirm the diagram/count changes make sense visually.
5. Open **MY SHIT**. Add actual lumber, blocks, Marketplace finds, free material, or barter material. Edit quantities.
6. Export the project JSON. Re-import it and confirm your inventory comes back.
7. Open **LOOK**. Take a picture and save a question. Confirm the app does not pretend it identified something it cannot actually identify.
8. Open **FIELD NOTES** from the home screen. Type a note. Try **TALK** if your browser supports speech recognition.
9. Open **BUILD**. Mark steps done and undone. Make sure it feels like one job at a time instead of a lesson.
10. Open **LIBRARY** and decide whether the alternatives are useful without getting in the way of your current build.

## Tell me what pisses you off

Good bugs to report are things like:

- I don't know what this button means.
- Too much shit on this screen.
- I expected this to be a picture.
- This explanation still assumes I know carpentry.
- This should be one tap, not three.
- This material status makes no sense.
- I need this outside and the text is too small.
- I can't tell which board the diagram is talking about.
- I expected the app to remember this and it didn't.
- This math or layout looks wrong.

## Known intentional limits in v0.2.0

- Project data is local-first in browser storage; D1 sync is not wired yet.
- Selected photo previews are not uploaded to R2 yet.
- Visual AI recognition is not enabled yet.
- The floor diagram is a planning/teaching diagram, not a stamped structural plan.
- The real instructional-photo library is not populated yet; it must use owned/licensed/public-domain imagery with clear provenance.
- Walls, roof, deck, plumbing, electrical, and interior systems are deliberately not pretending to be finished.

## Pass condition

V0.2.0 passes if a beginner can use the floor workflow without constantly needing a carpenter to translate the interface.
