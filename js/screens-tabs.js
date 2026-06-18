/* VITA screens — dashboard (home), plan, vita chat, progress, results upload */
(function () {
  var V = window.VITA;
  V.screens = V.screens || {};
  var root = document.getElementById("app");
  function $(s) { return root.querySelector(s); }
  function each(s, fn) { root.querySelectorAll(s).forEach(fn); }
  var t = V.t, esc = V.esc;
  function L(o) { return o[V.lang()] || o.en; }

  /* ===================== HOME / DASHBOARD ===================== */
  V.screens.home = function () {
    var p = V.state.profile;
    var score = V.healthScore();
    var bmi = V.bmi() || 28.4;
    var bmiSt = V.bmiStatus() || "medium";
    var concerns = V.concerns();
    var weight = p.weight || 85;
    var target = p.weight ? Math.max(60, Math.round(p.weight - 8)) : 77;
    var facePos = score; // 0..100

    var scoreStatus = score >= 71 ? t("hsGood") : score >= 41 ? t("hsModerate") : t("hsRisk");

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="dash-head">' +
          '<div><div class="s-head">' + V.logoBadge(34) + "<h1>" + t("homepage") + "</h1></div>" +
            '<p class="s-sub" style="max-width:210px;margin-bottom:0">' + t("hpCreated") + "</p></div>" +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px">' +
            '<button class="icon-box gray" data-menu>' + V.icon("grid") + "</button>" +
            '<div class="score-bubble">100%</div>' +
          "</div>" +
        "</div>" +
        '<div class="kicker" style="margin:20px 0 10px">' + t("yourData") + "</div>" +
        '<div class="score-card"><div class="score-card__top">' +
          '<div class="score-card__num">' + score + '<span>/100</span></div>' +
          '<div class="score-badge">' + V.icon("shield") + "</div></div>" +
          '<div class="score-track"><div class="score-face" style="left:' + Math.max(8, Math.min(92, facePos)) + '%">' + V.icon("smile") + "</div></div>" +
          '<div class="score-scale"><span>0-40</span><span>41-70</span><span>71-100</span></div>' +
          "<h3>" + t("healthScore") + "</h3><p>" + scoreStatus + "</p>" +
        "</div>" +
        '<div class="metric-row">' +
          '<div class="metric p"><div class="metric__tag">' + V.icon("scale") + "</div>" +
            '<div class="metric__num">' + weight + '<span>' + t("kg") + '</span></div>' +
            '<div class="metric__lbl">' + t("weight") + '</div>' +
            '<div class="metric__sub">' + t("target") + ": " + target + t("kg") + "</div></div>" +
          '<div class="metric y"><div class="metric__tag">' + V.icon("ruler") + "</div>" +
            '<div class="metric__num">' + bmi + "</div>" +
            '<div class="metric__lbl">' + t("bmi") + '</div>' +
            '<div class="metric__sub">' + (bmiSt === "good" ? t("normal") : t("caution")) + "</div></div>" +
        "</div>" +
        nextScreeningCard() +
        '<div class="kicker" style="margin:22px 0 10px">' + t("areas") + "</div>" +
        '<div class="list-card">' +
          concerns.map(function (c) {
            var ic = { sugar: "drop", energy: "bolt", heart: "heart", chol: "heart", weight: "scale", mental: "brain", skin: "skin" }[c.id] || "warn";
            var sevIcon = { high: "warn", medium: "diamond", low: "question" }[c.sev];
            return '<div class="list-row">' + V.iconBox(ic, "gray") +
              '<div class="list-row__t"><b>' + t(c.key) + "</b></div>" +
              '<span class="sev ' + c.sev + '">' + V.icon(sevIcon) + " " + t(c.sev) + "</span></div>";
          }).join("") +
        "</div>" +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        var m = $("[data-menu]");
        if (m) m.addEventListener("click", function () { V.go("menu"); });
        var ns = $("[data-next-screening]");
        if (ns) ns.addEventListener("click", function () { V.go("annual"); });
      }}
    );

    // next recommended screening card (soonest upcoming month)
    function nextScreeningCard() {
      var months = V.screeningByMonth();
      if (!months.length) return "";
      var cur = new Date().getMonth() + 1;
      var pick = months.filter(function (mo) { return mo.month >= cur; })[0] || months[0];
      var s = pick.items[0];
      return '<button class="next-sc" data-next-screening>' +
        '<span class="sc-dot" style="background:' + V.catColor(s.cat) + '"></span>' +
        '<div style="flex:1;text-align:left"><small class="kicker" style="display:block;margin-bottom:3px">' + t("dashNext") + "</small>" +
          "<b>" + L(s.name) + "</b><small style='display:block;color:var(--muted)'>" + V.monthName(pick.month) + " · " + L(V.freqLabel(s.freq)) + "</small></div>" +
        '<span class="next-sc__cta">' + t("dashNextCta") + " " + V.icon("next") + "</span></button>";
    }
  };

  /* ===================== PLAN ===================== */
  V.screens.plan = function () {
    var p = V.state.profile;
    var today = V.todayISO();
    var tasks = V.dailyTasks();
    var done = V.state.doneTasks[today] || [];
    var pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
    var day = V.planDay();
    var name = p.name ? p.name.split(" ")[0].toUpperCase() : "GIORGI K";
    var hour = new Date().getHours();
    var greet = hour < 12 ? t("goodMorning") : hour < 18 ? t("goodDay") : t("goodEvening");

    var meds = V.medications();
    var morningMeds = meds.filter(function (m) { return m.when === "morning"; });
    var eveningMeds = meds.filter(function (m) { return m.when === "evening"; });
    var doneMeds = V.state.doneMeds[today] || [];
    var food = V.foodPlan();

    function waterWidget() {
      var goal = V.waterGoal(), w = V.waterToday();
      var pct = Math.min(100, Math.round(w / goal * 100));
      return '<button class="water-card" data-water-open>' +
        '<span class="water-card__ring" style="--p:' + pct + '">' + V.icon("drop") + "</span>" +
        '<div style="flex:1;text-align:left"><b>' + t("waterWidget") + "</b>" +
          '<small>' + (w / 1000).toFixed(2).replace(/\.?0+$/, "") + " / " + (goal / 1000) + " ლ · " + pct + "%</small>" +
          '<div class="water-card__bar"><span style="width:' + pct + '%"></span></div></div>' +
        '<span class="water-card__add" data-water-add>' + V.icon("plus") + "</span></button>";
    }

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div style="display:flex;align-items:center;gap:12px;margin:4px 0 18px">' +
          '<div class="avatar" style="width:48px;height:48px;font-size:26px;margin:0">🧑🏻‍🦱</div>' +
          '<div style="flex:1"><span style="color:var(--muted)">' + greet + ' , </span><b>' + esc(name) + "</b></div>" +
          '<button class="icon-box gray" data-open-settings>' + V.icon("bell") + "</button>" +
        "</div>" +
        '<div class="plan-hero"><div class="plan-hero__top">' +
          "<h2>" + t("plAlmost") + '</h2><div class="plan-hero__pct">' + pct + "<span>%</span></div></div>" +
          '<div class="day-row">' + dayChips(day) + "</div>" +
          '<div class="daysleft"><span>' + t("plDaysLeft", { n: Math.max(0, 4 - ((day - 1) % 4)) }) + "</span></div>" +
        "</div>" +

        waterWidget() +
        '<button class="careplans-cta" data-careplans>' + V.iconBox("heart", "green") +
          '<div style="flex:1;text-align:left"><b>' + t("plCarePlans") + "</b><small>" + t("plCarePlansSub") + "</small></div>" +
          '<span class="cplan__chev">' + V.icon("next") + "</span></button>" +
        '<button class="careplans-cta" data-workouts>' + V.iconBox("bolt", "blue") +
          '<div style="flex:1;text-align:left"><b>' + t("plWorkouts") + "</b><small>" + t("plWorkoutsSub") + "</small></div>" +
          '<span class="cplan__chev">' + V.icon("next") + "</span></button>" +
        '<button class="careplans-cta" data-annual>' + V.iconBox("calendar", "pink") +
          '<div style="flex:1;text-align:left"><b>' + t("plAnnual") + "</b><small>" + t("plAnnualSub") + "</small></div>" +
          '<span class="cplan__chev">' + V.icon("next") + "</span></button>" +

        '<div class="section-head"><h3>' + t("plTasks") + '</h3><small>' + done.length + "/" + tasks.length + "</small></div>" +
        '<div class="track"><span style="width:' + pct + '%"></span></div>' +
        tasks.map(function (tk) {
          var d = done.indexOf(tk.id) >= 0;
          var lg = (V.state.taskLogs[today] || {})[tk.id];
          return '<div class="task ' + (d ? "done" : "") + '">' +
            '<button class="task__box" data-toggle="' + tk.id + '">' + V.icon("check") + "</button>" +
            '<span class="task__t">' + L(tk.label) + "</span>" +
            (lg && lg.photo ? '<img class="task__thumb" src="' + lg.photo + '" alt="">' : "") +
            '<button class="task__log ' + (lg ? "on" : "") + '" data-log="' + tk.id + '" title="' + t("logTitle") + '">' +
              V.icon(lg ? "check" : "camera") + "</button>" +
            '<span class="tag ' + V.catTone(tk.cat) + '">' + t(V.catKey(tk.cat)) + "</span></div>";
        }).join("") +

        (meds.length ? '<div class="section-head"><h3>' + t("plMeds") + '</h3><small>' + t("plDoctor") + "</small></div>" +
          (morningMeds.length ? '<div class="med-when">' + V.icon("sun") + " 08:00 — " + t("plWithBreakfast") + "</div>" +
            morningMeds.map(function (m) { return medRow(m, doneMeds, today); }).join("") : "") +
          (eveningMeds.length ? '<div class="med-when">' + V.icon("moon") + " 19:00 — " + t("plWithDinner") + "</div>" +
            eveningMeds.map(function (m) { return medRow(m, doneMeds, today); }).join("") : "") : "") +

        '<div class="section-head"><h3>' + t("plFood") + "</h3></div>" +
        '<div class="cal-note">' + t("plCalRange") + "</div>" +
        food.map(function (f) {
          return '<div class="food"><div class="food__top">' +
            "<b>" + L(f.title) + ' <span class="food__time">· ' + f.time + '</span></b>' +
            '<span class="food__kcal">~' + f.kcal + " " + t("plKcal") + "</span></div>" +
            "<ul>" + (f.items[V.lang()] || f.items.en).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></div>";
        }).join("") +
      "</div>" +
      V.tabbar("plan") +
      "</div>",
      { onMount: function () {
        var cp = $("[data-careplans]");
        if (cp) cp.addEventListener("click", function () { V.go("careplans"); });
        var wo = $("[data-workouts]");
        if (wo) wo.addEventListener("click", function () { V.go("workouts"); });
        var an = $("[data-annual]");
        if (an) an.addEventListener("click", function () { V.go("annual"); });
        var wopen = $("[data-water-open]");
        if (wopen) wopen.addEventListener("click", function () { V.go("water"); });
        var wadd = $("[data-water-add]");
        if (wadd) wadd.addEventListener("click", function (e) { e.stopPropagation(); V.waterAdd(250); V.render(); });
        each("[data-toggle]", function (el) {
          el.addEventListener("click", function () {
            var id = el.getAttribute("data-toggle");
            var arr = V.state.doneTasks[today] = V.state.doneTasks[today] || [];
            var i = arr.indexOf(id);
            if (i >= 0) arr.splice(i, 1); else arr.push(id);
            V.save();
            V.render();
          });
        });
        each("[data-log]", function (el) {
          el.addEventListener("click", function () { openLog(el.getAttribute("data-log")); });
        });
        each("[data-med]", function (el) {
          el.addEventListener("click", function () {
            var id = el.getAttribute("data-med");
            var arr = V.state.doneMeds[today] = V.state.doneMeds[today] || [];
            var i = arr.indexOf(id);
            if (i >= 0) arr.splice(i, 1); else arr.push(id);
            V.save();
            el.classList.toggle("done");
            el.querySelector(".task__box").className = "task__box";
          });
        });

        /* ----- interactive proof logger (text / photo / voice) ----- */
        function openLog(taskId) {
          var task = tasks.filter(function (x) { return x.id === taskId; })[0];
          var prev = (V.state.taskLogs[today] || {})[taskId] || {};
          var draft = { text: prev.text || "", photo: prev.photo || "", voice: !!prev.voice };
          var phone = root.querySelector(".phone");
          var old = root.querySelector("#logSheet"); if (old) old.remove();
          phone.insertAdjacentHTML("beforeend",
            '<div class="sheet-overlay" id="logSheet"><div class="sheet">' +
            '<div class="sheet__grab"></div>' +
            "<h3>" + t("logTitle") + "</h3>" +
            '<p class="s-sub" style="margin:-6px 0 14px">' + (task ? L(task.label) + " · " : "") + t("logHint") + "</p>" +
            '<label class="field" style="display:block"><span style="font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">' + t("logText") + "</span>" +
              '<textarea id="logText" rows="2" placeholder="' + t("logTextPh") + '" style="width:100%;margin-top:8px;padding:12px 14px;border:1.5px solid var(--line);border-radius:12px;font-size:15px;outline:none;background:var(--card);resize:none;font-family:var(--font)">' + esc(draft.text) + "</textarea></label>" +
            '<div class="log-actions">' +
              '<button class="log-act" id="logPhotoBtn">' + V.icon("camera") + "<span>" + t("logPhoto") + "</span></button>" +
              '<button class="log-act" id="logVoiceBtn">' + V.icon("mic") + '<span id="logVoiceLbl">' + (draft.voice ? t("logVoiceDone") : t("logVoice")) + "</span></button>" +
            "</div>" +
            '<input type="file" accept="image/*" id="logFile" style="display:none">' +
            '<div id="logPhotoPrev">' + (draft.photo ? '<img src="' + draft.photo + '">' : "") + "</div>" +
            '<button class="btn btn-primary" id="logSave" style="width:100%;margin-top:8px">' + V.icon("check") + " " + t("logSave") + "</button>" +
            "</div></div>");
          var sheet = root.querySelector("#logSheet");
          requestAnimationFrame(function () { sheet.classList.add("on"); });
          sheet.addEventListener("click", function (e) { if (e.target === sheet) sheet.classList.remove("on"); });

          sheet.querySelector("#logText").addEventListener("input", function (e) { draft.text = e.target.value; });

          var fileInput = sheet.querySelector("#logFile");
          sheet.querySelector("#logPhotoBtn").addEventListener("click", function () { fileInput.click(); });
          fileInput.addEventListener("change", function () {
            var f = fileInput.files && fileInput.files[0];
            if (!f) return;
            downscale(f, function (dataURL) {
              draft.photo = dataURL;
              sheet.querySelector("#logPhotoPrev").innerHTML = '<img src="' + dataURL + '">';
            });
          });

          var vbtn = sheet.querySelector("#logVoiceBtn"), vlbl = sheet.querySelector("#logVoiceLbl");
          vbtn.addEventListener("click", function () {
            if (draft.voice) { draft.voice = false; vbtn.classList.remove("on"); vlbl.textContent = t("logVoice"); return; }
            vbtn.classList.add("rec"); vlbl.textContent = t("logRec");
            setTimeout(function () {
              draft.voice = true; vbtn.classList.remove("rec"); vbtn.classList.add("on"); vlbl.textContent = t("logVoiceDone");
            }, 1400);
          });

          sheet.querySelector("#logSave").addEventListener("click", function () {
            var day = V.state.taskLogs[today] = V.state.taskLogs[today] || {};
            if (draft.text || draft.photo || draft.voice) day[taskId] = draft; else delete day[taskId];
            var arr = V.state.doneTasks[today] = V.state.doneTasks[today] || [];
            if (arr.indexOf(taskId) < 0) arr.push(taskId);
            V.save();
            sheet.classList.remove("on");
            setTimeout(function () { V.render(); }, 200);
          });
        }

        function downscale(file, cb) {
          var reader = new FileReader();
          reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
              var max = 640, w = img.width, h = img.height;
              if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
              else if (h > max) { w = Math.round(w * max / h); h = max; }
              var c = document.createElement("canvas"); c.width = w; c.height = h;
              c.getContext("2d").drawImage(img, 0, 0, w, h);
              try { cb(c.toDataURL("image/jpeg", 0.7)); } catch (err) { cb(e.target.result); }
            };
            img.onerror = function () { cb(e.target.result); };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        }
      }}
    );
  };

  function dayChips(day) {
    // show pairs DAY1/DAY2 done, current, upcoming
    var groups = [
      { lbl: "DAY1/DAY2", state: day > 2 ? "done" : day >= 1 ? "today" : "" },
      { lbl: "DAY3", state: day === 3 ? "today" : day > 3 ? "done" : "" },
      { lbl: "DAY4", state: day === 4 ? "today" : day > 4 ? "done" : "" },
    ];
    return groups.map(function (g) {
      var extra = g.state === "done" ? " " + V.icon("check") : "";
      return '<div class="day-chip ' + g.state + '">' + g.lbl + extra + "</div>";
    }).join("");
  }

  function medRow(m, doneMeds, today) {
    var d = doneMeds.indexOf(m.id) >= 0;
    return '<div class="med task ' + (d ? "done" : "") + '" data-med="' + m.id + '" style="box-shadow:var(--shadow-card);border:0">' +
      '<span class="task__box">' + V.icon("check") + "</span>" +
      '<div class="med__t"><b>' + L(m.name) + "</b><small>" + L(m.purpose) + "</small></div>" +
      '<span class="med__dose">' + m.dose + "</span></div>";
  }

  /* ===================== VITA CHAT ===================== */
  V.screens.vita = function () {
    var p = V.state.profile;
    if (!V.state.chat.length) {
      var nm = p.name ? " " + p.name.split(" ")[0] : "";
      V.state.chat.push({ role: "vita", text: t("chHello").replace("{name}", nm) });
      V.save();
    }
    var quicks = V.lang() === "ka"
      ? ["შაქარი როგორ დავწიო?", "წონაში ჩამოვიდე", "ენერგია მაკლია", "კანის მოვლა"]
      : ["Lower my blood sugar", "Help me lose weight", "I have low energy", "Skincare tips"];

    V.mount(
      V.statusbar() +
      '<div class="screen" style="overflow:hidden">' +
        '<div class="chat-head">' + V.logoBadge(42) +
          "<div><b>" + t("chTitle") + "</b><small>" + (V.api.aiOn()
            ? (V.lang() === "ka" ? (V.api.provider() === "gemini" ? "Gemini-ით გაძლიერებული" : "Claude-ით გაძლიერებული")
                                 : "Powered by " + (V.api.provider() === "gemini" ? "Gemini" : "Claude"))
            : t("chSub")) + "</small></div>" +
          '<button class="icon-box gray" data-open-settings>' + V.icon("settings") + "</button></div>" +
        (V.api.aiOn() ? "" : '<div class="chat-hint">' + V.icon("info") + " " + t("chOffline") + "</div>") +
        '<div class="chat-body" id="chatBody">' +
          V.state.chat.map(msgHTML).join("") +
        "</div>" +
        '<div class="quick-row" id="quicks">' +
          quicks.map(function (q) { return '<button class="quick" data-q="' + esc(q) + '">' + esc(q) + "</button>"; }).join("") +
        "</div>" +
        '<div class="chat-input"><input id="chatInput" placeholder="' + t("chPlaceholder") + '">' +
          '<button class="chat-send" id="chatSend">' + V.icon("send") + "</button></div>" +
      "</div>" +
      V.tabbar("vita"),
      { onMount: function () {
        var body = $("#chatBody"), input = $("#chatInput");
        function scroll() { body.scrollTop = body.scrollHeight; }
        scroll();
        function mockReply(text) {
          setTimeout(function () {
            var reply = V.chatReply(text, V.state.chat);
            var ty = $("#typing"); if (ty) ty.remove();
            V.state.chat.push({ role: "vita", text: reply });
            V.save();
            body.insertAdjacentHTML("beforeend", msgHTML({ role: "vita", text: reply }));
            scroll();
          }, 600 + Math.random() * 500);
        }
        function send(text) {
          text = (text || input.value).trim();
          if (!text) return;
          V.state.chat.push({ role: "user", text: text });
          input.value = "";
          body.insertAdjacentHTML("beforeend", msgHTML({ role: "user", text: text }));
          body.insertAdjacentHTML("beforeend", '<div class="typing" id="typing"><i></i><i></i><i></i></div>');
          scroll();
          V.save();

          if (!V.api.aiOn()) { mockReply(text); return; }

          // real AI: stream tokens into a bubble
          var bubble = null;
          var acc = "";
          function ensureBubble() {
            if (bubble) return;
            var ty = $("#typing"); if (ty) ty.remove();
            body.insertAdjacentHTML("beforeend", '<div class="msg vita" id="liveMsg"></div>');
            bubble = $("#liveMsg");
          }
          V.api.chat(V.state.chat, function (tok, full) {
            ensureBubble();
            acc = full;
            bubble.textContent = full;
            scroll();
          }, function (full) {
            if (bubble) bubble.removeAttribute("id");
            V.state.chat.push({ role: "vita", text: full || acc });
            V.save();
          }, function () { /* error event — handled by catch below */ })
          .catch(function () {
            // backend failed mid-stream or unavailable → offline reply
            if (bubble) { bubble.remove(); }
            mockReply(text);
          });
        }
        $("#chatSend").addEventListener("click", function () { send(); });
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
        each("[data-q]", function (b) { b.addEventListener("click", function () { send(b.getAttribute("data-q")); }); });
      }}
    );
  };
  function msgHTML(m) { return '<div class="msg ' + (m.role === "user" ? "user" : "vita") + '">' + esc(m.text) + "</div>"; }

  /* ===================== PROGRESS ===================== */
  V.screens.progress = function () {
    var p = V.state.profile;
    var startW = (V.state.weightLog[0] && V.state.weightLog[0].kg) || p.weight || 90;
    var curW = p.weight || 85;
    var tgtW = Math.max(60, Math.round((p.weight || 85) - 8));

    // synthesize a downward weight trend for the demo
    var weeks = 8;
    var wSeries = [];
    for (var i = 0; i < weeks; i++) {
      wSeries.push(Math.round((startW - (startW - curW) * (i / (weeks - 1))) * 10) / 10);
    }
    var scoreNow = V.healthScore();
    var sSeries = [];
    for (var j = 0; j < weeks; j++) {
      sSeries.push(Math.round(Math.max(40, scoreNow - (weeks - 1 - j) * 2.2)));
    }

    // streak + tasks completed
    var streak = countStreak();
    var totalDone = Object.keys(V.state.doneTasks).reduce(function (a, k) { return a + V.state.doneTasks[k].length; }, 0);

    var goalNames = { weight: t("gWeight"), waist: t("gWaist"), sugar: t("gSugar"), energy: t("gEnergy"), wellbeing: t("gWellbeing"), skin: t("gSkin"), hair: t("gHair"), oral: t("gOral") };
    var goals = V.state.goals.map(function (id, i) {
      var prog = [62, 48, 75, 55, 80, 40][i % 6];
      return { name: goalNames[id] || id, prog: prog };
    });

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head">' + V.logoBadge(34) + "<h1>" + t("pgTitle") + "</h1></div>" +
        '<p class="s-sub">' + t("pgDesc") + "</p>" +

        '<div class="pg-streak">' +
          '<div class="pg-stat"><div class="big">' + V.icon("flame") + streak + "</div>" +
            '<small>' + t("pgStreakDays") + "</small></div>" +
          '<div class="pg-stat"><div class="big" style="color:var(--green)">' + V.icon("check") + totalDone + "</div>" +
            '<small>' + t("pgTasksDone") + "</small></div>" +
        "</div>" +

        '<div class="chart-card"><h3>' + t("pgWeight") + "</h3>" +
          '<div class="cap">' + startW + t("kg") + " → " + curW + t("kg") + "  ·  " + t("target") + " " + tgtW + t("kg") + "</div>" +
          lineChart(wSeries, "#27AE60", tgtW) + "</div>" +

        '<div class="chart-card"><h3>' + t("pgScore") + "</h3>" +
          '<div class="cap">' + sSeries[0] + " → " + sSeries[weeks - 1] + "</div>" +
          barChart(sSeries) + "</div>" +

        '<div class="chart-card"><h3>' + t("pgGoals") + "</h3>" +
          (goals.length ? goals.map(function (g) {
            return '<div class="goalbar"><div class="goalbar__top"><b>' + esc(g.name) + "</b><span>" + g.prog + "%</span></div>" +
              '<div class="goalbar__track"><span style="width:' + g.prog + '%"></span></div></div>';
          }).join("") : '<p class="cap">—</p>') +
        "</div>" +
      "</div>" +
      V.tabbar("progress") +
      "</div>"
    );
  };

  function countStreak() {
    // consecutive days (ending today) with >=1 done task
    var d = new Date(), streak = 0;
    for (var i = 0; i < 60; i++) {
      var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      if (V.state.doneTasks[iso] && V.state.doneTasks[iso].length) streak++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function lineChart(series, color, targetVal) {
    var w = 320, h = 150, pad = 14;
    var min = Math.min.apply(null, series.concat([targetVal])) - 2;
    var max = Math.max.apply(null, series) + 2;
    var sx = function (i) { return pad + (i / (series.length - 1)) * (w - 2 * pad); };
    var sy = function (v) { return pad + (1 - (v - min) / (max - min)) * (h - 2 * pad); };
    var pts = series.map(function (v, i) { return sx(i) + "," + sy(v); }).join(" ");
    var area = "M" + sx(0) + "," + sy(series[0]) + " L" + pts.replace(/ /g, " L") + " L" + sx(series.length - 1) + "," + (h - pad) + " L" + sx(0) + "," + (h - pad) + " Z";
    var ty = sy(targetVal);
    return '<svg viewBox="0 0 ' + w + " " + h + '">' +
      '<defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".25"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#lg)"/>' +
      '<line x1="' + pad + '" y1="' + ty + '" x2="' + (w - pad) + '" y2="' + ty + '" stroke="var(--muted)" stroke-width="1.4" stroke-dasharray="4 4" opacity=".6"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      series.map(function (v, i) { return '<circle cx="' + sx(i) + '" cy="' + sy(v) + '" r="3.2" fill="' + color + '"/>'; }).join("") +
      "</svg>";
  }

  function barChart(series) {
    var w = 320, h = 150, pad = 14, n = series.length;
    var max = Math.max.apply(null, series) + 6;
    var bw = (w - 2 * pad) / n * 0.56;
    return '<svg viewBox="0 0 ' + w + " " + h + '">' +
      series.map(function (v, i) {
        var x = pad + (i + 0.5) * ((w - 2 * pad) / n) - bw / 2;
        var bh = (v / max) * (h - 2 * pad);
        var y = h - pad - bh;
        var col = v >= 71 ? "#27AE60" : v >= 41 ? "#F2B83B" : "#ED2E7E";
        return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="5" fill="' + col + '" opacity="' + (0.5 + 0.5 * (i / n)) + '"/>';
      }).join("") +
      "</svg>";
  }

  /* ===================== CARE PLANS (holistic A–F) ===================== */
  var openPlan = null; // which plan accordion is expanded (persists)
  V.screens.careplans = function () {
    var plans = V.carePlans();
    if (!plans.some(function (x) { return x.id === openPlan; })) openPlan = plans[0].id;

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("cpTitleScreen") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("cpDescScreen") + "</p>" +
        plans.map(function (pl) {
          var open = pl.id === openPlan;
          return '<div class="cplan ' + (open ? "open" : "") + '">' +
            '<button class="cplan__head" data-plan="' + pl.id + '">' + V.iconBox(pl.icon, pl.tone) +
              '<b>' + t(pl.key) + "</b><span class='cplan__chev'>" + V.icon("next") + "</span></button>" +
            '<div class="cplan__body">' +
              pl.sections.map(function (s) {
                return '<div class="cplan__sec"><h4>' + L(s.h) + "</h4><ul>" +
                  (s.items[V.lang()] || s.items.en).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") +
                  "</ul></div>";
              }).join("") +
            "</div></div>";
        }).join("") +
      "</div>" +
      V.tabbar("plan") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("plan"); });
        each("[data-plan]", function (b) {
          b.addEventListener("click", function () {
            var id = b.getAttribute("data-plan");
            openPlan = (openPlan === id) ? null : id;
            V.render();
          });
        });
      }}
    );
  };

  /* ===================== WATER TRACKER ===================== */
  V.screens.water = function () {
    var goal = V.waterGoal();
    var ml = V.waterToday();
    var pct = Math.min(100, Math.round(ml / goal * 100));
    var glasses = Math.round(ml / V.WATER_GLASS);
    var goalGlasses = Math.round(goal / V.WATER_GLASS);
    var series = V.waterSeries(7);
    var maxMl = Math.max(goal, Math.max.apply(null, series.map(function (s) { return s.ml; })));

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("waterTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("waterDesc") + "</p>" +

        '<div class="water-hero">' +
          waterBottle(pct) +
          '<div class="water-stat"><div class="water-stat__big">' + (ml / 1000).toFixed(2).replace(/\.?0+$/, "") + '<span> / ' + (goal / 1000) + " ლ</span></div>" +
            '<div class="water-stat__sub">' + pct + "% " + t("waterOf") + " · " + glasses + "/" + goalGlasses + " " + t("waterGlass") + "</div>" +
            (ml >= goal ? '<div class="tag green" style="margin-top:10px">' + t("waterGoalHit") + "</div>" : "") +
          "</div>" +
        "</div>" +

        '<div class="water-controls">' +
          '<button class="water-btn minus" data-water="-250">−</button>' +
          '<div class="water-glasses">' +
            Array.apply(null, { length: goalGlasses }).map(function (_, i) {
              return '<span class="wg ' + (i < glasses ? "on" : "") + '">' + V.icon("drop") + "</span>";
            }).join("") +
          "</div>" +
          '<button class="water-btn plus" data-water="250">+</button>' +
        "</div>" +
        '<button class="btn btn-primary" data-water="250" style="width:100%;margin-top:6px">' + V.icon("drop") + " " + t("waterAddGlass") + "</button>" +

        '<div class="section-head"><h3>' + t("waterWeek") + "</h3></div>" +
        '<div class="chart-card"><svg viewBox="0 0 320 130">' +
          series.map(function (s, i) {
            var bw = 30, gap = (320 - bw * 7) / 8, x = gap + i * (bw + gap);
            var bh = Math.max(3, (s.ml / maxMl) * 92), y = 104 - bh;
            var col = s.ml >= goal ? "#2BA94C" : "#7FC8E8";
            return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="6" fill="' + col + '"/>' +
              '<text x="' + (x + bw / 2) + '" y="120" text-anchor="middle" font-size="11" fill="var(--muted)">' + V.dayShort(s.key) + "</text>";
          }).join("") +
          '<line x1="0" y1="' + (104 - (goal / maxMl) * 92) + '" x2="320" y2="' + (104 - (goal / maxMl) * 92) + '" stroke="var(--muted)" stroke-dasharray="4 4" opacity=".5"/>' +
        "</svg></div>" +
      "</div>" +
      V.tabbar("plan") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("plan"); });
        each("[data-water]", function (b) {
          b.addEventListener("click", function () { V.waterAdd(parseInt(b.getAttribute("data-water"), 10)); V.render(); });
        });
      }}
    );
  };

  function waterBottle(pct) {
    var fillY = 96 - (pct / 100) * 84; // bottle body 12..96
    return '<svg class="water-bottle" viewBox="0 0 80 120" width="120" height="160">' +
      '<defs><clipPath id="bottleClip"><path d="M28 8 h24 v10 q12 6 12 22 v66 q0 10 -12 10 h-24 q-12 0 -12 -10 v-66 q0 -16 12 -22 Z"/></clipPath>' +
      '<linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD4F0"/><stop offset="1" stop-color="#36A0D8"/></linearGradient></defs>' +
      '<g clip-path="url(#bottleClip)">' +
        '<rect x="0" y="0" width="80" height="120" fill="var(--field)"/>' +
        '<rect x="0" y="' + fillY + '" width="80" height="120" fill="url(#wfill)"><animate attributeName="y" to="' + fillY + '" dur="0.5s" fill="freeze"/></rect>' +
        '<ellipse cx="40" cy="' + fillY + '" rx="42" ry="5" fill="#A7E0F5" opacity=".7"/>' +
      "</g>" +
      '<path d="M28 8 h24 v10 q12 6 12 22 v66 q0 10 -12 10 h-24 q-12 0 -12 -10 v-66 q0 -16 12 -22 Z" fill="none" stroke="var(--line)" stroke-width="2.5"/>' +
      '<rect x="31" y="2" width="18" height="7" rx="2" fill="var(--line)"/>' +
      "</svg>";
  }

  /* ===================== MENU / HUB ===================== */
  V.screens.menu = function () {
    function tile(icon, tone, labelKey, attr) {
      return '<button class="menu-tile" ' + attr + '>' + V.iconBox(icon, tone) +
        "<span>" + t(labelKey) + "</span></button>";
    }
    function group(titleKey, tiles) {
      return '<div class="menu-grp"><div class="kicker" style="margin:18px 0 10px">' + t(titleKey) + "</div>" +
        '<div class="menu-grid">' + tiles.join("") + "</div></div>";
    }

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("menuTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("x") + "</button></div>" +
        '<p class="s-sub">' + t("menuSub") + "</p>" +

        group("grpHealth", [
          tile("user", "green", "mProfile", 'data-go="profile"'),
          tile("calendar", "pink", "mAnnual", 'data-go="annual"'),
          tile("shield", "blue", "mBody", 'data-go="bodymap"'),
          tile("flask", "yellow", "mResults", 'data-go="results"'),
        ]) +
        group("grpCare", [
          tile("plan", "green", "mPlan", 'data-go="plan"'),
          tile("heart", "green", "mCare", 'data-go="careplans"'),
          tile("bolt", "blue", "mWorkouts", 'data-go="workouts"'),
          tile("drop", "blue", "mWater", 'data-go="water"'),
          tile("flask", "pink", "mCheckup", 'data-go="checkup"'),
        ]) +
        group("grpAssistant", [
          tile("chat", "blue", "mChat", 'data-go="vita"'),
          tile("progress", "green", "mProgress", 'data-go="progress"'),
        ]) +
        group("grpTools", [
          tile("calendar", "blue", "mIcs", 'data-act="ics"'),
          tile("file", "gray", "mJson", 'data-act="json"'),
          tile("file", "green", "mPrint", 'data-act="print"'),
          tile("settings", "gray", "mSettings", 'data-act="settings"'),
        ]) +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("home"); });
        each("[data-go]", function (b) {
          b.addEventListener("click", function () { V.go(b.getAttribute("data-go")); });
        });
        each("[data-act]", function (b) {
          b.addEventListener("click", function () {
            var a = b.getAttribute("data-act");
            if (a === "ics") V.features.exportICS();
            else if (a === "json") V.features.exportJSON();
            else if (a === "print") V.features.printSummary();
            else if (a === "settings") { V.openSettings(); }
          });
        });
      }}
    );
  };

  /* ===================== WORKOUTS ===================== */
  V.screens.workouts = function () {
    var week = V.workoutWeek();
    var done = V.state.doneWorkouts || {};
    var strengthDays = week.filter(function (d) { return d.type === "strength"; });
    var doneCount = strengthDays.filter(function (d) { return done[d.key]; }).length;
    var todayIdx = (new Date().getDay() + 6) % 7; // Mon=0

    function dayCard(d, i) {
      var isToday = i === todayIdx;
      var tone = d.type === "strength" ? "green" : d.type === "cardio" ? "blue" : "gray";
      var ic = d.type === "strength" ? "bolt" : d.type === "cardio" ? "walk" : "moon";
      var isDone = !!done[d.key];
      return '<div class="wo-day ' + (isToday ? "today" : "") + '">' +
        '<div class="wo-day__head">' + V.iconBox(ic, tone) +
          '<div style="flex:1"><b>' + V.dayName(d.key) + (isToday ? ' · <span style="color:var(--green)">' + V.t("today") + "</span>" : "") + "</b>" +
            "<small>" + L(d.focus) + "</small></div>" +
          (d.type === "rest" ? '<span class="tag gray">' + V.t("woRest") + "</span>"
            : '<button class="wo-check ' + (isDone ? "on" : "") + '" data-wo="' + d.key + '">' + V.icon("check") + "</button>") +
        "</div>" +
        (d.items.length ? '<ul class="wo-list">' + d.items.map(function (x) {
          return "<li><span>" + L(x.name) + '</span><b>' + esc(x.scheme) + "</b></li>";
        }).join("") + "</ul>" : "") +
        "</div>";
    }

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("woTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("woDesc") + "</p>" +
        '<div class="section-head"><h3>' + t("woThisWeek") + '</h3><small>' + t("woWeekDone", { n: doneCount }) + "</small></div>" +
        '<div class="track"><span style="width:' + Math.round(doneCount / 3 * 100) + '%"></span></div>' +
        week.map(dayCard).join("") +
      "</div>" +
      V.tabbar("plan") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("plan"); });
        each("[data-wo]", function (b) {
          b.addEventListener("click", function () {
            var k = b.getAttribute("data-wo");
            V.state.doneWorkouts = V.state.doneWorkouts || {};
            V.state.doneWorkouts[k] = !V.state.doneWorkouts[k];
            V.save();
            V.render();
          });
        });
      }}
    );
  };

  /* ===================== ANNUAL CHECKUPS (standards-based) ===================== */
  V.screens.annual = function () {
    var p = V.state.profile;
    var rec = V.recommendedScreenings();
    var sel = V.selectedScreenings();
    var byMonth = V.screeningByMonth();
    var curMonth = new Date().getMonth() + 1;

    // unique regions that have a recommended screening → one marker each
    var regions = {};
    rec.now.forEach(function (s) {
      regions[s.region] = regions[s.region] || { region: s.region, cat: s.cat, ids: [] };
      regions[s.region].ids.push(s.id);
    });
    var markers = Object.keys(regions).map(function (r) {
      var g = regions[r], xy = V.regionXY[r] || { x: 50, y: 50 };
      var anySel = g.ids.some(function (id) { return sel.indexOf(id) >= 0; });
      return '<button class="scmk ' + (anySel ? "on" : "") + '" data-region="' + r + '" title="' + V.regionLabel(r) +
        '" style="left:' + xy.x + "%;top:" + xy.y + "%;--mkc:" + V.catColor(g.cat) + '"></button>';
    }).join("");

    function row(s, selectable) {
      var on = sel.indexOf(s.id) >= 0;
      var dot = '<span class="sc-dot" style="background:' + V.catColor(s.cat) + '"></span>';
      var meta = L(s.freq ? V.freqLabel(s.freq) : { ka: "", en: "" }) + " · " + V.regionLabel(s.region);
      if (!selectable) {
        return '<div class="sc-row muted" data-rg="' + s.region + '">' + dot +
          '<div class="sc-row__t"><b>' + L(s.name) + "</b><small>" + meta + " · " + t("scFromAge", { age: s.fromAge }) + "</small></div></div>";
      }
      return '<div class="sc-row ' + (on ? "on" : "") + '" data-sc="' + s.id + '" data-rg="' + s.region + '">' + dot +
        '<div class="sc-row__t"><b>' + L(s.name) + "</b><small>" + meta + "</small>" +
          '<small class="sc-basis">' + t("scSrc") + ": " + L(s.basis) + "</small></div>" +
        '<span class="sc-box">' + V.icon("check") + "</span></div>";
    }

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("anTitleScreen") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("scBasis", { age: p.age || 36 }) + "</p>" +

        '<div class="scbody-card"><div class="scbody">' + screeningBody() + markers + "</div></div>" +

        '<div class="section-head"><h3>' + t("scRecommended") + '</h3><small>' + sel.length + " " + t("scSelected") + "</small></div>" +
        '<p class="s-sub" style="margin:-6px 0 12px">' + t("scTapHint") + "</p>" +
        rec.now.map(function (s) { return row(s, true); }).join("") +

        (rec.later.length ? '<div class="section-head"><h3>' + t("scLater") + "</h3></div>" +
          rec.later.map(function (s) { return row(s, false); }).join("") : "") +

        '<div class="section-head"><h3>' + t("scSchedule") + "</h3></div>" +
        '<div class="freq-legend">' + ["q", "b", "a"].map(function (f) { return "<span>" + L(V.freqLabel(f)) + "</span>"; }).join("") + "</div>" +
        (byMonth.length ? byMonth.map(function (mo) {
          return '<div class="amonth ' + (mo.month === curMonth ? "cur" : "") + '">' +
            '<div class="amonth__h"><b>' + V.monthName(mo.month) + "</b>" +
              (mo.month === curMonth ? '<span class="tag green">' + (V.lang() === "ka" ? "მიმდინარე" : "Now") + "</span>" : "") + "</div>" +
            mo.items.map(function (s) {
              return '<div class="arow"><span class="sc-dot" style="background:' + V.catColor(s.cat) + '"></span>' +
                '<div style="flex:1"><b>' + L(s.name) + "</b><small>" + L(V.freqLabel(s.freq)) + "</small></div></div>";
            }).join("") +
          "</div>";
        }).join("") : '<p class="cal-note">' + t("scNonePicked") + "</p>") +
      "</div>" +
      V.tabbar("plan") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("plan"); });
        function toggle(id) {
          var i = V.state.screenings.indexOf(id);
          if (i >= 0) V.state.screenings.splice(i, 1); else V.state.screenings.push(id);
          V.save(); V.render();
        }
        each("[data-sc]", function (el) {
          el.addEventListener("click", function () { toggle(el.getAttribute("data-sc")); });
        });
        each("[data-region]", function (mk) {
          mk.addEventListener("click", function () {
            var r = mk.getAttribute("data-region");
            var first = root.querySelector('[data-sc][data-rg="' + r + '"]') || root.querySelector('[data-rg="' + r + '"]');
            if (first) {
              first.scrollIntoView({ behavior: "smooth", block: "center" });
              first.classList.add("flash");
              setTimeout(function () { first.classList.remove("flash"); }, 1200);
            }
          });
        });
      }}
    );
  };

  // smooth front-facing human body for the screening map
  function screeningBody() {
    return '' +
'<svg viewBox="0 0 200 360" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">' +
'<defs><linearGradient id="scBodyG" x1="0" y1="0" x2="0" y2="1">' +
'<stop offset="0" stop-color="#BDEBD0"/><stop offset="1" stop-color="#7FD3A5"/></linearGradient></defs>' +
'<g fill="url(#scBodyG)">' +
'<circle cx="100" cy="40" r="26"/>' +                                  // head
'<path d="M90 64 h20 v12 q-10 6 -20 0 Z"/>' +                          // neck
'<path d="M64 80 q36 -12 72 0 q14 5 16 18 l-10 40 q-3 12 -12 14 l3 70 q1 22 -5 44 l-20 2 -8 -78 h-4 l-8 78 -20 -2 q-6 -22 -5 -44 l3 -70 q-9 -2 -12 -14 l-10 -40 q2 -13 16 -18 Z"/>' + // torso + legs
'<path d="M66 86 q-16 6 -22 22 l-12 64 q-2 9 6 11 q8 2 11 -7 l14 -64 Z"/>' + // left arm
'<path d="M154 86 q16 6 22 22 l12 64 q2 9 -6 11 q-8 2 -11 -7 l-14 -64 Z"/>' + // right arm
'</g>' +
'<g opacity=".5" fill="#3FA985">' +                                    // soft organ hints
'<ellipse cx="86" cy="120" rx="11" ry="15"/><ellipse cx="114" cy="120" rx="11" ry="15"/>' + // lungs
'<path d="M96 116 q5 -7 10 -1 q4 5 -1 11 l-9 10 -9 -10 q-5 -6 -1 -11 q5 -6 10 1 Z"/>' + // heart
'<ellipse cx="108" cy="158" rx="16" ry="11" opacity=".7"/>' +          // liver
'<rect x="84" y="170" width="32" height="22" rx="9" opacity=".6"/>' +  // abdomen
'</g>' +
'</svg>';
  }

  /* ===================== RESULTS UPLOAD ===================== */
  var ruPanel = "general";   // currently open panel (persists across re-render)

  V.screens.results = function () {
    var panels = V.labPanels();
    var allRefs = V.labRefs();
    if (!panels.some(function (p) { return p.id === ruPanel; })) ruPanel = panels[0].id;
    var panel = panels.filter(function (p) { return p.id === ruPanel; })[0];
    var saved = (V.state.labResults[0] && V.state.labResults[0].values) || {};
    var hasResult = Object.keys(saved).length > 0;

    function refById(id) { return allRefs.filter(function (r) { return r.id === id; })[0]; }
    function rangeText(r) {
      if (r.low > 0 && r.high < 9000) return r.low + "–" + r.high + (r.unit ? " " + r.unit : "");
      if (r.high < 9000) return "≤ " + r.high + (r.unit ? " " + r.unit : "");
      return "≥ " + r.low + (r.unit ? " " + r.unit : "");
    }

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("ruTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("x") + "</button></div>" +
        '<p class="s-sub">' + t("ruDesc") + "</p>" +

        '<div class="upload-grid">' +
          uploadOpt("camera", t("ruPhoto"), V.lang() === "ka" ? "ანალიზის ფურცლის სკანი" : "Scan your lab sheet") +
          uploadOpt("upload", t("ruFile"), "PDF · JPG · PNG") +
        "</div>" +

        '<div class="kicker" style="margin:22px 0 10px">' + t("ruPanel") + "</div>" +
        '<div class="chips" style="margin-bottom:18px">' +
          panels.map(function (pn) {
            var n = pn.refs.filter(function (r) { return saved[r.id] != null; }).length;
            return '<button class="chip ' + (pn.id === ruPanel ? "on" : "") + '" data-panel="' + pn.id + '">' +
              V.icon(pn.icon) + t(pn.key) + (n ? ' <b style="margin-left:2px">· ' + n + "</b>" : "") + "</button>";
          }).join("") +
        "</div>" +

        '<div class="section-head"><h3>' + t(panel.key) + '</h3>' +
          '<small><button id="fillBtn" style="color:var(--green);font-weight:600">' + t("ruFill") + "</button></small></div>" +
        panel.refs.map(function (r) {
          var prev = saved[r.id];
          var st = prev != null ? V.labStatus(r, prev) : null;
          var dot = st ? '<span class="sev ' + (st === "good" ? "good" : st === "high" ? "high" : "medium") + '" style="font-size:12px;margin-left:8px">●</span>' : "";
          return '<div class="lab-row"><label>' + L(r.name) + dot + "<small>" + t("ruNormRange") + ": " + rangeText(r) + "</small></label>" +
            '<input type="number" inputmode="decimal" data-lab="' + r.id + '" placeholder="' + r.demo + '" value="' + (prev != null ? prev : "") + '"></div>';
        }).join("") +

        '<button class="btn btn-primary" id="analyzeBtn" style="width:100%;margin:14px 0 8px">' + V.icon("sparkle") + " " + t("ruAnalyze") + "</button>" +

        '<div id="ruResult">' + (hasResult ? resultBlock() : "") + "</div>" +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("home"); });
        each("[data-panel]", function (b) {
          b.addEventListener("click", function () {
            captureInputs();           // keep what was typed before switching
            ruPanel = b.getAttribute("data-panel");
            V.render();
          });
        });
        var fill = $("#fillBtn");
        if (fill) fill.addEventListener("click", function (e) {
          e.preventDefault();
          each("[data-lab]", function (inp) {
            var r = refById(inp.getAttribute("data-lab"));
            if (r) inp.value = r.demo;
          });
        });
        $("#analyzeBtn").addEventListener("click", function () {
          captureInputs();
          var values = (V.state.labResults[0] && V.state.labResults[0].values) || {};
          if (!Object.keys(values).length) {
            // nothing anywhere → demo-fill the open panel so the flow always works
            panel.refs.forEach(function (r) { values[r.id] = r.demo; });
            var box0 = root.querySelectorAll("[data-lab]");
            box0.forEach(function (inp) { var r = refById(inp.getAttribute("data-lab")); if (r) inp.value = r.demo; });
          }
          applyResults(values);
          V.state.labResults = [{ date: V.todayISO(), values: values }];
          V.save();
          var box = $("#ruResult");
          box.innerHTML = resultBlock();
          box.scrollIntoView({ behavior: "smooth", block: "start" });
          if (V.api.aiOn()) {
            var sumEl = $("#ruSummary");
            if (sumEl) sumEl.textContent = (V.lang() === "ka" ? "VITA კითხულობს შედეგებს…" : "VITA is reading your results…");
            var entered = allRefs.filter(function (r) { return values[r.id] != null; });
            V.api.interpret(values, entered).then(function (txt) {
              var el = $("#ruSummary");
              if (el && txt) el.textContent = txt;
            }).catch(function () {});
          }
        });
      }}
    );

    // read current panel inputs into the saved values object (merge across panels)
    function captureInputs() {
      var rec = V.state.labResults[0] || { date: V.todayISO(), values: {} };
      root.querySelectorAll("[data-lab]").forEach(function (inp) {
        var id = inp.getAttribute("data-lab");
        var raw = inp.value.trim();
        if (raw === "") { delete rec.values[id]; return; }
        var v = parseFloat(raw);
        if (!isNaN(v)) rec.values[id] = v;
      });
      V.state.labResults = [rec];
      V.save();
    }

    function uploadOpt(icon, title, sub) {
      return '<button class="upload-opt">' + V.iconBox(icon, "green") +
        "<div><b>" + title + "</b><small>" + sub + "</small></div></button>";
    }

    function resultBlock() {
      var vals = (V.state.labResults[0] && V.state.labResults[0].values) || {};
      var flags = 0, total = 0;
      var groups = panels.map(function (pn) {
        var rows = pn.refs.filter(function (r) { return vals[r.id] != null; }).map(function (r) {
          var v = vals[r.id]; total++;
          var st = V.labStatus(r, v);
          if (st === "high" || st === "low") flags++;
          var sevCls = st === "good" ? "good" : st === "high" ? "high" : "medium";
          var lbl = st === "good" ? t("normal") : st === "high" ? t("high") : t("low");
          return '<div class="result-item">' + V.iconBox(pn.icon, st === "good" ? "green" : "pink") +
            '<div class="result-item__t"><b>' + L(r.name) + "</b><small>" + t("ruNormRange") + ": " + rangeText(r) + "</small></div>" +
            '<div style="text-align:right"><div class="result-item__v">' + v + "</div>" +
            '<span class="sev ' + sevCls + '" style="font-size:12.5px">' + lbl + "</span></div></div>";
        }).join("");
        if (!rows) return "";
        return '<div class="med-when" style="margin-top:14px">' + t(pn.key) + "</div>" + rows;
      }).join("");

      if (!total) return "";
      var summary = V.lang() === "ka"
        ? (flags ? total + " მაჩვენებლიდან " + flags + " ნორმის გარეთაა — გეგმა და მედიკამენტები შესაბამისად განახლდა." : "ყველა " + total + " მაჩვენებელი ნორმაშია — შესანიშნავია!")
        : (flags ? flags + " of " + total + " values are outside the normal range — your plan and medications were updated accordingly." : "All " + total + " values are within range — great work!");
      return '<div class="list-card" style="margin-top:20px;padding:18px">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">' + V.logoBadge(30) +
          "<b style='font-size:17px'>" + t("ruResult") + "</b></div>" +
        '<p class="s-sub" id="ruSummary" style="margin:4px 0 4px">' + summary + "</p>" +
        groups +
        '<div class="tag green" style="margin-top:16px">' + V.icon("check") + " " + t("ruUpdated") + "</div>" +
        "</div>";
    }

    function applyResults(v) {
      var p = V.state.profile;
      function add(arr, id) { if (arr.indexOf(id) < 0) arr.push(id); }
      function drop(arr, id) { var i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); }
      if (v.glucose != null || v.hba1c != null) {
        if ((v.glucose || 0) > 99 || (v.hba1c || 0) > 5.6) add(p.conditions, "pre");
      }
      if (v.ldl != null || v.trig != null) {
        if ((v.ldl || 0) > 100 || (v.trig || 0) > 150) add(p.conditions, "chol");
      }
      if (v.sys != null && (v.sys > 130 || (v.dia || 0) > 85)) add(p.conditions, "hyper");
      if (v.tsh != null && (v.tsh < 0.4 || v.tsh > 4.0)) add(p.conditions, "thyroid");
      // reflect new weight/waist into profile if metabolic entered
      if (v.waist != null) p.waist = v.waist;
      // keep "none" from lingering once a real diagnosis exists
      if (p.conditions.length > 1) drop(p.conditions, "none");
    }
  };
})();
