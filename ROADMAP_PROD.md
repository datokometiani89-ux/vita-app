# VITA — პროტოტიპიდან რეალურ პროდუქტამდე (production roadmap)

> სტატუსი 2026-09-28: აპი live-ია Render-ზე (v139), Apple-სტილის UI, demo-backend (JSON-ფაილი, პაროლების გარეშე auth, payment/video stub-ები). ეს დოკუმენტი აღწერს რა უნდა შეიცვალოს, რომ **რეალური მომხმარებლები** უსაფრთხოდ და საიმედოდ ისარგებლონ, და **ვინ (რომელი აგენტი)** აკეთებს რას.

## 1. რას ვინარჩუნებთ, რას ვცვლით

| ფენა | ახლა (პროტოტიპი) | პროდაქშენი (რეკომენდაცია) | რატომ |
|---|---|---|---|
| Front-end | vanilla JS PWA, hash-router, `apple.css` | **იგივე** + Capacitor wrapper (iOS/Android) ფაზა 3-ში | კოდი მზადაა; Capacitor აძლევს HealthKit/Health Connect, push, store-ს, კოდის გადაწერის გარეშე |
| მონაცემები | `localStorage` (მოწყობილობაზე) | **Supabase Postgres (EU region)** + offline-first sync (localStorage რჩება cache-ად) | მრავალ-მოწყობილობა, backup, GDPR-ის data export/delete, ექიმისთვის EHR |
| Auth | demo token, პაროლი არ არის | **Supabase Auth**: email OTP + Apple + Google; ექიმის როლი — მოწვევით (RLS policies) | უსაფრთხო, უფასო 50k MAU-მდე, Apple Sign-in store-ისთვის სავალდებულოა |
| Backend | `serve.py` + `backend.py` (stdlib, JSON-ფაილი) | **FastAPI** სერვისი (AI proxy, consult routing, webhooks) Render/Fly-ზე; DB და realtime → Supabase | ლოგიკა უკვე Python-შია; Supabase ხსნის DB/auth/realtime-ს |
| ვიდეო-ვიზიტი | სიმულაცია | **Daily.co** (prebuilt UI + tokens, HIPAA-ready გეგმა) | ერთ დღეში ინტეგრირდება `video_token` seam-ზე |
| გადახდები | stub | **Paddle (Merchant of Record)** ვებზე — VITA+ და ვიზიტები; store-ში Apple/Google IAP **RevenueCat**-ით | MoR ითვლის VAT/tax-ს გლობალურად და მუშაობს ქართული კომპანიისთვისაც |
| Wearables | demo snapshot | **Terra API** (Garmin/Fitbit/Oura/Apple/Google ერთი ინტეგრაციით) + Capacitor HealthKit | ერთი კონტრაქტი 10+ წყაროზე |
| AI | Claude/Gemini proxy | Claude (production key, rate-limit per user) + Gemini fallback; prompt-safety evals | უკვე მუშაობს; სჭირდება ლიმიტები და ლოგირება |
| Push/reminders | `.ics` + Notification API | OneSignal (web + Capacitor) | ერთი SDK ორივე პლატფორმაზე |
| Marketplace/კურიერი | demo კალათა | პილოტი თბილისში: 1 აფთიაქი + **Wolt Drive / Glovo API**; შეკვეთა → partner webhook | პარტნიორის ინფრასტრუქტურა, საკუთარი ფლოტი არა (გადაწყვეტილი) |
| Observability | არაფერი | Sentry (front+back), PostHog (consent-ით), UptimeRobot | ბაგებს იუზერამდე ვნახავთ |
| Compliance | disclaimers კოდში | Privacy Policy + ToS გვერდები, consent, EU data residency, doctor-access audit log, "wellness, not medical device" პოზიციონირების დოკუმენტი | გლობალურ ბაზარზე აუცილებელი; MDR/FDA საზღვარი Series A-მდე იურისტთან |

**სავარაუდო ინფრა-ხარჯი სტარტზე:** ~$150–300/თვე (Supabase Pro $25, Render/Fly $25–50, Daily pay-as-you-go, Sentry/PostHog free tier, Claude API მოხმარებით).

## 2. ფაზები (თითო = 1 sprint, აგენტების გუნდით)

### P0 — საფუძველი (1–2 კვირა) → „რეალურ იუზერს შეუძლია დარეგისტრირდეს და მონაცემები არ დაკარგოს"
- [ ] Supabase პროექტი (EU), სქემა: `profiles`, `state_snapshots` (JSONB per user — არსებული `V.state` პირდაპირ), `consults`, `ehr_records`, `orders`
- [ ] Auth: email OTP + Apple + Google; `js/auth.js` seam → Supabase; `bridge.js` token → Supabase JWT
- [ ] Sync: `V.save()` → debounce → `PATCH /state`; login-ზე merge (last-write-wins + local cache)
- [ ] `backend.py` → FastAPI: `/api/chat|interpret|vision` (rate-limit per user), consult routing Supabase Realtime-ზე
- [ ] Sentry + UptimeRobot; Privacy/ToS გვერდები; consent banner
- [ ] რეალურ 3 ტელეფონზე QA (iPhone Safari, Android Chrome, Samsung Internet): კამერის ფლოუები, safe-area, PWA install
- **Done =** ახალი იუზერი ორ მოწყობილობაზე ერთსა და იმავე მონაცემს ხედავს; test suite მწვანე; Sentry-ში 0 error 48 სთ

