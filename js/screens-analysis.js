/* VITA screens — analysing, profile summary, body map, checkup plan, goals */
(function () {
  var V = window.VITA;
  V.screens = V.screens || {};
  var root = document.getElementById("app");
  function $(s) { return root.querySelector(s); }
  function each(s, fn) { root.querySelectorAll(s).forEach(fn); }
  var t = V.t, esc = V.esc;

  /* ===================== ANALYSING ===================== */
  V.screens.analyse = function () {
    var steps = [
      { key: "anPersonal", icon: "check" },
      { key: "anBMI", icon: "scale" },
      { key: "anProfile", icon: "user" },
      { key: "anRisk", icon: "shield" },
    ];
    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad fade-in">' +
        '<div class="s-head">' + V.logoBadge(34) + "<h1>" + t("anTitle") + "</h1></div>" +
        '<p class="s-sub">' + t("anDesc") + "</p>" +
        '<div class="analyse-ring"><div class="ring">' +
          ringSVG(0) +
          '<div class="ring__core"></div>' +
          '<div class="ring__c"><div class="ring__pct" id="pct">0%</div><div class="ring__lbl">' + t("anProcessing") + "</div></div>" +
        "</div></div>" +
        '<div id="alist">' +
          steps.map(function (s, i) {
            return '<div class="analyse-item" data-i="' + i + '">' +
              '<span class="analyse-item__dot">' + V.icon(s.icon) + "</span>" +
              '<div class="analyse-item__t"><b>' + t(s.key) + "</b>" +
                '<div class="analyse-item__bar"><span></span></div></div>' +
              '<span class="analyse-pill pending">' + t("stPending") + "</span>" +
            "</div>";
          }).join("") +
        "</div>" +
      "</div></div>",
      { onMount: runAnalyse }
    );
  };

  function ringSVG(frac) {
    var r = 84, c = 2 * Math.PI * r;
    return '<svg width="190" height="190" viewBox="0 0 190 190">' +
      '<circle cx="95" cy="95" r="' + r + '" fill="none" stroke="rgba(20,24,31,.07)" stroke-width="14"/>' +
      '<circle id="ringfg" cx="95" cy="95" r="' + r + '" fill="none" stroke="#27AE60" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - frac)) + '"/>' +
      "</svg>";
  }

  function runAnalyse() {
    var pct = 0, target = 100, dur = 2600, start = Date.now();
    var r = 84, c = 2 * Math.PI * r;
    var fg = $("#ringfg"), pctEl = $("#pct");
    var items = root.querySelectorAll(".analyse-item");
    var thresholds = [10, 40, 70, 92];

    var tick = setInterval(function () {
      var p = Math.min(1, (Date.now() - start) / dur);
      pct = Math.round(p * target);
      if (fg) fg.setAttribute("stroke-dashoffset", c * (1 - p));
      if (pctEl) pctEl.textContent = pct + "%";
      items.forEach(function (el, i) {
        var pill = el.querySelector(".analyse-pill");
        var bar = el.querySelector(".analyse-item__bar > span");
        if (pct >= 100 || (i < items.length - 1 && pct > thresholds[i + 1])) {
          el.classList.add("complete"); el.classList.remove("process");
          el.querySelector(".analyse-item__dot").innerHTML = V.icon("check");
          pill.className = "analyse-pill complete"; pill.textContent = t("stComplete");
          bar.style.width = "100%";
        } else if (pct > thresholds[i]) {
          el.classList.add("process");
          pill.className = "analyse-pill process"; pill.textContent = t("stProcessing");
          bar.style.width = Math.min(95, (pct - thresholds[i]) * 3) + "%";
        }
      });
      if (p >= 1) {
        clearInterval(tick);
        setTimeout(function () { V.go("profile"); }, 650);
      }
    }, 40);
  }

  /* ===================== PROFILE SUMMARY ===================== */
  V.screens.profile = function () {
    var p = V.state.profile;
    var concerns = V.concerns();
    var name = p.name || "Giorgi K.";
    var loc = p.location || "Tbilisi";

    var rows = [
      { icon: "bolt", tone: "gray", b: t("diagnosis"), s: diagText(), right: hasDiag() ? '<span class="sev high">' + V.icon("warn") + " " + t("high") + "</span>" : "" },
      { icon: "walk", tone: "gray", b: t("lifestyle"), s: lifeText() },
      { icon: "smoke", tone: "gray", b: t("smoking"), s: smokeText(), right: p.smoking === "no" ? '<span class="mini-check">' + V.icon("check") + "</span>" : "" },
      { icon: "wine", tone: "gray", b: t("alcohol"), s: alcText() },
    ];

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("yourProfile") + "</h1></div>" +
          '<button class="icon-box gray" data-open-settings>' + V.icon("settings") + "</button></div>" +
        '<div class="profile-hero">' +
          '<div class="avatar">🧑🏻‍🦱</div>' +
          "<h2>" + esc(name) + "</h2>" +
          '<div class="loc">' + esc(loc) + (V.lang() === "ka" ? ", საქართველო" : ", Georgia") + "</div>" +
        "</div>" +
        '<div class="stat-row">' +
          stat("g", p.age || 28, t("years"), t("age")) +
          stat("b", p.weight || 85, t("kg"), t("weight")) +
          stat("p", p.height || 178, t("cm"), t("height")) +
        "</div>" +
        '<h3 style="font-size:20px;font-weight:800;margin:6px 0 12px">' + t("healthProfile") + "</h3>" +
        '<div class="list-card">' + rows.map(listRow).join("") + "</div>" +
        '<div class="concern-wrap"><h3>' + t("areas") + "</h3>" +
          '<div class="concern-chips">' +
            concerns.map(function (c) {
              return '<span class="concern ' + c.sev + '"><span class="concern__bdg">' + t(c.sev) + "</span>" + t(c.key) + "</span>";
            }).join("") +
          "</div></div>" +
      "</div>" +
      '<div class="actionbar center"><button class="btn btn-primary" data-next>' + t("next") + " " + V.icon("next") + "</button></div>" +
      "</div>",
      { onMount: function () { $("[data-next]").addEventListener("click", function () { V.go("bodymap"); }); } }
    );

    function stat(c, num, unit, lbl) {
      return '<div class="stat ' + c + '"><b>' + num + '<span>' + unit + "</span></b><small>" + lbl + "</small></div>";
    }
    function listRow(r) {
      return '<div class="list-row">' + V.iconBox(r.icon, r.tone) +
        '<div class="list-row__t"><b>' + r.b + "</b><small>" + r.s + "</small></div>" +
        (r.right || "") + "</div>";
    }
    function hasDiag() { return p.conditions.length && p.conditions.indexOf("none") < 0; }
    function diagText() {
      if (!hasDiag()) return V.lang() === "ka" ? "არ არის" : "None";
      var map = { pre: t("condPre"), chol: t("condChol"), hyper: t("condHyper"), thyroid: t("condThyroid") };
      return p.conditions.filter(function (x) { return map[x]; }).map(function (x) { return map[x]; }).join(", ");
    }
    function lifeText() {
      return { sitting: t("actSitting"), light: t("actLight"), active: t("actActive"), very: t("actVery") }[p.activity] || t("actSitting");
    }
    function smokeText() {
      return { no: t("smokeNo"), occ: t("smokeOcc"), daily: t("smokeDaily") }[p.smoking] || t("smokeNo");
    }
    function alcText() {
      return { never: t("alcNever"), occ: t("alcOcc"), soc: t("alcSoc"), weekly: t("alcWeekly"), daily: t("alcDaily") }[p.alcohol] || t("alcOcc");
    }
  };

  /* ===================== BODY MAP ===================== */
  V.screens.bodymap = function () {
    var markers = V.bodyMarkers();
    V.mount(
      '<div class="topbar green">' + V.statusbar(true) +
        '<div class="topbar__row"><div style="font-size:22px;font-weight:700">' + t("bmRisks") + "</div>" +
          '<button class="topbar__back" data-x style="gap:0"><span class="nub" style="border-radius:50%">' + V.icon("x") + "</span></button></div>" +
        '<div class="progressbar"><span style="width:88%"></span></div>' +
      "</div>" +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="margin-top:14px">' + V.logoBadge(34) + "<h1>" + t("bmTitle") + "</h1></div>" +
        '<p class="s-sub"><b style="color:var(--green)">VITA</b> ' + t("bmDetected", { n: markers.length }).replace("VITA-მ ", "").replace("VITA ", "") + "</p>" +
        '<div class="bodymap"><div class="bodymap__img">' + bodySVG() +
          markers.map(function (m) {
            return '<span class="marker ' + m.sev + '" style="left:' + m.x + "%;top:" + m.y + '%" title="' + t(m.key) + '"></span>';
          }).join("") +
          '<div class="legend">' +
            '<span><i style="background:var(--pink)"></i>' + t("high") + "</span>" +
            '<span><i style="background:var(--blue)"></i>' + t("medium") + "</span>" +
            '<span><i style="background:var(--green)"></i>' + t("low") + "</span>" +
          "</div>" +
        "</div></div>" +
        '<h3 style="font-size:20px;font-weight:800;margin:6px 0 12px">' + t("bmDetectedT") + "</h3>" +
        '<div class="concern-chips">' +
          markers.map(function (m) { return '<span class="concern ' + m.sev + '">' + t(m.key) + "</span>"; }).join("") +
        "</div>" +
      "</div>" +
      '<div class="actionbar center"><button class="btn btn-primary" data-next>' + t("next") + " " + V.icon("next") + "</button></div>" +
      "</div>",
      { onMount: function () {
        $("[data-next]").addEventListener("click", function () { V.go("checkup"); });
        $("[data-x]").addEventListener("click", function () { V.go("profile"); });
      }}
    );
  };

  function bodySVG() {
    // X-ray-style anatomical figure: translucent body, skeleton, organs.
    return '' +
'<svg viewBox="0 0 220 300" fill="none" xmlns="http://www.w3.org/2000/svg">' +
'<defs>' +
'<linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">' +
'<stop offset="0" stop-color="#A7E8C4"/><stop offset="1" stop-color="#54C58A"/></linearGradient>' +
'<radialGradient id="lungG" cx="50%" cy="40%" r="60%">' +
'<stop offset="0" stop-color="#39B9B0"/><stop offset="1" stop-color="#1E7E8C"/></radialGradient>' +
'<linearGradient id="liverG" x1="0" y1="0" x2="1" y2="1">' +
'<stop offset="0" stop-color="#2C9C7E"/><stop offset="1" stop-color="#16725C"/></linearGradient>' +
'</defs>' +
// translucent body
'<g fill="url(#bodyG)" opacity=".9">' +
'<ellipse cx="110" cy="34" rx="23" ry="26"/>' +              // head
'<path d="M101 58 h18 v12 q-9 5 -18 0 Z"/>' +                 // neck
'<path d="M70 74 q40 -12 80 0 q10 4 12 14 l-8 44 q-2 10 -10 12 l4 64 q1 30 -6 56 l-16 2 -8 -60 h-6 l-8 60 -16 -2 q-7 -26 -6 -56 l4 -64 q-8 -2 -10 -12 l-8 -44 q2 -10 12 -14 Z"/>' + // torso+legs
'<path d="M62 80 q-12 6 -16 20 l-10 60 q-1 8 6 9 q6 1 8 -7 l12 -58 Z"/>' + // left arm
'<path d="M158 80 q12 6 16 20 l10 60 q1 8 -6 9 q-6 1 -8 -7 l-12 -58 Z"/>' + // right arm
'</g>' +
// rib cage / spine (bone)
'<g stroke="#EAFBF1" stroke-width="2.2" opacity=".75" fill="none" stroke-linecap="round">' +
'<line x1="110" y1="70" x2="110" y2="168"/>' +                // spine
'<path d="M110 86 q-22 4 -30 22"/><path d="M110 96 q-26 5 -34 26"/>' +
'<path d="M110 108 q-28 6 -36 30"/><path d="M110 120 q-26 7 -34 30"/>' +
'<path d="M110 86 q22 4 30 22"/><path d="M110 96 q26 5 34 26"/>' +
'<path d="M110 108 q28 6 36 30"/><path d="M110 120 q26 7 34 30"/>' +
'<path d="M88 76 q22 -8 44 0"/>' +                            // collarbones
'</g>' +
// pelvis
'<g stroke="#EAFBF1" stroke-width="2.4" opacity=".7" fill="none">' +
'<path d="M86 170 q24 18 48 0"/><path d="M92 172 q-4 16 6 22"/><path d="M128 172 q4 16 -6 22"/>' +
'</g>' +
// lungs
'<g fill="url(#lungG)" opacity=".82">' +
'<path d="M104 92 q-4 30 -16 44 q-12 -2 -12 -22 q0 -20 12 -28 q9 -4 16 6 Z"/>' +
'<path d="M116 92 q4 30 16 44 q12 -2 12 -22 q0 -20 -12 -28 q-9 -4 -16 6 Z"/>' +
'</g>' +
// heart
'<path d="M110 104 q6 -8 12 -2 q5 5 -1 12 l-11 12 -11 -12 q-6 -7 -1 -12 q6 -6 12 2 Z" fill="#2BA45D" opacity=".9"/>' +
// liver + stomach
'<path d="M80 138 q26 -6 44 2 q-2 16 -22 18 q-20 1 -24 -10 q-1 -6 2 -10 Z" fill="url(#liverG)" opacity=".82"/>' +
// kidneys
'<g fill="#1E8E6E" opacity=".8"><path d="M94 162 q-7 1 -7 9 q0 8 7 8 q3 -8 0 -17 Z"/><path d="M126 162 q7 1 7 9 q0 8 -7 8 q-3 -8 0 -17 Z"/></g>' +
// intestine hint
'<path d="M96 176 q18 8 30 0 q4 10 -4 16 q-12 6 -22 0 q-8 -6 -4 -16 Z" fill="#3BB389" opacity=".55"/>' +
'</svg>';
  }

  /* ===================== CHECKUP PLAN ===================== */
  V.screens.checkup = function () {
    var plan = V.checkupPlan();
    var priority = plan.filter(function (x) { return x.sev === "high"; });
    var rest = plan.filter(function (x) { return x.sev !== "high"; });

    function card(item) {
      var inCal = V.state.calendar.indexOf(item.id) >= 0;
      var ex = V.checkupExtra(item.id);
      return '<div class="cu-card ' + item.sev + '">' +
        '<div class="cu-card__top">' + V.iconBox(item.icon, "gray") +
          '<div class="cu-card__t"><b>' + L(item.title) + "</b><small>" + L(item.note) + "</small></div>" +
          sevTag(item.sev) + "</div>" +
        '<div class="cu-card__div"></div>' +
        '<div class="cu-card__spec">' + V.icon("user") + "<span>" + t("cpSpec") + ": <b>" + L(ex.spec) + "</b> · " + ex.clinic + "</span></div>" +
        '<div class="cu-card__bot"><div class="cu-card__date"><b>' + t("cpRec") + "</b><small>" + L(item.date) + "</small></div>" +
          '<button class="cal-btn ' + (inCal ? "done" : "") + '" data-cal="' + item.id + '">' +
            V.icon(inCal ? "check" : "calendar") + (inCal ? t("cpBooked") : t("cpBook")) + "</button>" +
        "</div></div>";
    }

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head">' + V.logoBadge(34) + "<h1>" + t("cpTitle") + "</h1></div>" +
        '<p class="s-sub">' + t("cpDesc") + "</p>" +
        (priority.length ? '<div class="kicker" style="margin-bottom:14px">' + t("cpPriority") + "</div>" + priority.map(card).join("") : "") +
        (rest.length ? '<div class="kicker" style="margin:8px 0 14px">' + t("cpLater") + "</div>" + rest.map(card).join("") : "") +
      "</div>" +
      '<div class="actionbar center"><button class="btn btn-primary" data-next>' + t("goHome") + " " + V.icon("next") + "</button></div>" +
      "</div>",
      { onMount: function () {
        each("[data-cal]", function (b) {
          b.addEventListener("click", function () {
            var id = b.getAttribute("data-cal");
            var i = V.state.calendar.indexOf(id);
            if (i >= 0) V.state.calendar.splice(i, 1); else V.state.calendar.push(id);
            V.save();
            b.classList.toggle("done");
            b.innerHTML = V.icon(b.classList.contains("done") ? "check" : "calendar") +
              (b.classList.contains("done") ? t("cpBooked") : t("cpBook"));
          });
        });
        $("[data-next]").addEventListener("click", function () { V.go("goals"); });
      }}
    );

    function L(o) { return o[V.lang()] || o.en; }
    function sevTag(s) {
      var ic = { high: "warn", medium: "diamond", low: "question" }[s];
      return '<span class="sev ' + s + '">' + V.icon(ic) + " " + t(s) + "</span>";
    }
  };

  /* ===================== GOALS ===================== */
  V.screens.goals = function () {
    var groups = V.goalGroups();
    if (!V.state.goals.length) {
      // preselect defaults
      groups.forEach(function (g) { g.goals.forEach(function (go2) { if (go2.def) V.state.goals.push(go2.id); }); });
      V.save();
    }
    function goalRow(g) {
      var on = V.state.goals.indexOf(g.id) >= 0;
      var from = g.from || t(g.fromKey), to = g.to || t(g.toKey);
      return '<div class="goal ' + (on ? "on" : "") + '" data-goal="' + g.id + '">' +
        '<div class="goal__t"><b>' + t(g.labelKey) + "</b>" +
          '<small>' + esc(from) + ' → <span class="to">' + esc(to) + "</span></small></div>" +
        '<span class="goal__box">' + V.icon("check") + "</span></div>";
    }
    V.mount(
      '<div class="topbar green">' + V.statusbar(true) +
        '<div class="topbar__row"><div><div style="font-size:24px;font-weight:800">' + t("gTitle") + "</div>" +
          '<div style="opacity:.85;font-size:15px">' + t("gSub") + "</div></div>" +
          '<button class="topbar__back" data-back style="gap:0"><span class="nub">' + V.icon("back") + "</span></button></div>" +
        '<div class="progressbar"><span style="width:96%"></span></div>' +
      "</div>" +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="bubble" style="margin-top:16px">' + t("gHint") + "</div>" +
        groups.map(function (g) {
          var sel = g.goals.filter(function (x) { return V.state.goals.indexOf(x.id) >= 0; }).length;
          return '<div class="goal-group"><div class="goal-group__head">' +
            '<span class="goal-pill ' + g.tone + '">' + V.icon(g.icon) + t(g.labelKey) + "</span>" +
            '<span class="goal-count">' + sel + "/" + g.goals.length + "</span></div>" +
            g.goals.map(goalRow).join("") + "</div>";
        }).join("") +
      "</div>" +
      '<div class="actionbar center"><button class="btn btn-primary" data-gen>' + t("gGenerate") + "</button></div>" +
      "</div>",
      { onMount: function () {
        each("[data-goal]", function (el) {
          el.addEventListener("click", function () {
            var id = el.getAttribute("data-goal");
            var i = V.state.goals.indexOf(id);
            if (i >= 0) V.state.goals.splice(i, 1); else V.state.goals.push(id);
            el.classList.toggle("on");
            V.save();
            // update counts
            V.render();
          });
        });
        $("[data-back]").addEventListener("click", function () { V.go("checkup"); });
        $("[data-gen]").addEventListener("click", function () {
          V.state.onboarded = true;
          V.state.planGenerated = true;
          if (!V.state.planStartDay) V.state.planStartDay = V.todayISO();
          // seed health score history
          if (!V.state.scoreLog) V.state.scoreLog = [];
          V.save();
          V.go("home");
        });
      }}
    );
  };
})();
