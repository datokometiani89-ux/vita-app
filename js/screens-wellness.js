/* VITA — wellness micro-tools: hub, eye care, breathing, symptom checker,
   camera heart-rate, mental-health tests, mood journal.
   Self-cleaning animations: every ticker checks its root is still in the DOM
   and stops itself, so navigating away never leaves a timer running. */
(function () {
  var V = window.VITA;
  V.screens = V.screens || {};
  var root = document.getElementById("app");
  function $(s) { return root.querySelector(s); }
  function each(s, fn) { root.querySelectorAll(s).forEach(fn); }
  var t = V.t, esc = V.esc;
  function L(o) { return o[V.lang()] || o.en; }
  function today() { return V.todayISO(); }
  function alive(el) { return el && document.body.contains(el); }

  function W() { return (V.state.wellness = V.state.wellness || {}); }

  /* tools shown in the hub — only those with a built screen */
  V.wellnessTools = [
    { id: "eye",     route: "eyecare",   icon: "eye",      tone: "blue",    name: { ka: "თვალის მოვლა", en: "Eye care" },        desc: { ka: "20-20-20 + Amsler ტესტი", en: "20-20-20 + Amsler test" } },
    { id: "breathe", route: "breathe",   icon: "lungs",    tone: "green",   name: { ka: "სუნთქვის ვარჯიში", en: "Breathing" },     desc: { ka: "ბოქს-სუნთქვა 4-4-4-4", en: "Box breathing 4-4-4-4" } },
    { id: "symptom", route: "symptom",   icon: "stethoscope", tone: "pink", name: { ka: "სიმპტომ-ჩეკერი", en: "Symptom checker" }, desc: { ka: "AI ტრიაჟი → ექიმი", en: "AI triage → doctor" } },
    { id: "hr",      route: "heartrate", icon: "heart",    tone: "crimson", name: { ka: "გულისცემა კამერით", en: "Heart rate" },   desc: { ka: "თითი კამერაზე (PPG)", en: "Finger on camera (PPG)" } },
    { id: "mind",    route: "mindtests", icon: "brain",    tone: "blue",    name: { ka: "მენტალური ტესტები", en: "Mental tests" }, desc: { ka: "PHQ-9 · GAD-7", en: "PHQ-9 · GAD-7" } },
    { id: "mood",    route: "mood",      icon: "smile",    tone: "yellow",  name: { ka: "განწყობის დღიური", en: "Mood journal" },  desc: { ka: "ყოველდღიური განწყობა", en: "Daily mood" } },
  ];

  /* ===================== WELLNESS HUB ===================== */
  V.screens.wellness = function () {
    function card(tool) {
      return '<button class="well-tile" data-go="' + tool.route + '">' +
        V.iconBox(tool.icon, tool.tone) +
        '<div class="well-tile__t"><b>' + L(tool.name) + "</b><small>" + L(tool.desc) + "</small></div>" +
        V.icon("back") + "</button>";
    }
    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("wellTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("x") + "</button></div>" +
        '<p class="s-sub">' + t("wellSub") + "</p>" +
        '<div class="well-grid">' + V.wellnessTools.map(card).join("") + "</div>" +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("menu"); });
        each("[data-go]", function (b) { b.addEventListener("click", function () { V.go(b.getAttribute("data-go")); }); });
      }}
    );
  };

  /* ===================== EYE CARE (20-20-20 + Amsler) ===================== */
  // guided eye-movement phases: a dot travels a path; user follows with eyes.
  var EYE_PHASES = [
    { kind: "path", path: "horizontal", secs: 12, label: { ka: "მარცხნივ ↔ მარჯვნივ", en: "Left ↔ right" } },
    { kind: "path", path: "vertical",   secs: 12, label: { ka: "ზევით ↕ ქვევით", en: "Up ↕ down" } },
    { kind: "path", path: "circle",     secs: 14, label: { ka: "წრიულად", en: "Circles" } },
    { kind: "path", path: "infinity",   secs: 14, label: { ka: "∞ ფიგურა", en: "Figure ∞" } },
    { kind: "far",  secs: 20, label: { ka: "შეხედე 6 მეტრზე შორს", en: "Look 6m into the distance" } },
  ];

  V.screens.eyecare = function () {
    var w = W();
    var doneToday = !!(w.eyeLog && w.eyeLog[today()]);
    var amsler = w.amsler;

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.iconBox("eye", "blue") + "<h1>" + t("eyeTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("eyeSub") + "</p>" +

        '<div class="card-soft eye-card">' +
          '<div class="eye-stage" id="eyeStage">' +
            '<div class="eye-dot" id="eyeDot"></div>' +
            '<div class="eye-overlay" id="eyeOverlay">' +
              '<button class="btn btn-primary" id="eyeStart">' + V.icon("eye") + " " + t("eyeStart") + "</button>" +
              (doneToday ? '<p class="eye-done">✓ ' + t("eyeDoneToday") + "</p>" : '<p class="pts-badge" style="margin-top:10px">+' + V.POINTS.task + " " + t("rwPts") + "</p>") +
            "</div>" +
          "</div>" +
          '<div class="eye-meta"><b id="eyePhase">' + t("eyeReady") + '</b><span id="eyeTimer"></span></div>' +
        "</div>" +

        '<div class="section-head"><h3>' + t("amslerTitle") + "</h3>" + (amsler ? '<small>' + (amsler.result === "normal" ? t("amslerNormal") : t("amslerSeeDoc")) + "</small>" : "") + "</div>" +
        '<p class="cal-note" style="text-align:left;margin:0 0 12px">' + t("amslerHow") + "</p>" +
        '<div class="amsler-wrap">' + amslerSVG() + "</div>" +
        '<div class="amsler-act">' +
          '<button class="btn btn-ghost" data-amsler="normal">' + V.icon("check") + " " + t("amslerOk") + "</button>" +
          '<button class="btn btn-ghost danger" data-amsler="distortion">' + t("amslerBad") + "</button>" +
        "</div>" +
        '<div id="amslerResult"></div>' +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("wellness"); });
        $("#eyeStart").addEventListener("click", runEyeSession);
        each("[data-amsler]", function (b) {
          b.addEventListener("click", function () {
            var res = b.getAttribute("data-amsler");
            W().amsler = { date: today(), result: res };
            V.save();
            var box = $("#amslerResult");
            if (res === "normal") {
              box.innerHTML = '<div class="note-ok">' + V.icon("check") + " " + t("amslerNormalMsg") + "</div>";
            } else {
              box.innerHTML = '<div class="note-warn">' + V.icon("shield") + " " + t("amslerBadMsg") +
                ' <button class="link-btn" data-bookeye>' + t("amslerBook") + "</button></div>";
              var bk = box.querySelector("[data-bookeye]");
              if (bk) bk.addEventListener("click", function () { V.openClinics ? V.openClinics("derm", { ka: "ოფთალმოლოგი", en: "Ophthalmologist" }) : V.go("clinics"); });
            }
          });
        });
      }}
    );

    function runEyeSession() {
      var stage = $("#eyeStage"), dot = $("#eyeDot"), overlay = $("#eyeOverlay");
      var phaseEl = $("#eyePhase"), timerEl = $("#eyeTimer");
      if (!stage) return;
      overlay.style.display = "none";
      stage.classList.add("running");
      var pi = -1, start = 0, raf = 0;

      function nextPhase() {
        pi++;
        if (pi >= EYE_PHASES.length) return finish();
        var ph = EYE_PHASES[pi];
        phaseEl.textContent = L(ph.label);
        start = performance.now();
        if (ph.kind === "far") {
          dot.style.opacity = "0";
          stage.classList.add("far");
        } else {
          dot.style.opacity = "1";
          stage.classList.remove("far");
        }
        tick(ph);
      }
      function tick(ph) {
        if (!alive(stage)) { cancelAnimationFrame(raf); return; } // self-clean
        var elapsed = (performance.now() - start) / 1000;
        var left = Math.max(0, ph.secs - elapsed);
        timerEl.textContent = Math.ceil(left) + "s";
        if (ph.kind === "path") moveDot(dot, stage, ph.path, elapsed);
        if (left <= 0) return nextPhase();
        raf = requestAnimationFrame(function () { tick(ph); });
      }
      function finish() {
        stage.classList.remove("running", "far");
        phaseEl.textContent = t("eyeComplete");
        timerEl.textContent = "";
        dot.style.opacity = "0";
        W().eyeLog = W().eyeLog || {};
        if (!W().eyeLog[today()]) {
          W().eyeLog[today()] = true;
          V.awardOnce && V.awardOnce("eye:" + today(), V.POINTS.task, "task");
        }
        V.save();
        overlay.style.display = "";
        overlay.innerHTML = '<p class="eye-done">✓ ' + t("eyeDoneToday") + "</p>" +
          '<button class="btn btn-ghost" id="eyeAgain" style="margin-top:8px">' + t("eyeAgain") + "</button>";
        var ag = $("#eyeAgain"); if (ag) ag.addEventListener("click", runEyeSession);
        if (navigator.vibrate) navigator.vibrate(40);
      }
      nextPhase();
    }

    function moveDot(dot, stage, path, t0) {
      var w = stage.clientWidth, h = stage.clientHeight, pad = 26;
      var cx = w / 2, cy = h / 2, ax = (w - pad * 2) / 2, ay = (h - pad * 2) / 2;
      var speed = 0.9, a = t0 * speed * Math.PI; // radians
      var x = cx, y = cy;
      if (path === "horizontal") { x = cx + Math.sin(a) * ax; y = cy; }
      else if (path === "vertical") { x = cx; y = cy + Math.sin(a) * ay; }
      else if (path === "circle") { x = cx + Math.cos(a) * ax * 0.82; y = cy + Math.sin(a) * ay * 0.82; }
      else if (path === "infinity") { x = cx + Math.sin(a) * ax * 0.85; y = cy + Math.sin(a * 2) * ay * 0.5; }
      dot.style.transform = "translate(" + (x - 9) + "px," + (y - 9) + "px)";
    }
  };

  function amslerSVG() {
    var n = 20, s = 260, step = s / n, lines = "";
    for (var i = 0; i <= n; i++) {
      var p = (i * step).toFixed(1);
      lines += '<line x1="' + p + '" y1="0" x2="' + p + '" y2="' + s + '"/>';
      lines += '<line x1="0" y1="' + p + '" x2="' + s + '" y2="' + p + '"/>';
    }
    return '<svg viewBox="0 0 ' + s + ' ' + s + '" class="amsler" width="' + s + '" height="' + s + '">' +
      '<rect width="' + s + '" height="' + s + '" fill="#fff"/>' +
      '<g stroke="#111" stroke-width="1">' + lines + "</g>" +
      '<circle cx="' + (s / 2) + '" cy="' + (s / 2) + '" r="4.5" fill="#111"/></svg>';
  }

  /* ===================== BREATHING (box 4-4-4-4) ===================== */
  var BREATHE_STEPS = [
    { key: "in",   secs: 4, scale: 1.0,  label: { ka: "ჩაისუნთქე", en: "Breathe in" } },
    { key: "hold", secs: 4, scale: 1.0,  label: { ka: "შეიკავე", en: "Hold" } },
    { key: "out",  secs: 4, scale: 0.55, label: { ka: "ამოისუნთქე", en: "Breathe out" } },
    { key: "hold2",secs: 4, scale: 0.55, label: { ka: "შეიკავე", en: "Hold" } },
  ];
  var BREATHE_TARGET = 5; // cycles

  V.screens.breathe = function () {
    V.mount(
      V.statusbar() +
      '<div class="screen breathe-screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.iconBox("lungs", "green") + "<h1>" + t("brTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("brSub") + "</p>" +
        '<div class="breathe-stage">' +
          '<div class="breathe-rings"><span></span><span></span><span></span></div>' +
          '<div class="breathe-orb" id="brOrb"><b id="brLabel">' + t("brReady") + '</b><span id="brCount"></span></div>' +
        "</div>" +
        '<div class="breathe-meta"><span id="brCycles">0 / ' + BREATHE_TARGET + " " + t("brCycles") + '</span></div>' +
        '<button class="btn btn-primary" id="brStart" style="width:100%">' + V.icon("lungs") + " " + t("brStart") + "</button>" +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("wellness"); });
        $("#brStart").addEventListener("click", startBreathe);
      }}
    );

    function startBreathe() {
      var orbEl = $("#brOrb"), label = $("#brLabel"), count = $("#brCount"), cyc = $("#brCycles"), btn = $("#brStart");
      if (!orbEl) return;
      btn.disabled = true; btn.textContent = t("brGoing");
      var si = -1, cycle = 0, start = 0, raf = 0;

      function nextStep() {
        si++;
        if (si >= BREATHE_STEPS.length) { si = 0; cycle++; cyc.textContent = cycle + " / " + BREATHE_TARGET + " " + t("brCycles"); if (cycle >= BREATHE_TARGET) return finish(); }
        var st = BREATHE_STEPS[si];
        label.textContent = L(st.label);
        orbEl.style.transition = "transform " + st.secs + "s ease-in-out";
        orbEl.style.transform = "scale(" + st.scale + ")";
        start = performance.now();
        tick(st);
      }
      function tick(st) {
        if (!alive(orbEl)) { cancelAnimationFrame(raf); return; }
        var left = Math.max(0, st.secs - (performance.now() - start) / 1000);
        count.textContent = Math.ceil(left);
        if (left <= 0) return nextStep();
        raf = requestAnimationFrame(function () { tick(st); });
      }
      function finish() {
        label.textContent = t("brDone"); count.textContent = "";
        orbEl.style.transform = "scale(.8)";
        var w = W(); w.breatheLog = w.breatheLog || {};
        w.breatheLog[today()] = (w.breatheLog[today()] || 0) + 1;
        V.awardOnce && V.awardOnce("breathe:" + today(), V.POINTS.task, "task");
        V.save();
        if (btn) { btn.disabled = false; btn.textContent = t("brAgain"); }
        if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
      }
      nextStep();
    }
  };
})();
