/* VITA — Apple-redesign hubs (phase 1): Health · Care · Me tabs, plus the shared
   large-title header (V.screenHead) and inset-grouped list (V.igList) builders that
   the remaining screens migrate onto in later phases. */
(function () {
  var V = window.VITA;
  V.screens = V.screens || {};
  var root = document.getElementById("app");
  function $(s) { return root.querySelector(s); }
  function each(s, fn) { root.querySelectorAll(s).forEach(fn); }
  var t = V.t, esc = V.esc;
  function safe(fn, fb) { try { var v = fn(); return v == null ? fb : v; } catch (e) { return fb; } }

  /* Large-title header. o = { title, sub, back:true|route, backLabel, actions:[{icon,attr,label}] } */
  V.screenHead = function (o) {
    o = o || {};
    // back: true → generic [data-back] (V.mount navigates to o.back route or home);
    // backAttr lets legacy screens keep their own wiring (wellness tools listen on [data-x]).
    var attr = o.backAttr || "data-back";
    var back = (o.back || o.backAttr) ? '<button class="nav-large__back" ' + attr + (typeof o.back === "string" ? '="' + esc(o.back) + '"' : "") +
      ' aria-label="' + esc(t("back")) + '">' + V.icon("back") + (o.backLabel ? "<span>" + esc(o.backLabel) + "</span>" : "") + "</button>" : "";
    var acts = (o.actions || []).map(function (a) {
      return '<button class="' + (a.cls || "icon-box") + '" ' + (a.attr || "") + ' aria-label="' + esc(a.label || "") + '">' + V.icon(a.icon) + (a.text != null ? esc(String(a.text)) : "") + "</button>";
    }).join("");
    return '<header class="nav-large"><div class="nav-large__bar">' + back + '<div class="nav-large__acts">' + acts + "</div></div>" +
      "<h1>" + esc(o.title || "") + "</h1>" + (o.sub ? '<p class="nav-large__sub">' + esc(o.sub) + "</p>" : "") + "</header>";
  };

  /* Inset-grouped list. groups = [{ title, note, rows:[{ icon, tone, label, sub, go, value, badge }] }] */
  V.igList = function (groups) {
    return groups.map(function (g) {
      return (g.title ? '<div class="ig-title">' + esc(g.title) + "</div>" : "") +
        '<div class="ig">' + g.rows.filter(Boolean).map(function (r) {
          return '<button class="ig-row' + (r.danger ? " danger" : "") + '" data-go="' + esc(r.go) + '">' +
            '<span class="ig-ic ' + (r.tone || "gray") + '">' + (V.icons[r.icon] || "") + "</span>" +
            '<span class="ig-row__t"><b>' + esc(r.label) + "</b>" + (r.sub ? "<small>" + esc(r.sub) + "</small>" : "") + "</span>" +
            '<span class="ig-row__v">' + (r.value != null ? esc(String(r.value)) : "") +
              (r.badge != null ? '<span class="badge">' + esc(String(r.badge)) + "</span>" : "") + V.icon("chev") + "</span></button>";
        }).join("") + "</div>" +
        (g.note ? '<p class="ig-note">' + esc(g.note) + "</p>" : "");
    }).join("");
  };

  function hub(tab, head, body) {
    V.mount(
      V.statusbar() + '<div class="screen"><div class="pad-lg fade-in">' + head + body + "</div>" + V.tabbar(tab) + "</div>",
      { onMount: function () {
        each("[data-go]", function (b) { b.addEventListener("click", function () { var r = b.getAttribute("data-go"); if (r.charAt(0) !== "_") V.go(r); }); });
      } }
    );
  }

  /* ---------- Health ---------- */
  V.screens.health = function () {
    var rd = safe(function () { return V.readiness().score; }, null);
    var steps = safe(function () { return V.stepsToday(); }, 0);
    var water = safe(function () { return V.waterToday(); }, 0);
    var streak = safe(function () { return V.scanStreak(); }, 0);
    var mood = safe(function () { var w = V.state.wellness || {}; return !!(w.mood && w.mood[V.todayISO()]); }, false);
    hub("health",
      V.screenHead({ title: t("nHealth"), sub: t("hbHealthSub"), actions: [{ icon: "chat", attr: 'data-go="vita"', label: t("meAskVita") }] }),
      V.igList([
        { title: t("hbScans"), rows: [
          { icon: "camera", tone: "green", label: t("scnTitle"), sub: t("igScanSub"), go: "scan", badge: streak > 1 ? streak + "🔥" : null },
          { icon: "shield", tone: "blue", label: t("fbTitle"), sub: t("igFullSub"), go: "fullscan" },
          { icon: "skin", tone: "pink", label: t("skTitle"), go: "skinscan" },
          { icon: "mic", tone: "purple", label: t("vcTitle"), go: "voicescan" },
          { icon: "tongue", tone: "crimson", label: t("tgTitle"), go: "tonguescan" },
          { icon: "bolt", tone: "yellow", label: t("rxTitle"), go: "reactionscan" },
        ] },
        { title: t("hbTrack"), rows: [
          { icon: "walk", tone: "green", label: t("mSteps"), go: "steps", value: steps ? steps.toLocaleString() : null },
          { icon: "drop", tone: "blue", label: t("mWater"), go: "water", value: water ? water + " ml" : null },
          { icon: "food", tone: "yellow", label: t("mFood"), go: "food" },
          { icon: "moon", tone: "purple", label: t("slTitle"), go: "sleep" },
          { icon: "smile", tone: "pink", label: t("moTitle"), go: "mood", value: mood ? "✓" : null },
          { icon: "heart", tone: "crimson", label: t("bpTitle"), go: "bplog" },
          { icon: "calendar", tone: "pink", label: t("mCycle"), go: "cycle" },
          { icon: "pill", tone: "crimson", label: t("mMeds"), go: "meds" },
        ] },
        { title: t("hbInsights"), rows: [
          { icon: "sparkle", tone: "green", label: t("mCoach"), go: "coach" },
          { icon: "sun", tone: "yellow", label: t("rdTitle"), go: "readiness", value: rd },
          { icon: "progress", tone: "blue", label: t("mProgress"), go: "progress" },
          { icon: "trend", tone: "teal", label: t("mDatalab"), go: "datalab" },
          { icon: "flask", tone: "yellow", label: t("mResults"), go: "results" },
          { icon: "user", tone: "blue", label: t("mBody"), go: "bodymap" },
          { icon: "calendar", tone: "pink", label: t("mAnnual"), go: "annual" },
        ] },
        { title: t("hbTools"), rows: [
          { icon: "plan", tone: "green", label: t("mPlan"), go: "plan" },
          { icon: "eye", tone: "blue", label: t("mWellness"), go: "wellness" },
          { icon: "bolt", tone: "green", label: t("mExercises"), go: "exercises" },
          { icon: "walk", tone: "blue", label: t("mWorkouts"), go: "workouts" },
          { icon: "sparkle", tone: "teal", label: t("quTitle"), go: "quests" },
          { icon: "sparkle", tone: "yellow", label: t("mChallenges"), go: "challenges" },
        ] },
      ])
    );
  };

  /* ---------- Care ---------- */
  V.screens.care = function () {
    var cart = safe(function () { return V.cartCount(); }, 0);
    var due = safe(function () { return (V.predictNeeds() || []).filter(function (n) { return n.days != null && n.days <= 7; }).length; }, 0);
    var fam = safe(function () { return ((V.state.circle || {}).members || []).length; }, 0);
    hub("care",
      V.screenHead({ title: t("nCare"), sub: t("hbCareSub"), actions: [{ icon: "chat", attr: 'data-go="vita"', label: t("meAskVita") }] }),
      V.igList([
        { title: t("hbDoctors"), rows: [
          { icon: "stethoscope", tone: "green", label: t("mTelemed"), go: "telemed" },
          { icon: "location", tone: "blue", label: t("mVisits"), go: "visits" },
          { icon: "flask", tone: "pink", label: t("mCheckup"), go: "checkup" },
          { icon: "heart", tone: "crimson", label: t("mCare"), go: "careplans" },
        ] },
        { title: t("hbMarket"), rows: [
          { icon: "location", tone: "crimson", label: t("mMarket"), go: "market", badge: cart || null },
          { icon: "pill", tone: "crimson", label: t("mMeds"), go: "meds", value: due ? due + " " + t("igDue") : null },
          { icon: "shield", tone: "blue", label: t("mInsurance"), go: "insurance" },
          { icon: "trend", tone: "green", label: t("mRoi"), go: "roi" },
        ] },
        { title: t("hbFamily"), rows: [
          { icon: "heart", tone: "pink", label: t("mFamily"), go: "family", value: fam || null },
        ] },
        { title: t("hbPlanning"), rows: [
          { icon: "calendar", tone: "green", label: t("mCalendar"), go: "calendar" },
          { icon: "bell", tone: "yellow", label: t("rmTitle"), go: "reminders" },
          { icon: "globe", tone: "green", label: t("mVitaapp"), go: "vitaapp" },
        ] },
      ])
    );
  };

  // the old all-tiles grid (#/menu) is retired — every tile lives in a hub now; old links land on Me
  V.screens.menu = function () { V.go("me"); };

  /* ---------- Me ---------- */
  V.screens.me = function () {
    var p = V.state.profile || {};
    var name = p.name || t("mProfile");
    var sub = [p.age ? p.age + " " + t("meYears") : null, p.sex === "woman" ? t("woman") : (p.sex ? t("man") : null)].filter(Boolean).join(" · ");
    var plus = safe(function () { return V.isPlus(); }, false);
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    var notif = safe(function () { return V.features.notifOn(); }, false);
    var hero = '<button class="me-hero" data-go="profile"><span class="me-av">' + esc(V.initials(name) || "V") + "</span>" +
      '<span class="me-hero__t"><b>' + esc(name) + (plus ? '<span class="me-plus">VITA+</span>' : "") + "</b><small>" + esc(sub || t("meEditProfile")) + "</small></span>" + V.icon("chev") + "</button>";
    hub("me",
      V.screenHead({ title: t("nMe"), actions: [{ icon: "settings", attr: "data-open-settings", label: t("setTitle") }] }),
      hero + V.igList([
        { title: t("meActivity"), rows: [
          { icon: "progress", tone: "green", label: t("mProgress"), go: "progress" },
          { icon: "sparkle", tone: "yellow", label: t("mRewards"), go: "rewards", value: V.state.points || 0 },
          { icon: "sparkle", tone: "yellow", label: t("mChallenges"), go: "challenges" },
        ] },
        { title: t("meAccount"), rows: [
          { icon: "user", tone: "green", label: t("mProfile"), go: "profile" },
          { icon: "sparkle", tone: "yellow", label: t("mPlus"), go: "plus", value: plus ? "✓" : null },
          { icon: "bolt", tone: "blue", label: t("mWearable"), go: "wearable", value: safe(function () { return V.wearableConnected() ? "✓" : null; }, null) },
          { icon: "heart", tone: "pink", label: t("mFamily"), go: "family" },
        ] },
        { title: t("meApp"), rows: [
          { icon: "sliders", tone: "gray", label: t("customizeHome"), go: "customize" },
          { icon: "bell", tone: "crimson", label: t("rmTitle"), go: "reminders", value: notif ? t("igOn") : t("igOff") },
          { icon: "globe", tone: "blue", label: t("setLang"), go: "__lang", value: t("meLangVal") },
          { icon: "moon", tone: "purple", label: t("setTheme"), go: "__theme", value: dark ? t("igOn") : t("igOff") },
        ] },
        { title: t("meData"), rows: [
          { icon: "calendar", tone: "gray", label: t("setExportICS"), go: "__ics" },
          { icon: "file", tone: "gray", label: t("meExport"), go: "__export" },
          { icon: "file", tone: "gray", label: t("setPrint"), go: "__print" },
        ] },
        { rows: [
          { icon: "x", tone: "crimson", label: t("setReset"), go: "__reset", danger: true },
        ] },
      ])
    );
    // in-place actions (no route)
    each('[data-go="__lang"]', function (b) { b.addEventListener("click", function () { V.setLang(V.lang() === "ka" ? "en" : "ka"); V.render(); }); });
    each('[data-go="__theme"]', function (b) { b.addEventListener("click", function () { V.setTheme(!dark); V.render(); }); });
    each('[data-go="__export"]', function (b) { b.addEventListener("click", function () { V.features.exportJSON(); }); });
    each('[data-go="__ics"]', function (b) { b.addEventListener("click", function () { V.features.exportICS(); }); });
    each('[data-go="__print"]', function (b) { b.addEventListener("click", function () { V.features.printSummary(); }); });
    each('[data-go="__reset"]', function (b) { b.addEventListener("click", function () { if (confirm(t("setResetConfirm"))) { V.reset(); V.go("splash"); V.render(); } }); });
  };
})();
