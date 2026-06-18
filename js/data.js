/* VITA domain data — checkup plan, goals, meds, food, plan tasks, body-map.
   Personalised from the profile; content mirrors the spec document. */
window.VITA = window.VITA || {};

(function (V) {
  function has(arr, v) { return arr && arr.indexOf(v) >= 0; }

  /* ---------- Checkup / screening plan ---------- */
  V.checkupPlan = function () {
    var p = V.state.profile;
    var items = [];
    var sugar = has(p.conditions, "pre") || has(p.lastCheck, "sugar");

    if (sugar)
      items.push({ id: "glucose", icon: "drop", title: { ka: "შაქარი + HbA1c", en: "Blood sugar + HbA1c" },
        note: { ka: "პრედიაბეტი", en: "Pre-diabetes" }, sev: "high", date: { ka: "2-4 მაისი", en: "2–4 May" } });

    if (p.energy === "low" || p.energy === "vlow")
      items.push({ id: "energy", icon: "bolt", title: { ka: "ენერგია / ჰორმონები", en: "Energy / hormones" },
        note: { ka: "ტესტოსტერონი, TSH, B12, D", en: "Testosterone, TSH, B12, D" }, sev: "high", date: { ka: "4-8 მაისი", en: "4–8 May" } });

    if (has(p.conditions, "chol") || has(p.lastCheck, "chol") || sugar)
      items.push({ id: "lipid", icon: "heart", title: { ka: "ქოლესტერინი (ლიპიდები)", en: "Cholesterol (lipid panel)" },
        note: { ka: "LDL, HDL, ტრიგლიცერიდები", en: "LDL, HDL, triglycerides" }, sev: "medium", date: { ka: "12-14 ივნისი", en: "12–14 Jun" } });

    if (p.sex === "man" && (p.age == null || p.age >= 35))
      items.push({ id: "prostate", icon: "shield", title: { ka: "პროსტატის სკრინინგი", en: "Prostate screening" },
        note: { ka: "PSA + უროლოგი", en: "PSA + urologist" }, sev: "medium", date: { ka: "ივნისი", en: "June" } });

    if (p.stress === "high" || p.stress === "burn" || p.sleepQ === "poor" || p.sleepQ === "ins")
      items.push({ id: "mental", icon: "brain", title: { ka: "მენტალური შეფასება", en: "Mental health screening" },
        note: { ka: "PHQ-9, GAD-7, ძილი", en: "PHQ-9, GAD-7, sleep" }, sev: "medium", date: { ka: "ივნისი", en: "June" } });

    items.push({ id: "general", icon: "flask", title: { ka: "ზოგადი ანალიზები", en: "General blood panel" },
      note: { ka: "ღვიძლი, თირკმელი, ფარისებრი", en: "Liver, kidney, thyroid" }, sev: "medium", date: { ka: "მაისი", en: "May" } });

    if (p.skin === "dry" || p.skin === "sens" || p.hair === "thin" || p.hair === "loss")
      items.push({ id: "derm", icon: "sparkle", title: { ka: "დერმატოლოგი", en: "Dermatologist" },
        note: { ka: "კანის და თმის შეფასება", en: "Skin & hair assessment" }, sev: "low", date: { ka: "ივლისი", en: "July" } });

    if (p.oral === "irr" || p.oral === "once")
      items.push({ id: "dental", icon: "tooth", title: { ka: "სტომატოლოგი", en: "Dental check" },
        note: { ka: "ღრძილები, კარიესი", en: "Gums, caries" }, sev: "low", date: { ka: "ივლისი", en: "July" } });

    return items;
  };

  /* ---------- Recommended specialist + sample clinic per checkup (Step 3) ---------- */
  V.checkupExtra = function (id) {
    var m = {
      glucose: { spec: { ka: "ენდოკრინოლოგი", en: "Endocrinologist" }, clinic: "Aversi Clinic" },
      energy: { spec: { ka: "ენდოკრინოლოგი", en: "Endocrinologist" }, clinic: "Aversi Clinic" },
      lipid: { spec: { ka: "კარდიოლოგი", en: "Cardiologist" }, clinic: "NeoLab" },
      prostate: { spec: { ka: "უროლოგი", en: "Urologist" }, clinic: "Aversi Clinic" },
      mental: { spec: { ka: "ფსიქოლოგი", en: "Psychologist" }, clinic: "Mindful Center" },
      general: { spec: { ka: "ოჯახის ექიმი", en: "Family doctor" }, clinic: "NeoLab" },
      derm: { spec: { ka: "დერმატოლოგი", en: "Dermatologist" }, clinic: "Skin Clinic" },
      dental: { spec: { ka: "სტომატოლოგი", en: "Dentist" }, clinic: "Dental Art" },
    };
    return m[id] || { spec: { ka: "სპეციალისტი", en: "Specialist" }, clinic: "Clinic" };
  };

  /* ---------- Body-map markers (relative %, on the silhouette) ---------- */
  V.bodyMarkers = function () {
    var c = V.concerns();
    var slots = {
      heart:  { x: 50, y: 33 },
      sugar:  { x: 47, y: 52 },
      chol:   { x: 62, y: 40 },
      energy: { x: 35, y: 45 },
      weight: { x: 50, y: 58 },
      mental: { x: 50, y: 14 },
      skin:   { x: 67, y: 30 },
    };
    return c.filter(function (x) { return slots[x.id]; })
      .map(function (x) { return { id: x.id, key: x.key, sev: x.sev, x: slots[x.id].x, y: slots[x.id].y }; });
  };

  /* ---------- Goals catalog (grouped) ---------- */
  V.goalGroups = function () {
    var p = V.state.profile;
    var tgtW = p.weight ? Math.max(60, Math.round(p.weight - 8)) : 77;
    var tgtWaist = p.waist ? Math.max(80, p.waist - 15) : 95;
    return [
      { id: "general", labelKey: "gGeneral", tone: "green", icon: "heart", goals: [
        { id: "weight", labelKey: "gWeight", from: (p.weight || 85) + " " + V.t("kg"), to: tgtW + " " + V.t("kg"), def: true },
        { id: "sugar", labelKey: "gSugar", fromKey: "vPre", toKey: "vNormal" },
        { id: "waist", labelKey: "gWaist", from: (p.waist || 110) + " " + V.t("cm"), to: tgtWaist + " " + V.t("cm") },
      ]},
      { id: "mental", labelKey: "gMental", tone: "blue", icon: "smile", goals: [
        { id: "energy", labelKey: "gEnergy", fromKey: "vLow", toKey: "vHigh" },
        { id: "wellbeing", labelKey: "gWellbeing", fromKey: "vNormal", toKey: "vPositive", def: true },
      ]},
      { id: "appearance", labelKey: "gAppearance", tone: "pink", icon: "sparkle", goals: [
        { id: "skin", labelKey: "gSkin", fromKey: "vDry", toKey: "vSmooth" },
        { id: "hair", labelKey: "gHair", fromKey: "vThinning", toKey: "vMaint" },
        { id: "oral", labelKey: "gOral", fromKey: "vNormal", toKey: "vMaint" },
      ]},
    ];
  };

  /* ---------- Daily plan tasks (depend on selected goals) ---------- */
  V.dailyTasks = function () {
    var g = V.state.goals;
    var p = V.state.profile;
    var t = [];
    t.push({ id: "water", cat: "phys", label: { ka: "დალიე 1 ჭიქა წყალი", en: "Drink 1 glass of water" } });
    t.push({ id: "walk", cat: "phys", label: { ka: "10-წუთიანი სეირნობა", en: "Take a 10-minute walk" } });
    t.push({ id: "mood", cat: "mental", label: { ka: "ჩაინიშნე დღის განწყობა", en: "Log your daily mood" } });
    if (g.indexOf("weight") >= 0 || g.indexOf("waist") >= 0)
      t.push({ id: "steps", cat: "phys", label: { ka: "7,000–10,000 ნაბიჯი", en: "7,000–10,000 steps" } });
    if (g.indexOf("sugar") >= 0)
      t.push({ id: "lowgi", cat: "nutrition", label: { ka: "დაბალი GI საუზმე", en: "Low-GI breakfast" } });
    if (g.indexOf("wellbeing") >= 0 || g.indexOf("energy") >= 0)
      t.push({ id: "breath", cat: "mental", label: { ka: "10 წთ სუნთქვა / mindfulness", en: "10 min breathing / mindfulness" } });
    if (g.indexOf("skin") >= 0)
      t.push({ id: "spf", cat: "skin", label: { ka: "დამატენიანებელი + SPF 30+", en: "Moisturizer + SPF 30+" } });
    if (g.indexOf("oral") >= 0)
      t.push({ id: "floss", cat: "oral", label: { ka: "კბილის ძაფი", en: "Daily flossing" } });
    if (p.meds === "yes" || V.medications().length)
      t.push({ id: "meds", cat: "phys", label: { ka: "მიიღე მედიკამენტები", en: "Take your medications" } });
    return t;
  };

  V.catTone = function (cat) {
    return { phys: "green", mental: "blue", nutrition: "pink", skin: "pink", oral: "gray" }[cat] || "gray";
  };
  V.catKey = function (cat) {
    return { phys: "plCatPhys", mental: "plCatMental", nutrition: "plCatNutrition", skin: "plCatSkin", oral: "plCatOral" }[cat];
  };

  /* ---------- Medications (doctor-prescribed, from doc) ---------- */
  V.medications = function () {
    var p = V.state.profile;
    var meds = [];
    var sugar = has(p.conditions, "pre") || has(p.lastCheck, "sugar");
    // morning
    meds.push({ id: "omega3", when: "morning", name: { ka: "ომეგა-3 (თევზის ქონი)", en: "Omega-3 (Fish Oil)" },
      dose: "1000–2000 mg", purpose: { ka: "ტრიგლიცერიდები, გული, ღვიძლი", en: "Triglycerides, heart, liver" } });
    meds.push({ id: "vitd", when: "morning", name: { ka: "ვიტამინი D3", en: "Vitamin D3" },
      dose: "1000–2000 IU", purpose: { ka: "ენერგია, ჰორმონები, მეტაბოლიზმი", en: "Energy, hormones, metabolism" } });
    // evening
    if (sugar)
      meds.push({ id: "metformin", when: "evening", name: { ka: "მეტფორმინი", en: "Metformin" },
        dose: "500 mg", purpose: { ka: "ინსულინის მგრძნობელობა", en: "Insulin sensitivity" } });
    if (has(p.conditions, "chol") || has(p.lastCheck, "chol"))
      meds.push({ id: "atorva", when: "evening", name: { ka: "ატორვასტატინი", en: "Atorvastatin" },
        dose: "10–20 mg", purpose: { ka: "LDL ქოლესტერინი", en: "Lowers LDL cholesterol" } });
    return meds;
  };

  /* ---------- Food plan (from doc) ---------- */
  V.foodPlan = function () {
    return [
      { id: "breakfast", time: "08:00", kcal: 450, title: { ka: "საუზმე", en: "Breakfast" },
        items: { ka: ["შვრიის ფაფა (50გ)", "ბერძნული იოგურტი (150გ)", "კენკრა (100გ)", "ნიგოზი (15გ)"],
                 en: ["Oatmeal (50g dry oats)", "Greek yogurt (150g)", "Berries (100g)", "Walnuts (15g)"] } },
      { id: "snack1", time: "11:00", kcal: 200, title: { ka: "სნექი 1", en: "Snack 1" },
        items: { ka: ["1 ვაშლი", "10–15 ნუში"], en: ["1 apple", "10–15 almonds"] } },
      { id: "lunch", time: "14:00", kcal: 600, title: { ka: "სადილი", en: "Lunch" },
        items: { ka: ["შემწვარი ქათამი (150გ)", "წიწიბურა/კინოა (70გ)", "ბოსტნეული (200გ)", "ზეითუნის ზეთი (1 ს/კ)"],
                 en: ["Grilled chicken breast (150g)", "Buckwheat or quinoa (70g)", "Mixed vegetables (200g)", "Olive oil (1 tbsp)"] } },
      { id: "snack2", time: "17:00", kcal: 200, title: { ka: "სნექი 2", en: "Snack 2" },
        items: { ka: ["ბერძნული იოგურტი (150გ) ან ხაჭო (100გ)"], en: ["Greek yogurt (150g) or cottage cheese (100g)"] } },
      { id: "dinner", time: "19:30", kcal: 475, title: { ka: "ვახშამი", en: "Dinner" },
        items: { ka: ["შემწვარი თევზი (≈150გ)", "დიდი სალათა + ზეითუნის ზეთი"],
                 en: ["Grilled fish (salmon/white fish ~150g)", "Large salad with olive oil"] } },
    ];
  };

  /* ---------- Preventive screening catalog (international guidelines) ----------
     USPSTF / ADA / AAO / ADA-style adult preventive screening, gated by sex,
     age window and risk. region → maps to the body-map visualization. */
  V.freqLabel = function (f) {
    return { q: { ka: "კვარტალში", en: "Quarterly" }, b: { ka: "6 თვეში", en: "Every 6 months" }, a: { ka: "წელიწადში", en: "Annually" }, "3y": { ka: "3 წელიწადში", en: "Every 3 years" }, once: { ka: "ერთხელ", en: "Once" } }[f];
  };

  V.regionLabel = function (r) {
    var m = { head: "regHead", neck: "regNeck", chest: "regChest", heart: "regHeart", lungs: "regLungs", liver: "regLiver", abdomen: "regAbdomen", colon: "regColon", pelvis: "regPelvis", bone: "regBone", skin: "regSkin", mouth: "regMouth" };
    return m[r] ? V.t(m[r]) : r;
  };

  // body-map coordinates per region (% of the body SVG box)
  V.regionXY = {
    head: { x: 50, y: 11 }, mouth: { x: 50, y: 17 }, neck: { x: 50, y: 21 },
    chest: { x: 50, y: 31 }, heart: { x: 43, y: 33 }, lungs: { x: 58, y: 30 },
    liver: { x: 60, y: 45 }, abdomen: { x: 50, y: 47 }, colon: { x: 44, y: 53 },
    pelvis: { x: 50, y: 61 }, bone: { x: 38, y: 64 }, skin: { x: 76, y: 46 },
  };

  V.screeningCatalog = function () {
    // cat: cardio | metabolic | cancer | general | mental
    return [
      { id: "bp", region: "heart", cat: "cardio", sex: "any", min: 18, max: 120, freq: "a",
        name: { ka: "არტერიული წნევა", en: "Blood pressure" }, basis: { ka: "USPSTF — ყველა ზრდასრული", en: "USPSTF — all adults" } },
      { id: "diabetes", region: "abdomen", cat: "metabolic", sex: "any", min: 35, max: 70, freq: "b", riskFreq: "q",
        name: { ka: "შაქარი + HbA1c", en: "Blood sugar + HbA1c" }, basis: { ka: "USPSTF/ADA — 35–70, ჭარბწონა", en: "USPSTF/ADA — 35–70, overweight" }, riskAnyAge: true },
      { id: "lipids", region: "heart", cat: "cardio", sex: "any", min: 40, max: 75, freq: "b",
        name: { ka: "ლიპიდები (ქოლესტერინი)", en: "Lipid panel (cholesterol)" }, basis: { ka: "USPSTF — 40–75", en: "USPSTF — 40–75" }, riskAnyAge: true },
      { id: "colorectal", region: "colon", cat: "cancer", sex: "any", min: 45, max: 75, freq: "a",
        name: { ka: "კოლორექტალური სკრინინგი", en: "Colorectal cancer" }, basis: { ka: "USPSTF — 45–75 (FIT/კოლონოსკოპია)", en: "USPSTF — 45–75 (FIT/colonoscopy)" } },
      { id: "cervical", region: "pelvis", cat: "cancer", sex: "woman", min: 21, max: 65, freq: "3y",
        name: { ka: "საშვილოსნოს ყელი (PAP/HPV)", en: "Cervical (Pap/HPV)" }, basis: { ka: "USPSTF — ქალი 21–65", en: "USPSTF — women 21–65" } },
      { id: "breast", region: "chest", cat: "cancer", sex: "woman", min: 40, max: 74, freq: "b",
        name: { ka: "ძუძუ (მამოგრაფია)", en: "Breast (mammogram)" }, basis: { ka: "USPSTF — ქალი 40–74", en: "USPSTF — women 40–74" } },
      { id: "prostate", region: "pelvis", cat: "cancer", sex: "man", min: 50, max: 69, freq: "b", riskMin: 45,
        name: { ka: "პროსტატა (PSA, განხილვა)", en: "Prostate (PSA, discuss)" }, basis: { ka: "USPSTF — კაცი 50–69 (განხილვა)", en: "USPSTF — men 50–69 (shared decision)" } },
      { id: "lung", region: "lungs", cat: "cancer", sex: "any", min: 50, max: 80, freq: "a", needsSmoker: true,
        name: { ka: "ფილტვის სკრინინგი (LDCT)", en: "Lung cancer (LDCT)" }, basis: { ka: "USPSTF — მწეველი 50–80", en: "USPSTF — smokers 50–80" } },
      { id: "aaa", region: "abdomen", cat: "cardio", sex: "man", min: 65, max: 75, freq: "once", needsSmoker: true,
        name: { ka: "აორტის ანევრიზმა (ექო)", en: "Aortic aneurysm (US)" }, basis: { ka: "USPSTF — კაცი 65–75, ყოფ. მწეველი", en: "USPSTF — men 65–75, ever smoked" } },
      { id: "osteo", region: "bone", cat: "general", sex: "woman", min: 65, max: 120, freq: "a",
        name: { ka: "ოსტეოპოროზი (DEXA)", en: "Osteoporosis (DEXA)" }, basis: { ka: "USPSTF — ქალი 65+", en: "USPSTF — women 65+" } },
      { id: "depression", region: "head", cat: "mental", sex: "any", min: 18, max: 120, freq: "a",
        name: { ka: "დეპრესია (PHQ-9)", en: "Depression (PHQ-9)" }, basis: { ka: "USPSTF — ყველა ზრდასრული", en: "USPSTF — all adults" } },
      { id: "hepc", region: "liver", cat: "general", sex: "any", min: 18, max: 79, freq: "once",
        name: { ka: "ჰეპატიტი C", en: "Hepatitis C" }, basis: { ka: "USPSTF — 18–79, ერთხელ", en: "USPSTF — 18–79, once" } },
      { id: "dental", region: "mouth", cat: "general", sex: "any", min: 18, max: 120, freq: "b",
        name: { ka: "სტომატოლოგი", en: "Dental" }, basis: { ka: "ADA — ყოველ 6–12 თვეში", en: "ADA — every 6–12 months" } },
      { id: "eye", region: "head", cat: "general", sex: "any", min: 40, max: 120, freq: "b",
        name: { ka: "მხედველობა (ოფთალმოლოგი)", en: "Eye exam" }, basis: { ka: "AAO — 40+ პერიოდული", en: "AAO — 40+ periodic" } },
      { id: "thyroid", region: "neck", cat: "general", sex: "any", min: 35, max: 120, freq: "a", riskOnly: true,
        name: { ka: "ფარისებრი (TSH)", en: "Thyroid (TSH)" }, basis: { ka: "რისკ/სიმპტომ-დაფუძნებული", en: "Risk/symptom-based" } },
      { id: "skin", region: "skin", cat: "cancer", sex: "any", min: 18, max: 120, freq: "a", riskOnly: true,
        name: { ka: "კანის შემოწმება", en: "Skin check" }, basis: { ka: "რისკ-დაფუძნებული", en: "Risk-based" } },
    ];
  };

  function hasRisk(s, p) {
    if (s.id === "diabetes") return p.conditions.indexOf("pre") >= 0 || p.lastCheck.indexOf("sugar") >= 0 || ((V.bmi() || 0) >= 25);
    if (s.id === "lipids") return p.conditions.indexOf("chol") >= 0 || p.lastCheck.indexOf("chol") >= 0 || p.conditions.indexOf("pre") >= 0 || p.smoking === "daily";
    if (s.id === "thyroid") return p.conditions.indexOf("thyroid") >= 0 || p.energy === "vlow" || p.energy === "low";
    if (s.id === "skin") return p.skin === "sens" || p.skin === "dry" || p.hair === "loss";
    return false;
  }
  function smokerEver(p) { return p.smoking === "daily" || p.smoking === "occ"; }

  // → { now:[{...,freq}], later:[{...,fromAge}] } eligible by guidelines + profile
  V.recommendedScreenings = function () {
    var p = V.state.profile;
    var age = p.age || 36;
    var now = [], later = [];
    V.screeningCatalog().forEach(function (s) {
      if (s.sex !== "any" && s.sex !== p.sex) return;
      if (s.needsSmoker && !smokerEver(p)) return;
      if (s.riskOnly && !hasRisk(s, p)) return;
      var risk = hasRisk(s, p);
      var minAge = (risk && s.riskMin) ? s.riskMin : s.min;
      var eligibleNow = (risk && s.riskAnyAge) || (age >= minAge && age <= s.max);
      var freq = (risk && s.riskFreq) ? s.riskFreq : s.freq;
      var item = { id: s.id, region: s.region, cat: s.cat, name: s.name, basis: s.basis, freq: freq, risk: risk };
      if (eligibleNow) now.push(item);
      else if (age < minAge) later.push(Object.assign({ fromAge: minAge }, item));
    });
    return { now: now, later: later };
  };

  V.catColor = function (cat) {
    return { cardio: "var(--pink)", metabolic: "var(--yellow)", cancer: "var(--blue)", mental: "var(--blue)", general: "var(--green)" }[cat] || "var(--green)";
  };

  // selected screening ids (default = all recommended-now)
  V.selectedScreenings = function () {
    if (!V.state.screenings) {
      V.state.screenings = V.recommendedScreenings().now.map(function (s) { return s.id; });
      V.save();
    }
    return V.state.screenings;
  };

  // month schedule built from SELECTED screenings (freq → months)
  V.screeningByMonth = function () {
    var sel = V.selectedScreenings();
    var rec = V.recommendedScreenings().now.filter(function (s) { return sel.indexOf(s.id) >= 0; });
    function months(freq, start) {
      if (freq === "q") return [0, 3, 6, 9].map(function (o) { return ((start - 1 + o) % 12) + 1; });
      if (freq === "b") return [start, ((start + 5) % 12) + 1];
      if (freq === "3y") return [start];
      if (freq === "once") return [start];
      return [start]; // annual
    }
    var anchors = { heart: 5, abdomen: 3, colon: 4, lungs: 6, pelvis: 9, chest: 10, head: 2, neck: 7, liver: 8, bone: 11, skin: 6, mouth: 1 };
    var byM = {};
    rec.forEach(function (s, i) {
      var start = ((anchors[s.region] || ((i % 12) + 1)) % 12) + 1;
      months(s.freq, start).forEach(function (m) { (byM[m] = byM[m] || []).push(s); });
    });
    var out = [];
    for (var m = 1; m <= 12; m++) if (byM[m]) out.push({ month: m, items: byM[m] });
    return out;
  };

  /* ---------- Workout plan (weekly split, from the doc's Body & Fitness plan) ---------- */
  V.workoutWeek = function () {
    function ex(ka, en, scheme) { return { name: { ka: ka, en: en }, scheme: scheme }; }
    var strengthA = [ // full body
      ex("აზიდვები (push-ups)", "Push-ups", "3 × 10–12"),
      ex("ჩაჯდომები (squats)", "Squats", "3 × 15"),
      ex("ნახტომები (lunges)", "Lunges", "3 × 10 / ფეხი"),
      ex("პლანკი", "Plank", "3 × 40 წმ"),
    ];
    var strengthB = [ // upper + core
      ex("აზიდვები ვიწროდ", "Close-grip push-ups", "3 × 10"),
      ex("ნიჩბისებრი (rows, წყლის ბოთლით)", "Rows (water bottles)", "3 × 12"),
      ex("მუცლის გადახრები", "Crunches", "3 × 15"),
      ex("Superman", "Superman hold", "3 × 30 წმ"),
    ];
    var strengthC = [ // lower + core
      ex("ბულგარული ჩაჯდომა", "Bulgarian split squat", "3 × 10 / ფეხი"),
      ex("მენჯის აწევა (glute bridge)", "Glute bridge", "3 × 15"),
      ex("ხბოს აწევა", "Calf raises", "3 × 20"),
      ex("გვერდითი პლანკი", "Side plank", "2 × 30 წმ / მხარე"),
    ];
    var walk = [ex("სწრაფი სიარული", "Brisk walk", "45 წთ · 8–10 ათ. ნაბიჯი")];
    return [
      { key: "mon", type: "strength", focus: { ka: "ძალა — მთელი სხეული", en: "Strength — full body" }, items: strengthA },
      { key: "tue", type: "cardio", focus: { ka: "სიარული", en: "Walking" }, items: walk },
      { key: "wed", type: "strength", focus: { ka: "ძალა — ზედა + კორი", en: "Strength — upper + core" }, items: strengthB },
      { key: "thu", type: "cardio", focus: { ka: "სიარული", en: "Walking" }, items: walk },
      { key: "fri", type: "strength", focus: { ka: "ძალა — ქვედა + კორი", en: "Strength — lower + core" }, items: strengthC },
      { key: "sat", type: "cardio", focus: { ka: "აქტიური აღდგენა", en: "Active recovery" }, items: [ex("მსუბუქი სიარული / გაჭიმვა", "Easy walk / stretch", "30 წთ")] },
      { key: "sun", type: "rest", focus: { ka: "დასვენება", en: "Rest" }, items: [] },
    ];
  };

  /* ---------- Calendar events (for the month view) ---------- */
  function ymd(y, m, d) { return y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0"); }
  V.calendarEvents = function (year, month) {   // month 1-12
    var ev = {};
    function push(iso, e) { (ev[iso] = ev[iso] || []).push(e); }
    var daysIn = new Date(year, month, 0).getDate();

    // screenings (placed mid-month on day 12)
    if (V.screeningByMonth) {
      V.screeningByMonth().forEach(function (mo) {
        if (mo.month === month) {
          mo.items.forEach(function (s) {
            push(ymd(year, month, Math.min(12, daysIn)), { type: "screen", label: s.name, color: V.catColor(s.cat) });
          });
        }
      });
    }
    // bookings (exact dates) — from the clinics/visit flow
    (V.state.bookings || []).forEach(function (b) {
      if (!b.date) return;
      var p = b.date.split("-");
      if (parseInt(p[0]) === year && parseInt(p[1]) === month)
        push(b.date, { type: "visit", label: { ka: "ვიზიტი", en: "Visit" }, color: "var(--green)" });
    });
    // women's cycle — period days + fertile window
    if (V.state.profile && V.state.profile.sex === "woman" && V.cycle) {
      var c = V.cycle(), base = new Date(c.lastPeriod), len = c.cycleLen || 28, plen = c.periodLen || 5;
      for (var k = -2; k <= 14; k++) {
        var start = new Date(base); start.setDate(base.getDate() + k * len);
        for (var d = 0; d < plen; d++) {
          var pd = new Date(start); pd.setDate(start.getDate() + d);
          if (pd.getFullYear() === year && pd.getMonth() + 1 === month)
            push(ymd(year, month, pd.getDate()), { type: "period", label: { ka: "მენსტრუაცია", en: "Period" }, color: "var(--pink)" });
        }
        var ov = new Date(start); ov.setDate(start.getDate() + (len - 14));
        for (var f = -4; f <= 1; f++) {
          var fd = new Date(ov); fd.setDate(ov.getDate() + f);
          if (fd.getFullYear() === year && fd.getMonth() + 1 === month)
            push(ymd(year, month, fd.getDate()), { type: "fertile", label: { ka: "ნაყოფიერი", en: "Fertile" }, color: "var(--blue)" });
        }
      }
    }
    return ev;
  };

  // google calendar add-link for an all-day event
  V.gcalLink = function (title, isoDate, details, location) {
    var d = isoDate.replace(/-/g, "");
    var end = new Date(isoDate); end.setDate(end.getDate() + 1);
    var de = end.getFullYear() + String(end.getMonth() + 1).padStart(2, "0") + String(end.getDate()).padStart(2, "0");
    return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(title) +
      "&dates=" + d + "/" + de +
      (details ? "&details=" + encodeURIComponent(details) : "") +
      (location ? "&location=" + encodeURIComponent(location) : "");
  };

  /* ---------- Women's cycle ---------- */
  function dISO(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function addDays(iso, n) { var d = new Date(iso); d.setDate(d.getDate() + n); return d; }

  V.cycleDefault = function () {
    return { lastPeriod: dISO(addDays(V.todayISO(), -8)), cycleLen: 28, periodLen: 5, logs: {} };
  };
  V.cycle = function () {
    if (!V.state.cycle) { V.state.cycle = V.cycleDefault(); V.save(); }
    return V.state.cycle;
  };
  // current phase + predictions
  V.cycleInfo = function () {
    var c = V.cycle();
    var len = c.cycleLen || 28, plen = c.periodLen || 5;
    var ms = new Date(V.todayISO()) - new Date(c.lastPeriod);
    var elapsed = Math.floor(ms / 86400000);
    var day = ((elapsed % len) + len) % len + 1;      // 1..len
    var ovDay = len - 14;                              // ovulation day
    var phase;
    if (day <= plen) phase = "menstruation";
    else if (day >= ovDay - 1 && day <= ovDay + 1) phase = "ovulation";
    else if (day < ovDay - 1) phase = "follicular";
    else phase = "luteal";
    var nextIn = (len - day + 1);
    return {
      day: day, len: len, plen: plen, phase: phase, ovDay: ovDay,
      nextIn: nextIn,
      nextDate: dISO(addDays(V.todayISO(), nextIn)),
      fertileStart: Math.max(1, ovDay - 4), fertileEnd: ovDay + 1,
    };
  };
  V.cyclePhaseColor = function (p) {
    return { menstruation: "var(--pink)", follicular: "var(--green)", ovulation: "var(--blue)", luteal: "var(--yellow)" }[p] || "var(--green)";
  };
  V.cyclePhaseTip = function (p) {
    return {
      menstruation: { ka: "დაისვენე, რკინით მდიდარი საკვები, მსუბუქი მოძრაობა; ჰიდრატაცია ტკივილს ამცირებს.", en: "Rest, iron-rich food, light movement; hydration eases cramps." },
      follicular: { ka: "ენერგია მატულობს — კარგი დროა ინტენსიური ვარჯიშისა და ახალი მიზნებისთვის.", en: "Energy rising — great time for intense workouts and new goals." },
      ovulation: { ka: "პიკური ენერგია და ნაყოფიერება; ცილა და ჰიდრატაცია მნიშვნელოვანია.", en: "Peak energy and fertility; prioritise protein and hydration." },
      luteal: { ka: "PMS შესაძლებელია — მაგნიუმი, ძილი, ნაკლები კოფეინი/შაქარი.", en: "PMS possible — magnesium, sleep, less caffeine/sugar." },
    }[p];
  };
  V.cycleSymptoms = function () {
    return ["symCramps", "symMood", "symHeadache", "symFatigue", "symBloating", "symAcne"];
  };

  /* ---------- Rewards / brand elements ---------- */
  V.ELEMENT_ORDER = ["cross", "stetho", "pill", "capsule", "vitamin", "syringe"];
  V.ELEMENT_EVERY = 100;          // lifetime points per collected element

  V.award = function (pts, reason) {
    var s = V.state;
    s.points = (s.points || 0) + pts;
    s.lifetime = (s.lifetime || 0) + pts;
    s.rewardLog = s.rewardLog || [];
    s.rewardLog.unshift({ date: V.todayISO(), ts: Date.now(), pts: pts, reason: reason });
    if (s.rewardLog.length > 60) s.rewardLog.length = 60;
    // unlock brand elements every ELEMENT_EVERY lifetime points
    s.elements = s.elements || {};
    var have = 0; Object.keys(s.elements).forEach(function (k) { have += s.elements[k]; });
    var should = Math.floor(s.lifetime / V.ELEMENT_EVERY);
    while (have < should) {
      var t = V.ELEMENT_ORDER[have % V.ELEMENT_ORDER.length];
      s.elements[t] = (s.elements[t] || 0) + 1;
      have++;
    }
    V.save();
  };
  // award once per action-id per day (avoids double-award on re-toggle)
  V.awardOnce = function (key, pts, reason) {
    var s = V.state;
    s.awarded = s.awarded || {};
    var k = V.todayISO() + ":" + key;
    if (s.awarded[k]) return;
    s.awarded[k] = true;
    V.award(pts, reason);
  };
  V.elementsTotal = function () {
    var s = V.state.elements || {}, n = 0;
    Object.keys(s).forEach(function (k) { n += s[k]; });
    return n;
  };
  V.rewardTiers = function () {
    return [
      { id: "t1", cost: 300, key: "rwTier1" },
      { id: "t2", cost: 800, key: "rwTier2" },
      { id: "t3", cost: 2000, key: "rwTier3" },
    ];
  };

  /* ---------- Water tracker ---------- */
  V.WATER_GLASS = 250;            // ml per glass
  V.waterGoal = function () { return 2500; };   // ml/day target (2–2.5L)
  V.waterToday = function () { return V.state.waterLog[V.todayISO()] || 0; };
  V.waterAdd = function (ml) {
    var d = V.todayISO();
    var was = V.state.waterLog[d] || 0;
    var now = Math.max(0, was + ml);
    V.state.waterLog[d] = now;
    V.save();
    // reward: first time hitting the daily goal
    if (was < V.waterGoal() && now >= V.waterGoal() && V.awardOnce) V.awardOnce("water", 10, "water");
    return now;
  };
  V.waterSeries = function (days) {
    days = days || 7;
    var out = [], d = new Date();
    for (var i = days - 1; i >= 0; i--) {
      var dt = new Date(d); dt.setDate(d.getDate() - i);
      var iso = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
      out.push({ iso: iso, ml: V.state.waterLog[iso] || 0, key: ["sun","mon","tue","wed","thu","fri","sat"][dt.getDay()] });
    }
    return out;
  };

  /* ---------- Holistic care plans (A–F, from the doc) ----------
     Each plan: {id, key(title), icon, tone, sections:[{h, items:[]}]}.
     Personalised numbers pulled from the profile where the doc uses them. */
  V.carePlans = function () {
    var p = V.state.profile;
    var w = p.weight || 85;
    var tgtW = Math.max(60, Math.round(w - 8));
    var waist = p.waist || 110;
    var tgtWaist = Math.max(80, (p.sex === "woman" ? 80 : 94));
    function S(h_ka, h_en, ka, en) { return { h: { ka: h_ka, en: h_en }, items: { ka: ka, en: en } }; }

    var plans = [];

    plans.push({ id: "general", key: "cpGeneral", icon: "heart", tone: "green", sections: [
      S("მთავარი ფოკუსი", "Key focus",
        ["პრედიაბეტის უკუქცევა", "ქოლესტერინის კონტროლი", "ვისცერული ცხიმის შემცირება (წელი " + waist + "→<" + tgtWaist + " სმ)", "ცხიმოვანი ღვიძლის პრევენცია", "გულ-სისხლძარღვთა დაავადების პრევენცია"],
        ["Reverse prediabetes", "Control high cholesterol", "Reduce visceral fat (waist " + waist + "→<" + tgtWaist + " cm)", "Prevent fatty liver disease", "Prevent cardiovascular disease"]),
      S("დილა", "Morning",
        ["1 ჭიქა წყალი გაღვიძებისთანავე", "10–15 წთ მზის შუქი", "ცილოვანი საუზმე (შაქრის პიკის გარეშე)"],
        ["1 glass of water on waking", "10–15 min sunlight", "Protein-based breakfast (no sugar spike)"]),
      S("დღე", "Day",
        ["ჭამე ყოველ 3–4 საათში", "7,000–10,000 ნაბიჯი", "ადექი/იმოძრავე ყოველ 60 წუთში"],
        ["Eat every 3–4 hours", "7,000–10,000 steps", "Stand/move every 60 minutes"]),
      S("საღამო", "Evening",
        ["მსუბუქი ვახშამი (დაბალი ნახშირწყალი) 20:00-მდე", "სამუშაო დღეებში ალკოჰოლის გარეშე"],
        ["Light low-carb dinner before 8pm", "No alcohol on weekdays"]),
      S("კვების სტრუქტურა", "Food structure",
        ["ცილა: თევზი, ქათამი, კვერცხი", "ნახშირწყლები: დაბალი GI (შვრია, წიწიბურა, ბოსტნეული)", "ცხიმი: ზეითუნის ზეთი, კაკალი", "ბოჭკო: 25–30გ/დღეში"],
        ["Protein: fish, chicken, eggs", "Carbs: low-GI (oats, buckwheat, veg)", "Fats: olive oil, nuts", "Fiber: 25–30g/day"]),
      S("მოერიდე", "Avoid",
        ["თეთრი პური, შაქარი, დამუშავებული საკვები", "ალკოჰოლი (იდეალურად ≤1–2 კვირაში)", "მთელი დღე ჯდომა"],
        ["White bread, sugar, processed food", "Alcohol (ideally ≤1–2/week)", "Sitting all day"]),
      S("მედიკამენტური მხარდაჭერა (მხოლოდ ექიმის რეკომენდაციით)", "Medical support (doctor only)",
        ["CRP + ლიპიდების მონიტორინგი", "მეტფორმინი (ადრეული ჩარევა)", "ატორვასტატინი (თუ LDL მაღალია)", "ომეგა-3"],
        ["Monitor CRP + lipids", "Metformin (early intervention)", "Atorvastatin (if LDL stays high)", "Omega-3"]),
    ]});

    plans.push({ id: "mental", key: "cpMental", icon: "brain", tone: "blue", sections: [
      S("მთავარი საკითხები", "Key issues",
        ["დაბალი ენერგია", "სამსახურის სტრესი", "შესაძლო მსუბუქი გადაწვა"],
        ["Low energy", "Work stress", "Possible mild burnout"]),
      S("დღიური რუტინა", "Daily routine",
        ["10 წთ სუნთქვა ან mindfulness", "კოფეინი 14:00-ის შემდეგ შემცირება", "1 სთ ეკრანის გარეშე ძილის წინ"],
        ["10 min breathing or mindfulness", "Reduce caffeine after 2pm", "1 screen-free hour before sleep"]),
      S("კვირის ქმედებები", "Weekly actions",
        ["1 ფიზიკური აქტივობა გარეთ", "1 სოციალური / არასამსახურებრივი აქტივობა"],
        ["1 outdoor physical activity", "1 social / non-work activity"]),
      S("კლინიკური მხარდაჭერა", "Clinical support",
        ["ფსიქოლოგის კონსულტაცია თუ PHQ-9/GAD-7 მომატებულია", "ძილის ტრეკინგი (7–8 სთ სავალდებულო)"],
        ["Psychologist consult if PHQ-9/GAD-7 elevated", "Sleep tracking (7–8h mandatory)"]),
    ]});

    plans.push({ id: "body", key: "cpBody", icon: "scale", tone: "green", sections: [
      S("სამიზნეები", "Targets",
        ["წონა: " + w + " → " + tgtW + " კგ", "სხეულის ცხიმი: 38% → ~22–25%"],
        ["Weight: " + w + " → " + tgtW + " kg", "Body fat: 38% → ~22–25%"]),
      S("კვირის გეგმა", "Weekly plan",
        ["3×/კვირაში ძალისმიერი (მთელი სხეული — აზიდვები, ჩაჯდომები, კორი)", "ყოველდღიური სიარული 45 წთ (8–10 ათასი ნაბიჯი)"],
        ["3×/week strength (full body — push-ups, squats, core)", "Daily walking 45 min (8–10k steps)"]),
    ]});

    plans.push({ id: "skin", key: "cpSkin", icon: "sparkle", tone: "pink", sections: [
      S("დილა", "Morning",
        ["დამატენიანებელი (ჰიალურონი/ცერამიდები)", "SPF 30+ (თბილისშიც მნიშვნელოვანია)"],
        ["Moisturizer (hyaluronic acid/ceramides)", "SPF 30+ (important even in Tbilisi)"]),
      S("საღამო", "Evening", ["დასუფთავება (cleanser)", "მკვებავი დამატენიანებელი"], ["Cleanser", "Rich moisturizer"]),
      S("შიდა მხარდაჭერა", "Internal support",
        ["ჰიდრატაცია: 2–2.5ლ წყალი/დღეში", "ომეგა-3 (ქოლესტერინსაც ეხმარება)"],
        ["Hydration: 2–2.5L water/day", "Omega-3 (also helps cholesterol)"]),
    ]});

    plans.push({ id: "hair", key: "cpHair", icon: "hair", tone: "yellow", sections: [
      S("ბაზისური პრევენცია", "Core prevention",
        ["ცილით მდიდარი კვება", "სტრესის შემცირება + ძილის გაუმჯობესება"],
        ["Protein-rich diet", "Reduce stress + improve sleep"]),
      S("რუტინა", "Routine",
        ["თმის რეცხვა 2–3×/კვირაში", "ცხელი წყლის მოერიდება", "კვირაში სკალპის მასაჟი"],
        ["Wash hair 2–3×/week", "Avoid hot water", "Weekly scalp massage"]),
    ]});

    plans.push({ id: "oral", key: "cpOral", icon: "tooth", tone: "blue", sections: [
      S("რუტინა", "Routine",
        ["ყოველდღიური ფლოსი", "საწმენდი ხსნარი (ალკოჰოლის გარეშე, სურვილისამებრ)"],
        ["Daily flossing", "Mouthwash (alcohol-free, optional)"]),
      S("კლინიკური მოვლა", "Clinical care", ["წმენდა ყოველ 6 თვეში"], ["Cleaning every 6 months"]),
    ]});

    return plans;
  };

  /* ---------- Lab panels (from the doc's Diagnostic & Screening Plan) ----------
     Each ref: {id, name, unit, low, high, demo}. For "higher is better" markers
     (HDL, vitamins, testosterone, ferritin) high is set very large so only `low`
     flags. For score/count markers (PHQ-9, caries) low is 0. */
  V.labPanels = function () {
    var p = V.state.profile;
    var man = p.sex !== "woman";
    var panels = [
      { id: "general", key: "panGeneral", icon: "flask", refs: [
        { id: "glucose", name: { ka: "გლუკოზა (უზმოზე)", en: "Fasting glucose" }, unit: "mg/dL", low: 70, high: 99, demo: 112 },
        { id: "hba1c", name: { ka: "HbA1c", en: "HbA1c" }, unit: "%", low: 4, high: 5.6, demo: 6.1 },
        { id: "ldl", name: { ka: "LDL ქოლესტერინი", en: "LDL cholesterol" }, unit: "mg/dL", low: 0, high: 100, demo: 138 },
        { id: "hdl", name: { ka: "HDL ქოლესტერინი", en: "HDL cholesterol" }, unit: "mg/dL", low: 40, high: 9999, demo: 42 },
        { id: "trig", name: { ka: "ტრიგლიცერიდები", en: "Triglycerides" }, unit: "mg/dL", low: 0, high: 150, demo: 168 },
        { id: "ast", name: { ka: "ღვიძლი — AST", en: "Liver — AST" }, unit: "U/L", low: 0, high: 40, demo: 46 },
        { id: "alt", name: { ka: "ღვიძლი — ALT", en: "Liver — ALT" }, unit: "U/L", low: 0, high: 41, demo: 52 },
        { id: "creatinine", name: { ka: "კრეატინინი (თირკმელი)", en: "Creatinine (kidney)" }, unit: "mg/dL", low: 0.7, high: 1.3, demo: 0.95 },
        { id: "tsh", name: { ka: "TSH (ფარისებრი)", en: "TSH (thyroid)" }, unit: "mIU/L", low: 0.4, high: 4.0, demo: 2.1 },
        { id: "vitd", name: { ka: "ვიტამინი D", en: "Vitamin D" }, unit: "ng/mL", low: 30, high: 9999, demo: 22 },
        { id: "b12", name: { ka: "ვიტამინი B12", en: "Vitamin B12" }, unit: "pg/mL", low: 200, high: 9999, demo: 240 },
      ]},
      { id: "hormonal", key: "panHormonal", icon: "bolt", refs: (man ? [
        { id: "testo_total", name: { ka: "საერთო ტესტოსტერონი", en: "Total testosterone" }, unit: "ng/dL", low: 300, high: 9999, demo: 360 },
        { id: "testo_free", name: { ka: "თავისუფალი ტესტოსტერონი", en: "Free testosterone" }, unit: "pg/mL", low: 50, high: 9999, demo: 62 },
        { id: "shbg", name: { ka: "SHBG", en: "SHBG" }, unit: "nmol/L", low: 18, high: 54, demo: 30 },
        { id: "lh", name: { ka: "LH", en: "LH" }, unit: "IU/L", low: 1.7, high: 8.6, demo: 4.2 },
        { id: "fsh", name: { ka: "FSH", en: "FSH" }, unit: "IU/L", low: 1.5, high: 12.4, demo: 5.1 },
        { id: "prolactin", name: { ka: "პროლაქტინი", en: "Prolactin" }, unit: "ng/mL", low: 0, high: 18, demo: 11 },
        { id: "psa", name: { ka: "PSA (პროსტატა)", en: "PSA (prostate)" }, unit: "ng/mL", low: 0, high: 4, demo: 1.2 },
      ] : [
        { id: "estradiol", name: { ka: "ესტრადიოლი", en: "Estradiol" }, unit: "pg/mL", low: 30, high: 400, demo: 90 },
        { id: "fsh", name: { ka: "FSH", en: "FSH" }, unit: "IU/L", low: 3, high: 12, demo: 6 },
        { id: "lh", name: { ka: "LH", en: "LH" }, unit: "IU/L", low: 2, high: 12, demo: 5 },
        { id: "prolactin", name: { ka: "პროლაქტინი", en: "Prolactin" }, unit: "ng/mL", low: 0, high: 25, demo: 14 },
        { id: "tsh", name: { ka: "TSH (ფარისებრი)", en: "TSH (thyroid)" }, unit: "mIU/L", low: 0.4, high: 4.0, demo: 2.0 },
      ])},
      { id: "cardio", key: "panCardio", icon: "heart", refs: [
        { id: "hscrp", name: { ka: "hs-CRP", en: "High-sensitivity CRP" }, unit: "mg/L", low: 0, high: 3, demo: 4.2 },
        { id: "sys", name: { ka: "სისტოლური წნევა", en: "Systolic BP" }, unit: "mmHg", low: 90, high: 130, demo: 134 },
        { id: "dia", name: { ka: "დიასტოლური წნევა", en: "Diastolic BP" }, unit: "mmHg", low: 60, high: 85, demo: 86 },
        { id: "resting_hr", name: { ka: "მოსვენების პულსი", en: "Resting heart rate" }, unit: "bpm", low: 50, high: 80, demo: 74 },
      ]},
      { id: "metabolic", key: "panMetabolic", icon: "scale", refs: [
        { id: "bmi", name: { ka: "BMI", en: "BMI" }, unit: "", low: 18.5, high: 24.9, demo: V.bmi() || 28.4 },
        { id: "bodyfat", name: { ka: "სხეულის ცხიმი", en: "Body fat" }, unit: "%", low: 8, high: (man ? 24 : 31), demo: 32 },
        { id: "waist", name: { ka: "წელის გარშემოწერილობა", en: "Waist circumference" }, unit: "cm", low: 60, high: (man ? 94 : 80), demo: p.waist || 110 },
      ]},
      { id: "skin", key: "panSkin", icon: "sparkle", refs: [
        { id: "ferritin", name: { ka: "ფერიტინი (რკინა)", en: "Ferritin (iron)" }, unit: "ng/mL", low: 30, high: 9999, demo: 28 },
        { id: "folate", name: { ka: "ფოლატი", en: "Folate" }, unit: "ng/mL", low: 3, high: 9999, demo: 4.5 },
        { id: "mma", name: { ka: "MMA", en: "Methylmalonic acid (MMA)" }, unit: "nmol/L", low: 0, high: 270, demo: 210 },
        { id: "hydration", name: { ka: "წყლის მიღება დღეში", en: "Water intake / day" }, unit: "L", low: 2, high: 9999, demo: 1.2 },
      ]},
      { id: "mental", key: "panMental", icon: "brain", refs: [
        { id: "phq9", name: { ka: "PHQ-9 (დეპრესია)", en: "PHQ-9 (depression)" }, unit: "", low: 0, high: 4, demo: 8 },
        { id: "gad7", name: { ka: "GAD-7 (შფოთვა)", en: "GAD-7 (anxiety)" }, unit: "", low: 0, high: 4, demo: 7 },
        { id: "sleep_h", name: { ka: "ძილი (სთ/ღამე)", en: "Sleep (h/night)" }, unit: "h", low: 7, high: 9, demo: 5.5 },
      ]},
      { id: "dental", key: "panDental", icon: "tooth", refs: [
        { id: "bop", name: { ka: "BOP (ღრძილების სისხლდენა)", en: "BOP (bleeding gums)" }, unit: "%", low: 0, high: 10, demo: 22 },
        { id: "gingival", name: { ka: "გინგივალური ინდექსი", en: "Gingival index" }, unit: "", low: 0, high: 1, demo: 1.6 },
        { id: "caries", name: { ka: "კარიესი (რაოდ.)", en: "Tooth caries (count)" }, unit: "", low: 0, high: 0, demo: 2 },
      ]},
    ];
    return panels;
  };

  // Backward-compatible flat list of all refs (used by AI interpret + lookups).
  V.labRefs = function () {
    var out = [];
    V.labPanels().forEach(function (pn) { pn.refs.forEach(function (r) { out.push(r); }); });
    return out;
  };

  V.labStatus = function (ref, val) {
    if (val == null || isNaN(val)) return null;
    if (val < ref.low) return "low";
    if (val > ref.high) return "high";
    return "good";
  };

  /* ---------- offline VITA assistant (used when no Claude backend) ----------
     Data-driven: pulls real numbers from the profile so replies feel specific. */
  V.chatReply = function (msg) {
    var p = V.state.profile;
    var lc = (msg || "").toLowerCase();
    var ka = V.lang() === "ka";
    function pick(k, e) { return ka ? k : e; }
    function any() { for (var i = 0; i < arguments.length; i++) if (arguments[i].test(lc)) return true; return false; }

    var name = p.name ? p.name.split(" ")[0] : "";
    var bmi = V.bmi();
    var score = V.healthScore();
    var weight = p.weight || 85;
    var tgtW = Math.max(60, Math.round(weight - 8));
    var waist = p.waist || 110;
    var tgtWaist = Math.max(80, waist - 15);
    var concerns = V.concerns().map(function (c) { return V.t(c.key); });
    // slight, deterministic variation so repeats aren't identical
    var vary = function (arr) { return arr[(lc.length + (msg || "").length) % arr.length]; };

    // greeting
    if (any(/(გამარ|სალ(ა|ამ)|ჰეი)/, /\b(hello|hi|hey|yo|sup)\b/))
      return pick(
        "გამარჯობა" + (name ? " " + name : "") + "! 👋 " + (concerns.length ? "ახლა ყველაზე მეტ ყურადღებას ითხოვს: " + concerns.slice(0, 3).join(", ") + ". რომელზე ვისაუბროთ?" : "რით დაგეხმარო დღეს?"),
        "Hi" + (name ? " " + name : "") + "! 👋 " + (concerns.length ? "Right now your top focus areas are: " + concerns.slice(0, 3).join(", ") + ". Which one should we dig into?" : "How can I help today?"));

    // thanks
    if (any(/(მადლ|გმადლ)/, /\b(thanks|thank you|thx|cheers)\b/))
      return pick("არაფერს " + (name ? name + " " : "") + "🙌 აქ ვარ ნებისმიერ დროს.", "Anytime" + (name ? ", " + name : "") + " 🙌 I'm here whenever you need me.");

    // health score / status
    if (any(/(ქულა|სტატუს|მდგომარ|ჯანმრთელობა საერთ)/, /\b(score|status|how am i|overall)\b/)) {
      var band = score >= 71 ? pick("კარგ ზონაში", "in the good range") : score >= 41 ? pick("ზომიერი ყურადღების ზონაში", "in the moderate-attention range") : pick("რისკ-ზონაში", "in the risk range");
      return pick(
        "შენი ჯანმრთელობის ქულაა " + score + "/100 — " + band + ". " + (concerns.length ? "მთავარი ბერკეტებია: " + concerns.slice(0, 3).join(", ") + ". თუ გინდა, თითოეულზე კონკრეტული ნაბიჯები მოგცე." : "გააგრძელე ასე!"),
        "Your health score is " + score + "/100 — " + band + ". " + (concerns.length ? "The biggest levers are: " + concerns.slice(0, 3).join(", ") + ". Want concrete steps for each?" : "Keep it up!"));
    }

    // blood sugar
    if (any(/(შაქ|გლუკ|hba1c|დიაბ)/, /(sugar|glucose|diabet|hba1c|insulin)/))
      return pick(
        "შაქარი შენთვის პრიორიტეტული მიმართულებაა. სამი ბერკეტი: დაბალი GI საუზმე (ცილა + ბოჭკო), კვება ყოველ 3–4 საათში გრძელი შიმშილის გარეშე, და 7,000–10,000 ნაბიჯი. HbA1c-ის გადამოწმება დაგეგმე ჩექაფ-გეგმიდან. გავხსნა დეტალური დღის მენიუ?",
        "Blood sugar is a priority area for you. Three levers: a low-GI breakfast (protein + fibre), eating every 3–4 hours to avoid long fasts, and 7,000–10,000 daily steps. Book the HbA1c recheck from your checkup plan. Want me to open the detailed day menu?");

    // weight / fat loss
    if (any(/(წონა|დაკლ|ჭარბ|ცხიმ|მუცელ|წელ)/, /(weight|lose|fat|belly|waist|slim)/))
      return pick(
        "მიმდინარე წონა " + weight + " კგ, სამიზნე ≈ " + tgtW + " კგ" + (bmi ? " (BMI " + bmi + ")" : "") + ". წელი " + waist + "→" + tgtWaist + " სმ. გეგმა: -400–600 კკალ დეფიციტი, კვირაში 3 ძალისმიერი ვარჯიში + ყოველდღიური 45 წთ სიარული. რეალისტური ტემპია ~0.5 კგ/კვირაში.",
        "You're at " + weight + " kg, target ≈ " + tgtW + " kg" + (bmi ? " (BMI " + bmi + ")" : "") + ". Waist " + waist + "→" + tgtWaist + " cm. Plan: a 400–600 kcal deficit, 3 strength sessions/week + a daily 45-min walk. A realistic pace is ~0.5 kg/week.");

    // cholesterol / heart
    if (any(/(ქოლესტ|ლიპიდ|გულ|წნევ|cardio)/, /(cholesterol|lipid|heart|ldl|hdl|blood pressure|cardio)/))
      return pick(
        "გულ-სისხლძარღვებისთვის: ომეგა-3, ზეითუნის ზეთი და ბოჭკო (25–30გ/დღე), მარილისა და დამუშავებული საკვების შემცირება. LDL და hs-CRP გადაამოწმე. სტატინებზე გადაწყვეტილებას მხოლოდ ექიმი იღებს — მე ცხოვრების წესში დაგეხმარები.",
        "For cardiovascular health: omega-3, olive oil and fibre (25–30g/day), and less salt and processed food. Recheck LDL and hs-CRP. Statin decisions are your doctor's call — I'll help with the lifestyle side.");

    // energy / sleep / stress / mental
    if (any(/(ენერგ|ძილ|დაღლ|სტრეს|გადაწვ|შფოთ|განწყ|დეპრეს)/, /(energy|sleep|tired|stress|burnout|anxious|mood|mental|depress)/))
      return pick(
        "ენერგიასა და განწყობას ყველაზე მეტად ძილი არეგულირებს: მიზანი 7–8 სთ, კოფეინი 14:00-მდე, 1 სთ ეკრანის გარეშე ძილის წინ. დაამატე 10 წთ სუნთქვა/mindfulness დილით. თუ შფოთვა/დაქვეითება გრძელდება — PHQ-9/GAD-7 და ფსიქოლოგის კონსულტაცია გეგმაშია.",
        "Sleep drives most of your energy and mood: aim for 7–8h, caffeine before 2pm, and 1 screen-free hour before bed. Add a 10-min morning breathing/mindfulness habit. If low mood or anxiety persists, PHQ-9/GAD-7 and a psychologist consult are in your plan.");

    // skin
    if (any(/(კან|დამატენ|spf|აკნე)/, /(skin|moistur|spf|acne|hydrat)/))
      return pick(
        "კანისთვის: დილით ჰიალურონის/ცერამიდების დამატენიანებელი + SPF 30+ (თბილისშიც აუცილებელია), საღამოს რბილი დასუფთავება + მკვებავი კრემი. შიგნიდან: 2–2.5ლ წყალი და ომეგა-3. მშრალი კანი ხშირად დაბალ ფერიტინს/B12-საც უკავშირდება — ღირს შემოწმება.",
        "For skin: morning hyaluronic/ceramide moisturizer + SPF 30+ (yes, even in Tbilisi), evening gentle cleanse + a rich cream. From within: 2–2.5L water and omega-3. Dry skin often tracks with low ferritin/B12 — worth checking.");

    // hair
    if (any(/(თმა|ცვენ)/, /(hair|thinning|bald|scalp)/))
      return pick(
        "თმისთვის (ადრეული პრევენცია): ცილით მდიდარი კვება, სტრესის შემცირება და ძილი, რეცხვა კვირაში 2–3-ჯერ ცხელი წყლის გარეშე, კვირაში ერთხელ სკალპის მასაჟი. ფერიტინი, ტესტოსტერონი და TSH გადაამოწმე — ეს სამი ხშირად დგას ცვენის უკან.",
        "For hair (early-prevention mode): protein-rich diet, less stress and better sleep, wash 2–3×/week avoiding hot water, and a weekly scalp massage. Check ferritin, testosterone and TSH — those three are common drivers of thinning.");

    // oral / dental
    if (any(/(კბილ|ღრძ|პირის ღრუ|სტომატ)/, /(oral|dental|teeth|gum|floss|caries)/))
      return pick(
        "პირის ღრუსთვის: ყოველდღიური ფლოსი, ალკოჰოლის გარეშე საწმენდი, წმენდა ექიმთან ყოველ 6 თვეში. ღრძილების სისხლდენა (BOP) მეტაბოლურ ჯანმრთელობასაც უკავშირდება — ამიტომ ეს შენი ჰოლისტიკური გეგმის ნაწილია.",
        "For oral health: daily flossing, an alcohol-free mouthwash, and a cleaning every 6 months. Bleeding gums (BOP) link to metabolic health too — that's why it's part of your holistic plan.");

    // food / diet / nutrition
    if (any(/(კვებ|დიეტ|საჭმ|მენიუ|კალორ|ცილ|ნახშირწყ)/, /(food|diet|eat|meal|menu|calorie|protein|carb|nutrition)/))
      return pick(
        "სამიზნე ~1,900–2,100 კკალ/დღეში. სტრუქტურა: ცილა (თევზი, ქათამი, კვერცხი), დაბალი GI ნახშირწყლები (შვრია, წიწიბურა, ბოსტნეული), ჯანსაღი ცხიმი (ზეითუნის ზეთი, კაკალი), ბოჭკო 25–30გ. მოერიდე: თეთრ პურს, შაქარს, დამუშავებულ საკვებს. სრული გრაფიკი „გეგმა“-შია.",
        "Target ~1,900–2,100 kcal/day. Structure: protein (fish, chicken, eggs), low-GI carbs (oats, buckwheat, veg), healthy fats (olive oil, nuts), 25–30g fibre. Avoid: white bread, sugar, processed food. The full schedule is in the Plan tab.");

    // exercise
    if (any(/(ვარჯ|ფიტნეს|სპორტ|ნაბიჯ|სიარ)/, /(exercise|workout|train|fitness|gym|steps|walk|run)/))
      return pick(
        "კვირაში 3-ჯერ ძალისმიერი (მთელი სხეული — აზიდვები, ჩაჯდომები, კორი) + ყოველდღიური 45 წთ სიარული (8–10 ათასი ნაბიჯი). იჯექი ნაკლები — ადექი ყოველ 60 წუთში. ეს პირდაპირ აუმჯობესებს შაქარსაც და ენერგიასაც.",
        "3×/week strength (full body — push-ups, squats, core) + a daily 45-min walk (8–10k steps). Sit less — stand up every 60 minutes. This directly improves both your blood sugar and energy.");

    // alcohol / smoking / water
    if (any(/(ალკოჰ|სმ(ა|ის)|ღვინ|ლუდ)/, /(alcohol|drink|wine|beer)/))
      return pick("სამუშაო დღეებში ალკოჰოლის გარეშე, შაბათ-კვირას მაქს. 1–2 სასმელი. ალკოჰოლი პირდაპირ ეხება ღვიძლს, ძილს და შაქარს.", "Keep weekdays alcohol-free and cap weekends at 1–2 drinks. Alcohol directly affects your liver, sleep and blood sugar.");
    if (any(/(მოწევ|სიგარ|თამბაქ)/, /(smok|cigarette|tobacco|vape)/))
      return pick("მოწევა ყველაზე დიდი ცალკეული რისკია გულისთვის — თუ წევ, თავის დანებება ერთ ნაბიჯად ყველაზე მეტს ცვლის. დაგეხმარები გეგმით.", "Smoking is the single biggest cardiovascular risk — quitting is the one change that moves the needle most. I can help with a plan.");
    if (any(/(წყალ|დალ(ი|ე)|ჰიდრატ)/, /(water|hydrat|drink water)/))
      return pick("მიზანი 2–2.5ლ წყალი დღეში. დაიწყე დილით 1 ჭიქით — ეს ენერგიასაც, კანსაც და მადასაც არეგულირებს.", "Aim for 2–2.5L of water a day. Start with 1 glass each morning — it helps energy, skin and appetite alike.");

    // checkup / screening
    if (any(/(ჩექაფ|შემოწმ|სკრინ|ანალიზ|ექიმ|test)/, /(checkup|check-up|screen|test|lab|doctor|appointment)/))
      return pick(
        "შენი ჩექაფ-გეგმა პრიორიტეტებითაა დალაგებული — პირველი რიგში შაქარი (HbA1c) და ლიპიდები. „გეგმა/შემოწმება“-ში თითოეული კალენდარში დაამატე, ხოლო შედეგები „+“ ღილაკით ატვირთე — მე ავხსნი და პროფილს განვაახლებ.",
        "Your checkup plan is ordered by priority — blood sugar (HbA1c) and lipids first. Add each to your calendar from the Checkup screen, then upload results via the “+” button — I'll interpret them and update your profile.");

    // medications
    if (any(/(მედიკ|წამ(ა|ლ)|აბ(ი|ის)|დოზ)/, /(medication|medicine|drug|pill|dose|supplement|metformin|statin|omega)/))
      return pick(
        "შენს კალენდარშია: დილით ომეგა-3 + ვიტამინი D3 (საუზმესთან), საღამოს — ექიმის დანიშნულებით — მეტფორმინი/ატორვასტატინი (ვახშამთან). დოზებსა და დანიშვნას მხოლოდ შენი ექიმი წყვეტს; მე მიღების რეჟიმს გაკონტროლებ.",
        "Your calendar has: omega-3 + vitamin D3 in the morning (with breakfast), and — if your doctor prescribes — metformin/atorvastatin in the evening (with dinner). Doses and prescriptions are your doctor's decision; I'll keep the schedule on track.");

    // fallback — acknowledge + steer, with light variation
    return vary([
      pick("კარგი კითხვაა. შენი ჰოლისტიკური გეგმა ოთხ მიმართულებას მოიცავს — ზოგადი, მენტალური, სხეული და გარეგნობა. რომელი გაინტერესებს? შემიძლია შაქარზე, წონაზე, ენერგიაზე ან კანზე კონკრეტული ნაბიჯები მოგცე.",
           "Good question. Your holistic plan spans four tracks — general, mental, body and appearance. Which one interests you? I can give concrete steps on blood sugar, weight, energy or skin."),
      pick("ამაზე ცოტა მეტი კონტექსტი მჭირდება. სცადე მკითხო მაგ.: „როგორ დავწიო შაქარი“, „წონაში ჩამოსვლა“, „ენერგია მაკლია“, ან „კანის მოვლა“.",
           "I need a bit more context for that. Try asking me e.g. “lower my blood sugar”, “help me lose weight”, “I have low energy”, or “skincare tips”."),
    ]);
  };
})(window.VITA);
