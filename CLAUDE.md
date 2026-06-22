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
- ✅ Office workout `#/posture` (route kept as `posture`; displayed name "ოფისის ვარჯიში / Office workout") — **18 desk exercises** (`OFFICE_EX`, grouped by `OFFICE_AREAS`: neck/shoulders/back/wrists/legs/full). Each move renders an **animated human SVG figure** built by `figureSVG(kind)` / the `OX_FIG` builder map (one pose+motion per `fig` key: headTilt/headTurn/headTuck/shoulderRoll/shrug/armsBack/leanForward/twist/sideStretch/wristCircle/handsPulse/legRaise/ankleCircle/calfRaise/march/reachUp/breathe). Motion = inline SMIL `animateTransform` (via `oxAT()` helper) for rotate/translate, plus CSS classes `.ox-turn/.ox-twist/.ox-breathe-c/.ox-pulse-c` for 3D rotateY + scale. **Diverse cast**: `OX_LOOKS` (8 appearances — skin tone, hair style+colour via `oxHairBack`/`oxHairFront`, m/f silhouette via `oxTorso`/`oxShorts`), cycled per exercise by index so the list shows varied people (`figureSVG(kind, idx)`; list passes the array index, player passes `OFFICE_EX.indexOf(ex)`). Shared colours in `OXC`. Same SVG used small in the list card and large in the player (sized via `.ox-vis .ox-fig` / `.ox-stage .ox-fig`). List shows every exercise individually; tap one → focused player (animated stage + countdown + progress bar + skip/finish), or "Full routine" runs all 18. Names/descriptions inline in `OFFICE_EX`. Awards once/day on first completion; `state.wellness.posture[date]` = exercises done that day. NB: deliberately a guided routine, **not** live `rep-counter.js` Pose. (Replaced the earlier emoji visuals.)

**Possible future tools** (not built): live-Pose posture analysis · medication reminders · hydration-by-weight calc · more risk scores (CVD/heart-age).

## ▶ Engagement layer (from competitive analysis — global health apps)
A deep-research competitive analysis (Finch, Daylio, Oura, Samsung Vitals, K Health, Infermedica, Teladoc, Doctolib) drives a staged roadmap. All public APIs live in `js/screens-wellness.js`; home cards render in `V.screens.home` (`js/screens-tabs.js`) and are wired in its onMount.

**Stage 1 — DONE (quick wins):**
- ✅ **Mood daily loop** — one-tap 5-emoji check-in on home (`V.moodHomeCard`/`V.wireMoodHome`/`V.quickLogMood`/`V.moodStreak`), flips to logged + day-streak. (Daylio pattern.)
- ✅ **VITA garden** (`#/quests`) — Finch-style daily quests grow a 6-stage SVG plant. `V.dailyQuests` (derived from existing state, no double-tracking), `V.creditQuests` (+1 grow/quest, per-day guarded, once/day all-done bonus), `V.companionStage`/`companionProgress`, `plantSVG`. Home card `V.gardenHomeCard`/`V.wireGardenHome`. `state.companion {grow, credited}`.
- ✅ **Readiness** (`#/readiness`) — Oura-style daily 0-100 (`V.readiness`: sleep+mood+activity+HR-deviation factors) + Samsung-Vitals baseline-deviation insights. `V.hrBaseline/sleepBaseline/bpBaseline` = avg of PRIOR readings (exclude latest) → "vs your usual". Home card `V.readinessHomeCard`. Labeled wellness, not medical.

**Stage 2 — DONE (differentiation):**
- ✅ **Probabilistic triage** — `triage()` scores matched `SYMPTOM_RULES` by `countHits` (regex-alternation hit count) + red-flag bonus + `profilePrior` (age/sex/conditions/smoking → cardiac, stress/mood/sleep → mental, smoking → resp). Ranks safety-first then likelihood; shows a profile-prior note + per-candidate match-strength bars. No accuracy % shown.
- ✅ **Multi-signal camera** — `V.ppgHRV(beatTimes)` (RMSSD ms) + `V.ppgRR(series, durSec)` (resp rate via cardiac-smoothing + slow-detrend + first-peak autocorrelation). Heart-rate loop records beat times + raw series; `saveReading` stores `{bpm, rr, hrv}` + shows chips. Wellness-grade + skin-fairness disclaimers. Pure fns unit-testable via `V.ppgRR`/`V.ppgHRV`.

