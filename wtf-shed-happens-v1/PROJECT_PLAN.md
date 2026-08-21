# WTF Simple App Standard — Builder Edition

## Product
**WTF — Shed Happens**  
**Stupid Simple Builder**

## V1 Test Project
- Footprint: 24' × 16'
- Deck concept: 24' × 8'
- Roof concept: single slope
- Current build stage: Floor
- Theme: dark only
- Visual language: dark stained wood + blackened steel + blueprint/chalk white + carpenter-pencil yellow
- Primary user model: visual/doer, beginner vocabulary, budget/scrounge-aware

## Non-negotiable product rules
- Never assume trade vocabulary.
- Real instructional photos must be genuinely real and labeled.
- Diagrams and AI concepts are visibly distinguished.
- One recommended path first; alternatives second.
- User's current project stays separate from the big library.
- Free/used/reclaimed/barter materials are first-class.
- Safety/structural uncertainty must be stated plainly.
- Every instruction ends in something physically observable.
- No fake capabilities.

## Core screens
1. Home / My Build
2. Build
3. Plan
4. My Shit
5. Look At This
6. Library
7. WTF translator overlay

## Data model (planned)
- Project
- System
- Part
- Photo
- Diagram
- Material
- Step
- Note
- Source/provenance
- Status/progress
- Cost/source type

## Free-first Cloudflare plan
- Worker + Static Assets: app + API
- D1: project/state data
- R2: images/blueprints/photos
- Workers AI: optional enhancement only
- PWA cache: resilient field use
- GitHub: source of truth + deployment
