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

  /* ---------- Clinic directory (categories mirror vitaapp.ge) ----------
     Demo dataset of Tbilisi providers; structured so the real vitaapp.ge data
     can replace `clinicData` later. vitaUrl deep-links the live site. */
  var clinicData = {
    medical: { vitaUrl: "https://vitaapp.ge/clinics/samedicinodawesebulebebi", items: [
      { name: "NeoLab", district: { ka: "ვაკე", en: "Vake" }, address: "ი. ჭავჭავაძის გამზ. 37", phone: "+995322001234", priceFrom: 35, rating: 4.7, distance: 1.8 },
      { name: "Aversi Clinic", district: { ka: "საბურთალო", en: "Saburtalo" }, address: "ვაჟა-ფშაველას გამზ. 27", phone: "+995322002345", priceFrom: 40, rating: 4.5, distance: 2.6 },
      { name: "Evex (Caraps)", district: { ka: "დიდუბე", en: "Didube" }, address: "ცინცაძის ქ. 7", phone: "+995322003456", priceFrom: 30, rating: 4.4, distance: 3.9 },
      { name: "GPC კლინიკა", district: { ka: "ვაკე", en: "Vake" }, address: "ყიფშიძის ქ. 5", phone: "+995322004567", priceFrom: 45, rating: 4.6, distance: 2.1 },
    ]},
    dental: { vitaUrl: "https://vitaapp.ge/clinics/stomatologia", items: [
      { name: "Dental Art", district: { ka: "ვაკე", en: "Vake" }, address: "აბაშიძის ქ. 24", phone: "+995322010001", priceFrom: 50, rating: 4.8, distance: 1.5 },
      { name: "Renome", district: { ka: "საბურთალო", en: "Saburtalo" }, address: "ნუცუბიძის ქ. 12", phone: "+995322010002", priceFrom: 40, rating: 4.6, distance: 3.2 },
      { name: "Astra Dental", district: { ka: "მთაწმინდა", en: "Mtatsminda" }, address: "ლ. ასათიანის ქ. 9", phone: "+995322010003", priceFrom: 55, rating: 4.7, distance: 2.8 },
    ]},
    aesthetic: { vitaUrl: "https://vitaapp.ge/clinics/silamazedaestetika", items: [
      { name: "Skin Clinic", district: { ka: "ვაკე", en: "Vake" }, address: "ი. ჭავჭავაძის გამზ. 50", phone: "+995322020001", priceFrom: 60, rating: 4.6, distance: 1.9 },
      { name: "DermaLine", district: { ka: "საბურთალო", en: "Saburtalo" }, address: "ფალიაშვილის ქ. 18", phone: "+995322020002", priceFrom: 45, rating: 4.4, distance: 2.7 },
    ]},
    mental: { vitaUrl: "https://vitaapp.ge/clinics/mentalurijanmrteloba", items: [
      { name: "Mindful Center", district: { ka: "ვაკე", en: "Vake" }, address: "კოსტავას ქ. 70", phone: "+995322030001", priceFrom: 70, rating: 4.9, distance: 2.0 },
      { name: "სტიმული", district: { ka: "ვერა", en: "Vera" }, address: "მელიქიშვილის ქ. 11", phone: "+995322030002", priceFrom: 55, rating: 4.7, distance: 1.6 },
    ]},
    pharmacy: { vitaUrl: "https://vitaapp.ge/clinics/aptiakebi", items: [
      { name: "Aversi (აფთიაქი)", district: { ka: "ვაკე", en: "Vake" }, address: "ჭავჭავაძის გამზ. 19", phone: "+995322040001", priceFrom: 0, rating: 4.5, distance: 0.8 },
      { name: "PSP", district: { ka: "საბურთალო", en: "Saburtalo" }, address: "ვაჟა-ფშაველას 16", phone: "+995322040002", priceFrom: 0, rating: 4.4, distance: 1.2 },
      { name: "GPC აფთიაქი", district: { ka: "ვერა", en: "Vera" }, address: "მელიქიშვილის 24", phone: "+995322040003", priceFrom: 0, rating: 4.3, distance: 1.0 },
    ]},
  };
  V.checkupCategory = function (id) {
    return { glucose: "medical", energy: "medical", lipid: "medical", general: "medical",
      prostate: "medical", mental: "mental", derm: "aesthetic", dental: "dental" }[id] || "medical";
  };

  /* ---------- vitaapp.ge service directory + account ----------
     Surfaced on the VITA account screen — deep-links into the live
     vitaapp.ge service categories (real site, SPA). */
  V.VITAAPP_URL = "https://vitaapp.ge";
  V.vitaServices = [
    { id: "medical",   icon: "shield",   tone: "green", name: { ka: "კლინიკები", en: "Clinics" },        url: clinicData.medical.vitaUrl },
    { id: "pharmacy",  icon: "pill",     tone: "blue",  name: { ka: "აფთიაქები", en: "Pharmacies" },      url: clinicData.pharmacy.vitaUrl },
    { id: "dental",    icon: "sparkle",  tone: "pink",  name: { ka: "სტომატოლოგია", en: "Dental" },        url: clinicData.dental.vitaUrl },
    { id: "aesthetic", icon: "heart",    tone: "pink",  name: { ka: "სილამაზე & ესთეტიკა", en: "Beauty & aesthetics" }, url: clinicData.aesthetic.vitaUrl },
    { id: "mental",    icon: "chat",     tone: "blue",  name: { ka: "მენტალური ჯანმრთელობა", en: "Mental health" }, url: clinicData.mental.vitaUrl },
  ];
  V.vitaRegisterUrl = function () { return V.VITAAPP_URL + "/register"; };
  // link the local app to a vitaapp.ge account (prototype: email only, no password)
  V.linkVitaAccount = function (email, plan) {
    V.state.vitaAccount = { connected: true, email: email || "", plan: plan || "basic" };
    V.save();
  };
  V.unlinkVitaAccount = function () {
    V.state.vitaAccount = { connected: false, email: "", plan: "" };
    V.save();
  };

  /* ---- VITA+ subscription (demo; real payment is a future seam) ---- */
  V.isPlus = function () { return !!(V.state.plus && V.state.plus.active); };
  V.activatePlus = function (plan) {
    V.state.plus = { active: true, plan: plan || "monthly", since: V.todayISO() };
    V.save();
  };
  V.cancelPlus = function () {
    V.state.plus = { active: false, plan: null, since: null };
    V.save();
  };

  /* ---- Wearable / health-data integration (demo import; real sync = native HealthKit / Google Fit OAuth seam) ---- */
  V.WEARABLES = [
    { id: "apple", name: { ka: "Apple Health", en: "Apple Health" } },
    { id: "googlefit", name: { ka: "Google Fit", en: "Google Fit" } },
    { id: "garmin", name: { ka: "Garmin", en: "Garmin" } },
    { id: "fitbit", name: { ka: "Fitbit", en: "Fitbit" } },
  ];
  /* ---- Telemedicine doctors (demo directory; real availability = clinics/booking seam) ---- */
  V.DOCTORS = [
    { id: "d2", name: { ka: "დრ. გიორგი კაპანაძე", en: "Dr. Giorgi Kapanadze" }, spec: { ka: "თერაპევტი", en: "GP / Internist" }, rating: 4.8, price: 30, online: true, tone: "green" },
    { id: "d1", name: { ka: "დრ. ნინო ბერიძე", en: "Dr. Nino Beridze" }, spec: { ka: "კარდიოლოგი", en: "Cardiologist" }, rating: 4.9, price: 40, online: true, tone: "crimson" },
    { id: "d4", name: { ka: "დრ. ლევან ჩხეიძე", en: "Dr. Levan Chkheidze" }, spec: { ka: "ფსიქოთერაპევტი", en: "Psychotherapist" }, rating: 5.0, price: 50, online: true, tone: "blue" },
    { id: "d3", name: { ka: "დრ. თამარ ლომიძე", en: "Dr. Tamar Lomidze" }, spec: { ka: "დერმატოლოგი", en: "Dermatologist" }, rating: 4.9, price: 45, online: false, next: "18:30", tone: "pink" },
  ];
  V.doctorById = function (id) { return V.DOCTORS.filter(function (d) { return d.id === id; })[0] || null; };

  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function rnd1(a, b) { return Math.round((a + Math.random() * (b - a)) * 10) / 10; }
  // rich demo snapshot for one source (real sync needs native HealthKit / Google Fit OAuth)
  function genWearable() {
    var steps = rnd(5200, 12500), deep = rnd1(0.8, 1.8), rem = rnd1(1.2, 2.2), light = rnd1(3.2, 4.6);
    var sleepH = Math.round((deep + rem + light) * 10) / 10;
    var exerciseMin = rnd(12, 62), moveGoal = 500, kcalActive = rnd(280, 760);
    var series = { steps: [], sleepH: [], restHR: [] };
    for (var i = 0; i < 7; i++) { series.steps.push(rnd(4200, 13000)); series.sleepH.push(rnd1(5.2, 8.4)); series.restHR.push(rnd(54, 70)); }
    series.steps[6] = steps; series.sleepH[6] = sleepH;
    return {
      steps: steps, distanceKm: Math.round(steps * 0.00072 * 10) / 10, floors: rnd(3, 22),
      exerciseMin: exerciseMin, standHr: rnd(8, 13), workouts: rnd(0, 3),
      kcalActive: kcalActive, moveGoal: moveGoal, movePct: Math.min(140, Math.round(kcalActive / moveGoal * 100)),
      exerciseGoal: 30, standGoal: 12,
      restHR: rnd(52, 68), hrAvg: rnd(68, 86), hrv: rnd(28, 78), spo2: rnd(95, 99),
      sleepH: sleepH, sleepDeep: deep, sleepRem: rem, sleepLight: light,
      series: series,
    };
  }
  V.connectWearable = function (source) {
    var wb = V.state.wearable = V.state.wearable || { sources: [] };
    wb.sources = wb.sources || [];
    if (wb.sources.some(function (s) { return s.id === source; })) return;
    wb.sources.push({ id: source, since: V.todayISO(), snap: genWearable() });
    // feed resting-HR + sleep logs once/day so readiness / bio-age use them
    var c = V.wearableCombined(), w = (V.state.wellness = V.state.wellness || {}), d = V.todayISO();
    w.hr = w.hr || []; if (!w.hr.some(function (r) { return r.date === d; })) w.hr.push({ date: d, bpm: c.restHR });
    w.sleep = w.sleep || []; if (!w.sleep.some(function (r) { return r.date === d; })) w.sleep.push({ date: d, hours: c.sleepH, quality: c.sleepH >= 7 ? 4 : 3 });
    V.save();
  };
  V.disconnectWearable = function (source) {
    var wb = V.state.wearable || { sources: [] };
    if (source) wb.sources = (wb.sources || []).filter(function (s) { return s.id !== source; });
    else wb.sources = [];
    V.state.wearable = wb;
    V.save();
  };
  V.wearableSources = function () { return (V.state.wearable && V.state.wearable.sources) || []; };
  V.wearableConnected = function () { return V.wearableSources().length > 0; };
  // merge all connected sources into one combined snapshot (avg, so multi-device doesn't double-count)
  V.wearableCombined = function () {
    var src = V.wearableSources(); if (!src.length) return null;
    var keys = ["steps", "distanceKm", "floors", "exerciseMin", "standHr", "workouts", "kcalActive", "movePct", "restHR", "hrAvg", "hrv", "spo2", "sleepH", "sleepDeep", "sleepRem", "sleepLight"];
    var out = { moveGoal: 500, exerciseGoal: 30, standGoal: 12 };
    keys.forEach(function (k) {
      var sum = 0; src.forEach(function (s) { sum += s.snap[k] || 0; });
      var v = sum / src.length;
      out[k] = (k === "distanceKm" || k.indexOf("sleep") === 0) ? Math.round(v * 10) / 10 : Math.round(v);
    });
    var series = { steps: [], sleepH: [], restHR: [] };
    for (var i = 0; i < 7; i++) {
      ["steps", "sleepH", "restHR"].forEach(function (k) {
        var sum = 0; src.forEach(function (s) { sum += (s.snap.series[k] || [])[i] || 0; });
        series[k].push(k === "sleepH" ? Math.round(sum / src.length * 10) / 10 : Math.round(sum / src.length));
      });
    }
    out.series = series; out.count = src.length; out.ids = src.map(function (s) { return s.id; });
    return out;
  };
  V.clinicsFor = function (category, sort) {
    var grp = clinicData[category] || clinicData.medical;
    var items = grp.items.map(function (c, i) { return Object.assign({ id: category + i }, c); });
    items.sort(function (a, b) {
      if (sort === "price") return a.priceFrom - b.priceFrom;
      if (sort === "distance") return a.distance - b.distance;
      return b.rating - a.rating;
    });
    return { vitaUrl: grp.vitaUrl, items: items };
  };

  /* ---------- Bookings / visits ---------- */
  V.book = function (checkupId, clinic, date, time, title) {
    V.state.bookings = V.state.bookings || [];
    var id = "bk" + Date.now();
    V.state.bookings.push({ id: id, checkupId: checkupId, clinic: clinic.name, phone: clinic.phone,
      date: date, time: time, status: "planned", title: title });
    V.save();
    return id;
  };
  V.confirmVisit = function (id) {
    var b = (V.state.bookings || []).filter(function (x) { return x.id === id; })[0];
    if (b && b.status !== "attended") { b.status = "attended"; V.save(); if (V.awardOnce) V.awardOnce("visit:" + id, V.POINTS.booking, "booking"); }
  };
  V.cancelVisit = function (id) {
    V.state.bookings = (V.state.bookings || []).filter(function (x) { return x.id !== id; });
    V.save();
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
  /* ---------- Home widgets (customizable cards) ---------- */
  // each widget renders via V[card]() and wires via V[wire](); kicker = optional label above
  V.HOME_WIDGETS = [
    { id: "scan", key: "hwScan", card: "scanHomeCard", wire: "wireScanHome", kicker: "scnTitle" },
    { id: "today", key: "hwToday", card: "todayMini", wire: "wireTodayMini", kicker: "todayK" },
    { id: "meds", key: "hwMeds", card: "medsHomeCard", wire: "wireMedsHome" },
    { id: "water", key: "hwWater", card: "waterHomeCard", wire: "wireWaterHome" },
    { id: "steps", key: "hwSteps", card: "stepsHomeCard", wire: "wireStepsHome" },
    { id: "food", key: "hwFood", card: "foodHomeCard", wire: "wireFoodHome" },
    { id: "mood", key: "hwMood", card: "moodHomeCard", wire: "wireMoodHome" },
    { id: "readiness", key: "hwReadiness", card: "readinessHomeCard", wire: "wireReadinessHome" },
    { id: "bio", key: "hwBio", card: "bioAgeHomeCard", wire: "wireBioHome" },
    { id: "garden", key: "hwGarden", card: "gardenHomeCard", wire: "wireGardenHome" },
  ];
  V.homeWidget = function (id) { return V.HOME_WIDGETS.filter(function (w) { return w.id === id; })[0]; };
  V.homeCardsDefault = function () { return { order: ["scan", "today", "meds", "water", "steps", "food", "mood", "readiness", "bio", "garden"], hidden: { bio: true, garden: true } }; };
  // merge saved prefs with the registry so newly-added widgets always appear
  V.homeCardsPrefs = function () {
    var d = V.homeCardsDefault(), p = V.state.homeCards || {};
    var order = (p.order || d.order).slice().filter(function (id) { return V.homeWidget(id); });
    V.HOME_WIDGETS.forEach(function (w) { if (order.indexOf(w.id) < 0) order.push(w.id); });
    return { order: order, hidden: p.hidden || d.hidden };
  };
  V.setHomeCards = function (prefs) { V.state.homeCards = prefs; V.save(); };

  /* ---------- Plan insights (streak / focus / daily tip) ---------- */
  // consecutive days (up to today) with at least one task done
  V.taskStreak = function () {
    function diso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
    var n = 0, base = new Date(V.todayISO());
    for (var i = 0; i < 180; i++) {
      var d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i);
      var has = (((V.state.doneTasks || {})[diso(d)]) || []).length > 0;
      if (i === 0 && !has) continue;     // today not started yet — don't break the streak
      if (has) n++; else break;
    }
    return n;
  };
  // today's focus theme (rotates by weekday)
  V.DAY_FOCUS = [
    { icon: "moon", key: "df0", label: { ka: "დასვენება & აღდგენა", en: "Rest & recovery" } },
    { icon: "walk", key: "df1", label: { ka: "მოძრაობა", en: "Movement" } },
    { icon: "drop", key: "df2", label: { ka: "ჰიდრატაცია", en: "Hydration" } },
    { icon: "food", key: "df3", label: { ka: "კვება", en: "Nutrition" } },
    { icon: "moon", key: "df4", label: { ka: "ძილი", en: "Sleep" } },
    { icon: "brain", key: "df5", label: { ka: "მენტალური სიმშვიდე", en: "Mental calm" } },
    { icon: "bolt", key: "df6", label: { ka: "აქტიურობა", en: "Be active" } },
  ];
  V.dayFocus = function () { return V.DAY_FOCUS[new Date(V.todayISO()).getDay()]; };
  // rotating daily tip (deterministic by date)
  V.DAILY_TIPS = [
    { ka: "დილით 1 ჭიქა წყალი მეტაბოლიზმს აღვიძებს.", en: "A glass of water on waking kick-starts your metabolism." },
    { ka: "10-წუთიანი გასეირნება ჭამის შემდეგ შაქარს აქვეითებს.", en: "A 10-minute walk after meals lowers blood sugar." },
    { ka: "7–8 სთ ძილი ჰორმონებსა და მადას არეგულირებს.", en: "7–8h of sleep regulates hormones and appetite." },
    { ka: "ცილა ყოველ კვებაზე — სიმაძღრე და კუნთი.", en: "Protein at each meal — fullness and muscle." },
    { ka: "2 წუთი ღრმა სუნთქვა სტრესს ამცირებს.", en: "Two minutes of deep breathing lowers stress." },
    { ka: "ეკრანი ძილის წინ 1 საათით ადრე გამორთე.", en: "Switch screens off an hour before bed." },
    { ka: "ფერადი ბოსტნეული = მეტი ანტიოქსიდანტი.", en: "Colourful vegetables = more antioxidants." },
    { ka: "დილის მზე ენერგიასა და D ვიტამინს მატებს.", en: "Morning sunlight boosts energy and vitamin D." },
    { ka: "ნაკლები შაქარი — სტაბილური ენერგია დღეში.", en: "Less sugar — steadier energy through the day." },
    { ka: "ყოველ საათში 2–3 წუთით წამოდექი.", en: "Stand up for 2–3 minutes every hour." },
  ];
  V.dailyTip = function () {
    var d = new Date(V.todayISO());
    var idx = (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % V.DAILY_TIPS.length;
    return V.DAILY_TIPS[idx];
  };

  // today's plan completion 0-100 (done tasks / total) — real progress for the home
  V.dayProgress = function () {
    var tasks = V.dailyTasks();
    var done = (V.state.doneTasks && V.state.doneTasks[V.todayISO()]) || [];
    return tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  };
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

  /* ---------- User medication tracker ---------- */
  V.MED_SLOTS = ["morning", "noon", "evening", "bed"];
  V.userMeds = function () { return V.state.userMeds || (V.state.userMeds = []); };
  V.addMed = function (m) {
    var meds = V.userMeds();
    meds.push({
      id: "um" + Date.now(), name: (m.name || "").trim(), dose: (m.dose || "").trim(),
      when: (m.when && m.when.length ? m.when : ["morning"]), food: m.food || "any", note: (m.note || "").trim(),
    });
    V.save();
  };
  V.removeMed = function (id) { V.state.userMeds = V.userMeds().filter(function (x) { return x.id !== id; }); V.save(); };
  V.medTakenToday = function (id, slot) {
    var d = (V.state.medLog || {})[V.todayISO()] || {};
    return !!d[id + "|" + slot];
  };
  V.toggleMedTaken = function (id, slot) {
    V.state.medLog = V.state.medLog || {};
    var day = V.state.medLog[V.todayISO()] = V.state.medLog[V.todayISO()] || {};
    var k = id + "|" + slot;
    if (day[k]) delete day[k];
    else { day[k] = true; if (V.awardOnce) V.awardOnce("med:" + k, V.POINTS.med, "med"); }
    V.save();
  };
  // today's outstanding med doses (not yet taken) — for reminders + the "to take" list
  V.medsDueToday = function () {
    var out = [];
    V.userMeds().forEach(function (m) {
      m.when.forEach(function (slot) {
        if (!V.medTakenToday(m.id, slot)) out.push({ med: m, slot: slot });
      });
    });
    return out;
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

  // body-map coordinates per region (% of the body SVG box; calibrated to viewBox "0 8 200 268")
  V.regionXY = {
    head: { x: 50, y: 11.8 }, mouth: { x: 50, y: 19.9 }, neck: { x: 50, y: 25.2 },
    chest: { x: 50, y: 38.7 }, heart: { x: 43, y: 41.3 }, lungs: { x: 58, y: 37.3 },
    liver: { x: 60, y: 57.5 }, abdomen: { x: 50, y: 60.1 }, colon: { x: 44, y: 68.2 },
    pelvis: { x: 50, y: 78.9 }, bone: { x: 38, y: 83 }, skin: { x: 76, y: 58.8 },
  };

  V.screeningCatalog = function () {
    // cat: cardio | metabolic | cancer | general | mental ; book = clinics checkupId ; why = one-line purpose
    return [
      { id: "bp", region: "heart", cat: "cardio", sex: "any", min: 18, max: 120, freq: "a", book: "lipid",
        name: { ka: "არტერიული წნევა", en: "Blood pressure" }, basis: { ka: "USPSTF — ყველა ზრდასრული", en: "USPSTF — all adults" },
        why: { ka: "მაღალი წნევა ხშირად უსიმპტომოა — ადრე გამოვლენა გულსა და თირკმელს იცავს.", en: "High BP is usually silent — catching it early protects your heart and kidneys." } },
      { id: "diabetes", region: "abdomen", cat: "metabolic", sex: "any", min: 35, max: 70, freq: "b", riskFreq: "q", book: "glucose",
        name: { ka: "შაქარი + HbA1c", en: "Blood sugar + HbA1c" }, basis: { ka: "USPSTF/ADA — 35–70, ჭარბწონა", en: "USPSTF/ADA — 35–70, overweight" }, riskAnyAge: true,
        why: { ka: "პრედიაბეტი ხშირად შექცევადია ცხოვრების წესით — თუ დროზე გამოვლინდა.", en: "Pre-diabetes is often reversible with lifestyle — if caught in time." } },
      { id: "lipids", region: "heart", cat: "cardio", sex: "any", min: 40, max: 75, freq: "b", book: "lipid",
        name: { ka: "ლიპიდები (ქოლესტერინი)", en: "Lipid panel (cholesterol)" }, basis: { ka: "USPSTF — 40–75", en: "USPSTF — 40–75" }, riskAnyAge: true,
        why: { ka: "ქოლესტერინი განსაზღვრავს ინფარქტის რისკს და მკურნალობადია.", en: "Cholesterol drives heart-attack risk — and it's treatable." } },
      { id: "colorectal", region: "colon", cat: "cancer", sex: "any", min: 45, max: 75, freq: "a", book: "general",
        name: { ka: "კოლორექტალური სკრინინგი", en: "Colorectal cancer" }, basis: { ka: "USPSTF — 45–75 (FIT/კოლონოსკოპია)", en: "USPSTF — 45–75 (FIT/colonoscopy)" },
        why: { ka: "პოლიპის მოცილება კიბომდე — სკრინინგი სიკვდილიანობას ამცირებს.", en: "Removing polyps prevents cancer — screening cuts mortality." } },
      { id: "cervical", region: "pelvis", cat: "cancer", sex: "woman", min: 21, max: 65, freq: "3y", book: "general",
        name: { ka: "საშვილოსნოს ყელი (PAP/HPV)", en: "Cervical (Pap/HPV)" }, basis: { ka: "USPSTF — ქალი 21–65", en: "USPSTF — women 21–65" },
        why: { ka: "HPV/უჯრედული ცვლილებების ადრე გამოვლენით თითქმის სრულად პრევენცირდება.", en: "Detecting HPV/cell changes early makes it highly preventable." } },
      { id: "breast", region: "chest", cat: "cancer", sex: "woman", min: 40, max: 74, freq: "b", book: "general",
        name: { ka: "ძუძუ (მამოგრაფია)", en: "Breast (mammogram)" }, basis: { ka: "USPSTF — ქალი 40–74", en: "USPSTF — women 40–74" },
        why: { ka: "ადრეული ძუძუს კიბო პატარაა და გაცილებით უკეთ იკურნება.", en: "Early breast cancer is small and far more treatable." } },
      { id: "prostate", region: "pelvis", cat: "cancer", sex: "man", min: 50, max: 69, freq: "b", riskMin: 45, book: "prostate",
        name: { ka: "პროსტატა (PSA, განხილვა)", en: "Prostate (PSA, discuss)" }, basis: { ka: "USPSTF — კაცი 50–69 (განხილვა)", en: "USPSTF — men 50–69 (shared decision)" },
        why: { ka: "PSA-ს ექიმთან განხილვა — პროსტატის კიბოს ადრე გამოსავლენად.", en: "Discuss PSA with your doctor to catch prostate cancer early." } },
      { id: "lung", region: "lungs", cat: "cancer", sex: "any", min: 50, max: 80, freq: "a", needsSmoker: true, book: "general",
        name: { ka: "ფილტვის სკრინინგი (LDCT)", en: "Lung cancer (LDCT)" }, basis: { ka: "USPSTF — მწეველი 50–80", en: "USPSTF — smokers 50–80" },
        why: { ka: "მწეველებში დაბალ-დოზიანი CT ფილტვის კიბოს ადრე პოულობს.", en: "Low-dose CT finds lung cancer early in smokers." } },
      { id: "aaa", region: "abdomen", cat: "cardio", sex: "man", min: 65, max: 75, freq: "once", needsSmoker: true, book: "general",
        name: { ka: "აორტის ანევრიზმა (ექო)", en: "Aortic aneurysm (US)" }, basis: { ka: "USPSTF — კაცი 65–75, ყოფ. მწეველი", en: "USPSTF — men 65–75, ever smoked" },
        why: { ka: "აორტის ანევრიზმა უსიმპტომოა — ერთი ექო სიცოცხლეს არჩენს.", en: "An aortic aneurysm is silent — one ultrasound can be life-saving." } },
      { id: "osteo", region: "bone", cat: "general", sex: "woman", min: 65, max: 120, freq: "a", book: "general",
        name: { ka: "ოსტეოპოროზი (DEXA)", en: "Osteoporosis (DEXA)" }, basis: { ka: "USPSTF — ქალი 65+", en: "USPSTF — women 65+" },
        why: { ka: "ძვლის სიმკვრივის შემოწმება მოტეხილობამდე — DEXA პრევენციას იძლევა.", en: "Check bone density before a fracture — DEXA enables prevention." } },
      { id: "depression", region: "head", cat: "mental", sex: "any", min: 18, max: 120, freq: "a", book: "mental",
        name: { ka: "დეპრესია (PHQ-9)", en: "Depression (PHQ-9)" }, basis: { ka: "USPSTF — ყველა ზრდასრული", en: "USPSTF — all adults" },
        why: { ka: "დეპრესია ხშირად შეუმჩნეველია — მოკლე სკრინინგი ადრე ეხმარება.", en: "Depression often goes unnoticed — a short screen helps catch it early." } },
      { id: "hepc", region: "liver", cat: "general", sex: "any", min: 18, max: 79, freq: "once", book: "general",
        name: { ka: "ჰეპატიტი C", en: "Hepatitis C" }, basis: { ka: "USPSTF — 18–79, ერთხელ", en: "USPSTF — 18–79, once" },
        why: { ka: "ჰეპატიტი C წლების მანძილზე ჩუმად აზიანებს ღვიძლს — და ახლა იკურნება.", en: "Hepatitis C silently harms the liver for years — and is now curable." } },
      { id: "dental", region: "mouth", cat: "general", sex: "any", min: 18, max: 120, freq: "b", book: "dental",
        name: { ka: "სტომატოლოგი", en: "Dental" }, basis: { ka: "ADA — ყოველ 6–12 თვეში", en: "ADA — every 6–12 months" },
        why: { ka: "კარიესი და ღრძილების დაავადება მეტაბოლურ ჯანმრთელობასაც უკავშირდება.", en: "Cavities and gum disease also link to metabolic health." } },
      { id: "eye", region: "head", cat: "general", sex: "any", min: 40, max: 120, freq: "b", book: "general",
        name: { ka: "მხედველობა (ოფთალმოლოგი)", en: "Eye exam" }, basis: { ka: "AAO — 40+ პერიოდული", en: "AAO — 40+ periodic" },
        why: { ka: "მხედველობა და თვალის წნევა (გლაუკომა) — უსიმპტომო დაკარგვის პრევენცია.", en: "Vision and eye pressure (glaucoma) — prevent silent vision loss." } },
      { id: "thyroid", region: "neck", cat: "general", sex: "any", min: 35, max: 120, freq: "a", riskOnly: true, book: "energy",
        name: { ka: "ფარისებრი (TSH)", en: "Thyroid (TSH)" }, basis: { ka: "რისკ/სიმპტომ-დაფუძნებული", en: "Risk/symptom-based" },
        why: { ka: "ფარისებრის დისბალანსი ენერგიასა და წონაზე მოქმედებს.", en: "A thyroid imbalance affects your energy and weight." } },
      { id: "skin", region: "skin", cat: "cancer", sex: "any", min: 18, max: 120, freq: "a", riskOnly: true, book: "derm",
        name: { ka: "კანის შემოწმება", en: "Skin check" }, basis: { ka: "რისკ-დაფუძნებული", en: "Risk-based" },
        why: { ka: "ახალი ან ცვალებადი ხალები — მელანომის ადრე გამოვლენა.", en: "New or changing moles — early detection of melanoma." } },
    ];
  };

  // screening category metadata (icon + label) for grouping
  V.screenCats = {
    cardio:    { icon: "heart",  label: { ka: "გული და სისხლძარღვები", en: "Heart & vessels" } },
    metabolic: { icon: "drop",   label: { ka: "მეტაბოლიზმი", en: "Metabolic" } },
    cancer:    { icon: "shield", label: { ka: "ონკო-სკრინინგი", en: "Cancer screening" } },
    mental:    { icon: "brain",  label: { ka: "მენტალური ჯანმრთელობა", en: "Mental health" } },
    general:   { icon: "flask",  label: { ka: "ზოგადი შემოწმება", en: "General checks" } },
  };
  // map a screening to a clinics-booking checkupId
  V.screeningCheckup = function (idOrItem) {
    var id = typeof idOrItem === "string" ? idOrItem : (idOrItem && idOrItem.id);
    var s = V.screeningCatalog().filter(function (x) { return x.id === id; })[0];
    return (s && s.book) || "general";
  };
  // ---- yearly screening completion tracking ----
  // trim per-day/per-year maps so localStorage doesn't grow unbounded (call once at boot)
  V.pruneState = function () {
    var keepDays = 21, now = new Date(V.todayISO());
    function staleDateKey(key) {
      if (!/^\d{4}-\d\d-\d\d/.test(key)) return false; // keep non-date keys (e.g. "quit:start")
      var ms = now - new Date(key.slice(0, 10));
      return ms > keepDays * 86400000;
    }
    var s = V.state;
    if (s.awarded) Object.keys(s.awarded).forEach(function (k) { if (staleDateKey(k)) delete s.awarded[k]; });
    if (s.companion && s.companion.credited) Object.keys(s.companion.credited).forEach(function (k) { if (staleDateKey(k)) delete s.companion.credited[k]; });
    if (s.rewardLog && s.rewardLog.length > 100) s.rewardLog = s.rewardLog.slice(-100);
    if (s.screeningDone) { var y = new Date().getFullYear(); Object.keys(s.screeningDone).forEach(function (k) { if (+k < y - 1) delete s.screeningDone[k]; }); }
    V.save();
  };

  V.screeningYear = function () { return String(new Date().getFullYear()); };
  V.screeningDoneIds = function () {
    var y = V.screeningYear();
    V.state.screeningDone = V.state.screeningDone || {};
    return V.state.screeningDone[y] || (V.state.screeningDone[y] = []);
  };
  V.isScreeningDone = function (id) { return V.screeningDoneIds().indexOf(id) >= 0; };
  V.toggleScreeningDone = function (id) {
    var arr = V.screeningDoneIds(), i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.push(id);
    V.save();
  };
  // progress over the SELECTED screenings for the current year
  V.screeningProgress = function () {
    var sel = V.selectedScreenings(), doneIds = V.screeningDoneIds();
    var done = sel.filter(function (id) { return doneIds.indexOf(id) >= 0; }).length;
    var total = sel.length;
    return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
  };

  // lookup the catalog `why` for an item/id
  V.screeningWhy = function (idOrItem) {
    var id = typeof idOrItem === "string" ? idOrItem : (idOrItem && idOrItem.id);
    var s = V.screeningCatalog().filter(function (x) { return x.id === id; })[0];
    return s && s.why;
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

  /* ---------- Camera rep-tracking config ----------
     Each trackable move defines which body angle to watch and the
     thresholds (degrees) that mark the bottom ("down") and top ("up")
     of one repetition. joints are [a,b,c] landmark indices; the angle
     is measured at b. MediaPipe Pose landmark indices:
       11/12 shoulder, 13/14 elbow, 15/16 wrist,
       23/24 hip, 25/26 knee, 27/28 ankle  (L/R) */
  V.repMoves = [
    { id: "squat", name: { ka: "ჩაჯდომები", en: "Squats" }, target: 15,
      joints: { L: [23, 25, 27], R: [24, 26, 28] }, down: 95, up: 160, tip: { ka: "გვერდულად დადექი კამერასთან", en: "Stand sideways to the camera" } },
    { id: "pushup", name: { ka: "აზიდვები", en: "Push-ups" }, target: 12,
      joints: { L: [11, 13, 15], R: [12, 14, 16] }, down: 95, up: 155, tip: { ka: "გვერდულად, სხეული ჩანდეს მთლიანად", en: "Side-on, keep your whole body in frame" } },
    { id: "lunge", name: { ka: "ნახტომები (lunges)", en: "Lunges" }, target: 10,
      joints: { L: [23, 25, 27], R: [24, 26, 28] }, down: 100, up: 165, tip: { ka: "გვერდულად დადექი", en: "Stand sideways" } },
    { id: "bridge", name: { ka: "მენჯის აწევა", en: "Glute bridge" }, target: 15,
      joints: { L: [11, 23, 25], R: [12, 24, 26] }, down: 130, up: 170, tip: { ka: "დაწექი გვერდულად კამერასთან", en: "Lie sideways to the camera" } },
    { id: "curl", name: { ka: "ბაიცეფსის მოხრა", en: "Bicep curls" }, target: 12,
      joints: { L: [11, 13, 15], R: [12, 14, 16] }, down: 55, up: 150, tip: { ka: "გვერდულად, ხელი ჩანდეს", en: "Side-on, keep your arm visible" } },
  ];
  V.repMove = function (id) { return V.repMoves.filter(function (m) { return m.id === id; })[0] || null; };

  /* ---------- Gym exercise library (real movements, grouped by muscle) ---------- */
  V.EX_CATS = [
    { id: "chest", icon: "heart", label: { ka: "გულმკერდი", en: "Chest" } },
    { id: "back", icon: "shield", label: { ka: "ზურგი", en: "Back" } },
    { id: "legs", icon: "walk", label: { ka: "ფეხები", en: "Legs" } },
    { id: "shoulders", icon: "bolt", label: { ka: "მხრები", en: "Shoulders" } },
    { id: "arms", icon: "bolt", label: { ka: "მკლავები", en: "Arms" } },
    { id: "core", icon: "shield", label: { ka: "კორი", en: "Core" } },
  ];
  V.EXERCISE_LIB = [
    { id: "bench", cat: "chest", scheme: "4×8", name: { ka: "ბენჩ-პრესი", en: "Bench press" }, target: { ka: "გულმკერდი, ტრიცეფსი", en: "Chest, triceps" },
      steps: { ka: ["დაწექი სკამზე, შტანგა მხრების სიგანეზე", "ჩამოუშვი გულმკერდამდე, კონტროლით ასწიე"], en: ["Lie on the bench, grip shoulder-width", "Lower to the chest, press up under control"] } },
    { id: "pushup", cat: "chest", scheme: "3×12", rep: "pushup", name: { ka: "აზიდვები", en: "Push-ups" }, target: { ka: "გულმკერდი, კორი", en: "Chest, core" },
      steps: { ka: ["ხელები მხრების ქვეშ, სხეული სწორ ხაზზე", "ჩაიწიე, იდაყვები ~45°, ასწი"], en: ["Hands under shoulders, body in a line", "Lower with elbows ~45°, push up"] } },
    { id: "incline", cat: "chest", scheme: "3×10", name: { ka: "დახრილი დამბელ-პრესი", en: "Incline dumbbell press" }, target: { ka: "ზედა გულმკერდი", en: "Upper chest" },
      steps: { ka: ["სკამი 30–45°, დამბელები მხართან", "ასწი ზემოთ, ჩამოუშვი ნელა"], en: ["Bench at 30–45°, dumbbells at shoulders", "Press up, lower slowly"] } },
    { id: "latpull", cat: "back", scheme: "3×10", name: { ka: "ლატ-პულდაუნი", en: "Lat pulldown" }, target: { ka: "ბეჭები (ლატები)", en: "Lats" },
      steps: { ka: ["ფართო ხელით დაიჭირე, მკერდი წინ", "ჩამოწიე გულმკერდამდე, ჩაკუმშე ბეჭები"], en: ["Wide grip, chest up", "Pull to the chest, squeeze the lats"] } },
    { id: "row", cat: "back", scheme: "4×8", name: { ka: "ნიჩბისებრი წევა", en: "Bent-over row" }, target: { ka: "შუა ზურგი", en: "Mid-back" },
      steps: { ka: ["მუხლები ოდნავ მოხრილი, ზურგი სწორი", "მიწიე მუცელთან, ჩაკუმშე ბეჭები"], en: ["Knees soft, back flat", "Row to the belly, squeeze the shoulder blades"] } },
    { id: "deadlift", cat: "back", scheme: "3×5", name: { ka: "წოლითი წევა (Deadlift)", en: "Deadlift" }, target: { ka: "ზურგი, დუნდულები", en: "Back, glutes" },
      steps: { ka: ["შტანგა წვივთან, ზურგი სწორი", "ასწი თეძოს ბიძგით, ჩაკუმშე დუნდულები"], en: ["Bar over mid-foot, flat back", "Drive with the hips, lock out the glutes"] } },
    { id: "squat", cat: "legs", scheme: "4×10", rep: "squat", name: { ka: "ჩაჯდომები", en: "Squats" }, target: { ka: "ბარძაყი, დუნდულები", en: "Quads, glutes" },
      steps: { ka: ["ფეხები მხრების სიგანეზე", "ჩაჯექი თეძო მუხლის ქვემოთ, ასწი"], en: ["Feet shoulder-width", "Sit hips below knees, drive up"] } },
    { id: "lunge", cat: "legs", scheme: "3×10", rep: "lunge", name: { ka: "ნახტომები (Lunges)", en: "Lunges" }, target: { ka: "ბარძაყი, დუნდულები", en: "Quads, glutes" },
      steps: { ka: ["ნაბიჯი წინ, ორივე მუხლი 90°", "ასწი და გაიმეორე მეორე ფეხით"], en: ["Step forward, both knees to 90°", "Push up, alternate legs"] } },
    { id: "legpress", cat: "legs", scheme: "3×12", name: { ka: "ფეხის პრესი", en: "Leg press" }, target: { ka: "ბარძაყი", en: "Quads" },
      steps: { ka: ["ფეხები პლატფორმაზე მხრის სიგანეზე", "ჩაუშვი 90°-მდე, ასწი (მუხლი არ ჩაკეტო)"], en: ["Feet on the platform shoulder-width", "Lower to 90°, press (don't lock knees)"] } },
    { id: "ohp", cat: "shoulders", scheme: "4×8", name: { ka: "ზედა პრესი", en: "Overhead press" }, target: { ka: "მხრები", en: "Shoulders" },
      steps: { ka: ["შტანგა მხართან, კორი დაჭიმე", "ასწი თავზე ზემოთ, ჩამოუშვი"], en: ["Bar at shoulders, brace the core", "Press overhead, lower under control"] } },
    { id: "lateral", cat: "shoulders", scheme: "3×12", name: { ka: "გვერდითი აწევა", en: "Lateral raise" }, target: { ka: "გვერდითი დელტა", en: "Side delts" },
      steps: { ka: ["დამბელები გვერდით, იდაყვი ოდნავ მოხრილი", "ასწი მხრის სიმაღლემდე, ნელა ჩამოუშვი"], en: ["Dumbbells at sides, slight elbow bend", "Raise to shoulder height, lower slowly"] } },
    { id: "facepull", cat: "shoulders", scheme: "3×15", name: { ka: "Face pull", en: "Face pull" }, target: { ka: "უკანა დელტა", en: "Rear delts" },
      steps: { ka: ["თოკი სახის სიმაღლეზე, მიწიე შუბლისკენ", "ჩაკუმშე ბეჭები, ნელა დააბრუნე"], en: ["Rope at face height, pull to the forehead", "Squeeze the rear delts, return slowly"] } },
    { id: "curl", cat: "arms", scheme: "3×12", rep: "curl", name: { ka: "ბაიცეფსის მოხრა", en: "Bicep curl" }, target: { ka: "ბაიცეფსი", en: "Biceps" },
      steps: { ka: ["იდაყვები სხეულთან, მოხარე ზემოთ", "ჩაკუმშე, ნელა ჩამოუშვი"], en: ["Elbows at your sides, curl up", "Squeeze, lower slowly"] } },
    { id: "dip", cat: "arms", scheme: "3×10", name: { ka: "ტრიცეფსის დიპი", en: "Tricep dip" }, target: { ka: "ტრიცეფსი", en: "Triceps" },
      steps: { ka: ["ხელები სკამზე, ჩაიწიე იდაყვის მოხრით", "ასწი სხეული ბოლომდე"], en: ["Hands on a bench, lower by bending elbows", "Press back up fully"] } },
    { id: "hammer", cat: "arms", scheme: "3×12", name: { ka: "ჩაქუჩისებრი მოხრა", en: "Hammer curl" }, target: { ka: "ბაიცეფსი, წინამხარი", en: "Biceps, forearms" },
      steps: { ka: ["დამბელები ნეიტრალურად (ცერა ზემოთ)", "მოხარე და ჩაკუმშე"], en: ["Dumbbells neutral (thumbs up)", "Curl and squeeze"] } },
    { id: "plank", cat: "core", scheme: "3×40წმ", name: { ka: "პლანკი", en: "Plank" }, target: { ka: "კორი", en: "Core" },
      steps: { ka: ["იდაყვები მხრების ქვეშ, სხეული სწორ ხაზზე", "დაჭიმე მუცელი, არ ჩაუშვა მენჯი"], en: ["Elbows under shoulders, body in a line", "Brace the abs, don't drop the hips"] } },
    { id: "crunch", cat: "core", scheme: "3×15", name: { ka: "მუცლის აწევა", en: "Crunch" }, target: { ka: "მუცელი", en: "Abs" },
      steps: { ka: ["დაწექი, მუხლები მოხრილი", "ასწი მხრები, ჩაკუმშე მუცელი"], en: ["Lie down, knees bent", "Curl the shoulders up, squeeze the abs"] } },
    { id: "rtwist", cat: "core", scheme: "3×20", name: { ka: "რუსული ტრიალი", en: "Russian twist" }, target: { ka: "ირიბი მუცელი", en: "Obliques" },
      steps: { ka: ["იჯექი, ფეხები აწეული, ტანი უკან", "ატრიალე ტანი მარცხნივ-მარჯვნივ"], en: ["Sit with feet up, lean back", "Rotate the torso side to side"] } },
  ];
  V.exInPlan = function (id) { return (V.state.exPlan || []).indexOf(id) >= 0; };
  V.toggleExPlan = function (id) {
    V.state.exPlan = V.state.exPlan || [];
    var i = V.state.exPlan.indexOf(id);
    if (i >= 0) V.state.exPlan.splice(i, 1); else V.state.exPlan.push(id);
    V.save();
  };
  // best-effort map a workout exercise name → a trackable move
  V.repMoveForExercise = function (name) {
    var en = ((name && name.en) || "").toLowerCase();
    if (/push-?up/.test(en)) return V.repMove("pushup");
    if (/lunge/.test(en)) return V.repMove("lunge");
    if (/bridge/.test(en)) return V.repMove("bridge");
    if (/curl/.test(en)) return V.repMove("curl");
    if (/squat/.test(en)) return V.repMove("squat");
    return null;
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
    return { lastPeriod: dISO(addDays(V.todayISO(), -8)), cycleLen: 28, periodLen: 5, logs: {}, periodDays: {}, flow: {} };
  };
  V.cycle = function () {
    if (!V.state.cycle) { V.state.cycle = V.cycleDefault(); V.save(); }
    var c = V.state.cycle;
    c.periodDays = c.periodDays || {}; c.flow = c.flow || {}; c.logs = c.logs || {};
    return c;
  };
  // most recent period START = first day of the latest contiguous run of logged days
  V.cycleLastStart = function () {
    var c = V.cycle();
    var days = Object.keys(c.periodDays).filter(function (k) { return c.periodDays[k]; }).sort();
    if (!days.length) return c.lastPeriod;
    var start = days[days.length - 1];
    for (var i = days.length - 2; i >= 0; i--) {
      if (dISO(addDays(start, -1)) === days[i]) start = days[i]; else break;
    }
    return start;
  };
  V.cycleToggleDay = function (iso) {
    var c = V.cycle();
    if (c.periodDays[iso]) delete c.periodDays[iso]; else c.periodDays[iso] = 1;
    c.lastPeriod = V.cycleLastStart();   // keep predictions + calendar in sync
    V.save();
  };
  // classify a date for the calendar: logged period > predicted period/fertile/ovulation
  V.cycleDayType = function (iso) {
    var c = V.cycle();
    if (c.periodDays[iso]) return "period";
    var len = c.cycleLen || 28, plen = c.periodLen || 5, ovDay = len - 14;
    var elapsed = Math.floor((new Date(iso) - new Date(V.cycleLastStart())) / 86400000);
    var dayInCycle = ((elapsed % len) + len) % len + 1;   // 1..len, wraps both directions
    if (dayInCycle <= plen) return "predPeriod";
    if (dayInCycle === ovDay) return "ovulation";
    if (dayInCycle >= ovDay - 3 && dayInCycle <= ovDay + 1) return "fertile";
    return null;
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

  /* ---------- Sex- & age-tailored health ---------- */
  // returns the topics relevant to the user's sex + age (self-exams + screenings)
  V.sexHealthTopics = function () {
    var p = V.state.profile || {}, sex = p.sex || "man", age = p.age || 30;
    var ALL = [
      // women
      { id: "breast", sex: "woman", icon: "heart", tone: "pink", title: { ka: "მკერდის თვითშემოწმება", en: "Breast self-exam" },
        body: { ka: "ყოველთვიურად, მენსტრუაციის შემდეგ. ეძებე ახალი კვანძი, ფორმის/კანის ცვლილება, გამონადენი.", en: "Monthly, after your period. Look for new lumps, shape/skin changes, or discharge." },
        steps: { ka: ["დადექი სარკესთან, შეამოწმე ვიზუალურად აწეული და ჩამოშვებული ხელებით", "თითების ბალიშებით, წრიული მოძრაობით შეამოწმე მთელი მკერდი და იღლია", "დააჭირე ძუძუს თავს — შეამოწმე გამონადენი"], en: ["At the mirror, look with arms up then down", "With finger pads, circle the whole breast + armpit", "Gently squeeze the nipple — check for discharge"] },
        clinic: { cat: "medical", label: { ka: "მამოლოგი", en: "Breast doctor" } } },
      { id: "cervix", sex: "woman", minAge: 21, icon: "shield", tone: "pink", title: { ka: "საშვილოსნოს ყელის სკრინინგი", en: "Cervical screening (Pap/HPV)" },
        body: { ka: "Pap-ტესტი ~3 წელიწადში ერთხელ 21+ ასაკში; HPV-ტესტი 30+. ადრე აღმოჩენა მაღალ შედეგს იძლევა.", en: "Pap test ~every 3 years from 21; HPV test from 30. Early detection works." },
        clinic: { cat: "medical", label: { ka: "გინეკოლოგი", en: "Gynecologist" } } },
      { id: "iron", sex: "woman", icon: "drop", tone: "crimson", title: { ka: "რკინა და ანემია", en: "Iron & anemia" },
        body: { ka: "მენსტრუაცია ზრდის რკინის საჭიროებას. დაღლა/სიფერმკრთალე? შეამოწმე ფერიტინი/ჰემოგლობინი.", en: "Periods raise iron needs. Fatigue/paleness? Check ferritin/hemoglobin." },
        clinic: { cat: "medical", label: { ka: "ლაბორატორია", en: "Lab test" } } },
      { id: "bone", sex: "woman", minAge: 50, icon: "shield", tone: "blue", title: { ka: "ძვლის სიმკვრივე", en: "Bone density" },
        body: { ka: "მენოპაუზის შემდეგ ოსტეოპოროზის რისკი იზრდება — D ვიტამინი, კალციუმი, წონითი ვარჯიში, DEXA სკანი.", en: "Osteoporosis risk rises after menopause — vitamin D, calcium, weight-bearing exercise, a DEXA scan." } },
      // men
      { id: "testicular", sex: "man", icon: "shield", tone: "blue", title: { ka: "სათესლე ჯირკვლის თვითშემოწმება", en: "Testicular self-exam" },
        body: { ka: "ყოველთვიურად, თბილ შხაპში. ეძებე კვანძი, შეშუპება ან სიმძიმის შეგრძნება.", en: "Monthly, in a warm shower. Feel for lumps, swelling or heaviness." },
        steps: { ka: ["თბილ წყალში კანი მოდუნებულია — გააგორე თითო სათესლე ცერსა და თითებს შორის", "ეძებე მაგარი, უმტკივნეულო კვანძი", "ცვლილებაზე — მიმართე ექიმს"], en: ["In warm water the skin relaxes — roll each testicle between thumb & fingers", "Feel for a firm, painless lump", "Any change → see a doctor"] },
        clinic: { cat: "medical", label: { ka: "უროლოგი", en: "Urologist" } } },
      { id: "prostate", sex: "man", minAge: 45, icon: "shield", tone: "blue", title: { ka: "პროსტატა (PSA)", en: "Prostate (PSA)" },
        body: { ka: "45+ ასაკში განიხილე PSA-ტესტი ექიმთან, განსაკუთრებით ოჯახური ისტორიის შემთხვევაში.", en: "From 45, discuss a PSA test with your doctor — especially with family history." },
        clinic: { cat: "medical", label: { ka: "უროლოგი", en: "Urologist" } } },
      { id: "heartm", sex: "man", minAge: 35, icon: "heart", tone: "crimson", title: { ka: "გულის ადრეული რისკი", en: "Early heart risk" },
        body: { ka: "მამაკაცებში გულსისხლძარღვთა რისკი ადრე ჩნდება. აკონტროლე წნევა, ქოლესტერინი, წონა.", en: "Cardiovascular risk appears earlier in men. Track blood pressure, cholesterol, weight." } },
      // both
      { id: "colon", sex: "all", minAge: 45, icon: "shield", tone: "green", title: { ka: "ნაწლავის სკრინინგი", en: "Colorectal screening" },
        body: { ka: "45 წლიდან დაიწყე ნაწლავის სკრინინგი (კოლონოსკოპია ან FIT-ტესტი).", en: "Start colorectal screening at 45 (colonoscopy or a FIT test)." },
        clinic: { cat: "medical", label: { ka: "გასტროენტეროლოგი", en: "Gastroenterologist" } } },
    ];
    return ALL.filter(function (x) {
      if (x.sex !== "all" && x.sex !== sex) return false;
      if (x.minAge && age < x.minAge) return false;
      return true;
    });
  };

  /* ---------- Rewards / brand elements ---------- */
  V.POINTS = { task: 5, med: 5, workout: 15, water: 10, lab: 25, booking: 20 };
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
  // daily calorie target (Mifflin-St Jeor × activity), else 2000
  V.calorieGoal = function () {
    var p = V.state.profile || {};
    if (!p.weight || !p.height || !p.age) return 2000;
    var bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "woman" ? -161 : 5);
    var act = { sitting: 1.2, light: 1.375, active: 1.55, very: 1.725 }[p.activity] || 1.375;
    return Math.max(1200, Math.round(bmr * act / 50) * 50);
  };
  // macro gram targets from the calorie goal (30% protein / 40% carb / 30% fat)
  V.macroGoals = function () {
    var k = V.calorieGoal();
    return { p: Math.round(k * 0.3 / 4), c: Math.round(k * 0.4 / 4), f: Math.round(k * 0.3 / 9) };
  };

  V.WATER_GLASS = 250;            // ml per glass
  // personalized: ~35 ml per kg of body weight (clamped), else a 2.5 L default
  V.waterGoal = function () {
    var wkg = V.state.profile && V.state.profile.weight;
    if (wkg) return Math.min(4000, Math.max(1500, Math.round(wkg * 35 / 100) * 100));
    return 2500;
  };
  V.waterStreak = function () {
    var n = 0, goal = V.waterGoal();
    for (var i = 0; i < 90; i++) {
      var iso = dISO(addDays(V.todayISO(), -i));
      var ml = (V.state.waterLog || {})[iso] || 0;
      if (i === 0 && ml < goal) continue;        // today not yet hit — don't break the streak
      if (ml >= goal) n++; else break;
    }
    return n;
  };
  V.waterToday = function () { return V.state.waterLog[V.todayISO()] || 0; };
  V.waterAdd = function (ml) {
    var d = V.todayISO();
    var was = V.state.waterLog[d] || 0;
    var now = Math.max(0, was + ml);
    V.state.waterLog[d] = now;
    V.save();
    // reward: first time hitting the daily goal
    if (was < V.waterGoal() && now >= V.waterGoal() && V.awardOnce) V.awardOnce("water", V.POINTS.water, "water");
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
