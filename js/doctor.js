/* VITA for Doctors — standalone clinician console (the provider side of the
   telemedicine marketplace). Separate app/entry point (doctor.html); reuses the
   VITA brand helpers (V.icon/initials/logoBadge/t/lang). All demo data. */
(function () {
  var V = window.VITA || {};
  var root = document.getElementById("docapp");
  var esc = V.esc || function (s) { return String(s == null ? "" : s); };
  function $(s) { return root.querySelector(s); }
  function each(s, fn) { root.querySelectorAll(s).forEach(fn); }
  function lang() { return (V.lang && V.lang()) || "ka"; }
  function L(o) { return o[lang()] || o.en; }
  function icon(n) { return (V.icon && V.icon(n)) || ""; }
  function initials(n) { return (V.initials && V.initials(n)) || (n || "?").slice(0, 2).toUpperCase(); }
  function logo(size) { return (V.logoBadge && V.logoBadge(size)) || ""; }
  function toast(m) { if (V.toast) V.toast(m); }

  var TONE = { green: "#2BA94C", crimson: "#e8536b", yellow: "#e0a92e", blue: "#4a90d9", pink: "#e0689f" };

  /* ---------- the logged-in doctor (demo) ---------- */
  var ME = { name: { ka: "დრ. გიორგი კაპანაძე", en: "Dr. Giorgi Kapanadze" }, spec: { ka: "თერაპევტი", en: "GP / Internist" }, tone: "green" };
  var online = true;

  /* ---------- demo data ---------- */
  var QUEUE = [
    { id: "p1", name: "Ana Tsiklauri", nameKa: "ანა წიკლაური", age: 34, sex: "F", reason: { ka: "გულის აჩქარება, ზეწოლა გულმკერდში", en: "Palpitations, chest tightness" }, wait: 2, urgency: "high", tone: "crimson", vitals: { hr: 96, hrv: 24, spo2: 96, bioAge: 38, score: 58 } },
    { id: "p2", name: "Davit Meladze", nameKa: "დავით მელაძე", age: 47, sex: "M", reason: { ka: "ხველა 2 კვირაა, დაღლილობა", en: "Cough for 2 weeks, fatigue" }, wait: 5, urgency: "medium", tone: "yellow", vitals: { hr: 78, hrv: 39, spo2: 95, bioAge: 51, score: 66 } },
    { id: "p3", name: "Mariam Kvirikashvili", nameKa: "მარიამ კვირიკაშვილი", age: 28, sex: "F", reason: { ka: "შფოთვა, ძილის პრობლემა", en: "Anxiety, trouble sleeping" }, wait: 8, urgency: "low", tone: "blue", vitals: { hr: 72, hrv: 52, spo2: 98, bioAge: 27, score: 79 } },
  ];
  var PATIENTS = [
    { name: "Ana Tsiklauri", nameKa: "ანა წიკლაური", last: "2026-06-21", tags: [{ ka: "კარდიო", en: "Cardio" }], tone: "crimson" },
    { name: "Davit Meladze", nameKa: "დავით მელაძე", last: "2026-06-18", tags: [{ ka: "რესპირატ.", en: "Respiratory" }], tone: "yellow" },
    { name: "Mariam Kvirikashvili", nameKa: "მარიამ კვირიკაშვილი", last: "2026-06-15", tags: [{ ka: "მენტალური", en: "Mental" }], tone: "blue" },
    { name: "Luka Beridze", nameKa: "ლუკა ბერიძე", last: "2026-06-12", tags: [{ ka: "დიაბეტი", en: "Diabetes" }], tone: "green" },
    { name: "Nino Gelashvili", nameKa: "ნინო გელაშვილი", last: "2026-06-09", tags: [{ ka: "დერმა", en: "Derm" }], tone: "pink" },
  ];
  var ANALYTICS = { today: 12, avgWait: 4.2, rating: 4.9, revenue: 360, week: [8, 11, 9, 14, 12, 7, 12], satisfaction: 96 };

  /* ---------- view state ---------- */
  var view = "dashboard", current = null, callT = 0, ticker = null;

  function pname(p) { return lang() === "ka" ? (p.nameKa || p.name) : p.name; }
  function clearTimers() { if (ticker) clearInterval(ticker); ticker = null; }

  /* ---------- small charts ---------- */
  function weekBars(data, color) {
    var w = 340, h = 120, pad = 14, n = data.length, max = Math.max.apply(null, data) * 1.18 || 1, bw = (w - 2 * pad) / n * 0.6;
    var days = lang() === "ka" ? ["ორ", "სა", "ოთ", "ხუ", "პა", "შა", "კვ"] : ["M", "T", "W", "T", "F", "S", "S"];
    return '<svg viewBox="0 0 ' + w + " " + h + '" class="doc-svg">' +
      data.map(function (v, i) {
        var x = pad + (i + 0.5) * ((w - 2 * pad) / n) - bw / 2, bh = (v / max) * (h - 30), y = h - 22 - bh;
        return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="5" fill="' + color + '" opacity="' + (0.5 + 0.5 * i / n) + '"/>' +
          '<text x="' + (x + bw / 2) + '" y="' + (y - 5) + '" text-anchor="middle" class="doc-bv">' + v + "</text>" +
          '<text x="' + (x + bw / 2) + '" y="' + (h - 6) + '" text-anchor="middle" class="doc-ax">' + (days[i] || i + 1) + "</text>";
      }).join("") + "</svg>";
  }
  function donut(pct, color) {
    var r = 30, C = 2 * Math.PI * r, len = pct / 100 * C;
    return '<svg viewBox="0 0 76 76" class="doc-donut"><circle cx="38" cy="38" r="' + r + '" fill="none" stroke="var(--field)" stroke-width="9"/>' +
      '<circle cx="38" cy="38" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + len + " " + (C - len) + '" transform="rotate(-90 38 38)"/>' +
      '<text x="38" y="43" text-anchor="middle" class="doc-donut__t">' + pct + "%</text></svg>";
  }

  /* ---------- avatars / chips ---------- */
  function av(name, tone, size) { size = size || 44; return '<span class="doc-av" style="width:' + size + "px;height:" + size + "px;font-size:" + Math.round(size * 0.36) + "px;background:" + (TONE[tone] || TONE.green) + '">' + initials(name) + "</span>"; }
  function urgChip(u) { var c = u === "high" ? "crimson" : u === "medium" ? "yellow" : "blue"; var lbl = { high: { ka: "გადაუდებელი", en: "Urgent" }, medium: { ka: "საშუალო", en: "Medium" }, low: { ka: "დაბალი", en: "Low" } }[u]; return '<span class="doc-urg" style="color:' + TONE[c] + ";background:" + TONE[c] + '22">' + L(lbl) + "</span>"; }
  function kpi(label, val, sub, color) { return '<div class="doc-kpi"><b style="color:' + (color || "var(--ink)") + '">' + val + "</b><small>" + label + "</small>" + (sub ? '<i class="doc-kpi__sub">' + sub + "</i>" : "") + "</div>"; }

  /* ---------- views ---------- */
  function dashboard() {
    var waiting = QUEUE.length;
    return '<div class="doc-kpis">' +
        kpi(T("waiting"), waiting, null, TONE.crimson) +
        kpi(T("todayConsults"), ANALYTICS.today, null, TONE.green) +
        kpi(T("rating"), ANALYTICS.rating, "★", TONE.yellow) +
        kpi(T("revenue"), "₾" + ANALYTICS.revenue, T("today"), TONE.blue) +
      "</div>" +
      '<div class="doc-sec"><h2>' + icon("bell") + " " + T("incoming") + ' <span class="doc-badge">' + waiting + "</span></h2></div>" +
      (waiting ? QUEUE.map(qCard).join("") : '<div class="doc-empty">' + icon("check") + " " + T("queueEmpty") + "</div>");
  }
  function qCard(p) {
    return '<div class="doc-qcard' + (p.live ? " doc-qcard--live" : "") + '">' + av(pname(p), p.tone, 50) +
      '<div class="doc-qcard__t"><div class="doc-qcard__top"><b>' + esc(pname(p)) + "</b>" + urgChip(p.urgency) +
        (p.live ? '<span class="doc-livereq">● ' + T("liveReq") + "</span>" : "") + "</div>" +
        "<small>" + p.age + (p.sex === "F" ? "♀" : "♂") + " · " + esc(L(p.reason)) + "</small>" +
        '<i class="doc-wait">' + icon("bell") + " " + T("waiting") + " " + p.wait + " " + T("min") + "</i></div>" +
      '<button class="doc-accept" data-accept="' + p.id + '">' + icon("camera") + " " + T("accept") + "</button></div>";
  }

  function patients() {
    return '<div class="doc-sec"><h2>' + icon("user") + " " + T("roster") + "</h2></div>" +
      PATIENTS.map(function (p) {
        return '<div class="doc-rrow">' + av(pname(p), p.tone, 40) +
          '<div class="doc-qcard__t"><b>' + esc(pname(p)) + '</b><small>' + T("lastVisit") + " " + p.last + "</small></div>" +
          '<div class="doc-tags">' + p.tags.map(function (t) { return '<span class="doc-tag">' + L(t) + "</span>"; }).join("") + "</div></div>";
      }).join("");
  }

  function analytics() {
    return '<div class="doc-kpis">' +
        kpi(T("todayConsults"), ANALYTICS.today, null, TONE.green) +
        kpi(T("avgWait"), ANALYTICS.avgWait + " " + T("min"), null, TONE.blue) +
        kpi(T("rating"), ANALYTICS.rating, "★", TONE.yellow) +
        kpi(T("revenue"), "₾" + ANALYTICS.revenue, T("today"), TONE.crimson) +
      "</div>" +
      '<div class="doc-card"><div class="doc-card__h">' + icon("progress") + " <b>" + T("weekConsults") + "</b></div>" + weekBars(ANALYTICS.week, TONE.green) + "</div>" +
      '<div class="doc-2up">' +
        '<div class="doc-card doc-card--c"><div class="doc-card__h">' + icon("smile") + " <b>" + T("satisfaction") + "</b></div>" + donut(ANALYTICS.satisfaction, TONE.green) + "</div>" +
        '<div class="doc-card doc-card--c"><div class="doc-card__h">' + icon("check") + " <b>" + T("completion") + "</b></div>" + donut(94, TONE.blue) + "</div>" +
      "</div>";
  }

  function consult() {
    var p = current;
    return '<button class="doc-back" data-back>' + icon("back") + " " + T("backQueue") + "</button>" +
      '<div class="doc-console">' +
        // patient header + vitals
        '<div class="doc-card doc-pt"><div class="doc-pt__h">' + av(pname(p), p.tone, 46) +
          '<div class="doc-qcard__t"><b>' + esc(pname(p)) + "</b><small>" + p.age + (p.sex === "F" ? "♀" : "♂") + " · " + esc(L(p.reason)) + "</small></div>" + urgChip(p.urgency) + "</div>" +
          '<div class="doc-vitals">' +
            vital(icon("heart"), p.vitals.hr, "HR") + vital(icon("trend"), p.vitals.hrv, "HRV") +
            vital(icon("drop"), p.vitals.spo2 + "%", "SpO₂") + vital(icon("user"), p.vitals.bioAge, T("bioAge")) +
            vital(icon("shield"), p.vitals.score, T("scanScore")) +
          "</div></div>" +
        // video stage
        '<div class="doc-vstage"><span class="doc-live">● ' + T("live") + "</span>" +
          '<div class="doc-vbig">' + av(pname(p), p.tone, 92) + '<div class="doc-vname">' + esc(pname(p)) + "</div></div>" +
          '<div class="doc-vme">' + av(L(ME.name), ME.tone, 34) + "<small>" + T("you") + "</small></div>" +
          '<div class="doc-vtimer" id="docTimer">0:00</div></div>' +
        // notes + rx
        '<div class="doc-card"><div class="doc-card__h">' + icon("edit") + " <b>" + T("notes") + '</b></div><textarea id="docNotes" class="doc-ta" placeholder="' + esc(T("notesPh")) + '"></textarea></div>' +
        '<div class="doc-card"><div class="doc-card__h">' + icon("pill") + " <b>" + T("prescribe") + '</b></div>' +
          '<input id="docRx" class="field" placeholder="' + esc(T("rxPh")) + '"></div>' +
        '<button class="doc-complete" id="docComplete">' + icon("check") + " " + T("complete") + "</button>" +
      "</div>";
  }
  function vital(ic, val, label) { return '<div class="doc-vital">' + ic + "<b>" + val + "</b><small>" + label + "</small></div>"; }

  /* ---------- shell ---------- */
  function render() {
    clearTimers();
    var content = view === "dashboard" ? dashboard() : view === "patients" ? patients() : view === "analytics" ? analytics() : consult();
    var nav = view === "consult" ? "" :
      '<nav class="doc-nav">' +
        ['dashboard', 'patients', 'analytics'].map(function (v) {
          return '<button class="doc-nav__b' + (v === view ? " on" : "") + '" data-view="' + v + '">' + icon(v === "dashboard" ? "grid" : v === "patients" ? "user" : "progress") + " " + T("nav_" + v) + "</button>";
        }).join("") + "</nav>";

    root.innerHTML =
      '<header class="doc-top">' +
        '<div class="doc-brand">' + logo(34) + '<div><b>VITA <span>for Doctors</span></b><small>' + T("console") + "</small></div></div>" +
        '<div class="doc-top__r">' +
          '<button class="doc-online' + (online ? " on" : "") + '" id="docOnline"><i></i>' + (online ? T("online") : T("offline")) + "</button>" +
          '<button class="doc-lang" id="docLang">' + (lang() === "ka" ? "EN" : "ქა") + "</button>" +
          '<div class="doc-me">' + av(L(ME.name), ME.tone, 36) + '<div class="doc-me__t"><b>' + esc(L(ME.name)) + "</b><small>" + esc(L(ME.spec)) + "</small></div></div>" +
        "</div>" +
      "</header>" +
      nav +
      '<main class="doc-main">' + content + "</main>";

    wire();
    if (view === "consult") startCall();
  }

  function wire() {
    each("[data-view]", function (b) { b.addEventListener("click", function () { view = b.getAttribute("data-view"); render(); }); });
    each("[data-accept]", function (b) { b.addEventListener("click", function () { current = QUEUE.filter(function (p) { return p.id === b.getAttribute("data-accept"); })[0]; if (current) { if (current.live && V.bridge) V.bridge.send("consult-accepted", { patientId: current.id, patientUid: current.uid, doctor: L(ME.name) }); view = "consult"; render(); } }); });
    var back = $("[data-back]"); if (back) back.addEventListener("click", function () { clearTimers(); view = "dashboard"; current = null; render(); });
    var on = $("#docOnline"); if (on) on.addEventListener("click", function () { online = !online; render(); });
    var lg = $("#docLang"); if (lg) lg.addEventListener("click", function () { if (V.setLang) V.setLang(lang() === "ka" ? "en" : "ka"); render(); });
    var comp = $("#docComplete"); if (comp) comp.addEventListener("click", completeConsult);
  }

  function startCall() {
    callT = Date.now();
    ticker = setInterval(function () { var el = $("#docTimer"); if (!el) { clearTimers(); return; } var s = Math.round((Date.now() - callT) / 1000); el.textContent = Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }, 1000);
  }
  function completeConsult() {
    clearTimers();
    var rx = ($("#docRx") && $("#docRx").value) || "";
    if (current && current.live && V.bridge) V.bridge.send("consult-ended", { patientId: current.id, patientUid: current.uid, rx: rx, doctor: L(ME.name) });
    // remove from queue + update analytics (demo)
    QUEUE = QUEUE.filter(function (p) { return p.id !== current.id; });
    ANALYTICS.today += 1; ANALYTICS.revenue += 30;
    toast(T("consultDone"));
    view = "dashboard"; current = null; render();
  }

  /* ---------- copy ---------- */
  var STR = {
    console: { ka: "კლინიცისტის კონსოლი", en: "Clinician console" },
    online: { ka: "ონლაინ", en: "Online" }, offline: { ka: "ოფლაინ", en: "Offline" },
    nav_dashboard: { ka: "მთავარი", en: "Dashboard" }, nav_patients: { ka: "პაციენტები", en: "Patients" }, nav_analytics: { ka: "ანალიტიკა", en: "Analytics" },
    waiting: { ka: "რიგში", en: "Waiting" }, todayConsults: { ka: "დღეს ვიზიტი", en: "Consults today" }, rating: { ka: "რეიტინგი", en: "Rating" }, revenue: { ka: "შემოსავალი", en: "Revenue" }, today: { ka: "დღეს", en: "today" },
    incoming: { ka: "შემოსული რექვესთები", en: "Incoming requests" }, queueEmpty: { ka: "რიგი ცარიელია — ყველა მიღებულია", en: "Queue clear — all seen" },
    min: { ka: "წთ", en: "min" }, accept: { ka: "მიღება", en: "Accept" },
    roster: { ka: "პაციენტების სია", en: "Patient roster" }, lastVisit: { ka: "ბოლო ვიზიტი", en: "Last visit" },
    avgWait: { ka: "საშ. ლოდინი", en: "Avg wait" }, weekConsults: { ka: "ვიზიტები (7 დღე)", en: "Consults (7 days)" }, satisfaction: { ka: "კმაყოფილება", en: "Satisfaction" }, completion: { ka: "დასრულება", en: "Completion" },
    backQueue: { ka: "უკან რიგში", en: "Back to queue" }, live: { ka: "LIVE", en: "LIVE" }, you: { ka: "შენ", en: "You" },
    bioAge: { ka: "ბიო-ასაკი", en: "Bio-age" }, scanScore: { ka: "სკან-ქულა", en: "Scan" },
    notes: { ka: "კლინიკური ჩანაწერი", en: "Clinical notes" }, notesPh: { ka: "სიმპტომები, შეფასება, გეგმა…", en: "Symptoms, assessment, plan…" },
    prescribe: { ka: "რეცეპტის გამოწერა", en: "Prescribe" }, rxPh: { ka: "მედიკამენტი, დოზა…", en: "Medication, dose…" },
    complete: { ka: "ვიზიტის დასრულება", en: "Complete consult" }, consultDone: { ka: "ვიზიტი დასრულდა ✓", en: "Consult completed ✓" },
    newRequest: { ka: "ახალი მოთხოვნა მოვიდა 🔔", en: "New consult request 🔔" }, liveReq: { ka: "ცოცხალი", en: "live" },
  };
  function T(k) { var o = STR[k]; return o ? L(o) : k; }

  /* ---------- realtime: receive consult requests from the patient app ---------- */
  if (V.bridge) {
    if (V.bridge.init) V.bridge.init("doctor");
    V.bridge.on("consult-claimed", function (p) {
      if (!p || !p.id) return;
      var before = QUEUE.length;
      QUEUE = QUEUE.filter(function (q) { return q.id !== p.id; });
      if (QUEUE.length !== before && view === "dashboard") render();
    });
    V.bridge.on("consult-request", function (p) {
      if (!p || !p.id) return;
      if (QUEUE.some(function (q) { return q.id === p.id; })) return;
      var v = p.vitals || {};
      QUEUE.unshift({
        id: p.id, uid: p.uid, name: p.name || "Patient", nameKa: p.name || "პაციენტი", age: p.age || "—", sex: p.sex || "M",
        reason: p.reason || { ka: "ახალი მოთხოვნა", en: "New request" }, wait: 0, live: true,
        urgency: (v.score != null && v.score < 60) ? "high" : (v.score != null && v.score < 75) ? "medium" : "low",
        tone: (v.score != null && v.score < 60) ? "crimson" : "blue",
        vitals: { hr: v.hr || "—", hrv: v.hrv || "—", spo2: v.spo2 || "—", bioAge: v.bioAge || "—", score: v.score || "—" },
      });
      if (online) toast(T("newRequest"));
      if (view === "dashboard") render();
    });
  }

  render();
})();
