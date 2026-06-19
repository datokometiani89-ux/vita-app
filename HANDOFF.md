# HANDOFF — conversation context for continuing on another machine

This captures the *decisions and history* from the chat that built VITA, so a fresh
Claude session (e.g. on the laptop) has the same context without the literal transcript.
Read alongside `CLAUDE.md` (architecture + resume pointer) and `SPEC.md` (feature spec).

## Who / how to work
- **User:** Dato Kometiani (`dato.kometiani89@gmail.com`), founder-side. Communicates in **Georgian** — reply in Georgian. Designer-led; not deeply technical, so explain setup steps simply.
- **Language of the app:** Georgian (KA) default + EN toggle. All copy is `{ka, en}` via `V.t`.
- **Working style:** build features end-to-end as working prototypes with clean seams for real integrations; verify each in the preview before committing; one feature per commit.
- **The user gave standing autonomy** to keep building the wellness modules without waiting for per-step permission. Still: confirm before anything outward-facing/irreversible.

## Brand
- VITA = vitaapp.ge (real Georgian health-services company). Brand green `--green:#2BA94C`, font Avenir Next Georgian, glossy "jelly" gummy elements as the visual motif, tree-in-blob logo.
- ⚠️ **Logo is still a reconstruction** — the designer (Zura) will send the exact file later; don't treat the current tree mark as final. Brand green + font are correct.

## What exists (all committed)
Round-1 app + landing (vanilla JS SPA, no build) and round-2's 7 features, all done:
water tracker, rewards/elements gamification, women's cycle, calendar+.ics/gcal,
clinics finder + full visit flow, camera rep-counter (MediaPipe Pose), vitaapp.ge account.
Plus **social sign-in** (Google + Facebook) with a real-OAuth seam (`V.AUTH` client IDs in
`js/auth.js`) and a demo fallback.

### Pending integration seams (need credentials/decisions from the user)
- Social OAuth: paste real `googleClientId` / `facebookAppId` into `js/auth.js` (steps were given; user is obtaining them). No client secret needed for the frontend flow.
- Clinics API (currently real Tbilisi demo clinics + deep links), Google Calendar OAuth, vitaapp.ge SSO.
- Deploy: `DEPLOY.md` ready for Render; user will deploy "later".

## What we're building now — wellness micro-tools
The user loved the idea of wellness micro-exercises (started from "eye exercises"). We brainstormed
two batches and are building them under a **Wellness hub** (`js/screens-wellness.js`). See the
**"RESUME HERE"** section of `CLAUDE.md` for the exact done/pending list and routes.

Current checkpoint: hub + eye-care + breathing are built (commit `bb972eb`); their interactive
flows still need a preview pass. Next up: symptom checker → heart-rate (PPG) → PHQ-9/GAD-7 → mood journal.

## Repo / sync
- GitHub: `git@github.com:datokometiani89-ux/vita-app.git` (private). SSH key set up on the desktop Mac.
- **Golden rule:** work in one place at a time. `git pull` before starting, `git push` when done, to avoid conflicts between the desktop Mac and the laptop.

## Gotchas
- **Preview-mirror workflow** (see CLAUDE.md): the preview server serves from `/tmp/vita-preview`; rsync after edits and bump `?v=NN` (app.html) + `CACHE="vita-vNN"` (sw.js) together, or stale JS is served. At **v16** now.
- Screens re-render by replacing `#app`; any animation timer must self-clean by checking its root is still in the DOM (the wellness modules already do this).
