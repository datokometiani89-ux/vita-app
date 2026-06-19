# VITA Health AI — project guide (read me first)

Prototype **health app + marketing site** for VITA (vitaapp.ge). Vanilla HTML/CSS/JS,
**no build step**. Georgian (KA) default with EN toggle, dark mode, PWA. Client-side SPA
with a small optional Python AI proxy.

> If you're a fresh Claude session continuing this project: read this file, then
> `git log --oneline -20` and `SPEC.md` for the feature roadmap. Everything runs
> locally; no secrets required for the demo.

## Run it
```
python3 serve.py            # serves static files + AI proxy on $HOST:$PORT (default 0.0.0.0:8000)
# or any static server for the front-end alone
```
Open `index.html` (landing) or `app.html` (the app). PWA/service worker caches the shell.

## Architecture (front-end)
Global namespace `window.VITA` (aliased `V` inside each IIFE module). Hash router.

| File | Role |
|------|------|
| `app.html` / `index.html` | app shell / marketing landing. Script tags carry `?v=NN` cache-bust. |
| `js/i18n.js` | `V.t(key, params)`, `V.lang()`, `V.setLang()`. All copy is KA+EN objects. |
| `js/ui.js` | logo/icons (`V.icon`, `V.iconBox`, `V.jelly`, `V.logoBadge`), `V.esc`, `V.toast`, date helpers. |
| `js/state.js` | `V.state` persisted to localStorage `vita.state.v1`; `V.save()`, `V.reset()`. Defaults define the schema. |
| `js/data.js` | domain logic: clinics directory + booking, workouts, water, cycle, calendar, rewards, screenings, repMoves, vitaapp services. |
| `js/auth.js` | social sign-in (`V.auth.signIn`, `V.applyAuth`, `V.brandGlyph`). Real OAuth seam via `V.AUTH` client IDs; demo fallback. |
| `js/rep-counter.js` | camera rep counter (MediaPipe Pose from CDN) + manual fallback. `V.openRepCounter`. |
| `js/features.js` | reminders, .ics export, JSON export, printable summary. |
| `js/api.js` / `js/chat-engine.js` | AI chat: talks to `serve.py` proxy; offline template fallback. |
| `js/screens-onboarding.js` | splash (social sign-in), intro, 5-step profile wizard. |
| `js/screens-analysis.js` | AI analysis, profile summary, body map, checkup plan, lab results. |
| `js/screens-tabs.js` | home, plan, vita chat, progress, menu hub, and all feature screens. |
| `js/app.js` | router (`V.go`, `V.render`), phone chrome, settings, boot. |
| `css/base.css` | brand tokens (`--green:#2BA94C`, font Avenir Next Georgian), jelly/blob gradients. |
| `css/app.css` | app component styles. `css/landing.css` for the site. |
| `serve.py` | stdlib http.server: static + AI proxy. Claude > Gemini > offline. No pip deps. |

### Conventions
- Screens are `V.screens.<route> = function(){ V.mount(html, {onMount}) }`. Router resolves `V.screens[hash]` automatically — no registration needed.
- Reward engine: `V.award`/`V.awardOnce(key, pts, reason)`, `V.POINTS`, elements unlock per 100 lifetime pts.
- Add localized copy as `{ ka, en }` and reference via `V.t`.
- **Brand jelly elements** (`.jelly.b-{green|yellow|pink|blue|crimson|clear}`) are the visual motif — reuse them for new feature icons/visuals.

### ⚠️ Preview-mirror workflow (important)
The preview server serves from a **mirror** (`/tmp/vita-preview`), not the Desktop dir.
After editing, `rsync` changed files into the mirror, and **bump the version**:
`?v=NN` in `app.html` + `CACHE="vita-vNN"` in `sw.js` (same NN), or the browser/SW serves stale JS.
Currently at **v15**.

## Status
All 7 round-2 features done (see `SPEC.md`) + social sign-in. Demo runs fully offline.
**Pending integration seams** (work once credentials given): clinics API, Google Calendar OAuth,
vitaapp.ge SSO, social OAuth client IDs (`V.AUTH` in `js/auth.js`).
**Designer's exact logo** still pending — current tree mark is a reconstruction; brand green + font already applied.

## ▶ RESUME HERE — wellness micro-features (in progress)
All new modules live in `js/screens-wellness.js`, grouped under a **"Wellness tools" hub**
(`V.screens.wellness`, reachable from the menu tile `mWellness` and route `#/wellness`).
`V.wellnessTools` lists the hub tiles; `state.wellness` holds their data (see `js/state.js`).

**Done & committed** (last commit `bb972eb`):
- ✅ Wellness hub (6 tiles) + menu entry
- ✅ Eye care — `#/eyecare`: 20-20-20 guided dot exercise (self-cleaning rAF) + Amsler grid self-test
- ✅ Breathing — `#/breathe`: box-breathing 4-4-4-4 animated orb
- ⚠️ Eye + breathe code is written but their **interactive flows were not yet driven in preview** — verify first (drive the Start buttons, watch the animation, confirm points award + no console errors).

**Still to build** (each its own screen in `js/screens-wellness.js`, brand-styled, points + optional reminder, then commit):
1. 🤖 Symptom checker — `#/symptom`: AI triage (reuse `js/api.js` chat w/ offline fallback) → suggest specialist + urgency → deep-link `V.openClinics(checkupId, title)`.
2. ❤️ Heart rate — `#/heartrate`: PPG from rear-camera red-channel variation (getUserMedia + canvas sampling), live waveform + BPM → `state.wellness.hr`, manual fallback.
3. 🧠 Mental tests — `#/mindtests`: PHQ-9 + GAD-7 questionnaires, scoring + severity bands + recommendation → `state.wellness.phq/gad`, deep-link mental clinics.
4. 🙂 Mood journal — `#/mood`: daily mood (1–5 + note/tags) → `state.wellness.mood`, history chart, streak.
5. (later) 🧍 Posture coach (reuse `js/rep-counter.js` Pose) · 😴 sleep diary · 🚭 smoking-cessation · ⏱ fasting timer · 🩺 BP log (`state.wellness.bp`) · risk calculators.

Add each new tool's tile to `V.wellnessTools` only once its screen exists, so the hub never links to a dead route.

### How to verify (preview)
Per the mirror workflow above: rsync to `/tmp/vita-preview`, bump `?v=NN` + `sw.js` CACHE, reload with a `?cb=` query, then drive the UI and check `preview_console_logs` for errors. Currently at **v16**.
