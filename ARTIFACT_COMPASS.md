# Artifact Compass — WTF Shed Happens

## North Star
**Complication is the enemy. Simple is the solution.**

The app is for people who learn by seeing and doing, do not already speak trade jargon, and may be building with used, free, bartered, reclaimed, or mismatched material.

## WTF interaction model
**SEE → NAME → DO → CHECK → NEXT**

### Default information depth
1. WTF?
2. Show Me
3. Tell Me How
4. Why?
5. Nerd Shit

The default screen must never dump Level 5 information on somebody who only needs Level 1–3.

## Visual system
- Dark mode only for V1.
- Background: subtle dark stained wood / workbench texture.
- Panels: blackened or aged steel.
- Primary text: chalk / blueprint white.
- Action highlight: carpenter-pencil yellow.
- Diagram framing: deep blueprint navy with pale blue framing lines.
- Orange: pay-attention warning.
- Red: stop / do-not-wing-it warning.
- Green: verified / done / okay.

### Image truth labels
Every instructional visual must be visibly classified:
- **REAL PHOTO** — an actual photograph.
- **DIAGRAM** — a technical instructional drawing.
- **YOUR BLUEPRINT** — generated for the user's actual project dimensions and current selected method.
- **CONCEPT** — visualization only, including AI concept art.

An AI-generated image must never be presented as real construction evidence.

## Real-photo strategy
Instructional photos should come from one of these sources only:
1. User's own project photos.
2. Photos the project owns or has explicit permission to use.
3. Public-domain or properly licensed reference images.
4. Manufacturer documentation/images where reuse terms allow it.

Each reference image should eventually carry source/provenance metadata.

## Layout rules
- One obvious action per primary card.
- Large tap targets for field use.
- Mobile-first, thumb-friendly navigation.
- The user's current build is always easier to reach than the reference library.
- The selected method gets one primary recommendation. Alternatives live one level deeper.
- Tapping a construction part should reveal: name, WTF definition, job, where it goes, and deeper details on demand.

## Naming rules
Use plain-English labels first and professional vocabulary second.

Examples:
- **RUNNER / BEAM** — long support underneath the floor.
- **CENTER BEAM** — middle support that reduces unsupported joist span.
- **FLOOR JOIST** — repeating boards the subfloor sits on.
- **RIM** — closes the outside edge of the floor frame.
- **BLOCK / PIER** — support point carrying the frame into the ground.
- **O.C. / ON CENTER** — center-to-center spacing.
- **SPAN** — unsupported distance between supports.

Avoid using **stringer** for floor runners; reserve stringer primarily for stair framing terminology.

## Budget philosophy
Cheap is a first-class design constraint, not an embarrassment.

Material state must support:
- HAVE
- NEED
- FOUND
- FREE
- BARTERED
- BOUGHT
- USED
- INSTALLED

Recommendations can optimize for:
- CHEAP AS FUCK
- EASIEST
- USE WHAT I HAVE
- FEWEST CUTS
- FEWEST SUPPORTS
- STRONGER
- PICK FOR ME

## Truth and safety behavior
- Never pretend there is only one valid framing method when several exist.
- Never state that a structural layout is definitely adequate without the information required to support that claim.
- When species, grade, condition, soil, support spacing, span, or connection details matter, say so plainly.
- Ask for the missing measurement instead of guessing.
- Every instruction should end in something physically observable whenever possible.

Example: instead of `ensure adequate bearing`, say `look underneath: the beam should sit directly over the support, not hang past it`.

## Architecture — free-first
The app should remain useful even if all AI services are unavailable.

- Cloudflare Worker + Static Assets: UI and API.
- Browser/PWA cache: resilient field use.
- localStorage: V1 personal state.
- D1: future project/inventory/note sync.
- R2: future project photos, blueprints, and reference media.
- Workers AI: optional enhancement only.
- GitHub: source of truth and deployment source.

Cloudflare Static Asset requests are free and unlimited, while Worker execution remains subject to Free-plan Worker limits. Keep image/media payloads in static assets or R2 rather than bundling them into Worker code.

## V1 scope
The first proving ground is one real build:
- Project: 24' × 16' shed
- Current stage: Floor
- Deck concept: 24' × 8'
- Roof concept: shallow single-slope roof

V1 succeeds when the user can use the Floor workflow in the field without repeatedly leaving the app to ask what the terminology or next action means.

## Build order
1. Floor interaction and terminology.
2. Floor calculation/material engine.
3. Real labeled image library and provenance.
4. Project photo capture and storage.
5. D1/R2 sync.
6. Walls using the same interaction engine.
7. Roof.
8. Deck.
9. Generic project/template system.

## Anti-patterns
- Giant dashboard with dozens of equal-priority controls.
- Technical jargon as the primary label.
- Twenty options before one recommended path.
- Fake AI functionality.
- AI concept imagery labeled or implied as REAL.
- Construction advice disconnected from the user's actual inventory.
- App features that require paid AI to remain usable.