### P1 — ტელემედიცინა რეალურად (2–4 კვირა) → „ექიმთან რეალური ვიდეო-ვიზიტი, ფასიანი"
- [ ] Daily.co: `video_token` → რეალური room/token; patient + doctor UI Daily prebuilt-ზე
- [ ] ექიმის ანგარიშები (მოწვევით), `doctor.html` Supabase-ზე; e-prescription PDF; audit log
- [ ] Paddle checkout: ვიზიტის გადახდა + VITA+ subscription (webhook → `plus` სტატუსი)
- [ ] პირველი 3–5 რეალური ექიმი (პილოტი) და SLA: პასუხი < 10 წთ ონლაინ-სტატუსში
- **Done =** ერთი რეალური ფასიანი ვიზიტი ბოლომდე (გადახდა → ზარი → რეცეპტი → EHR)

### P2 — მონაცემები და კომერცია (4–8 კვირა)
- [ ] Terra API + HealthKit (Capacitor plugin) → `V.wearableCombined()` რეალურ მონაცემზე
- [ ] OneSignal push: მედიკამენტები, სკრინინგები, ყოველდღიური quests
- [ ] Marketplace პილოტი: 1 აფთიაქი + Wolt Drive; შეკვეთის სტატუსი webhook-ით (`V.orderStage` რეალურ დროზე)
- [ ] AI report/chat Claude production-ზე; prompt-safety eval set (50 სცენარი, red-flag escalation)
- **Done =** 100 ბეტა-იუზერი, D7 retention > 30%, 0 safety-incident

### P3 — სთორები და B2B (8–12 კვირა)
- [ ] Capacitor build: App Store + Google Play (RevenueCat IAP), review-ისთვის „wellness" ფორმულირება
- [ ] `org.html` რეალურ აგრეგირებულ მონაცემზე (k-anonymity ≥ 20), პირველი B2B LOI
- [ ] დაზღვევის პარტნიორის API (lead → premium quote)
- **Done =** სთორებში live, 1 B2B ხელშეკრულება

## 3. აგენტების გუნდი (`.claude/agents/`) და როგორ ვუშვებთ

| აგენტი | როლი | როდის |
|---|---|---|
| `vita-frontend` | ეკრანები, UI, i18n, კონვენციები (`screenHead`/`igList`/`TAB_OF`) | ყველა front-end ცვლილება |
| `vita-backend` | API, auth, DB, ინტეგრაციები (Supabase/Daily/Paddle/Terra) | ყველა სერვერული ცვლილება |
| `vita-qa` | რეგრესია: backend tests, UI audit (desktop+phone), ნავიგაცია, console, timers | ყოველი ცვლილების შემდეგ |
| `vita-security` | XSS/auth/role/secrets/headers review, ახალი test case-ები | რელიზამდე; backend/doctor-console ცვლილებაზე |
| `vita-ux` | დიზაინ-სისტემასთან შესაბამისობა, KA-first, a11y — კონკრეტული CSS fix-ებით | ახალი ეკრანი / რედიზაინი |
| `vita-medical-safety` | wellness-grade ენა, disclaimers, red-flag escalation, fairness caveat, MDR/FDA საზღვარი | ტექსტის/AI prompt-ის ნებისმიერი ცვლილება |
| `vita-i18n` | ბუნებრივი ქართული, ტერმინოლოგია, სიგრძე, key-ების ჰიგიენა | ტექსტის ცვლილება |
| `vita-release` | ვერსია, ტესტები, commit, post-push live checks | რელიზი |

**Sprint-ის ციკლი (თითო ამოცანაზე):**
1. `vita-frontend` / `vita-backend` ახორციელებს (ბრენჩზე, თუ დიდია)
2. `vita-qa` → PASS/FAIL ანგარიში; ბაგები უბრუნდება 1-ს
3. პარალელურად `vita-security` + `vita-medical-safety` + `vita-ux` (მხოლოდ იმ ცვლილებაზე)
4. `/release` (skill) → commit → **მფლობელი `git push`** → `vita-release` post-push check
Skills, რომლებიც ამას ერთ ბრძანებად ხდის: `/release`, `/mobile-check`, `/security-review`, `/ui-audit`.
Tools: `tools/test_backend.py` (43 ინტეგრაციული ტესტი), `tools/ui_audit.js` (DOM-აუდიტი ყველა route-ზე).

## 4. გადაწყვეტილებები, რომლებიც მფლობელს სჭირდება (P0-მდე)

1. **გადახდის სუბიექტი:** Paddle MoR (გირჩევ — მუშაობს საქართველოს კომპანიისთვის, VAT გლობალურად) თუ Stripe (სჭირდება US/EU entity — Stripe Atlas)?
2. **DB/Auth:** Supabase (გირჩევ — ერთ დღეში) თუ საკუთარი Postgres + Auth0/Firebase?
3. **სთორები როდის:** PWA-first (P0–P2 ვებზე, სწრაფი იტერაცია) და Capacitor P3-ში (გირჩევ), თუ native wrapper უკვე P1-ში?
4. **პილოტის გეოგრაფია:** თბილისი ტელემედიცინა/აფთიაქისთვის + პირველი გლობალური ბაზარი ინგლისურენოვანი wellness-ფლოუებისთვის — რომელი?
5. **ექიმების პილოტი:** ვინ არის პირველი 3–5 ექიმი (ხელშეკრულება, ტარიფი, ლიცენზიის ვერიფიკაცია)?

პასუხების შემდეგ P0 იწყება `vita-backend`-ით (Supabase სქემა + auth) და `vita-frontend`-ით (sync layer) პარალელურად.
