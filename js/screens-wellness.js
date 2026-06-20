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
  function daysSince(iso) { return iso ? Math.round((new Date(today()) - new Date(iso)) / 86400000) : 1e9; }
  function alive(el) { return el && document.body.contains(el); }

  function W() { return (V.state.wellness = V.state.wellness || {}); }

  /* tools shown in the hub — only those with a built screen. group: exercises | track | programs */
  V.wellnessTools = [
    { id: "eye",     route: "eyecare",   group: "exercises", icon: "eye",      tone: "blue",    name: { ka: "თვალის მოვლა", en: "Eye care" },        desc: { ka: "20-20-20 + Amsler ტესტი", en: "20-20-20 + Amsler test" } },
    { id: "breathe", route: "breathe",   group: "exercises", icon: "lungs",    tone: "green",   name: { ka: "სუნთქვის ვარჯიში", en: "Breathing" },     desc: { ka: "ბოქს-სუნთქვა 4-4-4-4", en: "Box breathing 4-4-4-4" } },
    { id: "posture", route: "posture",   group: "exercises", icon: "walk",     tone: "pink",    name: { ka: "ოფისის ვარჯიში", en: "Office workout" },  desc: { ka: "18 მაგიდის ვარჯიში", en: "18 desk exercises" } },
    { id: "scan",    route: "scan",      group: "track", phone: true, icon: "heart", tone: "crimson", name: { ka: "AI ჯანმრთელობის სკანი", en: "AI Health Scan" }, desc: { ka: "კამერით vitals 30 წმ-ში", en: "Camera vitals in 30s" } },
    { id: "symptom", route: "symptom",   group: "track", icon: "stethoscope", tone: "pink", name: { ka: "სიმპტომ-ჩეკერი", en: "Symptom checker" }, desc: { ka: "AI ტრიაჟი → ექიმი", en: "AI triage → doctor" } },
    { id: "hr",      route: "heartrate", group: "track", phone: true, icon: "heart", tone: "crimson", name: { ka: "გულისცემა კამერით", en: "Heart rate" },   desc: { ka: "თითი კამერაზე (PPG)", en: "Finger on camera (PPG)" } },
    { id: "mind",    route: "mindtests", group: "track", icon: "brain",    tone: "blue",    name: { ka: "მენტალური ტესტები", en: "Mental tests" }, desc: { ka: "PHQ-9 · GAD-7", en: "PHQ-9 · GAD-7" } },
    { id: "mood",    route: "mood",      group: "track", icon: "smile",    tone: "yellow",  name: { ka: "განწყობის დღიური", en: "Mood journal" },  desc: { ka: "ყოველდღიური განწყობა", en: "Daily mood" } },
    { id: "bp",      route: "bplog",     group: "track", icon: "drop",     tone: "crimson", name: { ka: "წნევის დღიური", en: "Blood pressure" }, desc: { ka: "სისტ./დიასტ. + პულსი", en: "Sys/dia + pulse log" } },
    { id: "sleep",   route: "sleep",     group: "track", icon: "moon",     tone: "blue",    name: { ka: "ძილის დღიური", en: "Sleep diary" },     desc: { ka: "ხანგრძლივობა + ხარისხი", en: "Duration + quality" } },
    { id: "fasting", route: "fasting",   group: "programs", icon: "flame",    tone: "yellow",  name: { ka: "უზმოობის ტაიმერი", en: "Fasting timer" }, desc: { ka: "16:8 · 18:6 · OMAD", en: "16:8 · 18:6 · OMAD" } },
    { id: "quit",    route: "quitsmoke", group: "programs", icon: "smoke",    tone: "green",   name: { ka: "მოწევის თავის დანებება", en: "Quit smoking" }, desc: { ka: "უსიგარეტო დღეები + ფული", en: "Smoke-free days + money" } },
    { id: "risk",    route: "risk",      group: "programs", icon: "shield",   tone: "blue",    name: { ka: "რისკის კალკულატორი", en: "Risk calculator" }, desc: { ka: "დიაბეტი (FINDRISC)", en: "Diabetes (FINDRISC)" } },
  ];
  var WELL_GROUPS = [
    { id: "exercises", label: { ka: "ვარჯიშები", en: "Exercises" } },
    { id: "track",     label: { ka: "ტესტები და ტრეკინგი", en: "Tests & tracking" } },
    { id: "programs",  label: { ka: "პროგრამები", en: "Programs" } },
  ];

  /* ===================== WELLNESS HUB ===================== */
  V.screens.wellness = function () {
    function card(tool) {
      return '<button class="well-tile" data-go="' + tool.route + '">' +
        V.iconBox(tool.icon, tool.tone) +
        '<div class="well-tile__t"><b>' + L(tool.name) + (tool.phone ? ' <span class="well-phone" title="' + t("wellPhone") + '">' + V.icon("camera") + "</span>" : "") + "</b><small>" + L(tool.desc) + "</small></div>" +
        V.icon("back") + "</button>";
    }
    var groups = WELL_GROUPS.map(function (g) {
      var tools = V.wellnessTools.filter(function (tt) { return tt.group === g.id; });
      if (!tools.length) return "";
      return '<div class="well-group-h">' + L(g.label) + "</div>" +
        '<div class="well-grid">' + tools.map(card).join("") + "</div>";
    }).join("");
    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("wellTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("x") + "</button></div>" +
        '<p class="s-sub">' + t("wellSub") + "</p>" +
        groups +
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

  /* ===================== SYMPTOM CHECKER (rule-based triage) ===================== */
  // urgency rank: higher = more urgent
  var URANK = { routine: 0, soon: 1, urgent: 2, emergency: 3 };

  // each rule: matchers (ka/en regexes), specialist, checkupId for openClinics, urgency, advice
  var SYMPTOM_RULES = [
    { re: [/chest pain|chest tight|chest pressure|გულმკერდ|გულის ტკივ|გულის არე/],
      flagRe: [/breath|short of breath|arm|jaw|sweat|სუნთქ|მკლავ|ხელ|ყბ|ოფლ/],
      spec: { ka: "კარდიოლოგი", en: "Cardiologist" }, checkupId: "lipid",
      urgency: "urgent", flagUrgency: "emergency",
      advice: { ka: "გულმკერდის ტკივილი სუნთქვის გაძნელებასთან ან მკლავში გადასვლასთან ერთად — დარეკე 112. სხვა შემთხვევაში დაუყოვნებლივ ნახე კარდიოლოგი.", en: "Chest pain with shortness of breath or pain spreading to the arm/jaw — call 112. Otherwise see a cardiologist urgently." } },
    { re: [/can'?t breathe|shortness of breath|hard to breathe|სუნთქვის გაძნელ|ვერ ვსუნთქ|ჰაერი არ მყოფ/],
      spec: { ka: "პულმონოლოგი", en: "Pulmonologist" }, checkupId: "general",
      urgency: "urgent",
      advice: { ka: "სუნთქვის მძიმე გაძნელება — სასწრაფო დახმარება. მსუბუქი შემთხვევა — მიმართე ექიმს 24 საათში.", en: "Severe breathing difficulty — seek emergency care. If mild, see a doctor within 24h." } },
    { re: [/face droop|slurred speech|sudden weakness|one side|stroke|სახის დაკ|მეტყველება|ცალ მხარ|ინსულტ/],
      spec: { ka: "ნევროლოგი", en: "Neurologist" }, checkupId: "general",
      urgency: "emergency",
      advice: { ka: "ინსულტის ნიშნები (სახის დაკიდება, მეტყველების დარღვევა, ცალი მხარის სისუსტე) — დაუყოვნებლივ 112.", en: "Stroke signs (face droop, slurred speech, one-sided weakness) — call 112 immediately." } },
    { re: [/faint|passed out|unconscious|gulis wasvla|გონ.*დაკარგ|გული წამივ|ცნობიერ/],
      spec: { ka: "თერაპევტი", en: "GP / Internist" }, checkupId: "general",
      urgency: "urgent",
      advice: { ka: "გონების დაკარგვა საჭიროებს გადაუდებელ შეფასებას, განსაკუთრებით თუ განმეორდა.", en: "Loss of consciousness needs urgent evaluation, especially if it recurs." } },
    { re: [/headache|migraine|თავის ტკივ|მიგრენ/],
      flagRe: [/worst|sudden|thunderclap|stiff neck|vision|უარეს|უძლიერეს|მოულოდნ|კისრის|მხედველ/],
      spec: { ka: "ნევროლოგი", en: "Neurologist" }, checkupId: "general",
      urgency: "soon", flagUrgency: "emergency",
      advice: { ka: "ჩვეულებრივი თავის ტკივილი — დასვენება, წყალი, დაკვირვება. უძლიერესი/მოულოდნელი ტკივილი მხედველობის ან კისრის სიმაგრით — 112.", en: "Ordinary headache — rest, hydrate, monitor. A sudden 'worst-ever' headache with vision change or stiff neck — call 112." } },
    { re: [/dizzy|dizziness|vertigo|თავბრუ|თავბრუსხ|ბრუ მესხ/],
      spec: { ka: "ნევროლოგი", en: "Neurologist" }, checkupId: "general",
      urgency: "soon",
      advice: { ka: "თავბრუსხვევა ხშირად დაკავშირებულია დეჰიდრატაციასთან, წნევასთან ან შიდა ყურთან. დალიე წყალი და დაისვენე; თუ გრძელდება — ნახე ექიმი.", en: "Dizziness often relates to dehydration, blood pressure or the inner ear. Hydrate and rest; if it persists, see a doctor." } },
    { re: [/stomach|abdomen|abdominal|tummy|nausea|vomit|diarr|მუცლის|კუჭ|გულისრევ|ღებინ|დიარ|ფაღარ/],
      flagRe: [/blood|severe|right lower|appendix|სისხლ|ძლიერ|მარჯვენა ქვედა|აპენდი/],
      spec: { ka: "გასტროენტეროლოგი", en: "Gastroenterologist" }, checkupId: "general",
      urgency: "soon", flagUrgency: "urgent",
      advice: { ka: "მუცლის მსუბუქი ტკივილი — მსუბუქი საკვები, წყალი, დაკვირვება. ძლიერი მარჯვენა-ქვედა ტკივილი ან სისხლი — სასწრაფოდ ექიმთან.", en: "Mild belly pain — light food, fluids, monitor. Severe right-lower pain or blood — see a doctor urgently." } },
    { re: [/rash|hives|itch|skin|acne|eczema|გამონაყ|ქავილ|კანის|აკნე|ეგზემ/],
      spec: { ka: "დერმატოლოგი", en: "Dermatologist" }, checkupId: "derm",
      urgency: "routine",
      advice: { ka: "მოერიდე ფხანას, გამოიყენე მსუბუქი დამატენიანებელი. თუ სწრაფად ვრცელდება ან სიცხეს ახლავს — ნახე ექიმი.", en: "Avoid scratching, use a gentle moisturizer. If it spreads fast or comes with fever, see a doctor." } },
    { re: [/anx|panic|depress|sad|hopeless|stress|can'?t sleep|insomnia|შფოთ|პანიკ|დეპრეს|სევდ|უიმედ|სტრეს|ვერ მძინავ|უძილ/],
      spec: { ka: "ფსიქოლოგი / ფსიქიატრი", en: "Psychologist / Psychiatrist" }, checkupId: "mental",
      urgency: "soon",
      advice: { ka: "სცადე სუნთქვის ვარჯიში და რეგულარული ძილი. სიმძიმის შესაფასებლად გაიარე PHQ-9 / GAD-7 ტესტი მენტალურ ხელსაწყოებში.", en: "Try a breathing exercise and regular sleep. To gauge severity, take the PHQ-9 / GAD-7 test in the mental tools." } },
    { re: [/back pain|joint|knee|shoulder|ზურგის|სახსრ|მუხლ|მხრის|წელის ტკივ/],
      spec: { ka: "ორთოპედი", en: "Orthopedist" }, checkupId: "general",
      urgency: "routine",
      advice: { ka: "მსუბუქი დატვირთვა, სწორი პოზა და გაჭიმვა. თუ ტკივილი ფეხში გადადის ან ნემსავს — ნახე ექიმი.", en: "Light movement, good posture and stretching. If pain radiates down the leg or there's numbness, see a doctor." } },
    { re: [/sore throat|throat|ear|ენ? ?ტ|ყელის ტკივ|ყელ.*მტკ|ყურის/],
      spec: { ka: "ოტოლარინგოლოგი (ЛОР)", en: "ENT (otolaryngologist)" }, checkupId: "general",
      urgency: "routine",
      advice: { ka: "თბილი სითხეები, დასვენება. თუ 3+ დღე გრძელდება მაღალ სიცხესთან — ნახე ექიმი.", en: "Warm fluids, rest. If it lasts 3+ days with high fever, see a doctor." } },
    { re: [/fever|temperature|სიცხ|ტემპერატ|ცხელ/],
      flagRe: [/39|40|stiff neck|rash|3 day|three day|კისრ|გამონაყ|3 დღ|სამი დღ/],
      spec: { ka: "თერაპევტი", en: "GP / Internist" }, checkupId: "general",
      urgency: "soon", flagUrgency: "urgent",
      advice: { ka: "დაისვენე, დალიე ბევრი სითხე. სიცხე 39°C-ზე მაღალი, 3+ დღე, ან კისრის სიმაგრესთან — სასწრაფოდ ექიმთან.", en: "Rest and drink plenty of fluids. Fever above 39°C, lasting 3+ days, or with a stiff neck — see a doctor urgently." } },
    { re: [/cough|cold|flu|ხველ|გაციებ|სურდ/],
      spec: { ka: "თერაპევტი", en: "GP / Internist" }, checkupId: "general",
      urgency: "routine",
      advice: { ka: "დასვენება, სითხეები, თბილი ორთქლი. თუ ხველა 2+ კვირა გრძელდება ან სისხლი ერევა — ნახე ექიმი.", en: "Rest, fluids, warm steam. If the cough lasts 2+ weeks or has blood, see a doctor." } },
    { re: [/tired|fatigue|exhaust|no energy|დაღლ|ენერგია არ|გადაღლ|უღონ/],
      spec: { ka: "თერაპევტი", en: "GP / Internist" }, checkupId: "energy",
      urgency: "routine",
      advice: { ka: "ხანგრძლივი დაღლილობა შეიძლება ანემიის, ფარისებრის ან D-ვიტამინის ნიშანი იყოს — გაიარე ზოგადი ანალიზები.", en: "Persistent fatigue can signal anemia, thyroid or low vitamin D — consider a general blood panel." } },
  ];

  // count how many distinct symptom keywords (regex alternatives) actually matched → likelihood signal
  function countHits(reList, lc) {
    if (!reList) return 0;
    var n = 0;
    reList.forEach(function (re) {
      re.source.split("|").forEach(function (p) { if (!p) return; try { if (new RegExp(p, "i").test(lc)) n++; } catch (e) {} });
    });
    return n;
  }
  // demographic/profile priors — "compare to similar profiles" (Infermedica/K Health style)
  function profilePrior(rule) {
    var p = V.state.profile || {}, s = 0, factors = [], ka = V.lang() === "ka";
    function add(n, fk, fe) { s += n; factors.push(ka ? fk : fe); }
    var age = +p.age || 0;
    if (rule.checkupId === "lipid") {            // cardiac
      if (age >= 60) add(2, age + " წ", age + "y"); else if (age >= 45) add(1, age + " წ", age + "y");
      if (p.sex === "man") add(0.6, "მამაკაცი", "male");
      if (p.conditions && p.conditions.indexOf("hyper") >= 0) add(1.2, "მაღალი წნევა", "high BP");
      if (p.conditions && p.conditions.indexOf("chol") >= 0) add(1, "ქოლესტერინი", "high cholesterol");
      if (p.smoking === "daily") add(0.8, "მოწევა", "smoking");
    } else if (rule.checkupId === "mental") {
      if (p.stress === "high" || p.stress === "burn") add(1, "სტრესი", "stress");
      if (p.mood === "anx" || p.mood === "low") add(0.8, "დაბალი განწყობა", "low mood");
      if (p.sleepQ === "poor" || p.sleepQ === "ins") add(0.5, "ცუდი ძილი", "poor sleep");
    } else if (rule.spec && rule.spec.en.indexOf("Pulmonologist") >= 0) {
      if (p.smoking === "daily") add(1, "მოწევა", "smoking");
    }
    return { score: s, factors: factors };
  }

  function triage(text) {
    var lc = " " + (text || "").toLowerCase() + " ";
    function any(arr) { for (var i = 0; i < arr.length; i++) if (arr[i].test(lc)) return true; return false; }

    // hard self-harm red flag first
    if (/suicid|kill myself|end my life|self.?harm|hurt myself|თავის მოკვლ|თავი მოვიკლ|აღარ მინდა ცხოვრ|თავის დაზიან/.test(lc)) {
      return { crisis: true, urgency: "emergency", spec: { ka: "კრიზისული დახმარება", en: "Crisis support" }, checkupId: "mental",
        advice: { ka: "დაუყოვნებლივ დარეკე 116 123 (კრიზისის ხაზი) ან 112. შენ მარტო არ ხარ.", en: "Call 116 123 (crisis line) or 112 right now. You are not alone." } };
    }

    var matched = [];
    SYMPTOM_RULES.forEach(function (r) {
      if (any(r.re)) {
        var flagged = !!(r.flagRe && any(r.flagRe));
        var urg = (flagged && r.flagUrgency) ? r.flagUrgency : r.urgency;
        var prior = profilePrior(r);
        var score = countHits(r.re, lc) + (flagged ? countHits(r.flagRe, lc) * 1.5 + 1 : 0) + prior.score;
        matched.push({ rule: r, urgency: urg, score: score, factors: prior.factors });
      }
    });
    if (!matched.length) {
      return { unknown: true, urgency: "soon", spec: { ka: "თერაპევტი", en: "GP / Internist" }, checkupId: "general",
        advice: { ka: "სიმპტომი ცალსახად ვერ დავაკავშირე. დაიწყე თერაპევტით — ის საჭიროებისას მიგმართავს სპეციალისტთან.", en: "I couldn't map this clearly. Start with a GP — they'll refer you to a specialist if needed." } };
    }
    // rank: safety first (urgency), then likelihood (score)
    matched.sort(function (a, b) { return (URANK[b.urgency] - URANK[a.urgency]) || (b.score - a.score); });
    var top = matched[0];
    var maxScore = Math.max.apply(null, matched.map(function (m) { return m.score; })) || 1;
    return {
      urgency: top.urgency, spec: top.rule.spec, checkupId: top.rule.checkupId, advice: top.rule.advice, factors: top.factors,
      candidates: matched.slice(0, 3).map(function (m) { return { spec: m.rule.spec, urgency: m.urgency, strength: Math.max(20, Math.round(m.score / maxScore * 100)) }; }),
    };
  }

  V.screens.symptom = function () {
    var CHIPS = [
      { k: "syHeadache" }, { k: "syFever" }, { k: "syCough" }, { k: "syThroat" }, { k: "syChest" }, { k: "syBreath" },
      { k: "syTummy" }, { k: "syBack" }, { k: "syFatigue" }, { k: "syDizzy" }, { k: "syRash" }, { k: "syAnxiety" },
    ];
    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.iconBox("stethoscope", "pink") + "<h1>" + t("syTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("sySub") + "</p>" +
        '<div class="card-soft" style="padding:14px">' +
          '<textarea id="syInput" class="sy-input" rows="3" placeholder="' + esc(t("syPlaceholder")) + '"></textarea>' +
          '<div class="sy-chips">' + CHIPS.map(function (c) { return '<button class="sy-chip" data-chip="' + esc(t(c.k)) + '">' + esc(t(c.k)) + "</button>"; }).join("") + "</div>" +
          '<button class="btn btn-primary" id="syGo" style="width:100%;margin-top:6px">' + V.icon("stethoscope") + " " + t("syAnalyze") + "</button>" +
        "</div>" +
        '<div id="syResult"></div>' +
        '<p class="sy-disc">' + t("syDisclaimer") + "</p>" +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("wellness"); });
        var input = $("#syInput");
        each("[data-chip]", function (b) {
          b.addEventListener("click", function () {
            var v = b.getAttribute("data-chip");
            input.value = input.value.trim() ? input.value.trim() + ", " + v : v;
            input.focus();
          });
        });
        $("#syGo").addEventListener("click", function () {
          var text = input.value.trim();
          var box = $("#syResult");
          if (!text) { box.innerHTML = '<div class="note-warn">' + V.icon("info") + " " + t("syEmpty") + "</div>"; return; }
          var r = triage(text);
          renderTriage(box, r);
          V.awardOnce && V.awardOnce("symptom:" + today(), V.POINTS.task, "task");
          V.save();
        });
      }}
    );

    function renderTriage(box, r) {
      var uClass = r.urgency, uLabel = t("sy" + r.urgency.charAt(0).toUpperCase() + r.urgency.slice(1));
      var html = '<div class="sy-card fade-in">' +
        '<div class="sy-urg sy-urg--' + uClass + '"><span class="sy-dot"></span>' + esc(uLabel) + "</div>";
      if (r.crisis) {
        html += '<div class="note-warn" style="margin-top:12px">' + V.icon("shield") + " " + esc(L(r.advice)) + "</div>";
      } else {
        html += '<div class="sy-spec"><small>' + t("sySpecialist") + "</small><b>" + esc(L(r.spec)) + "</b></div>" +
          '<div class="sy-adv"><small>' + t("syAdvice") + "</small><p>" + esc(L(r.advice)) + "</p></div>";
        if (r.factors && r.factors.length)
          html += '<p class="sy-prior">' + V.icon("user") + " " + (V.lang() === "ka"
            ? "შენი პროფილით (" + esc(r.factors.join(", ")) + ") ეს მიმართულება უფრო რელევანტურია."
            : "Given your profile (" + esc(r.factors.join(", ")) + "), this direction is more relevant.") + "</p>";
        if (r.candidates && r.candidates.length > 1)
          html += '<div class="sy-cands"><small>' + t("syMatch") + "</small>" + r.candidates.map(function (c) {
            return '<div class="sy-cand"><span class="sy-cand__n"><span class="sy-cand__dot sy-urg--' + c.urgency + '"></span>' + esc(L(c.spec)) + "</span>" +
              '<span class="sy-cand__bar"><i style="width:' + c.strength + '%"></i></span></div>';
          }).join("") + "</div>";
      }
      html += '<div class="sy-act">' +
        '<button class="btn btn-primary" data-book>' + V.icon("calendar") + " " + t("syBook") + "</button>" +
        '<button class="btn btn-ghost" data-clear>' + t("syClear") + "</button>" +
        "</div></div>";
      box.innerHTML = html;
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
      var bk = box.querySelector("[data-book]");
      if (bk) bk.addEventListener("click", function () {
        if (V.openClinics) V.openClinics(r.checkupId, r.spec); else V.go("clinics");
      });
      box.querySelector("[data-clear]").addEventListener("click", function () {
        $("#syInput").value = ""; box.innerHTML = ""; $("#syInput").focus();
      });
    }
  };

  /* ===================== HEART RATE (camera PPG) ===================== */
  /* ---- multi-signal PPG analysis (pure fns, wellness-grade estimates) ---- */
  function movingAvg(a, win) {
    if (win < 2) return a.slice();
    var out = [], half = Math.floor(win / 2);
    for (var i = 0; i < a.length; i++) {
      var s = 0, n = 0;
      for (var j = Math.max(0, i - half); j <= Math.min(a.length - 1, i + half); j++) { s += a[j]; n++; }
      out.push(s / n);
    }
    return out;
  }
  // HRV (RMSSD, ms) from beat timestamps; null if too few / implausible beats
  V.ppgHRV = function (beatTimes) {
    if (!beatTimes || beatTimes.length < 6) return null;
    var ibi = [];
    for (var i = 1; i < beatTimes.length; i++) {
      var d = beatTimes[i] - beatTimes[i - 1];
      if (d >= 300 && d <= 2000) ibi.push(d); // plausible 30–200 bpm
    }
    if (ibi.length < 5) return null;
    var ss = 0, m = 0;
    for (var k = 1; k < ibi.length; k++) { var diff = ibi[k] - ibi[k - 1]; ss += diff * diff; m++; }
    if (!m) return null;
    var rmssd = Math.round(Math.sqrt(ss / m));
    return (rmssd >= 5 && rmssd <= 200) ? rmssd : null;
  };
  // respiratory rate (breaths/min) via first-peak autocorrelation of the slow signal; null if weak/short
  V.ppgRR = function (series, durSec) {
    if (!series || durSec < 12 || series.length < 60) return null;
    var fps = series.length / durSec;
    var sShort = movingAvg(series, Math.max(3, Math.round(fps * 1.0)));   // kill cardiac pulse (~1 beat period)
    var trend = movingAvg(sShort, Math.max(5, Math.round(fps * 8)));      // very slow baseline drift
    var resp = [], amp = 0;
    for (var i = 0; i < sShort.length; i++) { var r = sShort[i] - trend[i]; resp.push(r); amp += Math.abs(r); }
    amp /= resp.length;
    if (amp < 0.05) return null; // essentially flat — no respiratory signal
    var minLag = Math.round(fps * 2), maxLag = Math.round(fps * 10), ac = []; // periods 2–10s = 6–30 br/min
    for (var lag = 0; lag <= maxLag + 1; lag++) {
      var s = 0, c = 0;
      for (var j = 0; j + lag < resp.length; j++) { s += resp[j] * resp[j + lag]; c++; }
      ac[lag] = s / c;
    }
    var bestLag = 0; // first prominent autocorrelation peak = fundamental respiratory period
    for (var l = minLag; l <= maxLag; l++) {
      if (ac[l] > ac[l - 1] && ac[l] >= ac[l + 1] && ac[l] > 0.3 * ac[0]) { bestLag = l; break; }
    }
    if (!bestLag) return null;
    var rr = Math.round(60 / (bestLag / fps));
    return (rr >= 6 && rr <= 30) ? rr : null;
  };

  // ---- AI Health Scan derived metrics (pure, wellness-grade) ----
  // stress/recovery from HRV (RMSSD ms): higher HRV → better recovery / lower stress
  V.scanStress = function (hrv) {
    if (!hrv) return null;
    var rec = Math.round(Math.max(15, Math.min(95, (hrv - 10) / 60 * 80 + 20)));
    var stress = 100 - rec;
    var band = stress < 35 ? { k: "scnLow", tone: "green" } : stress < 60 ? { k: "scnMid", tone: "yellow" } : { k: "scnHigh", tone: "crimson" };
    return { recovery: rec, stress: stress, band: band };
  };
  // composite 0-100 scan score from the available signals
  V.scanScore = function (m) {
    m = m || {};
    var s = 70;
    if (m.bpm) s += (m.bpm >= 55 && m.bpm <= 75) ? 12 : (m.bpm <= 90 ? 4 : -8);
    if (m.hrv) s += m.hrv >= 45 ? 12 : m.hrv >= 25 ? 4 : -6;
    if (m.rr) s += (m.rr >= 10 && m.rr <= 18) ? 6 : -4;
    if (m.spo2) s += m.spo2 >= 96 ? 4 : m.spo2 >= 94 ? 0 : -8;
    return Math.max(25, Math.min(99, Math.round(s)));
  };

  // SpO2 estimate from camera PPG — ratio-of-ratios of red vs blue channel
  // (standard empirical R-curve; UNCALIBRATED → wellness estimate, not medical).
  // Returns rounded % (90–100) or null if the signal is too weak to trust.
  V.ppgSpO2 = function (red, blue, durSec) {
    if (!red || !blue || durSec < 12 || red.length < 60 || blue.length < 60) return null;
    function acdc(a) {
      var n = a.length, mean = 0; for (var i = 0; i < n; i++) mean += a[i]; mean /= n;
      if (mean <= 0) return null;
      var ss = 0; for (var j = 0; j < n; j++) { var d = a[j] - mean; ss += d * d; }
      return { ac: Math.sqrt(ss / n), dc: mean };
    }
    var r = acdc(red), b = acdc(blue);
    if (!r || !b || r.ac < 0.3 || b.ac < 0.15) return null; // pulsatile signal too small
    var R = (r.ac / r.dc) / (b.ac / b.dc);
    if (!isFinite(R) || R <= 0) return null;
    var spo2 = Math.round(110 - 25 * R);
    return (spo2 >= 90 && spo2 <= 100) ? spo2 : null;
  };

  // Biological "health age" — chronological age nudged by modifiable factors +
  // the latest camera-scan signals (HRV, resting HR, stress). Wellness estimate.
  V.healthAge = function () {
    var p = V.state.profile || {};
    var chrono = p.age;
    if (!chrono || chrono < 12 || chrono > 100) return null;
    var d = 0;
    var bmi = V.bmi && V.bmi();
    if (bmi != null) { if (bmi >= 30) d += 4; else if (bmi >= 25) d += 2; else if (bmi < 18.5) d += 2; }
    if (p.smoking === "daily") d += 6; else if (p.smoking === "occ") d += 2;
    if (p.activity === "sitting") d += 3; else if (p.activity === "light") d += 1;
    else if (p.activity === "active") d -= 1; else if (p.activity === "very") d -= 2;
    var c = p.conditions || [];
    if (c.indexOf("hyper") >= 0) d += 3;
    if (c.indexOf("chol") >= 0) d += 2;
    if (c.indexOf("pre") >= 0) d += 4;
    if (c.indexOf("thyroid") >= 0) d += 1;
    if (p.sleep === "<5") d += 2; else if (p.sleep === "8+") d -= 1;
    if (p.stress === "burn") d += 2; else if (p.stress === "high") d += 1;
    // latest camera-scan biomarkers (strongest age signal: HRV)
    var w = V.state.wellness || {}, scan = (w.scan && w.scan.length) ? w.scan[w.scan.length - 1] : null;
    var usedScan = false;
    if (scan) {
      if (scan.hrv) { usedScan = true; if (scan.hrv >= 50) d -= 3; else if (scan.hrv >= 35) d -= 1; else if (scan.hrv < 20) d += 3; }
      if (scan.bpm) { usedScan = true; if (scan.bpm <= 60) d -= 2; else if (scan.bpm <= 75) d += 0; else if (scan.bpm <= 90) d += 2; else d += 4; }
      if (scan.stress != null && scan.stress >= 60) { usedScan = true; d += 2; }
    }
    var bio = Math.max(18, Math.min(95, Math.round(chrono + d)));
    var delta = bio - chrono;
    var tone = delta <= -1 ? "green" : delta <= 3 ? "yellow" : "crimson";
    return { chrono: chrono, bio: bio, delta: delta, tone: tone, usedScan: usedScan };
  };

  // cognitive processing-speed band from median visual reaction time (ms)
  V.reactionBand = function (ms) {
    if (ms == null) return null;
    if (ms <= 300) return { k: "rxSharp", tone: "green" };
    if (ms <= 420) return { k: "rxOk", tone: "yellow" };
    return { k: "rxSlow", tone: "crimson" };
  };
  // reaction time → 0-100 cognition sub-score (for the whole-body composite)
  V.reactionScore = function (ms) {
    if (ms == null) return null;
    return Math.max(20, Math.min(99, Math.round(100 - (ms - 220) / 4)));
  };

  /* ---- reusable camera-PPG capture (platform foundation: heart rate + AI Health Scan) ---- */
  // opts: { onStatus(key), onTick(bpm), onDone({bpm,rr,hrv,beatTimes}), onError(key) }
  // returns a stop() function. Caller provides a hidden <video> el id and a wave <canvas> el id.
  function ppgCapture(videoEl, canvasEl, opts) {
    opts = opts || {};
    var face = opts.facing === "user"; // contactless face mode vs fingertip
    var stream = null, raf = 0, running = false, video = videoEl, canvas = canvasEl, ctx, hidden, hctx;
    var waveBuf = [], rawBuf = [], blueBuf = [], beatTimes = [], baseline = 0, lastBeat = 0, beats = 0, startT = 0, measT = 0, prevSig = 0, ampEMA = 0, _firstBeat = 0;
    function status(k) { if (opts.onStatus) opts.onStatus(k); }
    function err(k) { stop(); if (opts.onError) opts.onError(k); }

    function start() {
      if (typeof isSecureContext !== "undefined" && !isSecureContext && location.hostname !== "localhost") { err("hrInsecure"); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { err("hrNoCam"); return; }
      status("hrRequesting");
      navigator.mediaDevices.getUserMedia({ video: { facingMode: face ? "user" : { ideal: "environment" } }, audio: false })
        .catch(function () { return navigator.mediaDevices.getUserMedia({ video: true, audio: false }); })
        .then(onStream).catch(camFail);
    }
    function onStream(s) {
      stream = s;
      var track = s.getVideoTracks()[0];
      if (!face) { try { if (track.applyConstraints) track.applyConstraints({ advanced: [{ torch: true }] }).catch(function () {}); } catch (e) {} }
      video.srcObject = s; var pp = video.play(); if (pp && pp.catch) pp.catch(function () {});
      ctx = canvas.getContext("2d");
      hidden = document.createElement("canvas"); hidden.width = 60; hidden.height = 60; hctx = hidden.getContext("2d");
      waveBuf = []; rawBuf = []; blueBuf = []; beatTimes = []; baseline = 0; lastBeat = 0; beats = 0; prevSig = 0; ampEMA = 0; measT = 0; _firstBeat = 0; startT = performance.now();
      running = true; status("hrPlace"); loop();
    }
    function camFail(e) {
      var k = (e && e.name === "NotAllowedError") ? "hrDenied" : (e && (e.name === "NotFoundError" || e.name === "OverconstrainedError")) ? "hrNoDevice" : "hrNoCam";
      err(k);
    }
    function firstBeatT() { if (!_firstBeat && lastBeat) _firstBeat = startT + 5000; return _firstBeat || startT; }
    function loop() {
      if (!running) return;
      if (!document.body.contains(canvas)) { stop(); return; }
      raf = requestAnimationFrame(loop);
      if (!video || video.readyState < 2) return;
      hctx.drawImage(video, 0, 0, 60, 60);
      var d = hctx.getImageData(20, 20, 20, 20).data, rSum = 0, bSum = 0, n = 0;
      for (var i = 0; i < d.length; i += 4) { rSum += d[i]; bSum += d[i + 2]; n++; }
      var v = rSum / n, vb = bSum / n, now = performance.now(), elapsed = (now - startT) / 1000;
      baseline = baseline ? baseline * 0.92 + v * 0.08 : v;
      var sig = v - baseline; ampEMA = ampEMA * 0.95 + Math.abs(sig) * 0.05;
      waveBuf.push(sig); if (waveBuf.length > 200) waveBuf.shift();
      drawWave();
      var fingerOn = face ? (ampEMA > 0.12) : (v < 150 && ampEMA > 0.25);
      if (!fingerOn) { status(face ? "scnFaceHold" : (ampEMA <= 0.25 && v < 150 ? "hrWeak" : "hrPlace")); }
      else {
        status("hrMeasuring");
        if (!measT) measT = now;
        rawBuf.push(v); if (rawBuf.length > 4000) rawBuf.shift();
        blueBuf.push(vb); if (blueBuf.length > 4000) blueBuf.shift();
        if (prevSig > 0 && sig <= 0 && (now - lastBeat) > 300) { if (lastBeat) beats++; beatTimes.push(now); lastBeat = now; }
        if (elapsed > 5 && beats >= 2) { var bpm = Math.round(beats / ((now - firstBeatT()) / 60000)); if (bpm >= 35 && bpm <= 210 && opts.onTick) opts.onTick(bpm); }
      }
      prevSig = sig;
      if (elapsed >= 24 && beats >= 4) finish();
      else if (elapsed >= 32) err("hrWeak");
    }
    function drawWave() {
      if (!ctx) return; var W2 = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W2, H); ctx.strokeStyle = "#e8536b"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
      var max = 1; for (var i = 0; i < waveBuf.length; i++) max = Math.max(max, Math.abs(waveBuf[i]));
      ctx.beginPath();
      for (var j = 0; j < waveBuf.length; j++) { var x = (j / 200) * W2, y = H / 2 - (waveBuf[j] / max) * (H / 2 - 8); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    function finish() {
      var endT = performance.now(), spanMin = (endT - firstBeatT()) / 60000, bpm = Math.round(beats / spanMin);
      var measSec = measT ? (endT - measT) / 1000 : 0, rr = V.ppgRR(rawBuf, measSec), hrv = V.ppgHRV(beatTimes);
      var spo2 = V.ppgSpO2(rawBuf, blueBuf, measSec);
      stop();
      if (bpm < 35 || bpm > 210) { if (opts.onError) opts.onError("hrWeak"); return; }
      if (opts.onDone) opts.onDone({ bpm: bpm, rr: rr, hrv: hrv, spo2: spo2 });
    }
    function stop() {
      running = false; if (raf) cancelAnimationFrame(raf);
      if (stream) { stream.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e) {} }); stream = null; }
    }
    start();
    return stop;
  }
  V.ppgCapture = ppgCapture;

  V.screens.heartrate = function () {
    var w = W();
    var last = (w.hr && w.hr.length) ? w.hr[w.hr.length - 1] : null;

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.iconBox("heart", "crimson") + "<h1>" + t("hrTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("hrSub") + "</p>" +

        '<div class="card-soft hr-card">' +
          '<div class="hr-readout"><b id="hrBpm">--</b><small>' + t("hrBpm") + "</small></div>" +
          '<div class="hr-extra" id="hrExtra"></div>' +
          '<canvas id="hrWave" class="hr-wave" width="600" height="120"></canvas>' +
          '<div class="hr-status" id="hrStatus">' + t("hrRestNote") + "</div>" +
          '<button class="btn btn-primary" id="hrStart" style="width:100%">' + V.icon("heart") + " " + t("hrStart") + "</button>" +
        "</div>" +

        '<div class="hr-manual">' +
          '<input id="hrManual" class="field" type="number" inputmode="numeric" min="30" max="220" placeholder="' + esc(t("hrManualPh")) + '">' +
          '<button class="btn btn-ghost" id="hrManualSave">' + t("hrManual") + "</button>" +
        "</div>" +
        '<div id="hrMsg"></div>' +
        (last ? '<div class="hr-last">' + t("hrLast") + ": <b>" + last.bpm + " " + t("hrBpm") + "</b>" + (last.rr ? " · " + last.rr + " " + t("hrRRUnit") : "") + (last.hrv ? " · HRV " + last.hrv + " ms" : "") + " · " + esc(last.date) + "</div>" : "") +
        '<p class="hr-multi-note">' + t("hrSkinNote") + "</p>" +
        '<video id="hrVideo" playsinline muted style="display:none"></video>' +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { stop(); V.go("wellness"); });
        $("#hrStart").addEventListener("click", toggle);
        $("#hrManualSave").addEventListener("click", function () {
          var v = parseInt($("#hrManual").value, 10);
          if (!v || v < 30 || v > 220) { $("#hrMsg").innerHTML = '<div class="note-warn">' + V.icon("info") + " " + esc(t("hrManualPh")) + "</div>"; return; }
          saveReading(v);
        });
      }}
    );

    var stream = null, raf = 0, running = false, video, canvas, ctx, hidden, hctx;
    var samples = [], waveBuf = [], rawBuf = [], beatTimes = [], baseline = 0, lastBeat = 0, beats = 0, startT = 0, measT = 0, prevSig = 0, ampEMA = 0;

    function toggle() { if (running) { stop(); resetUI(); } else start(); }
    function resetUI() {
      var b = $("#hrStart"); if (b) { b.disabled = false; b.innerHTML = V.icon("heart") + " " + t("hrStart"); }
      var s = $("#hrStatus"); if (s) s.textContent = t("hrRestNote");
    }

    function start() {
      if (typeof isSecureContext !== "undefined" && !isSecureContext && location.hostname !== "localhost") { camErr("hrInsecure"); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { camErr("hrNoCam"); return; }
      var b = $("#hrStart"); if (b) b.disabled = true;
      $("#hrStatus").textContent = t("hrRequesting");
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
        .catch(function () { return navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }) // any camera if rear fails
        .then(onStream)
        .catch(camFail);
    }
    function onStream(s) {
      stream = s;
      var track = s.getVideoTracks()[0];
      try { if (track.applyConstraints) track.applyConstraints({ advanced: [{ torch: true }] }).catch(function () {}); } catch (e) {}
      video = $("#hrVideo"); video.srcObject = s;
      var pp = video.play(); if (pp && pp.catch) pp.catch(function () {});
      canvas = $("#hrWave"); ctx = canvas.getContext("2d");
      hidden = document.createElement("canvas"); hidden.width = 60; hidden.height = 60; hctx = hidden.getContext("2d");
      samples = []; waveBuf = []; rawBuf = []; beatTimes = []; baseline = 0; lastBeat = 0; beats = 0; prevSig = 0; ampEMA = 0; measT = 0; startT = performance.now();
      running = true;
      var b = $("#hrStart"); if (b) { b.disabled = false; b.innerHTML = V.icon("x") + " " + t("hrCancel"); }
      $("#hrStatus").textContent = t("hrPlace");
      loop();
    }
    function camFail(err) {
      var b = $("#hrStart"); if (b) { b.disabled = false; b.innerHTML = V.icon("heart") + " " + t("hrStart"); }
      var key = (err && err.name === "NotAllowedError") ? "hrDenied"
        : (err && (err.name === "NotFoundError" || err.name === "OverconstrainedError")) ? "hrNoDevice" : "hrNoCam";
      camErr(key);
    }
    function camErr(key) { var m = $("#hrMsg"); if (m) m.innerHTML = '<div class="note-warn">' + V.icon("info") + " " + t(key) + "</div>"; var mi = $("#hrManual"); if (mi) mi.focus(); var st = $("#hrStatus"); if (st) st.textContent = t("hrRestNote"); }

    function loop() {
      if (!running) return;
      if (!alive($("#hrWave"))) { stop(); return; } // self-clean on navigation
      raf = requestAnimationFrame(loop);
      if (!video || video.readyState < 2) return;
      hctx.drawImage(video, 0, 0, 60, 60);
      var d = hctx.getImageData(20, 20, 20, 20).data; // center patch
      var rSum = 0, n = 0;
      for (var i = 0; i < d.length; i += 4) { rSum += d[i]; n++; }
      var v = rSum / n;
      var now = performance.now(), elapsed = (now - startT) / 1000;

      baseline = baseline ? baseline * 0.92 + v * 0.08 : v;
      var sig = v - baseline;
      ampEMA = ampEMA * 0.95 + Math.abs(sig) * 0.05;

      // waveform
      waveBuf.push(sig); if (waveBuf.length > 200) waveBuf.shift();
      drawWave();

      var fingerOn = v < 150 && ampEMA > 0.25; // dark red-saturated frame + pulsation
      if (!fingerOn) {
        $("#hrStatus").textContent = ampEMA <= 0.25 && v < 150 ? t("hrWeak") : t("hrPlace");
      } else {
        $("#hrStatus").textContent = t("hrMeasuring");
        if (!measT) measT = now;
        rawBuf.push(v); if (rawBuf.length > 4000) rawBuf.shift();
        // beat = downward zero-crossing of detrended signal, with refractory
        if (prevSig > 0 && sig <= 0 && (now - lastBeat) > 300) {
          if (lastBeat) beats++;
          beatTimes.push(now);
          lastBeat = now;
        }
        if (elapsed > 5 && beats >= 2) {
          var bpm = Math.round(beats / ((now - firstBeatT()) / 60000));
          if (bpm >= 35 && bpm <= 210) $("#hrBpm").textContent = bpm;
        }
      }
      prevSig = sig;

      if (elapsed >= 22 && beats >= 4) finishMeasure();
      else if (elapsed >= 30) { stop(); $("#hrStatus").textContent = t("hrWeak"); resetUI(); }
    }

    var _firstBeat = 0;
    function firstBeatT() { if (!_firstBeat && lastBeat) _firstBeat = startT + 5000; return _firstBeat || startT; }

    function drawWave() {
      if (!ctx) return;
      var W2 = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W2, H);
      ctx.strokeStyle = "#e8536b"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
      var max = 1; for (var i = 0; i < waveBuf.length; i++) max = Math.max(max, Math.abs(waveBuf[i]));
      ctx.beginPath();
      for (var j = 0; j < waveBuf.length; j++) {
        var x = (j / 200) * W2, y = H / 2 - (waveBuf[j] / max) * (H / 2 - 8);
        j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }

    function finishMeasure() {
      var endT = performance.now();
      var spanMin = (endT - firstBeatT()) / 60000;
      var bpm = Math.round(beats / spanMin);
      var measSec = measT ? (endT - measT) / 1000 : 0;
      var rr = V.ppgRR(rawBuf, measSec);
      var hrv = V.ppgHRV(beatTimes);
      stop();
      if (bpm < 35 || bpm > 210) { $("#hrStatus").textContent = t("hrWeak"); resetUI(); return; }
      saveReading(bpm, rr, hrv);
    }

    function band(bpm) {
      if (bpm < 60) return { k: "hrLow", c: "blue" };
      if (bpm <= 90) return { k: "hrNormal", c: "green" };
      if (bpm <= 100) return { k: "hrElevated", c: "yellow" };
      return { k: "hrHigh", c: "crimson" };
    }

    function saveReading(bpm, rr, hrv) {
      var b = band(bpm);
      var ww = W(); ww.hr = ww.hr || [];
      var rec = { date: today(), bpm: bpm };
      if (rr) rec.rr = rr;
      if (hrv) rec.hrv = hrv;
      ww.hr.push(rec);
      if (ww.hr.length > 60) ww.hr = ww.hr.slice(-60);
      V.awardOnce && V.awardOnce("hr:" + today(), V.POINTS.task, "task");
      V.save();
      var bpmEl = $("#hrBpm"); if (bpmEl) bpmEl.textContent = bpm;
      var ex = $("#hrExtra");
      if (ex) {
        var chips = "";
        if (rr) chips += '<span class="hr-stat">' + V.icon("lungs") + "<b>" + rr + "</b><small>" + t("hrRRUnit") + "</small></span>";
        if (hrv) chips += '<span class="hr-stat">' + V.icon("trend") + "<b>" + hrv + "</b><small>" + t("hrHRVUnit") + "</small></span>";
        ex.innerHTML = chips;
      }
      var st = $("#hrStatus"); if (st) st.innerHTML = "<b>" + t(b.k) + "</b> · " + bpm + " " + t("hrBpm");
      var msg = $("#hrMsg"); if (msg) msg.innerHTML = '<div class="note-ok">' + V.icon("check") + " " + t("hrSaved") + " — " + t(b.k) + " (" + bpm + " " + t("hrBpm") + ")</div>" +
        ((rr || hrv) ? '<p class="hr-multi-note">' + t("hrMultiNote") + "</p>" : "");
      var startBtn = $("#hrStart"); if (startBtn) { startBtn.disabled = false; startBtn.innerHTML = V.icon("heart") + " " + t("hrAgain"); }
      if (navigator.vibrate) navigator.vibrate(40);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      _firstBeat = 0;
      if (stream) { stream.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e) {} }); stream = null; }
    }
  };

  /* ===================== MENTAL TESTS (PHQ-9 / GAD-7) ===================== */
  var PHQ9 = [
    { ka: "ნაკლები ინტერესი ან სიამოვნება საქმეების კეთებისას", en: "Little interest or pleasure in doing things" },
    { ka: "დათრგუნვა, სევდა ან უიმედობა", en: "Feeling down, depressed, or hopeless" },
    { ka: "ძილის პრობლემა — ჩაძინება, ხშირი გაღვიძება ან ზედმეტი ძილი", en: "Trouble falling/staying asleep, or sleeping too much" },
    { ka: "დაღლილობა ან ენერგიის ნაკლებობა", en: "Feeling tired or having little energy" },
    { ka: "მადის დაქვეითება ან ჭარბი ჭამა", en: "Poor appetite or overeating" },
    { ka: "უარყოფითი დამოკიდებულება საკუთარი თავის მიმართ — წარუმატებლობის განცდა", en: "Feeling bad about yourself — or that you are a failure" },
    { ka: "კონცენტრაციის გაძნელება (კითხვა, ტელევიზია)", en: "Trouble concentrating on things" },
    { ka: "იმდენად ნელა მოძრაობა/საუბარი რომ სხვებმაც შენიშნეს — ან პირიქით, მოუსვენრობა", en: "Moving/speaking slowly — or being fidgety/restless" },
    { ka: "ფიქრები, რომ უკეთესი იქნებოდა აღარ იცოცხლო ან თავი დაიზიანო", en: "Thoughts that you'd be better off dead, or of hurting yourself" },
  ];
  var GAD7 = [
    { ka: "ნერვიულობა, შფოთვა ან დაძაბულობა", en: "Feeling nervous, anxious, or on edge" },
    { ka: "წუხილის შეჩერების ან კონტროლის შეუძლებლობა", en: "Not being able to stop or control worrying" },
    { ka: "ზედმეტი წუხილი სხვადასხვა საკითხზე", en: "Worrying too much about different things" },
    { ka: "მოდუნების გაძნელება", en: "Trouble relaxing" },
    { ka: "იმდენი მოუსვენრობა, რომ გაჩერება ჭირს", en: "Being so restless that it's hard to sit still" },
    { ka: "ადვილად გაღიზიანება", en: "Becoming easily annoyed or irritable" },
    { ka: "შიში, რომ რაღაც საშინელება მოხდება", en: "Feeling afraid as if something awful might happen" },
  ];

  function severityBand(kind, score) {
    if (kind === "phq") {
      if (score <= 4) return { k: "mtMinimal", rec: "mtRecMin", tone: "green" };
      if (score <= 9) return { k: "mtMild", rec: "mtRecMild", tone: "green" };
      if (score <= 14) return { k: "mtModerate", rec: "mtRecMod", tone: "yellow" };
      if (score <= 19) return { k: "mtModSevere", rec: "mtRecSevere", tone: "crimson" };
      return { k: "mtSevere", rec: "mtRecSevere", tone: "crimson" };
    }
    if (score <= 4) return { k: "mtMinimal", rec: "mtRecMin", tone: "green" };
    if (score <= 9) return { k: "mtMild", rec: "mtRecMild", tone: "green" };
    if (score <= 14) return { k: "mtModerate", rec: "mtRecMod", tone: "yellow" };
    return { k: "mtSevere", rec: "mtRecSevere", tone: "crimson" };
  }

  /* ===================== AI HEALTH SCAN (multimodal camera scan) ===================== */
  function scanScoreTone(s) { return s >= 75 ? "green" : s >= 50 ? "yellow" : "crimson"; }
  function hrBandKey(bpm) { return bpm < 60 ? "hrLow" : bpm <= 90 ? "hrNormal" : bpm <= 100 ? "hrElevated" : "hrHigh"; }
  var SKIN_TONE = { skLow: "green", skWatch: "yellow", skHigh: "crimson" };
  var VOICE_TONE = { vcGood: "green", vcMid: "yellow", vcLow: "crimson" };

  /* ---- shared scan helpers (used by #/scan and #/fullscan) ---- */
  function lastOf(key) { var a = W()[key]; return (a && a.length) ? a[a.length - 1] : null; }
  // VITA+ gate: premium perks (AI report, doctor print) show a lock until subscribed
  function isPlus() { return V.isPlus && V.isPlus(); }
  function plusChip() { return isPlus() ? "" : ' <span class="vp-lock">VITA+</span>'; }
  function plusGate(fn) { return function () { if (!isPlus()) { V.go("plus"); return; } fn.apply(this, arguments); }; }

  // Biological "health age" card
  function bioAgeCard() {
    var h = V.healthAge();
    if (!h) return '<button class="card-soft scn-bioage scn-bioage--empty" data-go="profile">' +
      V.iconBox("user", "blue") + '<div class="scn-bioage__t"><b>' + t("haTitle") + "</b><small>" + t("haNeedAge") + "</small></div>" + V.icon("next") + "</button>";
    var sign = h.delta > 0 ? "+" + h.delta : "" + h.delta;
    var verdict = h.delta <= -1 ? t("haYounger") : h.delta >= 4 ? t("haOlder") : t("haOnPar");
    return '<div class="card-soft scn-bioage rd-tone-' + h.tone + '">' +
      '<div class="scn-bioage__ring rd-tone-' + h.tone + '"><b>' + h.bio + "</b><small>" + t("haYears") + "</small></div>" +
      '<div class="scn-bioage__t"><b>' + t("haTitle") + "</b>" +
        '<small>' + t("haChrono") + " " + h.chrono + " · <span class='scn-bioage__delta tone-" + h.tone + "'>" + sign + " " + t("haYears") + "</span> · " + verdict + "</small>" +
        (h.usedScan ? "" : '<small class="scn-bioage__hint">' + t("haScanHint") + "</small>") +
      "</div></div>";
  }

  // human-readable multimodal summary (for AI prompt, chat handoff, offline report)
  V.scanSummaryText = function () {
    var ka = V.lang() === "ka";
    var scan = lastOf("scan"), skin = lastOf("skinScan"), voice = lastOf("voiceScan"), cog = lastOf("reaction"), h = V.healthAge();
    var parts = [];
    if (h) parts.push((ka ? "ბიო-ასაკი " : "Bio-age ") + h.bio + (ka ? " (ქრონ. " : " (chrono ") + h.chrono + ", " + (h.delta > 0 ? "+" + h.delta : h.delta) + ")");
    if (scan) parts.push((ka ? "გულ-სისხლძარღვი: ქულა " : "Cardio: score ") + scan.score + ", HR " + scan.bpm +
      (scan.hrv ? ", HRV " + scan.hrv + "ms" : "") + (scan.rr ? ", " + (ka ? "სუნთქვა " : "resp ") + scan.rr : "") +
      (scan.spo2 ? ", SpO2 " + scan.spo2 + "%" : "") + (scan.stress != null ? ", " + (ka ? "სტრესი " : "stress ") + scan.stress : ""));
    if (cog) parts.push((ka ? "კოგნიცია: რეაქცია " : "Cognition: reaction ") + cog.ms + "ms (" + t(cog.band) + ")");
    if (skin) parts.push((ka ? "კანი: " : "Skin: ") + t(skin.band));
    if (voice) parts.push((ka ? "ხმა: " : "Voice: ") + t(voice.band) + " (" + voice.steadiness + "%)");
    return parts.length ? parts.join(". ") : "";
  };

  function reportPrompt(summary) {
    var ka = V.lang() === "ka";
    return (ka
      ? "ეს ჩემი VITA AI-ჯანმრთელობის სკანის შედეგებია: " + summary + ". "
        + "დაწერე მოკლე, პერსონალური wellness-ანგარიში: (1) 2-3 წინადადება რას ნიშნავს ეს ჩემთვის მარტივი ენით, (2) 3 კონკრეტული ქმედითი რეკომენდაცია bullet-ებად. "
        + "ეს არ არის სამედიცინო დიაგნოზი. უპასუხე ქართულად, მოკლედ."
      : "These are my VITA AI health-scan results: " + summary + ". "
        + "Write a short personalized wellness report: (1) 2-3 sentences on what this means for me in plain language, (2) 3 concrete actionable recommendations as bullets. "
        + "This is not a medical diagnosis. Answer concisely.");
  }

  // deterministic offline report when the AI proxy is unavailable
  function reportOffline() {
    var ka = V.lang() === "ka";
    var scan = lastOf("scan"), voice = lastOf("voiceScan"), skin = lastOf("skinScan"), h = V.healthAge();
    var intro, recs = [];
    if (scan) {
      var good = scan.score >= 75;
      intro = ka ? ("შენი გულ-სისხლძარღვთა სკან-ქულაა " + scan.score + "/100" + (good ? " — ჯანსაღ დიაპაზონში." : ", რაც გაუმჯობესების სივრცეს ტოვებს.")) :
        ("Your cardiovascular scan score is " + scan.score + "/100" + (good ? " — in a healthy range." : ", leaving room to improve."));
      if (scan.hrv && scan.hrv < 30) recs.push(ka ? "გაზარდე HRV — რეგულარული ძილი და სუნთქვის ვარჯიში დაგეხმარება." : "Raise HRV — consistent sleep and breathing exercises help.");
      if (scan.bpm > 80) recs.push(ka ? "მოსვენების პულსი ოდნავ მაღალია — კარდიო-აქტივობა და ჰიდრატაცია." : "Resting pulse is a bit high — add cardio activity and hydration.");
      if (scan.spo2 && scan.spo2 < 95) recs.push(ka ? "SpO2 ოდნავ დაბალია — გაიმეორე მშვიდად; თუ მდგრადია, მიმართე ექიმს." : "SpO2 slightly low — re-measure calmly; if persistent, see a doctor.");
    } else intro = ka ? "ჯერ გაუშვი მთავარი კამერა-სკანი სრული ანგარიშისთვის." : "Run the main camera scan first for a full report.";
    if (h && h.delta >= 4) recs.push(ka ? "ბიო-ასაკი ქრონოლოგიურზე მაღალია — აქტივობა, ძილი და მოწევაზე უარი ყველაზე მეტს ცვლის." : "Bio-age above chronological — activity, sleep and quitting smoking move it most.");
    if (voice && voice.band === "vcLow") recs.push(ka ? "ხმის სტაბილურობა დაბალია — დაისვენე ხმა და დაიტენე სითხით." : "Voice steadiness is low — rest the voice and hydrate.");
    var cog = lastOf("reaction");
    if (cog && cog.band === "rxSlow") recs.push(ka ? "რეაქცია ნელია — ძილი, ჰიდრატაცია და ნაკლები ეკრანი დაღლამდე აუმჯობესებს." : "Reaction is slow — sleep, hydration and less pre-test screen time help.");
    if (skin && skin.band === "skHigh") recs.push(ka ? "კანის შემოწმებამ ყურადღება მოითხოვა — დაჯავშნე დერმატოლოგი." : "Skin check flagged attention — book a dermatologist.");
    var fillers = ka
      ? ["დღეში 7–8 სთ ძილი და ჰიდრატაცია თითქმის ყველა სიგნალს აუმჯობესებს.",
         "კვირაში 150 წთ ზომიერი აქტივობა გულის ჯანმრთელობას უწყობს ხელს.",
         "შეინარჩუნე რეგულარული სკანი ტენდენციის სანახავად."]
      : ["7–8 h of sleep and steady hydration improve nearly every signal.",
         "150 min/week of moderate activity supports heart health.",
         "Keep scanning regularly to track your trend."];
    for (var fi = 0; recs.length < 3 && fi < fillers.length; fi++) recs.push(fillers[fi]);
    return "<p>" + esc(intro) + "</p><ul>" + recs.slice(0, 4).map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>";
  }

  function reportFmt(s) { return esc(s || "").replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>").replace(/^/, "<p>").replace(/$/, "</p>"); }
  function reportWrap(inner, off) {
    return '<div class="scn-report fade-in"><div class="scn-report__head">' + V.icon("sparkle") + " <b>" + t("haReportTitle") + "</b>" +
      (off ? '<span class="scn-report__tag">' + t("haOffline") + "</span>" : "") + "</div>" +
      '<div class="scn-report__body" id="scnRepBody">' + inner + "</div>" +
      '<div class="scn-report__foot">' + V.icon("info") + " " + t("scnDisc") + "</div></div>";
  }
  // orchestrate AI report: stream from proxy, fall back to deterministic offline
  function runScanReport(btn, out) {
    var summary = V.scanSummaryText();
    if (!summary) { out.innerHTML = warn(t("haNeedScan")); return; }
    if (btn) btn.disabled = true;
    out.innerHTML = '<div class="scn-rep-load">' + V.icon("sparkle") + " " + t("haReportGen") + "</div>";
    var done = false;
    function offline() { if (done) return; done = true; out.innerHTML = reportWrap(reportOffline(), true); if (btn) btn.disabled = false; }
    if (!V.api || !V.api.chat) { offline(); return; }
    V.api.ready().then(function (on) {
      if (done) return;
      if (!on) { offline(); return; }
      out.innerHTML = reportWrap('<span class="scn-rep-cursor">▍</span>', false);
      var acc = "";
      V.api.chat([{ role: "user", text: reportPrompt(summary) }],
        function (tok, full) { acc = full || (acc + tok); var b = out.querySelector("#scnRepBody"); if (b) b.innerHTML = reportFmt(acc) + '<span class="scn-rep-cursor">▍</span>'; },
        function (full) { done = true; var b = out.querySelector("#scnRepBody"); if (b) b.innerHTML = reportFmt(full || acc); if (btn) btn.disabled = false; },
        function () { offline(); });
    }).catch(offline);
  }

  // consecutive-day scan streak (cardio scans), tolerant of a missing today
  function isoOf(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  V.scanStreak = function () {
    var arr = (W().scan || []); if (!arr.length) return 0;
    var days = {}; arr.forEach(function (s) { days[s.date] = 1; });
    var d = new Date(today()), streak = 0;
    if (!days[isoOf(d)]) d.setDate(d.getDate() - 1); // today not done yet → count up to yesterday
    while (days[isoOf(d)]) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  };

  // printable, doctor-ready scan report (reuses the AI narrative if on screen)
  function printScanReport() {
    var ka = V.lang() === "ka";
    var cardio = lastOf("scan"), cog = lastOf("reaction"), voice = lastOf("voiceScan"), skin = lastOf("skinScan");
    var h = V.healthAge(), comp = V.scanComposite();
    var rows = [];
    function row(name, val, band) { rows.push("<tr><td>" + name + "</td><td><b>" + val + "</b></td><td>" + (band || "") + "</td></tr>"); }
    if (cardio) row(ka ? "გული & მიმოქცევა" : "Heart & circulation", t("scnScore") + " " + cardio.score + " · " + cardio.bpm + " " + t("hrBpm") +
      (cardio.hrv ? " · HRV " + cardio.hrv : "") + (cardio.spo2 ? " · SpO₂ " + cardio.spo2 + "%" : ""), cardio.stress != null ? (ka ? "სტრესი " : "stress ") + cardio.stress : "");
    if (cog) row(ka ? "კოგნიცია" : "Cognition", cog.ms + " " + t("rxMs"), t(cog.band));
    if (voice) row(ka ? "სუნთქვა & ხმა" : "Respiration & voice", voice.steadiness + "%", t(voice.band));
    if (skin) row(ka ? "კანი" : "Skin", t(skin.band), "");
    var domBody = document.querySelector("#fsReportOut .scn-report__body, #scnReportOut .scn-report__body");
    var narrative = domBody ? domBody.innerHTML : reportOffline();
    var T = ka
      ? { title: "VITA — AI ჯანმრთელობის სკანი", sub: "გენერირებულია " + today(), comp: "საერთო ქულა", bio: "ბიოლოგიური ასაკი", chrono: "ქრონოლოგიური", marker: "სისტემა", val: "მაჩვენებელი", band: "შეფასება", rep: "AI ანგარიში", note: "მომზადებულია VITA Health AI-ით. wellness შეფასებაა, არა სამედიცინო დიაგნოზი." }
      : { title: "VITA — AI Health Scan", sub: "Generated " + today(), comp: "Composite", bio: "Biological age", chrono: "Chronological", marker: "System", val: "Reading", band: "Assessment", rep: "AI report", note: "Prepared by VITA Health AI. A wellness estimate, not a medical diagnosis." };
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>' + T.title + "</title>" +
      "<style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#14181f;max-width:720px;margin:32px auto;padding:0 20px}" +
      "h1{font-size:24px;margin:0 0 2px} .sub{color:#8A94A6;margin-bottom:20px}" +
      "h2{font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#2BA94C;margin:22px 0 8px;border-bottom:2px solid #E4F4EA;padding-bottom:4px}" +
      ".row{display:flex;gap:28px;flex-wrap:wrap;margin-bottom:6px} .row b{display:block;font-size:26px}" +
      "table{width:100%;border-collapse:collapse;font-size:14px} td,th{text-align:left;padding:7px 6px;border-bottom:1px solid #eee}" +
      ".rep p{margin:0 0 8px} .rep ul{padding-left:18px} .note{margin-top:26px;color:#8A94A6;font-size:12px}</style></head><body>" +
      "<h1>" + T.title + "</h1><div class='sub'>" + T.sub + "</div>" +
      "<div class='row'>" + (comp != null ? "<div><b>" + comp + "</b>" + T.comp + "</div>" : "") +
        (h ? "<div><b>" + h.bio + "</b>" + T.bio + " (" + T.chrono + " " + h.chrono + ", " + (h.delta > 0 ? "+" + h.delta : h.delta) + ")</div>" : "") + "</div>" +
      (rows.length ? "<h2>" + (ka ? "მაჩვენებლები" : "Readings") + "</h2><table><tr><th>" + T.marker + "</th><th>" + T.val + "</th><th>" + T.band + "</th></tr>" + rows.join("") + "</table>" : "") +
      "<h2>" + T.rep + "</h2><div class='rep'>" + narrative + "</div>" +
      "<div class='note'>" + T.note + "</div></body></html>";
    var win = window.open("", "_blank"); if (!win) { V.toast && V.toast(ka ? "ფანჯრის გახსნა დაიბლოკა" : "Popup blocked"); return; }
    win.document.open(); win.document.write(html); win.document.close();
    setTimeout(function () { try { win.focus(); win.print(); } catch (e) {} }, 350);
  }

  // share the scan summary (native share sheet, else clipboard)
  function shareScanReport() {
    var ka = V.lang() === "ka";
    var txt = (ka ? "ჩემი VITA AI ჯანმრთელობის სკანი:\n" : "My VITA AI health scan:\n") + V.scanSummaryText();
    if (navigator.share) { navigator.share({ title: "VITA", text: txt }).catch(function () {}); return; }
    if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(function () { V.toast && V.toast(ka ? "დაკოპირდა" : "Copied"); }); return; }
    V.toast && V.toast(txt);
  }

  V.screens.scan = function () {
    var w = W(); w.scan = w.scan || [];
    var stopCap = null, mode = "finger"; // finger (rear+torch) | face (front camera, contactless)

    function modalityStrip() {
      return '<div class="scn-mods">' +
        '<span class="scn-mod on">' + V.icon("heart") + L({ ka: "გულსისხლძარღვთა", en: "Cardiovascular" }) + ' <i>' + t("scnActive") + "</i></span>" +
        '<button class="scn-mod scn-mod--btn" data-go="skinscan">' + V.icon("camera") + L({ ka: "კანი", en: "Skin" }) + ' <i>' + t("scnActive") + "</i></button>" +
        '<button class="scn-mod scn-mod--btn" data-go="voicescan">' + V.icon("mic") + L({ ka: "ხმა", en: "Voice" }) + ' <i>' + t("scnActive") + "</i></button>" +
        '<button class="scn-mod scn-mod--btn" data-go="reactionscan">' + V.icon("brain") + L({ ka: "კოგნიცია", en: "Cognition" }) + ' <i>' + t("scnActive") + "</i></button>" +
      "</div>";
    }

    function render(result) {
      var last = w.scan.length ? w.scan[w.scan.length - 1] : null;
      var stage = result
        ? (function () {
            var tone = scanScoreTone(result.score);
            var st = result.hrv ? V.scanStress(result.hrv) : null;
            return '<div class="scn-result fade-in">' +
              '<div class="scn-ring rd-tone-' + tone + '"><b>' + result.score + '</b><small>' + t("scnScore") + "</small></div>" +
              '<div class="scn-metrics">' +
                scnMetric("heart", result.bpm, t("scnHR"), t(hrBandKey(result.bpm))) +
                (result.hrv ? scnMetric("trend", result.hrv + " ms", t("scnHRV"), null) : "") +
                (result.rr ? scnMetric("lungs", result.rr + " " + t("hrRRUnit"), t("scnResp"), null) : "") +
                (result.spo2 ? scnMetric("drop", result.spo2 + "%", t("scnSpO2"), null) : "") +
                (st ? scnMetric("brain", st.recovery + "%", t("scnRecovery"), t(st.band.k)) : "") +
              "</div>" +
              '<button class="btn btn-primary" id="scnStart" style="width:100%;margin-top:6px">' + V.icon("heart") + " " + t("scnAgain") + "</button>" +
            "</div>";
          })()
        : '<div class="scn-stage" id="scnStage">' +
            '<div class="scn-mode" id="scnMode">' +
              '<button class="scn-mode__b' + (mode === "finger" ? " on" : "") + '" data-mode="finger">' + V.icon("heart") + " " + t("scnModeFinger") + "</button>" +
              '<button class="scn-mode__b' + (mode === "face" ? " on" : "") + '" data-mode="face">' + V.icon("user") + " " + t("scnModeFace") + "</button>" +
            "</div>" +
            '<canvas id="hrWave" class="scn-wave" width="600" height="120"></canvas>' +
            '<div class="scn-status" id="scnStatus">' + t(mode === "face" ? "scnFaceHint" : "scnReady") + "</div>" +
            '<button class="btn btn-primary" id="scnStart" style="width:100%">' + V.icon("heart") + " " + t("scnStart") + "</button>" +
          "</div>";

      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' +
          head("heart", "crimson", "scnTitle") +
          '<p class="s-sub">' + t("scnSub") + "</p>" +
          (V.scanStreak() > 0 ? '<div class="scn-streak">' + V.icon("flame") + " " + V.scanStreak() + " " + t("scnStreakDays") + "</div>" : "") +
          modalityStrip() +
          '<button class="scn-fullcta" data-go="fullscan">' + V.iconBox("shield", "green") +
            '<div class="scn-fullcta__t"><b>' + t("fbTitle") + "</b><small>" + t("fbCardSub") + "</small></div>" + V.icon("next") + "</button>" +
          '<div class="card-soft scn-card">' + stage + "</div>" +
          '<div class="hr-manual">' +
            '<input id="hrManual" class="field" type="number" inputmode="numeric" min="30" max="220" placeholder="' + esc(t("hrManualPh")) + '">' +
            '<button class="btn btn-ghost" id="hrManualSave">' + t("hrManual") + "</button>" +
          "</div>" +
          '<div id="scnMsg"></div>' +
          bioAgeCard() +
          '<div class="scn-report-wrap"><button class="btn btn-ghost scn-report-btn" id="scnReport">' + V.icon("sparkle") + " " + t("haReportCta") + plusChip() + '</button><div id="scnReportOut"></div></div>' +
          (last ? '<div class="scn-actions">' +
            '<button class="scn-act" id="scnPrint">' + V.icon("file") + "<span>" + t("scnPrint") + plusChip() + "</span></button>" +
            '<button class="scn-act" id="scnShare">' + V.icon("send") + "<span>" + t("scnShare") + "</span></button>" +
            '<button class="scn-act" id="scnRemind">' + V.icon("bell") + "<span>" + t("scnRemind") + "</span></button>" +
          "</div>" : "") +
          scanHistory() +
          '<p class="hr-multi-note">' + t("scnDisc") + "</p>" +
          '<video id="hrVideo" playsinline muted style="display:none"></video>' +
        "</div>" +
        V.tabbar("home") +
        "</div>",
        { onMount: function () {
          backX();
          $("[data-x]").addEventListener("click", function () { if (stopCap) stopCap(); });
          each("[data-go]", function (b) { b.addEventListener("click", function () { V.go(b.getAttribute("data-go")); }); });
          $("#scnStart").addEventListener("click", startScan);
          each("[data-mode]", function (b) {
            b.addEventListener("click", function () {
              mode = b.getAttribute("data-mode");
              each("[data-mode]", function (x) { x.classList.toggle("on", x === b); });
              var s = $("#scnStatus"); if (s) s.textContent = t(mode === "face" ? "scnFaceHint" : "scnReady");
            });
          });
          var rep = $("#scnReport");
          if (rep) rep.addEventListener("click", plusGate(function () { runScanReport(rep, $("#scnReportOut")); }));
          var pr = $("#scnPrint"); if (pr) pr.addEventListener("click", plusGate(printScanReport));
          var sh = $("#scnShare"); if (sh) sh.addEventListener("click", shareScanReport);
          var rm = $("#scnRemind"); if (rm) rm.addEventListener("click", function () {
            V.features && V.features.exportScanReminder(9);
            V.toast && V.toast(t("scnRemindDone"));
          });
          $("#hrManualSave").addEventListener("click", function () {
            var v = parseInt($("#hrManual").value, 10);
            if (!v || v < 30 || v > 220) { $("#scnMsg").innerHTML = warn(t("hrManualPh")); return; }
            saveScan({ bpm: v });
          });
          var disc = $("[data-scn-discuss]");
          if (disc) disc.addEventListener("click", function () {
            var ins = scanInsightText();
            V.state.chat = V.state.chat || [];
            V.state.chat.push({ role: "user", text: (V.lang() === "ka" ? "ჩემი ჯანმრთელობის სკანი: " : "My health scan: ") + ins });
            V.save(); V.go("vita");
          });
        }}
      );
    }

    // longitudinal trend + rule-based insight (the "agent" layer over scans)
    function scanInsight() {
      var arr = w.scan || [];
      if (arr.length < 2) return null;
      var recent = arr.slice(-3), prev = arr.slice(-6, -3);
      function av(a) { return a.length ? a.reduce(function (x, s) { return x + s.score; }, 0) / a.length : 0; }
      var d = Math.round(av(recent) - (prev.length ? av(prev) : av(recent)));
      var dir = d >= 4 ? "up" : d <= -4 ? "down" : "flat";
      return { delta: d, dir: dir, tone: dir === "up" ? "green" : dir === "down" ? "crimson" : "blue" };
    }
    function scanInsightText() {
      var arr = w.scan || [], last = arr[arr.length - 1] || {};
      var ins = scanInsight();
      var ka = V.lang() === "ka";
      var s = (ka ? "სკან-ქულა " : "scan score ") + (last.score || "?") + (last.hrv ? (ka ? ", HRV " : ", HRV ") + last.hrv + "ms" : "") + (last.rr ? (ka ? ", სუნთქვა " : ", resp ") + last.rr : "");
      if (ins) s += ". " + (ins.dir === "up" ? (ka ? "ბოლო სკანებში გაუმჯობესდა (+" + ins.delta + ")" : "improving recently (+" + ins.delta + ")")
        : ins.dir === "down" ? (ka ? "ბოლო სკანებში დაეცა (" + ins.delta + ")" : "declining recently (" + ins.delta + ")")
        : (ka ? "სტაბილურია" : "stable"));
      return s;
    }
    function scanHistory() {
      var arr = w.scan || [];
      if (!arr.length) return "";
      var recent = arr.slice(-10);
      var bars = recent.map(function (s) {
        var tone = scanScoreTone(s.score);
        return '<div class="mo-bar" title="' + s.date + " · " + s.score + '"><span class="mo-bar__fill tone-' + tone + '" style="height:' + s.score + '%"></span><i>' + s.date.slice(8) + "</i></div>";
      }).join("");
      var ins = scanInsight();
      var insLine = ins ? '<div class="scn-insight scn-ins-' + ins.tone + '">' + V.icon("trend") + " " +
        (V.lang() === "ka" ? (ins.dir === "up" ? "ტენდენცია ზევით (+" + ins.delta + ")" : ins.dir === "down" ? "ტენდენცია ქვევით (" + ins.delta + ")" : "სტაბილური ტენდენცია")
          : (ins.dir === "up" ? "Trending up (+" + ins.delta + ")" : ins.dir === "down" ? "Trending down (" + ins.delta + ")" : "Stable trend")) + "</div>" : "";
      return '<div class="section-head"><h3>' + t("scnHistory") + "</h3>" +
        (arr.length >= 2 ? '<button class="link-btn" data-scn-discuss>' + t("scnDiscuss") + "</button>" : "") + "</div>" +
        insLine + '<div class="mo-chart">' + bars + "</div>";
    }

    function scnMetric(icon, val, label, sub) {
      return '<div class="scn-metric">' + V.iconBox(icon, "gray") +
        '<div class="scn-metric__t"><b>' + val + "</b><small>" + label + (sub ? " · " + sub : "") + "</small></div></div>";
    }

    function startScan() {
      var btn = $("#scnStart"); if (btn) btn.disabled = true;
      stopCap = V.ppgCapture($("#hrVideo"), $("#hrWave"), {
        facing: mode === "face" ? "user" : "environment",
        onStatus: function (k) { var s = $("#scnStatus"); if (s) s.textContent = t(k); },
        onTick: function (bpm) { var s = $("#scnStatus"); if (s) s.textContent = bpm + " " + t("hrBpm"); },
        onError: function (k) {
          var b = $("#scnStart"); if (b) b.disabled = false;
          $("#scnMsg").innerHTML = warn(t(k)); var mi = $("#hrManual"); if (mi) mi.focus();
          var s = $("#scnStatus"); if (s) s.textContent = t("scnReady");
        },
        onDone: function (m) { saveScan(m); },
      });
    }

    function saveScan(m) {
      var st = m.hrv ? V.scanStress(m.hrv) : null;
      var score = V.scanScore(m);
      var rec = { date: today(), bpm: m.bpm, score: score };
      if (m.hrv) rec.hrv = m.hrv;
      if (m.rr) rec.rr = m.rr;
      if (m.spo2) rec.spo2 = m.spo2;
      if (st) rec.stress = st.stress;
      w.scan.push(rec); if (w.scan.length > 60) w.scan = w.scan.slice(-60);
      // also feed the resting-HR log so Progress/readiness see it
      w.hr = w.hr || []; w.hr.push({ date: today(), bpm: m.bpm, rr: m.rr, hrv: m.hrv }); if (w.hr.length > 60) w.hr = w.hr.slice(-60);
      V.awardOnce && V.awardOnce("scan:" + today(), V.POINTS.task, "task");
      V.save();
      if (navigator.vibrate) navigator.vibrate(40);
      render({ bpm: m.bpm, hrv: m.hrv, rr: m.rr, spo2: m.spo2, score: score });
      var msg = $("#scnMsg"); if (msg) msg.innerHTML = '<div class="note-ok">' + V.icon("check") + " " + t("scnSaved") + "</div>";
    }

    render(null);
  };

  /* ===================== FULL BODY SCAN (unified flow + body-system map) ===================== */
  var TONE_HEX = { green: "#2BA94C", yellow: "#E0A92E", crimson: "#E8536B", gray: "#C4CDD6" };

  // whole-body composite from the latest of each modality (null if none yet)
  V.scanComposite = function () {
    var vals = [];
    var sc = lastOf("scan"); if (sc) vals.push(sc.score);
    var vo = lastOf("voiceScan"); if (vo && vo.steadiness != null) vals.push(vo.steadiness);
    var sk = lastOf("skinScan"); if (sk) vals.push(sk.band === "skLow" ? 90 : sk.band === "skWatch" ? 60 : 30);
    var rx = lastOf("reaction"); if (rx) vals.push(V.reactionScore(rx.ms));
    if (!vals.length) return null;
    return Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length);
  };

  V.screens.fullscan = function () {
    var cardio = lastOf("scan"), skin = lastOf("skinScan"), voice = lastOf("voiceScan"), cog = lastOf("reaction");
    var cTone = cardio ? scanScoreTone(cardio.score) : "gray";
    var sTone = skin ? SKIN_TONE[skin.band] : "gray";
    var vTone = voice ? VOICE_TONE[voice.band] : "gray";
    var gTone = cog ? REACT_TONE(cog.band) : "gray";
    var comp = V.scanComposite();

    function bodyMap() {
      function dot(cx, cy, tone) { return '<circle cx="' + cx + '" cy="' + cy + '" r="9" fill="' + TONE_HEX[tone] + '" stroke="#fff" stroke-width="3"/>'; }
      return '<svg class="fs-body" viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<g fill="var(--field)" stroke="var(--line)" stroke-width="1.5">' +
          '<circle cx="100" cy="34" r="22"/>' +
          '<path d="M78 60 h44 q14 0 14 16 v54 q0 10 -8 12 l-6 70 h-16 l-4 -52 -4 52 h-16 l-6 -70 q-8 -2 -8 -12 v-54 q0 -16 14 -16 Z"/>' +
          '<path d="M70 78 l-16 46 8 4 18 -40 Z"/><path d="M130 78 l16 46 -8 4 -18 -40 Z"/>' +
        "</g>" +
        dot(100, 30, gTone) +  // cognition — head/brain
        dot(86, 96, cTone) +   // heart — upper-left chest
        dot(114, 110, vTone) + // respiratory/voice — chest
        dot(140, 108, sTone) + // skin — forearm
        "</svg>";
    }
    function legend(icon, name, tone, val) {
      return '<div class="fs-leg"><span class="fs-leg__dot" style="background:' + TONE_HEX[tone] + '"></span>' +
        V.icon(icon) + '<div class="fs-leg__t"><b>' + name + "</b><small>" + (val || t("fbTodo")) + "</small></div></div>";
    }
    function step(icon, name, route, val, tone, done) {
      return '<button class="fs-step" data-go="' + route + '">' +
        '<span class="fs-step__ic rd-tone-' + (tone || "gray") + '">' + V.icon(icon) + "</span>" +
        '<span class="fs-step__t"><b>' + name + "</b><small>" + (val || t("fbTodo")) + "</small></span>" +
        (done ? '<span class="fs-step__chk">' + V.icon("check") + "</span>" : V.icon("next")) + "</button>";
    }
    var dToday = function (r) { return r && r.date === today(); };
    var cVal = cardio ? t("scnScore") + " " + cardio.score : null;
    var sVal = skin ? t(skin.band) : null;
    var vVal = voice ? t(voice.band) + " · " + voice.steadiness + "%" : null;
    var gVal = cog ? t(cog.band) + " · " + cog.ms + " " + t("rxMs") : null;

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        head("shield", "green", "fbTitle") +
        '<p class="s-sub">' + t("fbSub") + "</p>" +

        '<div class="card-soft fs-hero">' +
          '<div class="fs-hero__map">' + bodyMap() + "</div>" +
          '<div class="fs-hero__r">' +
            (comp != null
              ? '<div class="fs-comp rd-tone-' + scanScoreTone(comp) + '"><b>' + comp + '</b><small>' + t("fbComposite") + "</small></div>"
              : '<div class="fs-comp fs-comp--empty"><b>—</b><small>' + t("fbComposite") + "</small></div>") +
            legend("heart", t("fbSysCardio"), cTone, cVal) +
            legend("brain", t("fbSysCog"), gTone, gVal) +
            legend("lungs", t("fbSysResp"), vTone, vVal) +
            legend("skin", t("fbSysSkin"), sTone, sVal) +
          "</div>" +
        "</div>" +

        bioAgeCard() +

        '<div class="section-head"><h3>' + t("fbSteps") + "</h3></div>" +
        step("heart", t("fbSysCardio"), "scan", cVal, cTone, dToday(cardio)) +
        step("brain", t("fbSysCog"), "reactionscan", gVal, gTone, dToday(cog)) +
        step("lungs", t("fbSysResp"), "voicescan", vVal, vTone, dToday(voice)) +
        step("skin", t("fbSysSkin"), "skinscan", sVal, sTone, dToday(skin)) +

        '<div class="scn-report-wrap"><button class="btn btn-primary scn-report-btn" id="fsReport" style="width:100%">' + V.icon("sparkle") + " " + t("haReportCta") + plusChip() + '</button><div id="fsReportOut"></div></div>' +

        (comp != null ? '<div class="scn-actions">' +
          '<button class="scn-act" id="fsPrint">' + V.icon("file") + "<span>" + t("scnPrint") + plusChip() + "</span></button>" +
          '<button class="scn-act" id="fsShare">' + V.icon("send") + "<span>" + t("scnShare") + "</span></button>" +
          '<button class="scn-act" id="fsRemind">' + V.icon("bell") + "<span>" + t("scnRemind") + "</span></button>" +
        "</div>" : "") +

        '<p class="hr-multi-note">' + t("scnDisc") + "</p>" +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        backX();
        each("[data-go]", function (b) { b.addEventListener("click", function () { V.go(b.getAttribute("data-go")); }); });
        var rep = $("#fsReport");
        if (rep) rep.addEventListener("click", plusGate(function () { runScanReport(rep, $("#fsReportOut")); }));
        var pr = $("#fsPrint"); if (pr) pr.addEventListener("click", plusGate(printScanReport));
        var sh = $("#fsShare"); if (sh) sh.addEventListener("click", shareScanReport);
        var rm = $("#fsRemind"); if (rm) rm.addEventListener("click", function () {
          V.features && V.features.exportScanReminder(9);
          V.toast && V.toast(t("scnRemindDone"));
        });
      } }
    );
  };

  // home flagship card for the AI Health Scan
  V.scanHomeCard = function () {
    var arr = (W().scan || []), last = arr.length ? arr[arr.length - 1] : null;
    return '<button class="card-soft scan-home" id="scanHome">' +
      '<span class="scan-home__ring' + (last ? " rd-tone-" + scanScoreTone(last.score) : " scan-home__ring--empty") + '">' +
        (last ? "<b>" + last.score + "</b>" : V.icon("heart")) + "</span>" +
      '<span class="scan-home__t"><b>' + t("scnTitle") + "</b><small>" +
        (last ? t("scnScore") + " · " + last.bpm + " " + t("hrBpm") + (last.hrv ? " · HRV " + last.hrv : "") : t("scnCta")) + "</small></span>" +
      V.icon("next") + "</button>";
  };
  V.wireScanHome = function () { var c = document.getElementById("scanHome"); if (c) c.addEventListener("click", function () { V.go("scan"); }); };

  /* ===================== SKIN SCAN (guided ABCDE self-check + on-device hint) ===================== */
  // on-device colour-variation of a lesion photo (real, wellness-grade — not a diagnosis)
  V.skinColorVar = function (data) {
    if (!data || !data.length) return 0;
    var n = 0, sum = 0, sumsq = 0;
    for (var i = 0; i < data.length; i += 16) {
      var r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 200) continue;
      var spread = Math.max(r, g, b) - Math.min(r, g, b);
      sum += spread; sumsq += spread * spread; n++;
    }
    if (!n) return 0;
    var mean = sum / n, varr = sumsq / n - mean * mean, sd = Math.sqrt(Math.max(0, varr));
    return Math.round(Math.min(1, sd / 55) * 100) / 100;
  };
  V.skinFlag = function (yesCount, colorVar) {
    var score = yesCount + ((colorVar || 0) > 0.5 ? 1 : 0);
    if (score <= 1) return { k: "skLow", tone: "green", score: score };
    if (score <= 3) return { k: "skWatch", tone: "yellow", score: score };
    return { k: "skHigh", tone: "crimson", score: score };
  };
  var ABCDE = [
    { k: "skA", icon: "A" }, { k: "skB", icon: "B" }, { k: "skC", icon: "C" }, { k: "skD", icon: "D" }, { k: "skE", icon: "E" },
  ];

  V.screens.skinscan = function () {
    var w = W(); w.skinScan = w.skinScan || [];
    var answers = {}, colorVar = null, hasPhoto = false;

    function render(result) {
      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' +
          head("camera", "blue", "skTitle") +
          '<p class="s-sub">' + t("skSub") + "</p>" +
          '<div class="card-soft" style="padding:16px">' +
            '<label class="skin-photo" id="skinPhotoLbl"><canvas id="skinCanvas" width="220" height="220"></canvas>' +
              '<div class="skin-photo__hint" id="skinHint">' + V.icon("camera") + "<span>" + t("skPhoto") + "</span></div>" +
              '<input type="file" accept="image/*" capture="environment" id="skinFile" hidden></label>' +
            '<p class="mo-how" style="margin:14px 0 8px">' + t("skChecklist") + "</p>" +
            '<div class="skin-checks">' + ABCDE.map(function (q) {
              return '<button class="skin-chk" data-abcde="' + q.k + '"><span class="skin-chk__l">' + q.icon + "</span>" +
                '<span class="skin-chk__t">' + t(q.k) + "</span>" + V.icon("check") + "</button>";
            }).join("") + "</div>" +
            '<button class="btn btn-primary" id="skinGo" style="width:100%;margin-top:14px">' + V.icon("shield") + " " + t("skAnalyze") + "</button>" +
          "</div>" +
          '<div id="skinResult"></div>' +
          '<p class="hr-multi-note">' + t("skDisc") + "</p>" +
        "</div>" +
        V.tabbar("home") +
        "</div>",
        { onMount: function () {
          backX();
          var fileEl = $("#skinFile"), canvas = $("#skinCanvas"), hint = $("#skinHint");
          fileEl.addEventListener("change", function () {
            var f = fileEl.files && fileEl.files[0]; if (!f) return;
            var img = new Image();
            img.onload = function () {
              var ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              hasPhoto = true; hint.style.display = "none";
              try { var d = ctx.getImageData(60, 60, 100, 100).data; colorVar = V.skinColorVar(d); } catch (e) { colorVar = null; }
            };
            img.src = URL.createObjectURL(f);
          });
          each("[data-abcde]", function (b) {
            b.addEventListener("click", function () {
              var k = b.getAttribute("data-abcde");
              answers[k] = !answers[k]; b.classList.toggle("on", answers[k]);
            });
          });
          $("#skinGo").addEventListener("click", function () {
            var yes = Object.keys(answers).filter(function (k) { return answers[k]; }).length;
            var flag = V.skinFlag(yes, colorVar);
            w.skinScan.push({ date: today(), band: flag.k }); if (w.skinScan.length > 40) w.skinScan = w.skinScan.slice(-40);
            V.awardOnce && V.awardOnce("skin:" + today(), V.POINTS.task, "task");
            V.save();
            var box = $("#skinResult");
            box.innerHTML = '<div class="card-soft skin-res fade-in"><div class="rd-ring rd-tone-' + flag.tone + '" style="width:96px;height:96px;border-width:7px;margin:0 auto 12px"><b style="font-size:30px">' + flag.score + '</b></div>' +
              '<div class="mt-sev mt-tone-' + flag.tone + '" style="text-align:center">' + t(flag.k) + "</div>" +
              '<p class="mt-rec" style="text-align:center">' + t(flag.k + "Rec") + "</p>" +
              (flag.tone !== "green" ? '<button class="btn btn-primary" data-skin-derm style="width:100%">' + V.icon("calendar") + " " + t("skBook") + "</button>" : "") +
              (colorVar != null ? '<p class="hr-multi-note">' + t("skColorHint") + ": " + Math.round(colorVar * 100) + "%</p>" : "") + "</div>";
            box.scrollIntoView({ behavior: "smooth", block: "nearest" });
            var d = box.querySelector("[data-skin-derm]");
            if (d) d.addEventListener("click", function () { deepClinic("derm", { ka: "დერმატოლოგი", en: "Dermatologist" }); });
          });
        }}
      );
    }
    render();
  };

  /* ===================== VOICE SCAN (vocal-steadiness biomarker) ===================== */
  // vocal steadiness 0-100 from per-frame pitch + amplitude series (lower variation = steadier)
  V.voiceSteadiness = function (pitches, rmss) {
    function cv(arr) {
      arr = (arr || []).filter(function (x) { return x > 0; });
      if (arr.length < 5) return null;
      var m = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
      if (!m) return null;
      var v = arr.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / arr.length;
      return Math.sqrt(v) / m;
    }
    var pj = cv(pitches), sh = cv(rmss);
    if (pj == null || sh == null) return null;
    var jitterScore = Math.max(0, Math.min(100, 100 - pj * 1500));
    var shimmerScore = Math.max(0, Math.min(100, 100 - sh * 250));
    return Math.max(0, Math.min(100, Math.round(jitterScore * 0.6 + shimmerScore * 0.4)));
  };
  V.voiceBand = function (s) { return s >= 70 ? { k: "vcGood", tone: "green" } : s >= 45 ? { k: "vcMid", tone: "yellow" } : { k: "vcLow", tone: "crimson" }; };
  // autocorrelation pitch (Hz) of a time-domain buffer; 0 if unvoiced
  function acPitch(buf, sr) {
    var SIZE = buf.length, rms = 0;
    for (var i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return 0;
    var minLag = Math.floor(sr / 400), maxLag = Math.floor(sr / 80), best = -1, bestLag = -1;
    for (var lag = minLag; lag <= maxLag; lag++) {
      var s = 0; for (var j = 0; j < SIZE - lag; j++) s += buf[j] * buf[j + lag];
      if (s > best) { best = s; bestLag = lag; }
    }
    return bestLag > 0 ? sr / bestLag : 0;
  }

  function voiceCapture(opts) {
    opts = opts || {};
    var ctx, analyser, src, stream, raf = 0, running = false, startT = 0, pitches = [], rmss = [];
    function status(k) { if (opts.onStatus) opts.onStatus(k); }
    function start() {
      if (typeof isSecureContext !== "undefined" && !isSecureContext && location.hostname !== "localhost") { stop(); if (opts.onError) opts.onError("hrInsecure"); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { if (opts.onError) opts.onError("vcNoMic"); return; }
      status("vcRequesting");
      navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function (s) {
        stream = s;
        var AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC(); src = ctx.createMediaStreamSource(s);
        analyser = ctx.createAnalyser(); analyser.fftSize = 2048; src.connect(analyser);
        pitches = []; rmss = []; startT = performance.now(); running = true; status("vcSpeak"); loop();
      }).catch(function (e) {
        var k = (e && e.name === "NotAllowedError") ? "vcDenied" : "vcNoMic";
        if (opts.onError) opts.onError(k);
      });
    }
    function loop() {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      var buf = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(buf);
      var rms = 0; for (var i = 0; i < buf.length; i++) rms += buf[i] * buf[i]; rms = Math.sqrt(rms / buf.length);
      var p = acPitch(buf, ctx.sampleRate);
      if (rms > 0.012 && p > 0) { pitches.push(p); rmss.push(rms); }
      var elapsed = (performance.now() - startT) / 1000;
      if (opts.onLevel) opts.onLevel(Math.min(1, rms * 6), elapsed);
      if (elapsed >= 5) finish();
    }
    function finish() {
      var steadiness = V.voiceSteadiness(pitches, rmss);
      stop();
      if (steadiness == null) { if (opts.onError) opts.onError("vcWeak"); return; }
      if (opts.onDone) opts.onDone(steadiness);
    }
    function stop() {
      running = false; if (raf) cancelAnimationFrame(raf);
      if (stream) { stream.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e) {} }); stream = null; }
      if (ctx && ctx.close) { try { ctx.close(); } catch (e) {} }
    }
    start();
    return stop;
  }

  V.screens.voicescan = function () {
    var w = W(); w.voiceScan = w.voiceScan || [];
    var stopCap = null;

    function render(steadiness) {
      var band = steadiness != null ? V.voiceBand(steadiness) : null;
      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' +
          head("mic", "pink", "vcTitle") +
          '<p class="s-sub">' + t("vcSub") + "</p>" +
          '<div class="card-soft scn-card">' +
            (steadiness != null
              ? '<div class="scn-result fade-in"><div class="rd-ring rd-tone-' + band.tone + '"><b>' + steadiness + '</b><small>' + t("vcSteady") + "</small></div>" +
                  '<div class="mt-sev mt-tone-' + band.tone + '" style="text-align:center;margin-top:4px">' + t(band.k) + "</div>" +
                  '<p class="mt-rec" style="text-align:center">' + t(band.k + "Rec") + "</p>" +
                  (band.tone !== "green" ? '<button class="btn btn-ghost" data-vc-breathe style="width:100%">' + V.icon("lungs") + " " + t("vcBreathe") + "</button>" : "") +
                  '<button class="btn btn-primary" id="vcStart" style="width:100%;margin-top:8px">' + V.icon("mic") + " " + t("vcAgain") + "</button></div>"
              : '<div class="vc-stage"><div class="vc-orb" id="vcOrb">' + V.icon("mic") + '</div>' +
                  '<div class="vc-timer" id="vcTimer"></div>' +
                  '<div class="scn-status" id="vcStatus">' + t("vcReady") + "</div>" +
                  '<button class="btn btn-primary" id="vcStart" style="width:100%">' + V.icon("mic") + " " + t("vcStart") + "</button></div>") +
          "</div>" +
          '<div id="vcMsg"></div>' +
          '<p class="hr-multi-note">' + t("vcDisc") + "</p>" +
        "</div>" +
        V.tabbar("home") +
        "</div>",
        { onMount: function () {
          var b = $("[data-x]"); if (b) b.addEventListener("click", function () { if (stopCap) stopCap(); V.go("scan"); });
          $("#vcStart").addEventListener("click", startVoice);
          var br = $("[data-vc-breathe]"); if (br) br.addEventListener("click", function () { V.go("breathe"); });
        }}
      );
    }

    function startVoice() {
      var btn = $("#vcStart"); if (btn) btn.disabled = true;
      stopCap = voiceCapture({
        onStatus: function (k) { var s = $("#vcStatus"); if (s) s.textContent = t(k); },
        onLevel: function (lvl, el) {
          var orb = $("#vcOrb"); if (orb) orb.style.transform = "scale(" + (1 + lvl * 0.4) + ")";
          var tm = $("#vcTimer"); if (tm) tm.textContent = Math.max(0, Math.ceil(5 - el)) + "s";
        },
        onError: function (k) { var b = $("#vcStart"); if (b) b.disabled = false; $("#vcMsg").innerHTML = warn(t(k)); var s = $("#vcStatus"); if (s) s.textContent = t("vcReady"); },
        onDone: function (steadiness) {
          w.voiceScan.push({ date: today(), steadiness: steadiness, band: V.voiceBand(steadiness).k });
          if (w.voiceScan.length > 40) w.voiceScan = w.voiceScan.slice(-40);
          V.awardOnce && V.awardOnce("voice:" + today(), V.POINTS.task, "task"); V.save();
          if (navigator.vibrate) navigator.vibrate(40);
          render(steadiness);
        },
      });
    }
    render(null);
  };

  V.screens.mindtests = function () {
    var session = null; // { kind, qs, idx, answers:[] }

    function shell(body) {
      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' +
          '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.iconBox("brain", "blue") + "<h1>" + t("mtTitle") + "</h1></div>" +
            '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
          body +
        "</div>" +
        V.tabbar("home") +
        "</div>",
        { onMount: function () {
          $("[data-x]").addEventListener("click", function () {
            if (session) { session = null; renderPick(); } else V.go("wellness");
          });
          wire();
        }}
      );
    }

    function renderPick() {
      var w = W();
      var lastP = (w.phq && w.phq.length) ? w.phq[w.phq.length - 1] : null;
      var lastG = (w.gad && w.gad.length) ? w.gad[w.gad.length - 1] : null;
      session = null;
      shell(
        '<p class="s-sub">' + t("mtSub") + "</p>" +
        '<button class="mt-pick" data-test="phq">' + V.iconBox("smile", "blue") +
          '<div class="mt-pick__t"><b>' + t("mtPHQ") + "</b><small>" + t("mtPHQDesc") + "</small>" +
          (lastP ? '<span class="mt-pick__last">' + t("mtScore") + " " + lastP.score + " · " + t(lastP.severity) + "</span>" : "") + "</div>" +
          V.icon("back") + "</button>" +
        '<button class="mt-pick" data-test="gad">' + V.iconBox("brain", "pink") +
          '<div class="mt-pick__t"><b>' + t("mtGAD") + "</b><small>" + t("mtGADDesc") + "</small>" +
          (lastG ? '<span class="mt-pick__last">' + t("mtScore") + " " + lastG.score + " · " + t(lastG.severity) + "</span>" : "") + "</div>" +
          V.icon("back") + "</button>" +
        '<p class="sy-disc">' + t("mtDisclaimer") + "</p>"
      );
    }

    function renderQuestion() {
      var q = session.qs[session.idx];
      var pct = Math.round((session.idx / session.qs.length) * 100);
      var opts = ["mtA0", "mtA1", "mtA2", "mtA3"].map(function (a, i) {
        var on = session.answers[session.idx] === i ? " on" : "";
        return '<button class="mt-opt' + on + '" data-ans="' + i + '">' + t(a) + "</button>";
      }).join("");
      shell(
        '<div class="mt-prog"><span style="width:' + pct + '%"></span></div>' +
        '<p class="mt-qmeta">' + t("mtQof").replace("{n}", session.idx + 1).replace("{total}", session.qs.length) + "</p>" +
        '<p class="mt-intro">' + t("mtIntro") + "</p>" +
        '<h2 class="mt-q">' + esc(L(q)) + "</h2>" +
        '<div class="mt-opts">' + opts + "</div>" +
        (session.idx > 0 ? '<button class="btn btn-ghost" data-prev style="margin-top:14px">' + V.icon("back") + " " + t("mtBack") + "</button>" : "")
      );
    }

    function renderResult() {
      var score = session.answers.reduce(function (a, b) { return a + b; }, 0);
      var b = severityBand(session.kind, score);
      var maxScore = session.qs.length * 3;
      var crisis = session.kind === "phq" && session.answers[8] > 0;
      // save
      var w = W();
      var rec = { date: today(), score: score, severity: b.k };
      if (session.kind === "phq") { w.phq = w.phq || []; w.phq.push(rec); if (w.phq.length > 40) w.phq = w.phq.slice(-40); }
      else { w.gad = w.gad || []; w.gad.push(rec); if (w.gad.length > 40) w.gad = w.gad.slice(-40); }
      V.awardOnce && V.awardOnce(session.kind + ":" + today(), V.POINTS.task, "task");
      V.save();

      shell(
        '<div class="mt-result fade-in">' +
          '<p class="s-sub">' + (session.kind === "phq" ? t("mtPHQ") : t("mtGAD")) + "</p>" +
          '<div class="mt-score-ring mt-tone-' + b.tone + '"><b>' + score + '</b><small>/ ' + maxScore + "</small></div>" +
          '<div class="mt-sev mt-tone-' + b.tone + '">' + t("mtSeverity") + ": <b>" + t(b.k) + "</b></div>" +
          (crisis ? '<div class="note-warn" style="margin-top:14px">' + V.icon("shield") + " " + t("mtCrisis") + "</div>" : "") +
          '<p class="mt-rec">' + t(b.rec) + "</p>" +
          '<div class="sy-act">' +
            (b.tone !== "green" || crisis ? '<button class="btn btn-primary" data-book>' + V.icon("calendar") + " " + t("mtBookMental") + "</button>" : "") +
            '<button class="btn btn-ghost" data-retake>' + t("mtRetake") + "</button>" +
          "</div>" +
          '<p class="sy-disc">' + t("mtDisclaimer") + "</p>" +
        "</div>"
      );
    }

    function wire() {
      if (!session) {
        each("[data-test]", function (b) {
          b.addEventListener("click", function () {
            var kind = b.getAttribute("data-test");
            session = { kind: kind, qs: kind === "phq" ? PHQ9 : GAD7, idx: 0, answers: [] };
            renderQuestion();
          });
        });
        return;
      }
      if (session.done) {
        var bk = $("[data-book]"); if (bk) bk.addEventListener("click", function () { V.openClinics ? V.openClinics("mental", { ka: "ფსიქოლოგი", en: "Psychologist" }) : V.go("clinics"); });
        var rt = $("[data-retake]"); if (rt) rt.addEventListener("click", function () { var k = session.kind; session = { kind: k, qs: k === "phq" ? PHQ9 : GAD7, idx: 0, answers: [] }; renderQuestion(); });
        return;
      }
      each("[data-ans]", function (b) {
        b.addEventListener("click", function () {
          session.answers[session.idx] = parseInt(b.getAttribute("data-ans"), 10);
          if (session.idx < session.qs.length - 1) { session.idx++; renderQuestion(); }
          else { session.done = true; renderResult(); }
        });
      });
      var pv = $("[data-prev]"); if (pv) pv.addEventListener("click", function () { session.idx--; renderQuestion(); });
    }

    renderPick();
  };

  /* ===================== COGNITIVE REACTION TIME (processing speed) ===================== */
  function REACT_TONE(k) { return k === "rxSharp" ? "green" : k === "rxOk" ? "yellow" : "crimson"; }
  V.screens.reactionscan = function () {
    var w = W(); w.reaction = w.reaction || [];
    var N = 5, trials = [], state = "idle", timer = null, startedAt = 0;

    function setPad(cls, big, small) {
      var pad = $("#rxPad"); if (!pad) return;
      pad.className = "rx-pad " + cls;
      var bb = $("#rxBig"); if (bb) bb.textContent = big;
      var ss = $("#rxSmall"); if (ss) ss.textContent = small || "";
    }
    function prog() {
      var p = $("#rxProg"); if (!p) return;
      var d = ""; for (var i = 0; i < N; i++) d += '<span class="rx-dot' + (i < trials.length ? " on" : "") + '"></span>';
      p.innerHTML = d;
    }
    function beginTrial() {
      state = "waiting"; setPad("rx-wait", t("rxWait"), "");
      var delay = 1200 + Math.floor(Math.random() * 2300);
      timer = setTimeout(function () {
        if (!alive($("#rxPad"))) return;
        state = "go"; startedAt = performance.now(); setPad("rx-go", t("rxTap"), "");
      }, delay);
    }
    function median(a) { var s = a.slice().sort(function (x, y) { return x - y; }); var m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); }
    function finish() {
      var ms = median(trials), band = V.reactionBand(ms);
      w.reaction.push({ date: today(), ms: ms, band: band.k }); if (w.reaction.length > 40) w.reaction = w.reaction.slice(-40);
      V.awardOnce && V.awardOnce("reaction:" + today(), V.POINTS.task, "task");
      V.save();
      state = "finished"; setPad("rx-result rd-tone-" + band.tone, ms + " " + t("rxMs"), t(band.k) + " · " + t("rxTapRetake"));
      if (navigator.vibrate) navigator.vibrate(40);
      var msg = $("#rxMsg"); if (msg) msg.innerHTML = '<div class="note-ok">' + V.icon("check") + " " + t("rxSaved") + " — " + t(band.k) + " (" + ms + " " + t("rxMs") + ")</div>";
      trials = [];
    }
    function padClick() {
      if (state === "idle" || state === "finished") { if (state === "finished") prog(); beginTrial(); return; }
      if (state === "waiting") { clearTimeout(timer); state = "idle"; setPad("rx-early", t("rxEarly"), t("rxTapRetry")); return; }
      if (state === "go") {
        var ms = Math.round(performance.now() - startedAt);
        trials.push(ms); prog();
        if (trials.length >= N) finish();
        else { state = "idle"; setPad("rx-step", ms + " " + t("rxMs"), t("rxTapNext")); }
      }
    }
    function history() {
      var arr = w.reaction || []; if (!arr.length) return "";
      var recent = arr.slice(-10);
      var bars = recent.map(function (r) {
        var tone = REACT_TONE(r.band), h = V.reactionScore(r.ms);
        return '<div class="mo-bar" title="' + r.date + " · " + r.ms + 'ms"><span class="mo-bar__fill tone-' + tone + '" style="height:' + h + '%"></span><i>' + r.date.slice(8) + "</i></div>";
      }).join("");
      return '<div class="section-head"><h3>' + t("rxHistory") + "</h3></div><div class=\"mo-chart\">" + bars + "</div>";
    }

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        head("brain", "blue", "rxTitle") +
        '<p class="s-sub">' + t("rxSub") + "</p>" +
        '<div class="card-soft rx-card">' +
          '<button class="rx-pad rx-idle" id="rxPad"><b id="rxBig">' + t("rxTapStart") + '</b><small id="rxSmall">' + t("rxHint") + "</small></button>" +
          '<div class="rx-prog" id="rxProg"></div>' +
        "</div>" +
        '<div id="rxMsg"></div>' +
        history() +
        '<p class="hr-multi-note">' + t("rxDisc") + "</p>" +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        backX();
        $("[data-x]").addEventListener("click", function () { if (timer) clearTimeout(timer); });
        prog();
        $("#rxPad").addEventListener("click", padClick);
      } }
    );
  };

  /* ===================== MOOD JOURNAL ===================== */
  var MOODS = [
    { v: 1, emoji: "😣", k: "moM1", tone: "crimson" },
    { v: 2, emoji: "🙁", k: "moM2", tone: "yellow" },
    { v: 3, emoji: "😐", k: "moM3", tone: "blue" },
    { v: 4, emoji: "🙂", k: "moM4", tone: "green" },
    { v: 5, emoji: "😄", k: "moM5", tone: "green" },
  ];
  var MOOD_TAGS = ["moTWork", "moTFamily", "moTSleep", "moTHealth", "moTStress", "moTExercise", "moTSocial", "moTMoney"];

  function moodStreak(mood) {
    var n = 0, d = new Date(today());
    for (;;) {
      var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      if (mood[iso]) { n++; d.setDate(d.getDate() - 1); } else break;
    }
    return n;
  }

  /* ---------- public mood API (used by the home daily-loop card) ---------- */
  V.MOODS = MOODS;
  V.moodStreak = function () { return moodStreak(W().mood || {}); };
  V.moodToday = function () { return (W().mood || {})[today()] || null; };
  // one-tap log from anywhere; keeps any existing note/tags, awards once/day
  V.quickLogMood = function (score) {
    var w = W(); w.mood = w.mood || {};
    var existed = !!w.mood[today()];
    var prev = w.mood[today()] || {};
    w.mood[today()] = { score: score, note: prev.note || "", tags: prev.tags || [] };
    if (!existed) V.awardOnce && V.awardOnce("mood:" + today(), V.POINTS.task, "task");
    V.save();
    return w.mood[today()];
  };

  // returns HTML for a home-screen daily mood check-in (one-tap)
  V.moodHomeCard = function () {
    var todays = V.moodToday(), streak = V.moodStreak();
    var head = '<div class="hm-head"><b>' + t("moHow") + "</b>" +
      (streak ? '<span class="hm-streak">🔥 ' + streak + "</span>" : "") + "</div>";
    if (todays) {
      var m = MOODS[(todays.score || 1) - 1];
      return '<div class="card-soft home-mood" id="homeMood">' + head +
        '<div class="hm-done"><span class="hm-emoji">' + m.emoji + "</span>" +
          "<div><b>" + t(m.k) + "</b><small>" + t("moSaved") + "</small></div>" +
          '<button class="hm-hist" data-hm-hist>' + t("moHistory") + " " + V.icon("next") + "</button></div></div>";
    }
    return '<div class="card-soft home-mood" id="homeMood">' + head +
      '<div class="hm-faces">' + MOODS.map(function (mm) {
        return '<button class="hm-face" data-hm="' + mm.v + '" aria-label="' + t(mm.k) + '"><span>' + mm.emoji + "</span></button>";
      }).join("") + "</div></div>";
  };
  // wires the home mood card; re-renders itself in place after a tap
  V.wireMoodHome = function () {
    var card = document.getElementById("homeMood");
    if (!card) return;
    function refresh() {
      var box = document.createElement("div");
      box.innerHTML = V.moodHomeCard();
      var fresh = box.firstChild;
      card.replaceWith(fresh);
      V.wireMoodHome();
    }
    card.querySelectorAll("[data-hm]").forEach(function (b) {
      b.addEventListener("click", function () {
        V.quickLogMood(parseInt(b.getAttribute("data-hm"), 10));
        V.toast && V.toast(t("moSaved"));
        if (navigator.vibrate) navigator.vibrate(25);
        refresh();
      });
    });
    var h = card.querySelector("[data-hm-hist]");
    if (h) h.addEventListener("click", function () { V.go("mood"); });
  };

  V.screens.mood = function () {
    var w = W();
    w.mood = w.mood || {};
    var todays = w.mood[today()];
    var sel = todays ? todays.score : 0;
    var tags = todays && todays.tags ? todays.tags.slice() : [];

    function render() {
      var streak = moodStreak(w.mood);
      var dates = Object.keys(w.mood).sort();
      var recent = dates.slice(-14);

      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' +
          '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.iconBox("smile", "yellow") + "<h1>" + t("moTitle") + "</h1></div>" +
            '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
          '<p class="s-sub">' + t("moSub") + "</p>" +

          '<div class="card-soft" style="padding:16px">' +
            '<p class="mo-how">' + t("moHow") + "</p>" +
            '<div class="mo-faces">' + MOODS.map(function (m) {
              return '<button class="mo-face' + (sel === m.v ? " on tone-" + m.tone : "") + '" data-mood="' + m.v + '"><span>' + m.emoji + "</span><small>" + t(m.k) + "</small></button>";
            }).join("") + "</div>" +
            '<div class="mo-tags">' + MOOD_TAGS.map(function (tg) {
              return '<button class="mo-tag' + (tags.indexOf(tg) >= 0 ? " on" : "") + '" data-tag="' + tg + '">' + t(tg) + "</button>";
            }).join("") + "</div>" +
            '<textarea id="moNote" class="sy-input" rows="2" placeholder="' + esc(t("moNotePh")) + '">' + esc(todays && todays.note ? todays.note : "") + "</textarea>" +
            '<button class="btn btn-primary" id="moSave" style="width:100%">' + V.icon("check") + " " + (todays ? t("moUpdate") : t("moSave")) + "</button>" +
            '<div id="moMsg"></div>' +
          "</div>" +

          '<div class="section-head"><h3>' + t("moHistory") + "</h3>" + (streak > 0 ? '<small>🔥 ' + streak + " " + t("moStreak") + "</small>" : "") + "</div>" +
          (recent.length
            ? '<div class="mo-chart">' + recent.map(function (iso) {
                var e = w.mood[iso], m = MOODS[(e.score || 1) - 1];
                return '<div class="mo-bar" title="' + iso + '"><span class="mo-bar__fill tone-' + m.tone + '" style="height:' + (e.score / 5 * 100) + '%"></span><i>' + iso.slice(8) + "</i></div>";
              }).join("") + "</div>"
            : '<p class="cal-note" style="text-align:left">' + t("moNoHist") + "</p>") +
        "</div>" +
        V.tabbar("home") +
        "</div>",
        { onMount: function () {
          $("[data-x]").addEventListener("click", function () { V.go("wellness"); });
          each("[data-mood]", function (b) { b.addEventListener("click", function () {
            sel = parseInt(b.getAttribute("data-mood"), 10);
            each("[data-mood]", function (x) {
              var mv = +x.getAttribute("data-mood");
              x.className = "mo-face" + (sel === mv ? " on tone-" + MOODS[mv - 1].tone : "");
            });
          }); });
          each("[data-tag]", function (b) { b.addEventListener("click", function () {
            var tg = b.getAttribute("data-tag"), i = tags.indexOf(tg);
            if (i >= 0) tags.splice(i, 1); else tags.push(tg);
            b.classList.toggle("on");
          }); });
          $("#moSave").addEventListener("click", function () {
            if (!sel) { $("#moMsg").innerHTML = '<div class="note-warn">' + V.icon("info") + " " + t("moPickFirst") + "</div>"; return; }
            var first = !w.mood[today()];
            w.mood[today()] = { score: sel, note: $("#moNote").value.trim(), tags: tags.slice() };
            if (first) V.awardOnce && V.awardOnce("mood:" + today(), V.POINTS.task, "task");
            V.save();
            V.toast && V.toast(t("moSaved"));
            render();
          });
        }}
      );
    }
    render();
  };

  /* ===================== BLOOD-PRESSURE LOG ===================== */
  function bpBand(sys, dia) {
    if (sys >= 180 || dia >= 120) return { k: "bpCrisis", tone: "crimson", crisis: true };
    if (sys >= 140 || dia >= 90) return { k: "bpStage2", tone: "crimson" };
    if (sys >= 130 || dia >= 80) return { k: "bpStage1", tone: "yellow" };
    if (sys >= 120) return { k: "bpElevated", tone: "yellow" };
    return { k: "bpNormal", tone: "green" };
  }

  V.screens.bplog = function () {
    var w = W(); w.bp = w.bp || [];

    function render() {
      var recent = w.bp.slice(-8).reverse();
      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' +
          head("drop", "crimson", "bpTitle") +
          '<p class="s-sub">' + t("bpSub") + "</p>" +
          '<div class="card-soft" style="padding:16px">' +
            '<div class="bp-row">' +
              '<label class="bp-field"><span>' + t("bpSys") + '</span><input id="bpSys" type="number" inputmode="numeric" placeholder="120"></label>' +
              '<label class="bp-field"><span>' + t("bpDia") + '</span><input id="bpDia" type="number" inputmode="numeric" placeholder="80"></label>' +
            "</div>" +
            '<label class="bp-field" style="margin-top:10px"><span>' + t("bpPulse") + '</span><input id="bpPulse" type="number" inputmode="numeric" placeholder="72"></label>' +
            '<button class="btn btn-primary" id="bpSave" style="width:100%;margin-top:14px">' + V.icon("check") + " " + t("bpSave") + "</button>" +
            '<div id="bpMsg"></div>' +
          "</div>" +
          '<div class="section-head"><h3>' + t("bpHistory") + "</h3></div>" +
          (recent.length
            ? '<div class="bp-list">' + recent.map(function (r) {
                var b = bpBand(r.sys, r.dia);
                return '<div class="bp-item"><span class="bp-dot tone-' + b.tone + '"></span>' +
                  '<b>' + r.sys + "/" + r.dia + '</b><small>' + t(b.k) + (r.pulse ? " · ♥ " + r.pulse : "") + "</small>" +
                  '<i>' + esc(r.date) + "</i></div>";
              }).join("") + "</div>"
            : '<p class="cal-note" style="text-align:left">' + t("bpNoHist") + "</p>") +
        "</div>" +
        V.tabbar("home") +
        "</div>",
        { onMount: function () {
          backX();
          $("#bpSave").addEventListener("click", function () {
            var sys = parseInt($("#bpSys").value, 10), dia = parseInt($("#bpDia").value, 10), pulse = parseInt($("#bpPulse").value, 10);
            if (!sys || !dia || sys < 70 || sys > 260 || dia < 40 || dia > 160 || dia >= sys) {
              $("#bpMsg").innerHTML = warn(t("bpInvalid")); return;
            }
            var b = bpBand(sys, dia);
            w.bp.push({ date: today(), sys: sys, dia: dia, pulse: pulse || null });
            if (w.bp.length > 60) w.bp = w.bp.slice(-60);
            V.awardOnce && V.awardOnce("bp:" + today(), V.POINTS.task, "task");
            V.save();
            var msg = '<div class="note-' + (b.tone === "green" ? "ok" : "warn") + '">' + V.icon(b.tone === "green" ? "check" : "shield") + " " + t("bpSaved") + " — <b>" + t(b.k) + "</b></div>";
            if (b.crisis) msg += '<div class="note-warn" style="margin-top:8px">' + V.icon("shield") + " " + t("bpCrisisMsg") + "</div>";
            if (b.tone === "crimson") msg += '<button class="link-btn" data-cardio style="margin-top:8px">' + t("bpBookCardio") + "</button>";
            $("#bpMsg").innerHTML = msg;
            var c = $("[data-cardio]"); if (c) c.addEventListener("click", function () { deepClinic("lipid", { ka: "კარდიოლოგი", en: "Cardiologist" }); });
            setTimeout(render, 1100);
          });
        }}
      );
    }
    render();
  };

  /* ===================== SLEEP DIARY ===================== */
  function sleepHours(bed, wake) {
    function mins(s) { var p = s.split(":"); return (+p[0]) * 60 + (+p[1]); }
    var b = mins(bed), wk = mins(wake);
    var diff = wk - b; if (diff <= 0) diff += 1440; // crossed midnight
    return Math.round(diff / 6) / 10; // hours, 1-decimal
  }

  V.screens.sleep = function () {
    var w = W(); w.sleep = w.sleep || [];
    var qual = 3;

    function render() {
      var recent = w.sleep.slice(-7);
      var last = w.sleep.length ? w.sleep[w.sleep.length - 1] : null;
      var avg = recent.length ? Math.round(recent.reduce(function (a, r) { return a + r.hours; }, 0) / recent.length * 10) / 10 : null;
      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' +
          head("moon", "blue", "slTitle") +
          '<p class="s-sub">' + t("slSub") + "</p>" +
          '<div class="card-soft" style="padding:16px">' +
            '<div class="bp-row">' +
              '<label class="bp-field"><span>' + t("slBed") + '</span><input id="slBed" type="time" value="23:00"></label>' +
              '<label class="bp-field"><span>' + t("slWake") + '</span><input id="slWake" type="time" value="07:00"></label>' +
            "</div>" +
            '<p class="mo-how" style="margin:14px 0 10px">' + t("slQuality") + "</p>" +
            '<div class="sl-quality">' + [1, 2, 3, 4, 5].map(function (n) {
              return '<button class="sl-q' + (qual === n ? " on" : "") + '" data-q="' + n + '">' + n + "<small>" + t("slQ" + n) + "</small></button>";
            }).join("") + "</div>" +
            '<button class="btn btn-primary" id="slSave" style="width:100%;margin-top:14px">' + V.icon("check") + " " + t("slSave") + "</button>" +
            '<div id="slMsg"></div>' +
          "</div>" +
          (last || avg != null
            ? '<div class="sl-stats">' +
                (last ? '<div class="sl-stat"><b>' + last.hours + " " + t("slHours") + '</b><small>' + t("slLast") + "</small></div>" : "") +
                (avg != null ? '<div class="sl-stat"><b>' + avg + " " + t("slHours") + '</b><small>' + t("slAvg") + "</small></div>" : "") +
              "</div>"
            : "") +
          (avg != null ? '<div class="note-' + (avg < 7 ? "warn" : "ok") + '">' + V.icon(avg < 7 ? "info" : "check") + " " + t(avg < 7 ? "slShort" : "slGood") + "</div>" : "") +
          '<div class="section-head"><h3>' + t("slHistory") + "</h3></div>" +
          (recent.length
            ? '<div class="mo-chart">' + recent.map(function (r) {
                var tone = r.hours < 6 ? "crimson" : r.hours < 7 ? "yellow" : "green";
                return '<div class="mo-bar" title="' + r.date + " · " + r.hours + 'h"><span class="mo-bar__fill tone-' + tone + '" style="height:' + Math.min(100, r.hours / 9 * 100) + '%"></span><i>' + r.date.slice(8) + "</i></div>";
              }).join("") + "</div>"
            : '<p class="cal-note" style="text-align:left">' + t("slNoHist") + "</p>") +
        "</div>" +
        V.tabbar("home") +
        "</div>",
        { onMount: function () {
          backX();
          each("[data-q]", function (b) { b.addEventListener("click", function () {
            qual = +b.getAttribute("data-q");
            each("[data-q]", function (x) { x.classList.toggle("on", x === b); });
          }); });
          $("#slSave").addEventListener("click", function () {
            var bed = $("#slBed").value, wake = $("#slWake").value;
            if (!bed || !wake) { $("#slMsg").innerHTML = warn(t("slFill")); return; }
            var hrs = sleepHours(bed, wake);
            var existing = w.sleep.findIndex(function (r) { return r.date === today(); });
            var row = { date: today(), bed: bed, wake: wake, hours: hrs, quality: qual };
            if (existing >= 0) w.sleep[existing] = row; else w.sleep.push(row);
            if (w.sleep.length > 60) w.sleep = w.sleep.slice(-60);
            if (existing < 0) V.awardOnce && V.awardOnce("sleep:" + today(), V.POINTS.task, "task");
            V.save();
            V.toast && V.toast(t("slSaved"));
            render();
          });
        }}
      );
    }
    render();
  };

  /* ===================== FASTING TIMER ===================== */
  var FAST_PROTOCOLS = [
    { id: "16:8", fast: 16, eat: 8 },
    { id: "18:6", fast: 18, eat: 6 },
    { id: "20:4", fast: 20, eat: 4 },
    { id: "OMAD", fast: 23, eat: 1 },
  ];

  V.screens.fasting = function () {
    var w = W();
    w.fasting = w.fasting || { active: null, log: [] };

    function render() {
      var f = w.fasting, active = f.active;
      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' +
          head("flame", "yellow", "fsTitle") +
          '<p class="s-sub">' + t("fsSub") + "</p>" +
          (active
            ? '<div class="card-soft fast-live">' +
                '<svg class="fast-ring" viewBox="0 0 120 120"><circle class="fast-ring__bg" cx="60" cy="60" r="52"/><circle id="fastArc" class="fast-ring__fg" cx="60" cy="60" r="52"/></svg>' +
                '<div class="fast-readout"><span class="fast-proto">' + active.protocol + '</span><b id="fastElapsed">0:00</b><small id="fastSub">' + t("fsRemaining") + "</small></div>" +
              "</div>" +
              '<div class="fast-meta" id="fastMeta">' + t("fsActive") + "</div>" +
              '<button class="btn btn-ghost danger" id="fastStop" style="width:100%">' + V.icon("x") + " " + t("fsStop") + "</button>"
            : '<p class="mo-how">' + t("fsPick") + "</p>" +
              '<div class="fast-protos">' + FAST_PROTOCOLS.map(function (p) {
                return '<button class="fast-proto-btn" data-proto="' + p.id + '"><b>' + p.id + "</b><small>" + t("fsEatWindow").replace("{h}", p.eat) + "</small></button>";
              }).join("") + "</div>") +
          '<div class="fast-total">' + t("fsTotal") + ": <b>" + (f.log ? f.log.length : 0) + "</b></div>" +
        "</div>" +
        V.tabbar("home") +
        "</div>",
        { onMount: function () {
          backX();
          if (active) { runClock(); $("#fastStop").addEventListener("click", stopFast); }
          else each("[data-proto]", function (b) { b.addEventListener("click", function () { startFast(b.getAttribute("data-proto")); }); });
        }}
      );
    }

    function startFast(id) {
      var p = FAST_PROTOCOLS.filter(function (x) { return x.id === id; })[0] || FAST_PROTOCOLS[0];
      w.fasting.active = { start: Date.now(), targetH: p.fast, protocol: p.id };
      V.save();
      render();
    }
    function stopFast() {
      var a = w.fasting.active; if (!a) return;
      var hrs = (Date.now() - a.start) / 3600000;
      if (hrs < a.targetH && !confirm(t("fsConfirmStop"))) return;
      w.fasting.log = w.fasting.log || [];
      w.fasting.log.push({ date: today(), hours: Math.round(hrs * 10) / 10, protocol: a.protocol });
      if (w.fasting.log.length > 60) w.fasting.log = w.fasting.log.slice(-60);
      w.fasting.active = null;
      if (hrs >= a.targetH) V.awardOnce && V.awardOnce("fasting:" + today(), V.POINTS.task, "task");
      V.save();
      V.toast && V.toast(t("fsLogged").replace("{h}", Math.round(hrs * 10) / 10));
      render();
    }
    function runClock() {
      var arc = $("#fastArc"), elEl = $("#fastElapsed"), subEl = $("#fastSub"), metaEl = $("#fastMeta");
      var C = 2 * Math.PI * 52;
      if (arc) arc.style.strokeDasharray = C;
      function tick() {
        if (!alive(arc)) return; // self-clean on navigation
        var a = w.fasting.active; if (!a) return;
        var sec = (Date.now() - a.start) / 1000;
        var targetSec = a.targetH * 3600;
        var frac = Math.min(1, sec / targetSec);
        if (arc) arc.style.strokeDashoffset = C * (1 - frac);
        var done = sec >= targetSec;
        var show = done ? sec : sec; // always show elapsed
        elEl.textContent = fmtHMS(show);
        if (done) { subEl.textContent = ""; metaEl.textContent = t("fsComplete"); arc.classList.add("done"); }
        else { var rem = targetSec - sec; subEl.textContent = t("fsRemaining") + " " + fmtHMS(rem); }
        requestAnimationFrame(function () { setTimeout(tick, 250); });
      }
      tick();
    }
    function fmtHMS(sec) {
      var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
      return h + ":" + String(m).padStart(2, "0") + (h < 1 ? ":" + String(s).padStart(2, "0") : "");
    }
    render();
  };

  /* ===================== QUIT SMOKING ===================== */
  var QUIT_MILES = [
    { k: "qsM20m", ms: 20 * 60000 },
    { k: "qsM12h", ms: 12 * 3600000 },
    { k: "qsM2d", ms: 2 * 86400000 },
    { k: "qsM2w", ms: 14 * 86400000 },
    { k: "qsM1m", ms: 30 * 86400000 },
    { k: "qsM1y", ms: 365 * 86400000 },
  ];

  V.screens.quitsmoke = function () {
    var w = W();

    function render() {
      var q = w.quit;
      if (!q || !q.date) return renderSetup();
      var elapsed = Date.now() - new Date(q.date + "T00:00:00").getTime();
      if (elapsed < 0) elapsed = 0;
      var days = Math.floor(elapsed / 86400000);
      var cigs = Math.floor(elapsed / 86400000 * q.perDay);
      var packsCost = (cigs / (q.cigsPerPack || 20)) * (q.pricePack || 0);
      var nextMile = QUIT_MILES.filter(function (m) { return m.ms > elapsed; })[0];

      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' +
          head("smoke", "green", "qsTitle") +
          '<p class="s-sub">' + t("qsSub") + "</p>" +
          '<div class="card-soft quit-hero">' +
            '<b class="quit-days">' + days + "</b><span>" + t("qsDays") + " " + t("qsSmokeFree") + "</span>" +
          "</div>" +
          '<div class="quit-stats">' +
            '<div class="quit-stat">' + V.iconBox("smoke", "blue") + "<b>" + cigs.toLocaleString() + "</b><small>" + t("qsNotSmoked") + "</small></div>" +
            '<div class="quit-stat">' + V.iconBox("diamond", "green") + "<b>₾" + Math.round(packsCost) + "</b><small>" + t("qsSaved") + "</small></div>" +
          "</div>" +
          (nextMile ? '<div class="note-ok">' + V.icon("trend") + " " + t("qsNextMile") + ": " + t(nextMile.k) + "</div>" : "") +
          '<div class="section-head"><h3>' + t("qsMiles") + "</h3></div>" +
          '<div class="quit-miles">' + QUIT_MILES.map(function (m) {
            var done = elapsed >= m.ms;
            return '<div class="quit-mile' + (done ? " on" : "") + '">' + V.icon(done ? "check" : "info") + "<span>" + t(m.k) + "</span>" + (done ? '<i>' + t("qsReached") + "</i>" : "") + "</div>";
          }).join("") + "</div>" +
          '<button class="btn btn-ghost" id="quitReset" style="width:100%;margin-top:16px">' + t("qsReset") + "</button>" +
        "</div>" +
        V.tabbar("home") +
        "</div>",
        { onMount: function () {
          backX();
          $("#quitReset").addEventListener("click", function () { w.quit = null; V.save(); render(); });
        }}
      );
    }

    function renderSetup() {
      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' +
          head("smoke", "green", "qsTitle") +
          '<p class="s-sub">' + t("qsSub") + "</p>" +
          '<div class="card-soft" style="padding:16px">' +
            '<p class="mo-how">' + t("qsSetup") + "</p>" +
            '<label class="bp-field"><span>' + t("qsDate") + '</span><input id="qDate" type="date" value="' + today() + '"></label>' +
            '<label class="bp-field" style="margin-top:10px"><span>' + t("qsPerDay") + '</span><input id="qPer" type="number" inputmode="numeric" placeholder="20"></label>' +
            '<div class="bp-row" style="margin-top:10px">' +
              '<label class="bp-field"><span>' + t("qsPrice") + '</span><input id="qPrice" type="number" inputmode="decimal" placeholder="9"></label>' +
              '<label class="bp-field"><span>' + t("qsPerPack") + '</span><input id="qPack" type="number" inputmode="numeric" placeholder="20"></label>' +
            "</div>" +
            '<button class="btn btn-primary" id="qBegin" style="width:100%;margin-top:14px">' + V.icon("check") + " " + t("qsBegin") + "</button>" +
            '<div id="qMsg"></div>' +
          "</div>" +
        "</div>" +
        V.tabbar("home") +
        "</div>",
        { onMount: function () {
          backX();
          $("#qBegin").addEventListener("click", function () {
            var date = $("#qDate").value, per = parseInt($("#qPer").value, 10);
            if (!date || !per || per < 1) { $("#qMsg").innerHTML = warn(t("qsFill")); return; }
            w.quit = { date: date, perDay: per, pricePack: parseFloat($("#qPrice").value) || 0, cigsPerPack: parseInt($("#qPack").value, 10) || 20 };
            V.awardOnce && V.awardOnce("quit:start", V.POINTS.task, "task");
            V.save();
            render();
          });
        }}
      );
    }
    render();
  };

  /* ===================== RISK CALCULATOR (FINDRISC) ===================== */
  // each question: options [{label-key, pts}]; prefill index from profile when possible
  var FINDRISC = [
    { q: "rkQ1", opts: [["rkQ1a", 0], ["rkQ1b", 2], ["rkQ1c", 3], ["rkQ1d", 4]], pre: function (p) { var a = p.age; return a == null ? -1 : a < 45 ? 0 : a < 55 ? 1 : a < 65 ? 2 : 3; } },
    { q: "rkQ2", opts: [["rkQ2a", 0], ["rkQ2b", 1], ["rkQ2c", 3]], pre: function () { var b = V.bmi(); return b == null ? -1 : b < 25 ? 0 : b <= 30 ? 1 : 2; } },
    { q: "rkQ3", sub: function (p) { return p.sex === "woman" ? "rkQ3woman" : "rkQ3man"; },
      opts: [["rkQ3a", 0], ["rkQ3b", 3], ["rkQ3c", 4]],
      pre: function (p) { var wst = p.waist; if (wst == null) return -1; var man = p.sex !== "woman"; var lo = man ? 94 : 80, hi = man ? 102 : 88; return wst < lo ? 0 : wst <= hi ? 1 : 2; } },
    { q: "rkQ4", yn: true, opts: [["rkNo", 2], ["rkYes", 0]], pre: function (p) { return p.activity == null ? -1 : (p.activity === "sitting" ? 0 : 1); } },
    { q: "rkQ5", yn: true, opts: [["rkNo", 1], ["rkYes", 0]], pre: function (p) { return p.food == null ? -1 : (p.food === "irregular" ? 0 : 1); } },
    { q: "rkQ6", yn: true, opts: [["rkNo", 0], ["rkYes", 2]], pre: function (p) { return p.conditions && p.conditions.indexOf("hyper") >= 0 ? 1 : -1; } },
    { q: "rkQ7", yn: true, opts: [["rkNo", 0], ["rkYes", 5]], pre: function (p) { return (p.conditions && p.conditions.indexOf("pre") >= 0) || (p.lastCheck && p.lastCheck.indexOf("sugar") >= 0) ? 1 : -1; } },
    { q: "rkQ8", opts: [["rkQ8a", 0], ["rkQ8b", 3], ["rkQ8c", 5]], pre: function () { return -1; } },
  ];
  function findriscBand(score) {
    if (score < 7) return { k: "rkLow", rec: "rkRecLow", tone: "green" };
    if (score < 12) return { k: "rkSlight", rec: "rkRecLow", tone: "green" };
    if (score < 15) return { k: "rkModerate", rec: "rkRecMod", tone: "yellow" };
    if (score < 21) return { k: "rkHigh", rec: "rkRecHigh", tone: "crimson" };
    return { k: "rkVeryHigh", rec: "rkRecHigh", tone: "crimson" };
  }

  V.screens.risk = function () {
    var p = V.state.profile;
    var session = null; // { idx, answers:[] }

    function shell(body) {
      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' + head("shield", "blue", "rkTitle") + body + "</div>" +
        V.tabbar("home") + "</div>",
        { onMount: function () {
          $("[data-x]").addEventListener("click", function () { if (session && !session.done) { session = null; renderIntro(); } else V.go("wellness"); });
          wire();
        }}
      );
    }
    function renderIntro() {
      session = null;
      var lastR = W().risk && W().risk.findrisc;
      shell('<p class="s-sub">' + t("rkSub") + "</p>" +
        (lastR ? '<div class="note-ok">' + V.icon("info") + " " + t("rkResult") + ": <b>" + lastR.score + " " + t("rkPts") + "</b> · " + t(lastR.band) + "</div>" : "") +
        '<button class="btn btn-primary" id="rkStart" style="width:100%;margin-top:14px">' + V.icon("shield") + " " + t("rkStart") + "</button>");
    }
    function renderQ() {
      var item = FINDRISC[session.idx];
      var pct = Math.round((session.idx / FINDRISC.length) * 100);
      var preIdx = session.answers[session.idx] != null ? session.answers[session.idx] : item.pre(p);
      var opts = item.opts.map(function (o, i) {
        return '<button class="mt-opt' + (preIdx === i ? " on" : "") + '" data-opt="' + i + '">' + t(o[0]) + "</button>";
      }).join("");
      shell(
        '<div class="mt-prog"><span style="width:' + pct + '%"></span></div>' +
        '<p class="mt-qmeta">' + t("mtQof").replace("{n}", session.idx + 1).replace("{total}", FINDRISC.length) + "</p>" +
        '<h2 class="mt-q">' + t(item.q) + "</h2>" +
        (item.sub ? '<p class="mt-intro">' + t(item.sub(p)) + "</p>" : "") +
        '<div class="mt-opts">' + opts + "</div>" +
        (session.idx > 0 ? '<button class="btn btn-ghost" data-prev style="margin-top:14px">' + V.icon("back") + " " + t("mtBack") + "</button>" : "")
      );
    }
    function renderResult() {
      var score = session.answers.reduce(function (sum, ai, i) { return sum + FINDRISC[i].opts[ai][1]; }, 0);
      var b = findriscBand(score);
      var ww = W(); ww.risk = ww.risk || {};
      ww.risk.findrisc = { date: today(), score: score, band: b.k };
      V.awardOnce && V.awardOnce("risk:" + today(), V.POINTS.task, "task");
      V.save();
      shell('<div class="mt-result fade-in">' +
        '<p class="s-sub">FINDRISC</p>' +
        '<div class="mt-score-ring mt-tone-' + b.tone + '"><b>' + score + '</b><small>' + t("rkPts") + "</small></div>" +
        '<div class="mt-sev mt-tone-' + b.tone + '">' + t("rkResult") + ": <b>" + t(b.k) + "</b></div>" +
        '<p class="mt-rec">' + t(b.rec) + "</p>" +
        '<div class="sy-act">' +
          (b.tone !== "green" ? '<button class="btn btn-primary" data-book>' + V.icon("calendar") + " " + t("rkBook") + "</button>" : "") +
          '<button class="btn btn-ghost" data-retake>' + t("rkRetake") + "</button>" +
        "</div></div>");
    }
    function wire() {
      if (!session) { var s = $("#rkStart"); if (s) s.addEventListener("click", function () { session = { idx: 0, answers: [] }; renderQ(); }); return; }
      if (session.done) {
        var bk = $("[data-book]"); if (bk) bk.addEventListener("click", function () { deepClinic("glucose", { ka: "ენდოკრინოლოგი", en: "Endocrinologist" }); });
        var rt = $("[data-retake]"); if (rt) rt.addEventListener("click", function () { session = { idx: 0, answers: [] }; renderQ(); });
        return;
      }
      each("[data-opt]", function (b) {
        b.addEventListener("click", function () {
          session.answers[session.idx] = parseInt(b.getAttribute("data-opt"), 10);
          if (session.idx < FINDRISC.length - 1) { session.idx++; renderQ(); }
          else { session.done = true; renderResult(); }
        });
      });
      var pv = $("[data-prev]"); if (pv) pv.addEventListener("click", function () { session.idx--; renderQ(); });
    }
    renderIntro();
  };

  /* ===================== OFFICE WORKOUT (desk exercises) ===================== */
  var OFFICE_AREAS = {
    neck:      { ka: "კისერი", en: "Neck" },
    shoulders: { ka: "მხრები", en: "Shoulders" },
    back:      { ka: "ზურგი", en: "Back & core" },
    wrists:    { ka: "მაჯები და ხელები", en: "Wrists & hands" },
    legs:      { ka: "ფეხები", en: "Legs" },
    full:      { ka: "სრული სხეული", en: "Full body" },
  };
  // anim = CSS class (.ox-*). Each move's emoji + motion is its own visualization.
  var OFFICE_EX = [
    { id: "neck-tilt",   area: "neck", fig: "headTilt", secs: 30, name: { ka: "კისრის გვერდითი დახრა", en: "Neck side tilt" }, desc: { ka: "ყური ნელა მხრისკენ დახარე, თითო მხარეს 5 წმ დაიჭირე.", en: "Slowly tilt your ear toward each shoulder, hold 5s per side." } },
    { id: "neck-turn",   area: "neck", fig: "headTurn", secs: 30, name: { ka: "კისრის შემოტრიალება", en: "Neck turns" }, desc: { ka: "ნელა მოატრიალე თავი მარცხნივ, შემდეგ მარჯვნივ.", en: "Slowly turn your head left, then right." } },
    { id: "chin-tuck",   area: "neck", fig: "headTuck", secs: 25, name: { ka: "ნიკაპის ჩაწევა", en: "Chin tucks" }, desc: { ka: "ნიკაპი უკან ჩაიწიე, თითქოს „ორმაგ ნიკაპს“ აკეთებ.", en: "Draw your chin straight back, making a 'double chin'." } },
    { id: "shoulder-roll", area: "shoulders", fig: "shoulderRoll", secs: 30, name: { ka: "მხრების ტრიალი", en: "Shoulder rolls" }, desc: { ka: "მხრები დიდი წრეებით ატრიალე უკან.", en: "Roll your shoulders backward in big circles." } },
    { id: "shoulder-shrug", area: "shoulders", fig: "shrug", secs: 25, name: { ka: "მხრების აწევა", en: "Shoulder shrugs" }, desc: { ka: "მხრები ყურებამდე ასწიე, 3 წმ დაიჭირე, ჩამოუშვი.", en: "Lift shoulders to your ears, hold 3s, release." } },
    { id: "chest-open",  area: "shoulders", fig: "armsBack", secs: 30, name: { ka: "გულმკერდის გახსნა", en: "Chest opener" }, desc: { ka: "ხელები ზურგს უკან გადააჯვარედინე და გულმკერდი გახსენი.", en: "Clasp your hands behind you and open your chest." } },
    { id: "upper-back",  area: "back", fig: "leanForward", secs: 30, name: { ka: "ზედა ზურგის გაჭიმვა", en: "Upper-back stretch" }, desc: { ka: "ხელები წინ გაიწიე და ზედა ზურგი მოამრგვალე.", en: "Reach your arms forward and round your upper back." } },
    { id: "torso-twist", area: "back", fig: "twist", secs: 30, name: { ka: "ტანის შემოტრიალება", en: "Seated torso twist" }, desc: { ka: "სკამზე მჯდომი ნელა შემოტრიალდი თითო მხარეს.", en: "Sitting tall, slowly twist your torso to each side." } },
    { id: "side-stretch", area: "back", fig: "sideStretch", secs: 30, name: { ka: "გვერდითი გაჭიმვა", en: "Seated side stretch" }, desc: { ka: "ერთი ხელი მაღლა ასწიე და ტანი გვერდზე დახარე.", en: "Raise one arm overhead and lean to the side." } },
    { id: "wrist-circles", area: "wrists", fig: "wristCircle", secs: 25, name: { ka: "მაჯების ტრიალი", en: "Wrist circles" }, desc: { ka: "მაჯები ორივე მიმართულებით ნელა ატრიალე.", en: "Circle your wrists slowly in both directions." } },
    { id: "wrist-stretch", area: "wrists", fig: "handsPulse", secs: 25, name: { ka: "მაჯის გაჭიმვა", en: "Wrist stretch" }, desc: { ka: "ხელი წინ გაშალე, თითები მეორე ხელით ნაზად უკან გაჭიმე.", en: "Extend an arm, gently pull the fingers back with the other hand." } },
    { id: "finger-stretch", area: "wrists", fig: "handsPulse", secs: 20, name: { ka: "თითების გაშლა", en: "Finger spread" }, desc: { ka: "თითები ფართოდ გაშალე, შემდეგ მუშტად მოკუმე — გაიმეორე.", en: "Spread your fingers wide, then make a fist — repeat." } },
    { id: "leg-raise",   area: "legs", fig: "legRaise", secs: 30, name: { ka: "ფეხის აწევა", en: "Seated leg raises" }, desc: { ka: "სკამზე მჯდომი თითო ფეხი გაასწორე და 3 წმ დაიჭირე.", en: "Sitting down, straighten one leg and hold 3s." } },
    { id: "ankle-circles", area: "legs", fig: "ankleCircle", secs: 25, name: { ka: "ტერფების ტრიალი", en: "Ankle circles" }, desc: { ka: "ფეხი ასწიე და ტერფი ორივე მიმართულებით ატრიალე.", en: "Lift a foot and circle the ankle both ways." } },
    { id: "calf-raise",  area: "legs", fig: "calfRaise", secs: 30, name: { ka: "წვივების აწევა", en: "Calf raises" }, desc: { ka: "წამოდექი და ცერებზე ნელა ადი-ჩამოდი.", en: "Stand and slowly rise onto your toes and back down." } },
    { id: "hip-march",   area: "legs", fig: "march", secs: 30, name: { ka: "ადგილზე ნაბიჯი", en: "Seated marching" }, desc: { ka: "სკამზე მჯდომი მონაცვლეობით ასწიე მუხლები.", en: "Sitting tall, lift your knees alternately like marching." } },
    { id: "stand-reach", area: "full", fig: "reachUp", secs: 25, name: { ka: "წამოდექი და გაიწიე", en: "Stand & reach" }, desc: { ka: "წამოდექი, ხელები მაღლა გაიწიე და მთელი სხეული გაჭიმე.", en: "Stand up, reach overhead and stretch your whole body tall." } },
    { id: "deep-breath", area: "full", fig: "breathe", secs: 30, name: { ka: "ღრმა სუნთქვა", en: "Deep breathing" }, desc: { ka: "4 წმ ჩაისუნთქე ცხვირით, 4 წმ ნელა ამოისუნთქე.", en: "Breathe in through the nose 4s, exhale slowly 4s." } },
  ];

  /* ---------- human SVG figure builder — animated pose per motion, varied looks ---------- */
  var OXC = { gr: "#2BA94C", gr2: "#1f8a3f", shoe: "#2f3640", eye: "#2a1c14" };
  // diverse cast: skin tones, hair styles + colours, m/f silhouettes — cycled per exercise
  var OX_LOOKS = [
    { sk: "#f0c8a0", hair: "#4a3526", style: "mop",      fem: false },
    { sk: "#d99a6c", hair: "#3a2418", style: "ponytail", fem: true },
    { sk: "#a9663c", hair: "#15151a", style: "crop",     fem: false },
    { sk: "#f4d2ad", hair: "#c79a3e", style: "long",     fem: true },
    { sk: "#cf9560", hair: "#5b4636", style: "curly",    fem: false },
    { sk: "#9c5e38", hair: "#1b1320", style: "bun",      fem: true },
    { sk: "#e8b487", hair: "#6b4a2a", style: "short",    fem: false },
    { sk: "#c98a5a", hair: "#2a1c14", style: "long",     fem: true },
  ];
  function oxP(d, c, w) { return '<path d="' + d + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'; }
  function oxShoe(x, y) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="8" ry="5" fill="' + OXC.shoe + '"/>'; }
  function oxLegs(A) { return oxP("M54 98 L50 138", A.sk, 11) + oxP("M66 98 L70 138", A.sk, 11) + oxShoe(49, 140) + oxShoe(71, 140); }
  function oxShorts(A) { return A.fem ? '<path d="M47 82 q13 9 26 0 l2 18 q-15 7 -30 0 z" fill="' + OXC.gr2 + '"/>' : '<rect x="46" y="82" width="28" height="18" rx="7" fill="' + OXC.gr2 + '"/>'; }
  function oxTorso(A, cls) { var c = cls ? 'class="' + cls + '" ' : ""; return A.fem ? '<path ' + c + 'd="M44 56 q16 -7 32 0 l-3 34 q-13 5 -26 0 z" fill="' + OXC.gr + '"/>' : '<rect ' + c + 'x="44" y="54" width="32" height="36" rx="14" fill="' + OXC.gr + '"/>'; }
  function oxHairBack(A) {
    if (A.style === "ponytail") return '<path d="M74 30 q9 8 5 26 q-2 6 -6 4 q5 -16 -3 -28 z" fill="' + A.hair + '"/>';
    if (A.style === "long") return '<path d="M44 28 q-6 24 -1 40 q4 4 8 1 q-5 -22 1 -41 z" fill="' + A.hair + '"/><path d="M76 28 q6 24 1 40 q-4 4 -8 1 q5 -22 -1 -41 z" fill="' + A.hair + '"/>';
    if (A.style === "bun") return '<circle cx="60" cy="16" r="6" fill="' + A.hair + '"/>';
    return "";
  }
  function oxHairFront(A) {
    if (A.style === "crop") return '<path d="M46 33 a14 14 0 0 1 28 0 l-2 -4 a13 13 0 0 0 -24 0 z" fill="' + A.hair + '"/>';
    if (A.style === "short") return '<path d="M48 28 a13 13 0 0 1 24 0 q-12 -5 -24 0 z" fill="' + A.hair + '"/>';
    if (A.style === "curly") return '<path d="M46 33 a14 14 0 0 1 28 0 l-3 -2 a12 12 0 0 0 -22 0 z" fill="' + A.hair + '"/><circle cx="49" cy="27" r="4" fill="' + A.hair + '"/><circle cx="57" cy="22" r="4.5" fill="' + A.hair + '"/><circle cx="64" cy="22" r="4.5" fill="' + A.hair + '"/><circle cx="71" cy="27" r="4" fill="' + A.hair + '"/>';
    if (A.style === "long") return '<path d="M44 33 a16 14 0 0 1 32 0 q-5 -11 -16 -11 q-11 0 -16 11 z" fill="' + A.hair + '"/>';
    if (A.style === "ponytail" || A.style === "bun") return '<path d="M45 33 a15 13 0 0 1 30 0 q-4 -10 -15 -10 q-11 0 -15 10 z" fill="' + A.hair + '"/>';
    return '<path d="M46 32 a14 14 0 0 1 28 0 l-3 -2 a12 12 0 0 0 -22 0 z" fill="' + A.hair + '"/>'; // mop
  }
  function oxHead(A) { return oxHairBack(A) + '<rect x="55" y="48" width="10" height="9" rx="4" fill="' + A.sk + '"/><circle cx="60" cy="34" r="15" fill="' + A.sk + '"/>' + oxHairFront(A) + '<circle cx="55" cy="35" r="1.8" fill="' + OXC.eye + '"/><circle cx="65" cy="35" r="1.8" fill="' + OXC.eye + '"/>'; }
  function oxArmsDown(A) { return oxP("M48 60 L40 86", A.sk, 9) + oxP("M72 60 L80 86", A.sk, 9); }
  // animateTransform: smooth eased loop (or linear for continuous circles)
  function oxAT(type, vals, dur, linear) {
    if (linear) return '<animateTransform attributeName="transform" type="' + type + '" values="' + vals + '" dur="' + dur + 's" repeatCount="indefinite" calcMode="linear"/>';
    var n = vals.split(";").length - 1, ks = [];
    for (var i = 0; i < n; i++) ks.push("0.4 0 0.6 1");
    return '<animateTransform attributeName="transform" type="' + type + '" values="' + vals + '" dur="' + dur + 's" repeatCount="indefinite" calcMode="spline" keySplines="' + ks.join(";") + '"/>';
  }
  function oxG(anim, inner) { return "<g>" + anim + inner + "</g>"; }

  var OX_FIG = {
    headTilt: function (A) { return oxLegs(A) + oxShorts(A) + oxArmsDown(A) + oxTorso(A) + oxG(oxAT("rotate", "-12 60 53;-12 60 53;12 60 53;12 60 53;-12 60 53", 3.4), oxHead(A)); },
    headTurn: function (A) { return oxLegs(A) + oxShorts(A) + oxArmsDown(A) + oxTorso(A) + '<g class="ox-turn">' + oxHead(A) + "</g>"; },
    headTuck: function (A) { return oxLegs(A) + oxShorts(A) + oxArmsDown(A) + oxTorso(A) + oxG(oxAT("rotate", "8 60 52;8 60 52;-7 60 52;8 60 52;8 60 52", 2.8), oxHead(A)); },
    shoulderRoll: function (A) { return oxLegs(A) + oxShorts(A) + oxTorso(A) + oxHead(A) + oxG(oxAT("translate", "0 -3;3 0;0 4;-3 0;0 -3", 2.8, true), oxP("M47 59 L43 76 L48 90", A.sk, 9) + oxP("M73 59 L77 76 L72 90", A.sk, 9)); },
    shrug: function (A) { return oxLegs(A) + oxShorts(A) + oxTorso(A) + oxHead(A) + oxG(oxAT("translate", "0 3;0 3;0 -5;0 -5;0 3", 2.4), oxArmsDown(A)); },
    armsBack: function (A) { return oxLegs(A) + oxShorts(A) +
      oxG(oxAT("rotate", "0 50 58;0 50 58;20 50 58;0 50 58;0 50 58", 2.8), oxP("M50 58 L40 82", A.sk, 9)) +
      oxG(oxAT("rotate", "0 70 58;0 70 58;-20 70 58;0 70 58;0 70 58", 2.8), oxP("M70 58 L80 82", A.sk, 9)) +
      oxTorso(A) + oxHead(A); },
    leanForward: function (A) { return oxLegs(A) + oxShorts(A) + oxG(oxAT("rotate", "0 60 92;0 60 92;12 60 92;12 60 92;0 60 92", 3),
      oxP("M50 60 L58 82", A.sk, 9) + oxP("M70 60 L62 82", A.sk, 9) + oxTorso(A) + oxHead(A)); },
    twist: function (A) { return oxLegs(A) + oxShorts(A) + '<g class="ox-twist">' + oxArmsDown(A) + oxTorso(A) + oxHead(A) + "</g>"; },
    sideStretch: function (A) { return oxLegs(A) + oxShorts(A) + oxG(oxAT("rotate", "0 60 96;0 60 96;13 60 96;13 60 96;0 60 96", 3.6),
      oxP("M48 58 L42 84", A.sk, 9) + oxP("M72 56 L82 26", A.sk, 9) + oxTorso(A) + oxHead(A)); },
    wristCircle: function (A) { return oxLegs(A) + oxShorts(A) + oxTorso(A) + oxHead(A) +
      oxP("M48 60 L50 78", A.sk, 9) + oxP("M72 60 L70 78", A.sk, 9) +
      oxG(oxAT("rotate", "0 50 78;360 50 78", 2.6, true), oxP("M50 78 L57 67", A.sk, 8)) +
      oxG(oxAT("rotate", "0 70 78;360 70 78", 2.6, true), oxP("M70 78 L63 67", A.sk, 8)); },
    handsPulse: function (A) { return oxLegs(A) + oxShorts(A) + oxTorso(A) + oxHead(A) +
      '<g class="ox-pulse-c">' + oxP("M48 60 L52 78 L60 72", A.sk, 9) + oxP("M72 60 L68 78 L60 72", A.sk, 9) + "</g>"; },
    legRaise: function (A) { return oxArmsDown(A) + oxTorso(A) + oxHead(A) + oxShorts(A) + oxP("M54 98 L50 138", A.sk, 11) + oxShoe(49, 140) +
      oxG(oxAT("rotate", "0 64 96;0 64 96;-34 64 96;0 64 96;0 64 96", 3.2), oxP("M64 96 L70 134", A.sk, 11) + oxShoe(71, 140)); },
    ankleCircle: function (A) { return oxArmsDown(A) + oxTorso(A) + oxHead(A) + oxShorts(A) + oxP("M54 98 L50 138", A.sk, 11) + oxShoe(49, 140) +
      oxP("M66 98 L70 126", A.sk, 11) + oxG(oxAT("rotate", "0 70 128;360 70 128", 2.4, true), oxShoe(70, 134)); },
    calfRaise: function (A) { return '<ellipse cx="49" cy="143" rx="8" ry="4" fill="' + OXC.shoe + '" opacity="0.28"/><ellipse cx="71" cy="143" rx="8" ry="4" fill="' + OXC.shoe + '" opacity="0.28"/>' +
      oxG(oxAT("translate", "0 0;0 0;0 -11;0 0;0 0", 2), oxLegs(A) + oxShorts(A) + oxArmsDown(A) + oxTorso(A) + oxHead(A)); },
    march: function (A) { return oxArmsDown(A) + oxTorso(A) + oxHead(A) + oxShorts(A) +
      oxG(oxAT("translate", "0 0;0 -9;0 0;0 0;0 0", 1.7), oxP("M54 98 L50 138", A.sk, 11) + oxShoe(49, 140)) +
      oxG(oxAT("translate", "0 0;0 0;0 0;0 -9;0 0", 1.7), oxP("M66 98 L70 138", A.sk, 11) + oxShoe(71, 140)); },
    reachUp: function (A) { return oxLegs(A) + oxShorts(A) + oxG(oxAT("translate", "0 2;0 2;0 -3;0 2;0 2", 3),
      oxP("M48 58 L53 24", A.sk, 9) + oxP("M72 58 L67 24", A.sk, 9) + oxTorso(A) + oxHead(A)); },
    breathe: function (A) { return oxLegs(A) + oxShorts(A) +
      oxG(oxAT("rotate", "0 60 60;0 60 60;-13 60 60;0 60 60;0 60 60", 4.5), oxP("M50 60 L41 83", A.sk, 9)) +
      oxG(oxAT("rotate", "0 60 60;0 60 60;13 60 60;0 60 60;0 60 60", 4.5), oxP("M70 60 L79 83", A.sk, 9)) +
      oxTorso(A, "ox-breathe-c") + oxHead(A); },
  };
  function figureSVG(kind, idx) {
    var build = OX_FIG[kind] || OX_FIG.headTilt;
    var A = OX_LOOKS[(idx || 0) % OX_LOOKS.length];
    return '<svg viewBox="0 0 120 150" class="ox-fig" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + build(A) + "</svg>";
  }

  V.screens.posture = function () {
    var w = W(); w.posture = w.posture || {};

    function todayCount() { return Number(w.posture[today()]) || 0; }
    function record() {
      w.posture[today()] = todayCount() + 1;
      if (w.posture[today()] === 1) V.awardOnce && V.awardOnce("posture:" + today(), V.POINTS.task, "task");
      V.save();
    }

    /* ---------- list of exercises (grouped by area) ---------- */
    function renderList() {
      var cnt = todayCount();
      var byArea = {};
      OFFICE_EX.forEach(function (ex, i) { (byArea[ex.area] = byArea[ex.area] || []).push(i); });
      var groups = Object.keys(OFFICE_AREAS).filter(function (a) { return byArea[a]; }).map(function (a) {
        return '<div class="ox-group-h">' + L(OFFICE_AREAS[a]) + "</div>" +
          byArea[a].map(function (i) {
            var ex = OFFICE_EX[i];
            return '<button class="ox-card" data-ex="' + i + '">' +
              '<span class="ox-vis">' + figureSVG(ex.fig, i) + "</span>" +
              '<span class="ox-card__t"><b>' + L(ex.name) + "</b><small>" + ex.secs + " " + t("poSecs") + " · " + L(OFFICE_AREAS[ex.area]) + "</small></span>" +
              V.icon("back") + "</button>";
          }).join("");
      }).join("");

      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' +
          head("walk", "pink", "poTitle") +
          '<p class="s-sub">' + t("poSub") + "</p>" +
          '<button class="btn btn-primary" id="poRoutine" style="width:100%">' + V.icon("walk") + " " + t("poRoutine") + " · " + OFFICE_EX.length + "</button>" +
          (cnt ? '<p class="ox-today">✓ ' + t("poTodayCount").replace("{n}", cnt) + "</p>" : "") +
          '<div class="section-head"><h3>' + t("poList") + "</h3></div>" +
          '<div class="ox-list">' + groups + "</div>" +
        "</div>" +
        V.tabbar("home") +
        "</div>",
        { onMount: function () {
          backX();
          // freeze the 18 list figures (perf) — they animate only in the player
          each(".ox-vis .ox-fig", function (svg) { try { svg.pauseAnimations(); } catch (e) {} });
          $("#poRoutine").addEventListener("click", function () { play(OFFICE_EX.slice(), 0); });
          each("[data-ex]", function (b) { b.addEventListener("click", function () { play([OFFICE_EX[+b.getAttribute("data-ex")]], 0); }); });
        }}
      );
    }

    /* ---------- focused player (single exercise or routine queue) ---------- */
    function play(queue, startIdx) {
      var idx = startIdx || 0;
      var routine = queue.length > 1;

      function step() {
        var ex = queue[idx];
        V.mount(
          V.statusbar() +
          '<div class="screen"><div class="pad-lg fade-in">' +
            head("walk", "pink", "poTitle") +
            '<div class="ox-player">' +
              (routine ? '<p class="ox-qmeta">' + (idx + 1) + " / " + queue.length + "</p>" : "") +
              '<div class="ox-stage" id="oxFig">' + figureSVG(ex.fig, OFFICE_EX.indexOf(ex)) + "</div>" +
              '<h2 class="ox-name">' + L(ex.name) + "</h2>" +
              '<p class="ox-desc">' + L(ex.desc) + "</p>" +
              '<div class="ox-timer" id="oxTimer">' + ex.secs + "</div>" +
              '<div class="mt-prog"><span id="oxBar" style="width:0%"></span></div>' +
              '<div class="ox-controls">' +
                '<button class="btn btn-ghost" data-skip>' + t("poSkip") + " " + V.icon("next") + "</button>" +
                '<button class="btn btn-ghost danger" data-stop>' + V.icon("x") + " " + t("poStop") + "</button>" +
              "</div>" +
            "</div>" +
          "</div>" +
          V.tabbar("home") +
          "</div>",
          { onMount: run }
        );

        function run() {
          $("[data-x]").addEventListener("click", renderList);
          $("[data-stop]").addEventListener("click", renderList);
          $("[data-skip]").addEventListener("click", function () { advance(false); });
          var stage = $(".ox-stage"), timerEl = $("#oxTimer"), bar = $("#oxBar");
          var start = performance.now(), raf = 0;
          function tick() {
            if (!alive(stage)) { cancelAnimationFrame(raf); return; } // self-clean
            var elapsed = (performance.now() - start) / 1000;
            var left = Math.max(0, ex.secs - elapsed);
            timerEl.textContent = Math.ceil(left);
            bar.style.width = Math.min(100, elapsed / ex.secs * 100) + "%";
            if (left <= 0) { advance(true); return; }
            raf = requestAnimationFrame(tick);
          }
          tick();
        }
        function advance(credit) {
          if (credit) { record(); if (navigator.vibrate) navigator.vibrate(30); }
          idx++;
          if (idx < queue.length) step();
          else finishAll();
        }
      }

      function finishAll() {
        V.mount(
          V.statusbar() +
          '<div class="screen"><div class="pad-lg fade-in">' +
            head("walk", "pink", "poTitle") +
            '<div class="mt-result fade-in" style="padding-top:20px">' +
              '<div class="ox-finish">🎉</div>' +
              '<h2 class="mt-q" style="text-align:center">' + t("poComplete") + "</h2>" +
              '<p class="mt-rec" style="text-align:center">' + t("poTodayCount").replace("{n}", todayCount()) + "</p>" +
              '<div class="sy-act">' +
                '<button class="btn btn-primary" data-again>' + V.icon("walk") + " " + t("poAgain") + "</button>" +
                '<button class="btn btn-ghost" data-list>' + t("poBackList") + "</button>" +
              "</div>" +
            "</div>" +
          "</div>" +
          V.tabbar("home") +
          "</div>",
          { onMount: function () {
            $("[data-x]").addEventListener("click", renderList);
            $("[data-list]").addEventListener("click", renderList);
            $("[data-again]").addEventListener("click", function () { play(queue, 0); });
          }}
        );
      }

      step();
    }

    renderList();
  };

  /* ===================== VITA GARDEN — daily quests + growing plant ===================== */
  var GROW_THRESH = [0, 3, 8, 15, 25, 40]; // grow points needed to reach each of 6 stages

  function companion() { return (V.state.companion = V.state.companion || { grow: 0, credited: {} }); }

  // today's daily quests, completion derived from existing app state (no double-tracking)
  V.dailyQuests = function () {
    var d = today(), w = V.state.wellness || {};
    return [
      { id: "mood",    icon: "smile", key: "quMood",    route: "mood",    done: !!(w.mood && w.mood[d]) },
      { id: "water",   icon: "drop",  key: "quWater",   route: "plan",    done: (V.waterToday ? V.waterToday() : 0) > 0 },
      { id: "breathe", icon: "lungs", key: "quBreathe", route: "breathe", done: !!(w.breatheLog && w.breatheLog[d]) },
      { id: "move",    icon: "walk",  key: "quMove",    route: "posture", done: (Number((w.posture || {})[d]) || 0) > 0 },
      { id: "task",    icon: "check", key: "quTask",    route: "plan",    done: ((V.state.doneTasks || {})[d] || []).length > 0 },
    ];
  };
  // accrue plant growth for any newly-completed quests; daily all-done bonus once
  V.creditQuests = function () {
    var c = companion(); c.credited = c.credited || {};
    var d = today(), changed = false, quests = V.dailyQuests();
    quests.forEach(function (q) {
      var k = d + ":" + q.id;
      if (q.done && !c.credited[k]) { c.credited[k] = true; c.grow = (c.grow || 0) + 1; changed = true; }
    });
    if (quests.every(function (q) { return q.done; }) && !c.credited[d + ":__all"]) {
      c.credited[d + ":__all"] = true;
      V.awardOnce && V.awardOnce("quests:" + d, V.POINTS.task, "task");
      changed = true;
    }
    if (changed) V.save();
    return c;
  };
  V.companionStage = function () {
    var g = companion().grow || 0, s = 0;
    for (var i = 0; i < GROW_THRESH.length; i++) if (g >= GROW_THRESH[i]) s = i;
    return s;
  };
  V.companionProgress = function () {
    var g = companion().grow || 0, s = V.companionStage();
    if (s >= GROW_THRESH.length - 1) return { stage: s, max: true };
    return { stage: s, cur: g - GROW_THRESH[s], need: GROW_THRESH[s + 1] - GROW_THRESH[s], max: false };
  };

  function leaf(x, y, d) { return '<path d="M' + x + " " + y + " q" + (d * 11) + " -5 " + (d * 17) + " -1 q" + (d * -5) + " 7 " + (d * -17) + ' 1 z" fill="#3cb85f"/>'; }
  function flower(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="3.6" fill="#f4c542"/><circle cx="' + x + '" cy="' + y + '" r="1.5" fill="#e89a3c"/>'; }
  function plantSVG(stage) {
    var spec = [
      { h: 8,  pairs: 1, canopy: 0 }, { h: 22, pairs: 1, canopy: 0 }, { h: 36, pairs: 2, canopy: 0 },
      { h: 48, pairs: 3, canopy: 0 }, { h: 50, pairs: 0, canopy: 1 }, { h: 54, pairs: 1, canopy: 2 },
    ][stage] || { h: 8, pairs: 1, canopy: 0 };
    var topY = 106 - spec.h, inner = "";
    inner += '<path d="M60 106 V' + topY + '" stroke="#1f8a3f" stroke-width="' + (stage >= 4 ? 5 : 3) + '" stroke-linecap="round" fill="none"/>';
    for (var i = 0; i < spec.pairs; i++) {
      var ly = 102 - (i + 1) * (spec.h / (spec.pairs + 1));
      inner += leaf(60, ly, -1) + leaf(60, ly, 1);
    }
    if (spec.canopy) {
      inner += '<circle cx="50" cy="' + (topY + 6) + '" r="12" fill="#2BA94C"/><circle cx="70" cy="' + (topY + 6) + '" r="12" fill="#2BA94C"/><circle cx="60" cy="' + (topY - 3) + '" r="16" fill="#3cb85f"/>';
      if (spec.canopy > 1) inner += flower(51, topY - 2) + flower(68, topY) + flower(60, topY - 12) + flower(60, topY + 8);
    } else if (stage >= 1) {
      inner += '<circle cx="60" cy="' + topY + '" r="3.6" fill="#3cb85f"/>';
    }
    return '<svg viewBox="0 0 120 132" class="gp-svg" aria-hidden="true">' +
      '<ellipse cx="60" cy="124" rx="30" ry="5" fill="#000" opacity="0.06"/>' +
      '<g class="gp-sway">' + inner + "</g>" +
      '<path d="M45 110 L75 110 L71 127 Q71 129 69 129 L51 129 Q49 129 49 127 Z" fill="#c97b4a"/>' +
      '<rect x="42" y="104" width="36" height="8" rx="3" fill="#d98a58"/>' +
      '<ellipse cx="60" cy="106" rx="15" ry="2.6" fill="#5b3a29"/></svg>';
  }

  V.screens.quests = function () {
    V.creditQuests();
    var stage = V.companionStage(), prog = V.companionProgress(), quests = V.dailyQuests();
    var doneN = quests.filter(function (q) { return q.done; }).length;

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("quTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("quSub") + "</p>" +
        '<div class="garden-card">' +
          '<div class="garden-stage">' + plantSVG(stage) + "</div>" +
          '<div class="garden-meta"><b>' + t("quS" + stage) + "</b>" +
            (prog.max ? '<small class="garden-max">🌿 ' + t("quMaxed") + "</small>"
              : '<div class="garden-prog"><span style="width:' + Math.round(prog.cur / prog.need * 100) + '%"></span></div>' +
                '<small>' + prog.cur + " / " + prog.need + " " + t("quNext") + "</small>") +
          "</div>" +
        "</div>" +
        '<div class="section-head"><h3>' + t("quQuests") + "</h3><small>" + doneN + " / " + quests.length + "</small></div>" +
        (doneN === quests.length ? '<div class="note-ok" style="margin-bottom:12px">' + V.icon("check") + " " + t("quAllDone") + "</div>" : "") +
        '<div class="qu-list">' + quests.map(function (q) {
          return '<button class="qu-row' + (q.done ? " on" : "") + '" data-q-go="' + q.route + '">' +
            V.iconBox(q.icon, q.done ? "green" : "gray") +
            '<div class="qu-row__t"><b>' + t(q.key) + "</b></div>" +
            (q.done ? '<span class="qu-check">' + V.icon("check") + "</span>" : '<span class="qu-cta">' + V.icon("next") + "</span>") +
            "</button>";
        }).join("") + "</div>" +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        var b = $("[data-x]"); if (b) b.addEventListener("click", function () { V.go("home"); });
        each("[data-q-go]", function (r) { r.addEventListener("click", function () { V.go(r.getAttribute("data-q-go")); }); });
      }}
    );
  };

  // compact home card linking to the garden
  V.gardenHomeCard = function () {
    V.creditQuests();
    var stage = V.companionStage(), prog = V.companionProgress(), quests = V.dailyQuests();
    var doneN = quests.filter(function (q) { return q.done; }).length;
    var pct = prog.max ? 100 : Math.round(prog.cur / prog.need * 100);
    return '<button class="card-soft garden-home" id="gardenHome">' +
      '<span class="garden-home__plant">' + plantSVG(stage) + "</span>" +
      '<span class="garden-home__t"><b>' + t("quTitle") + " · " + t("quS" + stage) + "</b>" +
        "<small>" + doneN + " / " + quests.length + " " + t("quQuests") + "</small>" +
        '<span class="garden-home__bar"><span style="width:' + pct + '%"></span></span></span>' +
      V.icon("next") + "</button>";
  };
  V.wireGardenHome = function () {
    var c = document.getElementById("gardenHome");
    if (c) c.addEventListener("click", function () { V.go("quests"); });
  };

  /* ===================== READINESS — daily score + baseline insights ===================== */
  function avg(nums) { return nums.length ? nums.reduce(function (a, b) { return a + b; }, 0) / nums.length : null; }
  // baseline = personal usual, computed from the prior readings (excludes the latest one)
  V.hrBaseline = function () { var a = (W().hr || []).slice(0, -1).slice(-14); return a.length ? Math.round(avg(a.map(function (x) { return x.bpm; }))) : null; };
  V.sleepBaseline = function () { var a = (W().sleep || []).slice(0, -1).slice(-14); return a.length ? Math.round(avg(a.map(function (x) { return x.hours; })) * 10) / 10 : null; };
  V.bpBaseline = function () { var a = (W().bp || []).slice(0, -1).slice(-14); return a.length ? { sys: Math.round(avg(a.map(function (x) { return x.sys; }))), dia: Math.round(avg(a.map(function (x) { return x.dia; }))) } : null; };

  // composite daily readiness (0-100) from whatever today's data exists
  V.readiness = function () {
    var w = W(), d = today(), score = 70, factors = [];
    function add(key, icon, adj, val) { score += adj; factors.push({ key: key, icon: icon, adj: Math.round(adj), val: val }); }
    var sl = (w.sleep || []).slice(-1)[0];
    if (sl && daysSince(sl.date) <= 1) { var h = sl.hours, a = h >= 7 && h <= 9 ? 12 : h >= 6 ? 4 : h >= 5 ? -6 : -14; a += (sl.quality - 3) * 2.5; add("rdSleep", "moon", a, h + t("slHours")); }
    var mo = (w.mood || {})[d];
    if (mo) add("rdMood", "smile", (mo.score - 3) * 5, null);
    var q = V.dailyQuests ? V.dailyQuests().filter(function (x) { return x.done; }).length : 0;
    add("rdActivity", "walk", (q - 2) * 3, q + "/5");
    var hrArr = (w.hr || []), hrRec = hrArr.length ? hrArr[hrArr.length - 1] : null, hrBase = V.hrBaseline();
    if (hrRec && daysSince(hrRec.date) <= 7 && hrBase) { var dev = hrRec.bpm - hrBase, a2 = dev <= 3 ? 4 : dev <= 8 ? -3 : -9; add("rdHR", "heart", a2, (dev >= 0 ? "+" : "") + dev + " bpm"); }
    score = Math.max(25, Math.min(99, Math.round(score)));
    var band = score >= 75 ? { k: "rdReady", tone: "green" } : score >= 50 ? { k: "rdModerate", tone: "yellow" } : { k: "rdRecover", tone: "crimson" };
    return { score: score, band: band, factors: factors };
  };

  // baseline-deviation rows for the detail screen (only metrics with ≥2 logs)
  function rdInsights() {
    var w = W(), rows = [];
    var hr = (w.hr || []);
    if (hr.length >= 2) { var hl = hr[hr.length - 1].bpm, hb = V.hrBaseline(); rows.push({ icon: "heart", label: "rdHR", last: hl + " bpm", base: hb + " bpm", dev: hl - hb, worseHigh: true, thr: 5 }); }
    var s = (w.sleep || []);
    if (s.length >= 2) { var ll = s[s.length - 1].hours, lb = V.sleepBaseline(); rows.push({ icon: "moon", label: "rdSleep", last: ll + t("slHours"), base: lb + t("slHours"), dev: Math.round((ll - lb) * 10) / 10, worseHigh: false, thr: 0.8 }); }
    var b = (w.bp || []);
    if (b.length >= 2) { var bl = b[b.length - 1], bb = V.bpBaseline(); rows.push({ icon: "drop", label: "bpTitle", last: bl.sys + "/" + bl.dia, base: bb.sys + "/" + bb.dia, dev: bl.sys - bb.sys, worseHigh: true, thr: 8 }); }
    return rows;
  }

  V.screens.readiness = function () {
    var r = V.readiness(), rows = rdInsights();
    function devBadge(o) {
      if (Math.abs(o.dev) < o.thr) return '<span class="rd-dev ok">' + t("rdNormal") + "</span>";
      var up = o.dev > 0, bad = up === o.worseHigh;
      return '<span class="rd-dev ' + (bad ? "bad" : "good") + '">' + (up ? "↑" : "↓") + " " + Math.abs(o.dev) + " " + t(up ? "rdAbove" : "rdBelow") + "</span>";
    }
    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.iconBox("bolt", r.band.tone) + "<h1>" + t("rdTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("rdSub") + "</p>" +
        '<div class="rd-hero"><div class="rd-ring rd-big rd-tone-' + r.band.tone + '"><b>' + r.score + "</b><small>/100</small></div>" +
          '<div class="rd-hero__b rd-text-' + r.band.tone + '">' + t(r.band.k) + "</div></div>" +
        '<div class="section-head"><h3>' + t("rdFactors") + "</h3></div>" +
        '<div class="rd-factors-list">' + r.factors.map(function (f) {
          return '<div class="rd-frow">' + V.iconBox(f.icon, f.adj >= 0 ? "green" : "gray") +
            '<div class="rd-frow__t"><b>' + t(f.key) + "</b>" + (f.val ? "<small>" + f.val + "</small>" : "") + "</div>" +
            '<span class="rd-adj ' + (f.adj >= 0 ? "pos" : "neg") + '">' + (f.adj >= 0 ? "+" : "") + f.adj + "</span></div>";
        }).join("") + "</div>" +
        (rows.length ? '<div class="section-head"><h3>' + t("rdInsights") + "</h3></div>" +
          '<div class="rd-ins-list">' + rows.map(function (o) {
            return '<div class="rd-irow">' + V.iconBox(o.icon, "blue") +
              '<div class="rd-irow__t"><b>' + t(o.label) + "</b><small>" + o.last + " · " + t("rdBaseline") + " " + o.base + "</small></div>" +
              devBadge(o) + "</div>";
          }).join("") + "</div>" : "") +
        '<p class="sy-disc">' + t("rdDisc") + "</p>" +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () { var b = $("[data-x]"); if (b) b.addEventListener("click", function () { V.go("home"); }); } }
    );
  };

  V.readinessHomeCard = function () {
    var r = V.readiness();
    return '<button class="card-soft rd-home" id="rdHome">' +
      '<span class="rd-ring rd-tone-' + r.band.tone + '"><b>' + r.score + "</b></span>" +
      '<span class="rd-home__t"><small>' + t("rdHome") + '</small><b class="rd-text-' + r.band.tone + '">' + t(r.band.k) + "</b></span>" +
      V.icon("next") + "</button>";
  };
  V.wireReadinessHome = function () { var c = document.getElementById("rdHome"); if (c) c.addEventListener("click", function () { V.go("readiness"); }); };

  // compact 2-up "today" row for home: readiness ring + garden plant
  V.todayMini = function () {
    V.creditQuests && V.creditQuests();
    var r = V.readiness(), stage = V.companionStage(), quests = V.dailyQuests();
    var qDone = quests.filter(function (q) { return q.done; }).length;
    return '<div class="today-mini">' +
      '<button class="tm-cell" data-tm="readiness"><span class="rd-ring rd-tone-' + r.band.tone + '"><b>' + r.score + "</b></span>" +
        '<span class="tm-lbl"><b>' + t("rdTitle") + '</b><small class="rd-text-' + r.band.tone + '">' + t(r.band.k) + "</small></span></button>" +
      '<button class="tm-cell" data-tm="quests"><span class="tm-plant">' + plantSVG(stage) + "</span>" +
        '<span class="tm-lbl"><b>' + t("quTitle") + "</b><small>" + qDone + " / " + quests.length + " " + t("quQuests") + "</small></span></button>" +
    "</div>";
  };
  V.wireTodayMini = function () { document.querySelectorAll("[data-tm]").forEach(function (b) { b.addEventListener("click", function () { V.go(b.getAttribute("data-tm")); }); }); };

  /* ===================== TELEMEDICINE (video consult + e-prescription) ===================== */
  var TD_HEX = { green: "#2BA94C", crimson: "#e8536b", pink: "#e0689f", blue: "#4a90d9" };
  var TD_RX = {
    d1: [{ ka: "ომეგა-3, 1000მგ", en: "Omega-3, 1000mg" }, { ka: "დღეში 1× ჭამის შემდეგ", en: "Once daily after meals" }],
    d2: [{ ka: "ვიტამინი D3, 2000 IU", en: "Vitamin D3, 2000 IU" }, { ka: "დღეში 1×, 8 კვირა", en: "Once daily, 8 weeks" }],
    d3: [{ ka: "დამატენიანებელი SPF30", en: "Moisturizer SPF30" }, { ka: "დილით, ყოველდღე", en: "Every morning" }],
    d4: [{ ka: "ცნობიერების ვარჯიში (10წთ/დღე)", en: "Mindfulness practice (10min/day)" }, { ka: "4-კვირიანი გეგმა", en: "4-week plan" }],
  };
  V.screens.telemed = function () {
    var stage = "list", doc = null, startT = 0, ticker = null, chat = [], sIdx = 0, sTimer = null, paid = false, saved = false;

    function clearTimers() { if (ticker) clearInterval(ticker); if (sTimer) clearTimeout(sTimer); ticker = sTimer = null; }
    function docAv(d, size) { size = size || 46; return '<span class="td-av" style="width:' + size + "px;height:" + size + "px;font-size:" + Math.round(size * 0.36) + "px;background:" + TD_HEX[d.tone] + '">' + V.initials(L(d.name)) + "</span>"; }
    function fmtDur(s) { var m = Math.floor(s / 60), ss = s % 60; return m + ":" + (ss < 10 ? "0" : "") + ss; }

    function docCard(d) {
      return '<button class="td-doc" data-doc="' + d.id + '">' + docAv(d) +
        '<div class="td-doc__t"><b>' + L(d.name) + "</b><small>" + L(d.spec) + " · ★ " + d.rating + "</small></div>" +
        '<div class="td-doc__r">' + (d.online ? '<span class="td-online">' + t("tdOnline") + "</span>" : '<span class="td-soon">' + d.next + "</span>") +
          "<b>₾" + d.price + "</b></div></button>";
    }

    function script() {
      var ka = V.lang() === "ka";
      return ka
        ? ["გამარჯობა, მე ვარ " + L(doc.name) + ". რა გაწუხებთ დღეს?", "გასაგებია. რამდენი ხანია ეს გრძნობა გაქვთ?", "მადლობა ინფორმაციისთვის. გირჩევთ რეჟიმისა და ჰიდრატაციის გაუმჯობესებას — რეცეპტს ვიზიტის ბოლოს გამოგიწერთ."]
        : ["Hi, I'm " + L(doc.name) + ". What brings you in today?", "I see. How long have you felt this way?", "Thanks for the details. I'd suggest improving your routine and hydration — I'll send a prescription at the end."];
    }
    var REPLY = {
      ka: ["გასაგებია, მესმის.", "კარგი, ეს მნიშვნელოვანია.", "გირჩევთ ამას ყურადღებით მიადევნოთ თვალი.", "თუ გაუარესდა, აუცილებლად მოგვმართეთ."],
      en: ["I understand.", "Okay, that's important.", "I'd keep an eye on that.", "If it worsens, please reach out."],
    };

    function pushChat(role, text) { chat.push({ role: role, text: text }); var b = $("#tdChat"); if (b) { b.insertAdjacentHTML("beforeend", chatHTML({ role: role, text: text })); b.scrollTop = b.scrollHeight; } }
    function chatHTML(m) { return '<div class="td-msg td-msg--' + (m.role === "me" ? "me" : "doc") + '">' + esc(m.text) + "</div>"; }

    function paint() {
      clearTimers();
      var bodyInner;
      if (stage === "list") {
        var past = (V.state.consults || []).slice(-3).reverse();
        bodyInner =
          '<p class="s-sub">' + t("tdSub") + "</p>" +
          '<div class="section-head"><h3>' + t("tdOnlineNow") + "</h3></div>" +
          V.DOCTORS.map(docCard).join("") +
          (past.length ? '<div class="section-head" style="margin-top:18px"><h3>' + t("tdPast") + "</h3></div>" +
            past.map(function (c) { var d = V.doctorById(c.docId) || { name: { ka: "ექიმი", en: "Doctor" }, tone: "green", spec: { ka: c.spec, en: c.spec } };
              return '<div class="td-past">' + docAv(d, 36) + '<div class="td-doc__t"><b>' + L(d.name) + "</b><small>" + c.date + " · " + t("tdVideo") + " · " + fmtDur(c.durSec || 0) + "</small></div>" + (c.paid ? '<span class="td-online">₾' + (d.price || "") + "</span>" : "") + "</div>";
            }).join("") : "") +
          '<p class="hr-multi-note">' + t("tdDisc") + "</p>";
      } else if (stage === "call") {
        bodyInner =
          '<div class="td-call">' +
            '<div class="td-stage">' +
              '<div class="td-vid td-vid--doc">' + docAv(doc, 88) + '<div class="td-vid__name">' + L(doc.name) + "<small>" + L(doc.spec) + "</small></div>" +
                '<span class="td-live">● ' + t("tdLive") + "</span></div>" +
              '<div class="td-vid td-vid--me">' + V.avatar(40) + "<small>" + t("tdYou") + "</small></div>" +
              '<div class="td-timer" id="tdTimer">0:00</div>' +
            "</div>" +
            '<div class="td-chat" id="tdChat">' + chat.map(chatHTML).join("") + "</div>" +
            '<div class="td-input"><input id="tdMsg" class="field" placeholder="' + esc(t("tdType")) + '"><button class="icon-box green" id="tdSend">' + V.icon("send") + "</button></div>" +
            '<div class="td-ctrls">' +
              '<button class="td-ctrl" id="tdMute">' + V.icon("mic") + "</button>" +
              '<button class="td-ctrl" id="tdCam">' + V.icon("camera") + "</button>" +
              '<button class="td-ctrl td-ctrl--end" id="tdEnd">' + V.icon("x") + " " + t("tdEnd") + "</button>" +
            "</div></div>";
      } else { // summary
        var dur = Math.max(1, Math.round((Date.now() - startT) / 1000));
        if (!saved) { saveConsult(dur); saved = true; }
        var rx = TD_RX[doc.id] || TD_RX.d2;
        bodyInner =
          '<div class="card-soft td-sum">' +
            '<div class="td-sum__head">' + docAv(doc, 48) + '<div class="td-doc__t"><b>' + L(doc.name) + "</b><small>" + L(doc.spec) + " · " + t("tdVideo") + " · " + fmtDur(dur) + "</small></div>" + V.icon("check") + "</div>" +
            '<p class="td-notes">' + t("tdNotes") + "</p>" +
          "</div>" +
          '<div class="card-soft td-rx"><div class="td-rx__head">' + V.icon("pill") + " <b>" + t("tdRx") + "</b></div>" +
            '<div class="td-rx__item"><b>' + L(rx[0]) + "</b><small>" + L(rx[1]) + "</small></div>" +
            '<button class="btn btn-ghost" id="tdRxSend" style="width:100%;margin-top:10px">' + V.icon("send") + " " + t("tdRxSend") + "</button></div>" +
          (paid
            ? '<div class="note-ok">' + V.icon("check") + " " + t("tdPaidNote") + "</div>"
            : '<button class="btn btn-primary" id="tdPay" style="width:100%">' + t("tdPay") + " ₾" + doc.price + "</button>") +
          '<p class="cal-note" style="text-align:center;margin:10px 0 0">' + t("tdPayDemo") + "</p>" +
          '<button class="btn btn-ghost" id="tdDone" style="width:100%;margin-top:14px">' + t("tdDone") + "</button>";
      }

      V.mount(
        V.statusbar() +
        '<div class="screen"><div class="pad-lg fade-in">' +
          '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.iconBox("stethoscope", "green") + "<h1>" + t("tdTitle") + "</h1></div>" +
            '<button class="icon-box gray" data-x>' + V.icon(stage === "call" ? "back" : "x") + "</button></div>" +
          bodyInner +
        "</div>" +
        (stage === "call" ? "" : V.tabbar("home")) +
        "</div>",
        { onMount: wire }
      );
    }

    function startCall(d) { doc = d; chat = []; sIdx = 0; paid = false; saved = false; startT = Date.now(); stage = "call"; paint(); beginCallTimers(); }
    function beginCallTimers() {
      ticker = setInterval(function () { var el = $("#tdTimer"); if (!el) { clearInterval(ticker); return; } el.textContent = fmtDur(Math.round((Date.now() - startT) / 1000)); }, 1000);
      var lines = script();
      function next() { if (stage !== "call" || sIdx >= lines.length) return; pushChat("doc", lines[sIdx]); sIdx++; sTimer = setTimeout(next, 3800); }
      sTimer = setTimeout(next, 1400);
    }
    function saveConsult(dur) {
      V.state.consults = V.state.consults || [];
      V.state.consults.push({ date: today(), docId: doc.id, spec: L(doc.spec), type: "video", durSec: dur, rx: TD_RX[doc.id] ? [L(TD_RX[doc.id][0])] : [], paid: false });
      if (V.state.consults.length > 40) V.state.consults = V.state.consults.slice(-40);
      V.awardOnce && V.awardOnce("telemed:" + today(), V.POINTS.task, "task");
      V.save();
    }

    function wire() {
      var x = $("[data-x]");
      if (x) x.addEventListener("click", function () { clearTimers(); if (stage === "call") { stage = "list"; paint(); } else V.go("menu"); });
      each("[data-doc]", function (b) { b.addEventListener("click", function () { var d = V.doctorById(b.getAttribute("data-doc")); if (!d) return; if (!d.online) { V.toast && V.toast(t("tdNextAt") + " " + d.next); return; } startCall(d); }); });
      var send = $("#tdSend"), msg = $("#tdMsg");
      function doSend() { var v = (msg.value || "").trim(); if (!v) return; pushChat("me", v); msg.value = ""; sTimer = setTimeout(function () { if (stage === "call") pushChat("doc", REPLY[V.lang() === "ka" ? "ka" : "en"][Math.floor(Math.random() * 4)]); }, 1200); }
      if (send) send.addEventListener("click", doSend);
      if (msg) msg.addEventListener("keydown", function (e) { if (e.key === "Enter") doSend(); });
      each(".td-ctrl", function (b) { if (b.id !== "tdEnd") b.addEventListener("click", function () { b.classList.toggle("off"); }); });
      var end = $("#tdEnd"); if (end) end.addEventListener("click", function () { clearTimers(); stage = "summary"; paint(); });
      var pay = $("#tdPay"); if (pay) pay.addEventListener("click", function () { paid = true; var c = (V.state.consults || []).slice(-1)[0]; if (c) c.paid = true; V.save(); V.toast && V.toast(t("tdPaidNote")); paint(); });
      var rxSend = $("#tdRxSend"); if (rxSend) rxSend.addEventListener("click", function () { V.toast && V.toast(t("tdRxSent")); });
      var done = $("#tdDone"); if (done) done.addEventListener("click", function () { stage = "list"; doc = null; paint(); });
    }

    paint();
  };

  /* ---------- small shared helpers for the new screens ---------- */
  function head(icon, tone, titleKey) {
    return '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' +
      V.iconBox(icon, tone) + "<h1>" + t(titleKey) + "</h1></div>" +
      '<button class="icon-box gray" data-x aria-label="' + t("back") + '">' + V.icon("back") + "</button></div>";
  }
  function backX() { var b = $("[data-x]"); if (b) b.addEventListener("click", function () { V.go("wellness"); }); }
  function warn(msg) { return '<div class="note-warn">' + V.icon("info") + " " + msg + "</div>"; }
  function deepClinic(id, title) { if (V.openClinics) V.openClinics(id, title); else V.go("clinics"); }
})();
