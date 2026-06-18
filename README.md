# VITA — Health AI Assistant

VITA-ის პროტოტიპი: **მარკეტინგული ვებსაიტი + სრული მობილური აპლიკაცია** (web prototype).
აწყობილია Figma დიზაინისა და სატესტო დავალების დოკუმენტის მიხედვით, სუფთა HTML / CSS / vanilla JS-ით — build-process და dependency-ები არ სჭირდება.

A prototype of the VITA Health AI product: a **marketing landing site** plus a **full interactive mobile app**, built to match the Figma "Medical App" design and the product brief. Pure HTML/CSS/vanilla JS — no build step, no dependencies.

---

## გაშვება / Run

ნებისმიერი სტატიკური სერვერი საკმარისია. მაგალითად:

```bash
cd "VITA AI APP"
python3 serve.py        # → http://127.0.0.1:4170
```

შემდეგ გახსენი:
- **ვებსაიტი (landing):** `http://127.0.0.1:4170/index.html`
- **აპლიკაცია (app):** `http://127.0.0.1:4170/app.html`

> `file://`-ითაც იხსნება, მაგრამ ლოკალური სერვერი რეკომენდებულია.

**ონლაინ გაშვება / Deploy:** იხ. [DEPLOY.md](DEPLOY.md) — ერთ უფასო Render სერვისად (საიტი + აპი + AI ერთ URL-ზე).

### რეალური AI (არასავალდებულო) / Real AI (optional)

ნაგულისხმევად ასისტენტი მუშაობს **ოფლაინ** (გასაღები არ სჭირდება). ცოცხალი AI-ს ორი გზა:

**🆓 უფასო — Google Gemini (ბარათის გარეშე, დემოსთვის):**
```bash
# 1) გასაღები: https://aistudio.google.com → "Get API key" (Google ანგარიშით)
export GEMINI_API_KEY=AIza...
python3 serve.py            # pip install საჭირო არ არის — სუფთა stdlib
```

**Claude (Anthropic) — ყველაზე ძლიერი, ბილინგი სჭირდება:**
```bash
pip install anthropic
export ANTHROPIC_API_KEY=sk-ant-...
python3 serve.py
```

`serve.py` ემსახურება საიტს/აპს **და** პროქსირებს LLM-ს (`/api/chat` SSE სტრიმინგი, `/api/interpret`).
პრიორიტეტი: **Claude > Gemini > ოფლაინ**. ორივე გასაღების არსებობისას Claude იმარჯვებს.
ჩატის სათაური აჩვენებს რომელი მოდელია ჩართული.

> **Free demo path:** get a no-cost key at aistudio.google.com, `export GEMINI_API_KEY=...`,
> run `python3 serve.py` (no pip needed). Provider priority is Claude > Gemini > offline;
> with no key the app uses the built-in offline assistant. Models default to
> `claude-opus-4-8` / `gemini-2.0-flash` (override via `VITA_CLAUDE_MODEL` / `VITA_GEMINI_MODEL`).

---

## სტრუქტურა / Structure

```
index.html              მარკეტინგული ვებსაიტი (landing)
app.html                მობილური აპლიკაცია (SPA shell)
serve.py                static server + Claude proxy (/api/chat, /api/interpret)
css/
  base.css              დიზაინ-სისტემა: ფერები, ღილაკები, chips, blobs, dark theme
  app.css               აპლიკაციის ეკრანების სტილები
  landing.css           ვებსაიტის სტილები
js/
  i18n.js               ქართული + ინგლისური თარგმანები
  ui.js                 VITA ლოგო (SVG), icon set, helpers
  state.js              პროფილი, localStorage, derived metrics (BMI, health score, risks)
  api.js                Claude backend client (chat stream / interpret) + offline fallback
  chat-engine.js        smarter offline assistant (intents, follow-ups, data Q&A, variation)
  data.js               checkup plan, goals, medications, food plan, body-map, chat logic
  app.js                router, phone chrome, bottom nav, settings sheet
  screens-onboarding.js splash, intro, 5-ნაბიჯიანი wizard
  screens-analysis.js   AI ანალიზი, profile summary, body map, checkup plan, goals
  screens-tabs.js       dashboard, plan, VITA chat, progress, results upload
```

---

## რა არის აწყობილი / What's built

**Figma-ში დახატული ეკრანები (ზუსტად):**
- Splash + welcome (jelly-blob branding, VITA tree logo)
- Onboarding intro (5 step / 2 min)
- 5-ნაბიჯიანი პროფილის wizard: Basic info · Lifestyle · Health status · Mental & Energy · Appearance
- AI "Analysing your data" (ცოცხალი progress ring + staged checklist)
- Your Profile summary (stat cards, health profile, areas of concern)
- Health risks **body map** (markers: High / Medium / Low)
- Checkup plan (priority cards + "add to calendar")
- Your Goals (6-month plan, grouped goals)
- Homepage dashboard (health-score gauge, weight & BMI, concerns)
- Plan tab (daily tasks, day progression, category pills)
- Bottom navigation + center FAB

