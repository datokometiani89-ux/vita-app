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
        var urg = (r.flagRe && r.flagUrgency && any(r.flagRe)) ? r.flagUrgency : r.urgency;
        matched.push({ rule: r, urgency: urg });
      }
    });
    if (!matched.length) {
      return { unknown: true, urgency: "soon", spec: { ka: "თერაპევტი", en: "GP / Internist" }, checkupId: "general",
        advice: { ka: "სიმპტომი ცალსახად ვერ დავაკავშირე. დაიწყე თერაპევტით — ის საჭიროებისას მიგმართავს სპეციალისტთან.", en: "I couldn't map this clearly. Start with a GP — they'll refer you to a specialist if needed." } };
    }
    matched.sort(function (a, b) { return URANK[b.urgency] - URANK[a.urgency]; });
    var top = matched[0];
    return { urgency: top.urgency, spec: top.rule.spec, checkupId: top.rule.checkupId, advice: top.rule.advice,
      others: matched.slice(1, 3).map(function (m) { return m.rule.spec; }) };
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
        if (r.others && r.others.length)
          html += '<p class="sy-other">' + (V.lang() === "ka" ? "ასევე იხილე: " : "Consider also: ") + r.others.map(function (s) { return esc(L(s)); }).join(", ") + "</p>";
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
          '<canvas id="hrWave" class="hr-wave" width="600" height="120"></canvas>' +
          '<div class="hr-status" id="hrStatus">' + t("hrRestNote") + "</div>" +
          '<button class="btn btn-primary" id="hrStart" style="width:100%">' + V.icon("heart") + " " + t("hrStart") + "</button>" +
        "</div>" +

        '<div class="hr-manual">' +
          '<input id="hrManual" class="field" type="number" inputmode="numeric" min="30" max="220" placeholder="' + esc(t("hrManualPh")) + '">' +
          '<button class="btn btn-ghost" id="hrManualSave">' + t("hrManual") + "</button>" +
        "</div>" +
        '<div id="hrMsg"></div>' +
        (last ? '<div class="hr-last">' + t("hrLast") + ": <b>" + last.bpm + " " + t("hrBpm") + "</b> · " + esc(last.date) + "</div>" : "") +
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
    var samples = [], waveBuf = [], baseline = 0, lastBeat = 0, beats = 0, startT = 0, prevSig = 0, ampEMA = 0;

    function toggle() { if (running) { stop(); resetUI(); } else start(); }
    function resetUI() {
      var b = $("#hrStart"); if (b) { b.disabled = false; b.innerHTML = V.icon("heart") + " " + t("hrStart"); }
      var s = $("#hrStatus"); if (s) s.textContent = t("hrRestNote");
    }

    function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { noCam(); return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
        .then(function (s) {
          stream = s;
          var track = s.getVideoTracks()[0];
          try { if (track.applyConstraints) track.applyConstraints({ advanced: [{ torch: true }] }).catch(function () {}); } catch (e) {}
          video = $("#hrVideo"); video.srcObject = s; video.play();
          canvas = $("#hrWave"); ctx = canvas.getContext("2d");
          hidden = document.createElement("canvas"); hidden.width = 60; hidden.height = 60; hctx = hidden.getContext("2d");
          samples = []; waveBuf = []; baseline = 0; lastBeat = 0; beats = 0; prevSig = 0; ampEMA = 0; startT = performance.now();
          running = true;
          var b = $("#hrStart"); b.innerHTML = V.icon("x") + " " + t("hrCancel");
          $("#hrStatus").textContent = t("hrPlace");
          loop();
        })
        .catch(noCam);
    }
    function noCam() { var m = $("#hrMsg"); if (m) m.innerHTML = '<div class="note-warn">' + V.icon("info") + " " + t("hrNoCam") + "</div>"; var mi = $("#hrManual"); if (mi) mi.focus(); }

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
        // beat = downward zero-crossing of detrended signal, with refractory
        if (prevSig > 0 && sig <= 0 && (now - lastBeat) > 300) {
          if (lastBeat) beats++;
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
      var spanMin = (performance.now() - firstBeatT()) / 60000;
      var bpm = Math.round(beats / spanMin);
      stop();
      if (bpm < 35 || bpm > 210) { $("#hrStatus").textContent = t("hrWeak"); resetUI(); return; }
      saveReading(bpm);
    }

    function band(bpm) {
      if (bpm < 60) return { k: "hrLow", c: "blue" };
      if (bpm <= 90) return { k: "hrNormal", c: "green" };
      if (bpm <= 100) return { k: "hrElevated", c: "yellow" };
      return { k: "hrHigh", c: "crimson" };
    }

    function saveReading(bpm) {
      var b = band(bpm);
      var ww = W(); ww.hr = ww.hr || [];
      ww.hr.push({ date: today(), bpm: bpm });
      if (ww.hr.length > 60) ww.hr = ww.hr.slice(-60);
      V.awardOnce && V.awardOnce("hr:" + today(), V.POINTS.task, "task");
      V.save();
      var bpmEl = $("#hrBpm"); if (bpmEl) bpmEl.textContent = bpm;
      var st = $("#hrStatus"); if (st) st.innerHTML = "<b>" + t(b.k) + "</b> · " + bpm + " " + t("hrBpm");
      var msg = $("#hrMsg"); if (msg) msg.innerHTML = '<div class="note-ok">' + V.icon("check") + " " + t("hrSaved") + " — " + t(b.k) + " (" + bpm + " " + t("hrBpm") + ")</div>";
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
          each("[data-mood]", function (b) { b.addEventListener("click", function () { sel = parseInt(b.getAttribute("data-mood"), 10); render(); }); });
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
})();
