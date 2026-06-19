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

## ▶ Wellness micro-features — ALL 12 TILES DONE (v18)
All modules live in `js/screens-wellness.js`, grouped under the **"Wellness tools" hub**
(`V.screens.wellness`, reachable from menu tile `mWellness` and route `#/wellness`).
`V.wellnessTools` lists the hub tiles; `state.wellness` holds their data (see `js/state.js`).
Every tool awards `V.POINTS.task` once/day via `awardOnce`, is brand-styled, and self-cleans
its rAF/camera/timer on navigation (`alive()` guard). i18n keys in `js/i18n.js`
(prefixes `eye/br/sy/hr/mt/mo/bp/sl/fs/qs/rk/po`); styles in `css/app.css` (matching `.`-prefixes
+ shared `.card-soft`). Shared screen helpers at bottom of the file: `head()`, `backX()`, `warn()`, `deepClinic()`.

**Built & verified in preview:**
- ✅ Eye care `#/eyecare` · Breathing `#/breathe` (box 4-4-4-4)
- ✅ Symptom checker `#/symptom` — offline rule triage (`SYMPTOM_RULES` + red-flag/self-harm) → urgency + specialist → `V.openClinics`
- ✅ Heart rate `#/heartrate` — camera PPG → BPM `state.wellness.hr`; manual + graceful no-cam fallback (camera path needs real device)
- ✅ Mental tests `#/mindtests` — PHQ-9 + GAD-7, per-Q flow w/ Back, severity bands → `phq`/`gad`; Q9 crisis note
- ✅ Mood journal `#/mood` — 1–5 emoji + tags + note → `mood`, 14-day chart, streak
- ✅ BP log `#/bplog` — sys/dia/pulse → `bp`, ACC/AHA bands, crisis (≥180/120) → cardiologist deep-link
- ✅ Sleep diary `#/sleep` — bed/wake → hours+quality → `sleep`, 7-day avg, chart
- ✅ Fasting timer `#/fasting` — 16:8/18:6/20:4/OMAD, live ring (Date.now), `fasting.active`+`log`
- ✅ Quit smoking `#/quitsmoke` — quit date → days/cigs/₾ saved + health milestones → `quit`
- ✅ Risk calculator `#/risk` — FINDRISC (8-Q, **prefills from `V.state.profile`/`V.bmi()`**) → diabetes risk band → glucose deep-link, saved in `risk.findrisc`
- ✅ Office workout `#/posture` (route kept as `posture`; displayed name "ოფისის ვარჯიში / Office workout") — **18 desk exercises** (`OFFICE_EX`, grouped by `OFFICE_AREAS`: neck/shoulders/back/wrists/legs/full). Each move renders an **animated human SVG figure** built by `figureSVG(kind)` / the `OX_FIG` builder map (one pose+motion per `fig` key: headTilt/headTurn/headTuck/shoulderRoll/shrug/armsBack/leanForward/twist/sideStretch/wristCircle/handsPulse/legRaise/ankleCircle/calfRaise/march/reachUp/breathe). Motion = inline SMIL `animateTransform` (via `oxAT()` helper) for rotate/translate, plus CSS classes `.ox-turn/.ox-twist/.ox-breathe-c/.ox-pulse-c` for 3D rotateY + scale. Figure colors in `OXC`. Same SVG used small in the list card and large in the player (sized via `.ox-vis .ox-fig` / `.ox-stage .ox-fig`). List shows every exercise individually; tap one → focused player (animated stage + countdown + progress bar + skip/finish), or "Full routine" runs all 18. Names/descriptions inline in `OFFICE_EX`. Awards once/day on first completion; `state.wellness.posture[date]` = exercises done that day. NB: deliberately a guided routine, **not** live `rep-counter.js` Pose. (Replaced the earlier emoji visuals.)

**Possible future tools** (not built): live-Pose posture analysis · medication reminders · hydration-by-weight calc · more risk scores (CVD/heart-age).

### How to verify (preview)
rsync to `/tmp/vita-preview`, bump `?v=NN` (app.html) + `sw.js` CACHE, reload with `?cb=`, drive the UI, check `preview_console_logs`. Currently at **v20**. Launch config `.claude/launch.json` runs `python3 http.server` on the mirror, port 8011 (note: it `chdir`s first — the launched cwd is sandboxed/inaccessible, so `--directory` fails).