**დავალებაში იყო, მაგრამ Figma-ში არ იყო დახატული — VITA-ის სტილში დავამატე:**
- **Results Upload** — ლაბ-შედეგების ფოტო/ფაილი/ხელით შეყვანა, AI ინტერპრეტაცია ნორმებთან შედარებით, პროფილის ავტომატური განახლება (FAB → ეკრანი).
- **VITA AI chat** — კონტექსტური ასისტენტი პროფილზე დაყრდნობით, quick-replies, typing indicator.
- **Progress tab** — წონის ტრენდი (target line), health-score bar chart, streak, goal-progress bars (Step 7).
- **Medication calendar & Food plan** — დილის/საღამოს მედიკამენტები და დღის კვების გრაფიკი (დოკუმენტიდან).
- **ჰოლისტიკური ზრუნვის გეგმები (A–F)** — დეტალური გეგმები (ზოგადი, მენტალური, სხეული/ფიტნესი, კანი, თმა, პირის ღრუ) დოკუმენტის სრული შინაარსით (Plan ტაბიდან).
- **ვარჯიშების მოდული** — კვირის გეგმა (ძალა/კარდიო/დასვენება), სავარჯიშოები სეტებით, შესრულების მონიშვნა (Plan ტაბიდან).
- **წლის ჩექაფები — საერთაშორისო სტანდარტებით** — USPSTF/ADA-სტილის პრევენციული სკრინინგები, რეკომენდებული **ასაკის, სქესისა და რისკის** მიხედვით; **ასარჩევი** სია (იუზერი თვითონ მონიშნავს) + **ადამიანის სხეულის ვიზუალიზაცია** (თითო შემოწმება სხეულის შესაბამის არეზე) + თვეების გაწერა და "მოგვიანებით (ასაკის მიხედვით)" სია.
- **სპეციალისტი/კლინიკა + ვიზიტის დაჯავშნა** — ჩექაფ-გეგმაში თითო შემოწმებას ერთვის რეკომენდებული სპეციალისტი და კლინიკა, ვიზიტი ჯავშნდება კალენდარში (Step 3).

- **მენიუ (hub)** — დაშბორდის grid-ღილაკი → ყველა ფუნქცია ერთ ეკრანზე (ჯანმრთელობა / გეგმა & ზრუნვა / ასისტენტი / ხელსაწყოები).
- **დაშბორდზე "შემდეგი რეკომენდებული შემოწმება"** — ბმული წლის ჩექაფების სრულ გეგმაზე.

**Quick wins (PWA + utilities):**
- **PWA** — `manifest.json` + `sw.js` + icons: აპლიკაცია ინსტალირებადია ("Add to Home Screen") და მუშაობს **offline** (app shell ქეშირდება).
- **შეხსენებები** — Settings → Reminders ჩართვა (Notification API): წყალი/მედიკამენტები/ძილი დღის განმავლობაში (აპის/PWA გახსნისას).
- **.ics ექსპორტი** — დაჯავშნილი ჩექაფები Google/Apple Calendar-ში (Settings → "კალენდარში ექსპორტი").
- **მონაცემების ექსპორტი** — სრული პროფილი JSON-ად + **ექიმისთვის რეზიუმე** (ბეჭდვა/PDF) Settings-დან.
- **ინტერაქციული დავალებები** — დღის დავალების დადასტურება ტექსტით, ფოტოთი (რეალური ატვირთვა + thumbnail) ან ვოისით; ინახება და მონიშნავს შესრულებას (დოკ.: „ინტერაქციული — გამწვანებით, ვოისით, ტექსტით ან ფოტოთი").

**დიზაინის გაუმჯობესებები / Design upgrades:**
- სრული **dark mode** (გადამრთველი Settings-ში).
- **ქართული + ინგლისური** ენების გადართვა მთელ აპსა და საიტზე.
- ერთიანი დიზაინ-სისტემა (radius, shadows, ფერთა ტონები), gradient jelly-blobs და SVG VITA logomark.
- რესპონსიული landing (desktop → mobile).

---

## როგორ მუშაობს მონაცემები / How it's wired

- ყველაფერი ინახება **localStorage**-ში (`vita.state.v1`) — პროფილი, მიზნები, შესრულებული დავალებები, ლაბ-შედეგები, chat.
- მეტრიკები **გამოითვლება პროფილიდან**: BMI, health score (0–100), areas of concern, checkup plan, medications — ანუ შენ ცვლი onboarding-ის პასუხებს და მთელი აპი შესაბამისად ერგება.
- დემო-პროფილი (Giorgi K., 36, pre-diabetic) ემთხვევა დავალების მაგალითს; ცარიელი პროფილით აპი იწყება splash-იდან.
- პარამეტრები (ენა / dark mode / **reset**) ღია სია-ფურცელშია — settings/bell ღილაკი ან Profile ეკრანის gear.

---

*VITA Health AI — prototype · 2026*