**Stage 3 — IN PROGRESS (strategic):**
- ✅ **VITA+ subscription (freemium, v60)** `#/plus` (`V.screens.plus`, in `js/screens-tabs.js`) — monthly/yearly plans, benefit list, **demo activation** (`V.activatePlus`/`V.cancelPlus`/`V.isPlus`; `state.plus`). NB: **no real payment** — Stripe/Apple Pay is a future seam, clearly labelled demo. Premium perks gated in `js/screens-wellness.js` via `plusChip()` (lock badge) + `plusGate()`: **AI scan report** + **doctor print** require VITA+ (route to `#/plus`); scans/bio-age/share/reminder stay free. Menu tile `mPlus`. i18n `vp*`.
- ✅ **Wearable / health-data seam (v60, viz v61)** `#/wearable` (`V.screens.wearable`) — **multi-source**: connect any of Apple Health / Google Fit / Garmin / Fitbit (`state.wearable.sources = [{id, since, snap}]`). `V.connectWearable`/`disconnectWearable(id?)`/`wearableSources`/`wearableConnected`; **`V.wearableCombined()`** averages all sources into one dashboard (multi-device doesn't double-count) + a "merged from N" note. Rich viz: **Apple-style activity rings** (move/exercise/stand SVG arcs), 7-day **steps** bars (goal line), **sleep** stacked stages (deep/REM/light) + 7-day trend, **heart** tiles (rest/avg HR, HRV, SpO₂), distance/floors/active-min/workouts grid. Source chips with ✕-disconnect + "add a source". Demo snapshot via `genWearable()`; feeds `wellness.hr`/`wellness.sleep` (readiness/bio-age). NB: real sync needs native HealthKit / Google Fit OAuth — labelled demo. Menu tile `mWearable`. i18n `we*`.
- ✅ **Telemedicine (v62)** `#/telemed` (`V.screens.telemed`, in `js/screens-wellness.js`) — stateful single screen: **doctor directory** (`V.DOCTORS`/`V.doctorById`, online/next-slot/price/rating) → **video-call sim** (dark stage + LIVE + ticking timer + self-PiP, scripted doctor chat on a timeline via `setTimeout`, free-text replies, mute/camera/end controls) → **after-visit summary** (notes + **e-prescription** `TD_RX` per doctor + send-to-pharmacy demo + **demo payment** — NO real charge, labelled). Saves `state.consults`; past visits on the list. Menu tile `mTelemed`. i18n `td*`. CSS `.td-*`. Chat is **scripted** (not AI-as-doctor) + emergency-disclaimer. Footer link `.td-docapp` → the separate doctor app.
- ✅ **VITA for Doctors — separate clinician app (v63–64)** `doctor.html` + `js/doctor.js` + `css/doctor.css` — the **provider side** of the two-sided marketplace, a STANDALONE app (own entry point, NOT part of the patient SPA; reuses `V.icon/initials/logoBadge/t/lang` only). Web-dashboard layout (top bar + Dashboard/Patients/Analytics nav): **incoming consult queue** (urgency, wait, accept) → **consult console** showing the patient's VITA **scan vitals** (HR/HRV/SpO₂/bio-age/scan-score) + video-call sim + clinical notes + prescribe → complete (updates queue + KPIs live). Patient roster + **analytics** (KPIs, 7-day consults bars, satisfaction/completion donuts). All demo data inside `doctor.js` (`QUEUE`/`PATIENTS`/`ANALYTICS`/`ME`); KA/EN via local `STR`+`V.lang`. Real version = separate codebase + backend (routing, EHR, WebRTC SDK like Daily/LiveKit/Twilio, payments). Verify at `/doctor.html`.
- ✅ **Realtime bridge — patient↔doctor (v65)** `js/bridge.js` (`V.bridge`: `send`/`on`/`_emit`) — connects the patient app and doctor app **live across browser tabs with NO server**, via `BroadcastChannel` (+ `localStorage` 'storage'-event fallback), same-origin. Stands in for real backend signalling (WebSocket/WebRTC). Patient `startCall()` broadcasts `consult-request` (name + latest scan vitals); doctor app receives it → unshifts a **"● live"** card into the queue (pulsing glow). Doctor accept → `consult-accepted` → patient call shows a `.td-sys` "doctor joined" line; complete → `consult-ended` (+ rx). Loaded in `app.html` + `doctor.html`. Verified in-tab via `_emit`; true realtime is cross-tab.
- ✅ **B2B2C — VITA for Business (v65)** `org.html` + `js/org.js` + `css/org.css` (reuses `doctor.css`) — standalone **population-health dashboard** for employers/insurers: **aggregate & anonymized only** (privacy banner; no individual PII). KPIs (enrolled, avg wellness score, % active, est. annual savings), **risk distribution** stacked bar, 8-week **engagement** bars, screening-compliance + active **donuts**, ranked **focus areas**, **departments** cohort table (score-coloured + trend), ROI/upsell note. Bilingual via local `STR`. Demo data in `org.js` (`ORG`/`DATA`). Verify at `/org.html`.
- ✅ **Real backend (v66)** `backend.py` (imported by `serve.py`; pure stdlib, no pip deps) — the genuine server side, replacing the client-only bridge when the server is up:
  - **Realtime SSE bus** `GET /api/events?role&uid` (held open per subscriber via the existing `ThreadingMixIn`; 15s keepalive pings). `backend.subscribe/unsubscribe/_push`.
  - **Consult routing** `POST /api/consult/request` (→ broadcasts `consult-request` to all doctors) · `/accept` (→ pushes `consult-accepted` to the patient's uid + `consult-claimed` to doctors) · `/end` (→ `consult-ended` + writes EHR) · `GET /api/consult/queue` (backlog for a fresh doctor app).
  - **Demo auth** `POST /api/auth/login` {email,role,name}→token (no passwords — prototype). **EHR** store `GET /api/ehr?patientId`. JSON-file persistence `vita-backend.json` (gitignored).
  - **Seams (clearly stubbed, never real):** `POST /api/payment/intent` returns a fake Stripe PaymentIntent (NEVER charges; real Stripe integration point documented in code) · `POST /api/video/token` returns a fake room+token (real Daily/LiveKit/Twilio integration point documented).
  - `/api/health` now also returns `backend:true` + `online` counts.
  - **Front-end** `js/bridge.js` upgraded to two transports behind one `send()`/`on()` API: **server** (EventSource + fetch) when `/api/health` reports `backend:true`, else **local** (BroadcastChannel + localStorage) for static hosting. `V.bridge.init(role)` probes + upgrades; patient/doctor pass a per-role `uid`. **Verified end-to-end over a live `serve.py`**: patient JS call → server queue → doctor accept → SSE → patient sees "doctor joined".
- **NEXT:** real Stripe + Daily/LiveKit keys (env) to turn the seams live · real auth (passwords/OAuth) · a DB (Postgres) instead of the JSON file for production.

## ▶ AI Health Scan — multimodal flagship (the globally-fundable wedge)
The strategic "smartphone = diagnostic" play. `#/scan` is the hub; modality strip links the three:
- **Cardiovascular** (`#/scan`) — camera PPG via reusable `V.ppgCapture` (HR + `V.ppgRR` resp + `V.ppgHRV`) → `V.scanStress` (recovery/stress from HRV) + `V.scanScore` composite → `state.wellness.scan`. Shows scan-score history + rule-based trend insight + **"Discuss with VITA"** (seeds the AI chat with the scan summary). Home flagship card `V.scanHomeCard`.
- **Skin** (`#/skinscan`) — photo + ABCDE guided self-check + on-device `V.skinColorVar` (pixel colour-variation) → `V.skinFlag` band → dermatologist deep-link. `state.wellness.skinScan`.
- **Voice** (`#/voicescan`) — 5s sustained vowel → Web Audio per-frame pitch (autocorrelation) + RMS → `V.voiceSteadiness` (jitter/shimmer CV) + `V.voiceBand` → breathing deep-link. `state.wellness.voiceScan`.
All wellness-grade + disclaimers; pure analysis fns unit-tested; camera/mic paths fail gracefully (denied/no-device messages). Real ML models are a future seam. Pure fns: `V.scanStress/scanScore/skinColorVar/skinFlag/voiceSteadiness/voiceBand`, capture helpers `V.ppgCapture` (+ internal `voiceCapture`).

**Depth layer — DONE (v55, "3 modalities felt too easy"):**
- ✅ **Bio-age** `V.healthAge()` — chronological age nudged by profile factors + latest camera-scan biomarkers (HRV/HR/stress) → `{bio, chrono, delta, tone}`. Card `bioAgeCard()` on `#/scan` + `#/fullscan`; empty-state deep-links to profile.
- ✅ **AI personalized report** — `runScanReport()` builds a summary (`V.scanSummaryText()`), streams a narrative + 3 recs from the AI proxy (`V.api.chat`), falls back to a deterministic `reportOffline()` when the proxy is down (verified offline path). Button on `#/scan` + `#/fullscan`.
- ✅ **More PPG signals** — `V.ppgSpO2(red, blue, durSec)` (ratio-of-ratios, **uncalibrated → wellness estimate, returns null when signal too weak**); `ppgCapture` now samples the blue channel too and returns `spo2` in `onDone`; folded into `scanScore` + a SpO₂ metric chip.
- ✅ **Full body scan** `#/fullscan` (`V.screens.fullscan`) — unified hub over all modalities: SVG **body-system map** (brain/heart/respiration/skin dots coloured by each band's tone), `V.scanComposite()` whole-body score, bio-age, per-modality step rows (done-today ✓ + deep-link to run), and the AI report. CTA card on `#/scan`. i18n prefix `fb*`/`ha*` (NB: `fs*` was already taken by the fasting timer).
- ✅ **Cognition modality (v57)** `#/reactionscan` (`V.screens.reactionscan`) — 5-trial visual reaction-time test (wait-for-green → tap), median ms → `V.reactionBand`/`V.reactionScore`; false-start guard + history. `state.wellness.reaction`. Folded into the full-body scan as the 4th system (brain node on the body map, composite, legend/step, modality chip, AI-report summary). i18n `rx*`. Honest wellness/processing-speed framing — not a medical test.
- ✅ **Face mode + share/print + streak (v59):** camera scan has a **finger/face capture toggle** — `ppgCapture(opts.facing)` (`face` = front camera, no torch, relaxed amplitude gate, "experimental, good light" copy; fingertip stays the reliable path). **`V.scanStreak()`** consecutive-day chip on `#/scan`. **Doctor-ready print** `printScanReport()` (window.open/print, reuses the on-screen AI narrative or `reportOffline()`) + **share** `shareScanReport()` (`navigator.share`→clipboard). **Daily reminder** `V.features.exportScanReminder(hour)` → recurring `.ics` (RRULE:FREQ=DAILY + VALARM). Action row on `#/scan` + `#/fullscan`. i18n `scnMode*`/`scnFace*`/`scnStreak*`/`scnPrint`/`scnShare`/`scnRemind*`.

- ✅ **Transparency + calibration (v68):** `#/scaninfo` (`V.screens.scaninfo`) — honest "How it works & accuracy" screen: per-modality *measures / method / accuracy & limits*, an explicit **fairness note** (lower accuracy on darker skin), not-a-diagnosis disclaimer. Linked from `#/scan` via `.scn-infolink`. **Personal calibration** on the cardio result: "Compare to a real device" → enter actual HR → single-point `offset = ref − scanned` stored in `state.wellness.calib.hr` → future readings show the calibrated value + a "calibrated ±N" label. Honest (user's own reference corrects bias), persists, applies automatically.

**Hard rules from research:** never label camera-vitals or AI triage as clinical/diagnostic — wellness/informational + disclaimer; do NOT cite any symptom-checker accuracy %; camera-PPG degrades on dark skin (fairness caveat). Open: Georgian medical-device regulation + whether the local market supports B2B2C subsidized telehealth.

## ▶ Standalone pages (v70)
`test.html` (+ `js/selftest.js`) — self-test: 18 assertions over the pure analysis fns (ppgRR/ppgHRV/ppgSpO2, scanScore, reactionBand, healthAge, wearableCombined…) + a real-device validation guide. `pitch.html` — bilingual investor one-pager (problem/solution/wedge/3-app platform/business model/market/roadmap/ask; figures marked `[fill]`, print/PDF button). Both reuse `V.logo/icon/t`, load `base.css`.

## ▶ Marketing landing (pitch narrative, v69)
`index.html` (+ `css/landing.css`) — self-contained inline-JS page (own `copy`/`render`, reuses `V.icon/iconBox/logo/t`). Tells the platform story: hero → **AI-scan wedge band** ("Your phone is now a health scanner" · heart/skin/voice/cognition) → 7-step journey → features → **"One platform, three apps"** section linking `app.html` (patient) · `doctor.html` (clinician) · `org.html` (business) → CTA. NB: the landing does NOT load `css/app.css`, so the `.icon-box` base+tone styles are duplicated into `landing.css`. Landing assets carry their own `?v=NN` (was unversioned).

## ▶ Brand assets (v52–v53)
Official **Avenir Next Georgian** font now bundled in `/fonts` (`@font-face` in `css/base.css`; only the **Demi** weight — the supplied "Regular" was a byte-identical copy of Demi, so heavier weights are browser-synthesised until a true Regular is added). The **logo** mark in `js/ui.js` (`V.treeMark`/`V.mark`/`V.logoBadge` — `logoBadge` now renders the organic blob, not a circle) is still a **hand-built reconstruction** of the official tree+blob — **pending the designer's real `.svg`** to drop in verbatim (user will provide; do not keep approximating once it arrives).

### How to verify (preview)
rsync to `/tmp/vita-preview`, bump `?v=NN` (app.html) + `sw.js` CACHE, reload with `?cb=`, drive the UI, check `preview_console_logs`. Currently at **v68**. Launch config `.claude/launch.json` runs `python3 http.server` on the mirror, port 8011 (note: it `chdir`s first — the launched cwd is sandboxed/inaccessible, so `--directory` fails).
