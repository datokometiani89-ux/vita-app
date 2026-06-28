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
            '<div style="display:flex;gap:8px;align-items:center">' +
              '<button class="pts-chip" data-rewards aria-label="' + t("rwTitle") + '">' + V.icon("sparkle") + (V.state.points || 0) + "</button>" +
              '<button class="icon-box gray" data-menu aria-label="' + t("menuTitle") + '">' + V.icon("grid") + "</button>" +
            "</div>" +
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
        (V.scanHomeCard ? '<div class="kicker" style="margin:22px 0 10px">' + t("scnTitle") + "</div>" + V.scanHomeCard() : "") +
        (V.todayMini ? '<div class="kicker" style="margin:22px 0 10px">' + t("todayK") + "</div>" + V.todayMini() : "") +
        (V.moodHomeCard ? V.moodHomeCard() : "") +
        (V.stepsHomeCard ? V.stepsHomeCard() : "") +
        (V.foodHomeCard ? V.foodHomeCard() : "") +
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
        var rw = $("[data-rewards]");
        if (rw) rw.addEventListener("click", function () { V.go("rewards"); });
        var ns = $("[data-next-screening]");
        if (ns) ns.addEventListener("click", function () { V.go("annual"); });
        if (V.wireScanHome) V.wireScanHome();
        if (V.wireTodayMini) V.wireTodayMini();
        if (V.wireMoodHome) V.wireMoodHome();
        if (V.wireStepsHome) V.wireStepsHome();
        if (V.wireFoodHome) V.wireFoodHome();
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
          V.avatar(48) +
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

        '<div class="section-head"><h3>' + t("plTasks") + '</h3><small>' + done.length + "/" + tasks.length + " · " +
          '<span style="color:#B98A1B">' + ((tasks.length - done.length) * V.POINTS.task) + " " + t("rwPoints") + " " + t("plPtsLeft") + "</span></small></div>" +
        '<div class="track"><span style="width:' + pct + '%"></span></div>' +
        tasks.map(function (tk) {
          var d = done.indexOf(tk.id) >= 0;
          var lg = (V.state.taskLogs[today] || {})[tk.id];
          var jt = { phys: "cross", mental: "stetho", nutrition: "vitamin", skin: "capsule", oral: "syringe" }[tk.cat] || "cross";
          return '<div class="task ' + (d ? "done" : "") + '">' +
            '<button class="task__box" data-toggle="' + tk.id + '">' + V.icon("check") + "</button>" +
            V.jelly(jt, 30, "task__jelly") +
            '<span class="task__t">' + L(tk.label) + "</span>" +
            (lg && lg.photo ? '<img class="task__thumb" src="' + lg.photo + '" alt="">' : "") +
            '<button class="task__log ' + (lg ? "on" : "") + '" data-log="' + tk.id + '" title="' + t("logTitle") + '">' +
              V.icon(lg ? "check" : "camera") + "</button>" +
            '<span class="pts-badge ' + (d ? "earned" : "") + '">' + (d ? "✓ " : "+") + V.POINTS.task + "</span></div>";
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
            if (i >= 0) arr.splice(i, 1); else { arr.push(id); V.awardOnce("task:" + id, V.POINTS.task, "task"); }
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
            if (i >= 0) arr.splice(i, 1); else { arr.push(id); V.awardOnce("med:" + id, V.POINTS.med, "med"); }
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
      '<span class="pts-badge ' + (d ? "earned" : "") + '">' + (d ? "✓ " : "+") + V.POINTS.med + "</span>" +
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
    // context-aware quick replies derived from the user's actual focus areas
    var lng = V.lang(), pick = function (o) { return o[lng] || o.en; };
    var concernQ = {
      sugar:  { ka: "შაქარი როგორ დავწიო?", en: "Lower my blood sugar" },
      weight: { ka: "წონაში ჩამოვიდე", en: "Help me lose weight" },
      energy: { ka: "ენერგია მაკლია", en: "I have low energy" },
      heart:  { ka: "გული გავიჯანსაღო", en: "Improve my heart health" },
      chol:   { ka: "ქოლესტერინი დავწიო", en: "Lower my cholesterol" },
      mental: { ka: "სტრესი და ძილი", en: "Stress & sleep" },
      skin:   { ka: "კანის მოვლა", en: "Skincare tips" },
    };
    var conc = (V.concerns ? V.concerns() : []).map(function (c) { return concernQ[c.id]; }).filter(Boolean);
    var quicks = (conc.length ? conc : [concernQ.sugar, concernQ.weight, concernQ.energy, concernQ.skin]).slice(0, 4).map(pick);
    var hasUserMsg = V.state.chat.some(function (m) { return m.role === "user"; });

    V.mount(
      V.statusbar() +
      '<div class="screen" style="overflow:hidden">' +
        '<div class="chat-head">' + V.logoBadge(42) +
          "<div><b>" + t("chTitle") + "</b><small>" + (V.api.aiOn()
            ? (V.lang() === "ka" ? (V.api.provider() === "gemini" ? "Gemini-ით გაძლიერებული" : "Claude-ით გაძლიერებული")
                                 : "Powered by " + (V.api.provider() === "gemini" ? "Gemini" : "Claude"))
            : t("chSub")) + "</small></div>" +
          (V.state.chat.length > 1 ? '<button class="icon-box gray" data-newchat aria-label="' + t("chNew") + '">' + V.icon("edit") + "</button>" : "") +
          '<button class="icon-box gray" data-open-settings>' + V.icon("settings") + "</button></div>" +
        (V.api.aiOn() ? "" : '<div class="chat-hint">' + V.icon("info") + " " + t("chOffline") + "</div>") +
        '<div class="chat-body" id="chatBody">' +
          V.state.chat.map(msgHTML).join("") +
        "</div>" +
        (hasUserMsg ? "" : '<div class="quick-row" id="quicks">' +
          quicks.map(function (q) { return '<button class="quick" data-q="' + esc(q) + '">' + esc(q) + "</button>"; }).join("") +
        "</div>") +
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
          var qr = $("#quicks"); if (qr) qr.remove(); // quick replies are first-message only
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
            var reply = (full || acc || "").trim();
            if (!reply) { if (bubble) bubble.remove(); var ty = $("#typing"); if (ty) ty.remove(); mockReply(text); return; }
            if (bubble) bubble.removeAttribute("id");
            V.state.chat.push({ role: "vita", text: reply });
            V.save();
          }, function () { /* error event — rejects the promise → catch below */ })
          .catch(function () {
            // backend failed / AI errored mid-stream → offline reply
            if (bubble) { bubble.remove(); }
            var ty = $("#typing"); if (ty) ty.remove();
            mockReply(text);
          });
        }
        $("#chatSend").addEventListener("click", function () { send(); });
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
        each("[data-q]", function (b) { b.addEventListener("click", function () { send(b.getAttribute("data-q")); }); });
        var nc = $("[data-newchat]");
        if (nc) nc.addEventListener("click", function () {
          if (!confirm(t("chNewConfirm"))) return;
          V.state.chat = []; V.save(); V.render();
        });
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

    // ---- real logged data → tappable dashboard cards ----
    var streak = countStreak();
    var totalDone = Object.keys(V.state.doneTasks).reduce(function (a, k) { return a + V.state.doneTasks[k].length; }, 0);
    var ws = V.state.wellness || {};
    var moodStreak = V.moodStreak ? V.moodStreak() : 0;
    var screenPct = V.screeningProgress ? V.screeningProgress().pct : 0;
    var sleepArr = ws.sleep || [];
    var sleepAvg = sleepArr.length ? Math.round(sleepArr.slice(-7).reduce(function (a, x) { return a + x.hours; }, 0) / Math.min(7, sleepArr.length) * 10) / 10 : null;
    var gardenStage = V.companionStage ? V.companionStage() : 0;
    var moodDates = Object.keys(ws.mood || {}).sort().slice(-14);
    var r = V.readiness ? V.readiness() : null;
    var bpLast = (ws.bp || []).slice(-1)[0];
    var hrLast = (ws.hr || []).slice(-1)[0];

    function pgCard(icon, tone, value, label, route) {
      return '<button class="pg-card" data-go="' + route + '">' + V.iconBox(icon, tone) +
        '<span class="pg-card__t"><b>' + value + "</b><small>" + label + "</small></span></button>";
    }
    var cards = [];
    if (r) cards.push(pgCard("bolt", r.band.tone, r.score, t("rdTitle"), "readiness"));
    cards.push(pgCard("flame", "crimson", streak, t("pgStreakDays"), "plan"));
    cards.push(pgCard("smile", "yellow", "🔥 " + moodStreak, t("moStreak"), "mood"));
    cards.push(pgCard("walk", "pink", t("quS" + gardenStage), t("quTitle"), "quests"));
    cards.push(pgCard("shield", "blue", screenPct + "%", t("scRecCount"), "annual"));
    if (sleepAvg != null) cards.push(pgCard("moon", "blue", sleepAvg + t("slHours"), t("slAvg"), "sleep"));
    if (bpLast) cards.push(pgCard("drop", "crimson", bpLast.sys + "/" + bpLast.dia, t("bpTitle"), "bplog"));
    if (hrLast) cards.push(pgCard("heart", "crimson", String(hrLast.bpm), t("hrTitle"), "heartrate"));
    cards.push(pgCard("check", "green", totalDone, t("pgTasksDone"), "plan"));

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head">' + V.logoBadge(34) + "<h1>" + t("pgTitle") + "</h1></div>" +
        '<p class="s-sub">' + t("pgDesc") + "</p>" +

        '<div class="kicker" style="margin:6px 0 10px">' + t("pgWellness") + "</div>" +
        '<div class="pg-grid">' + cards.join("") + "</div>" +

        '<div class="chart-card"><h3>' + t("pgScore") + "</h3>" +
          '<div class="cap">' + sSeries[0] + " → " + sSeries[weeks - 1] + " · " + t("pgWeek") + " 1–" + weeks + "</div>" +
          barChart(sSeries) + "</div>" +

        '<div class="chart-card"><h3>' + t("pgWeight") + "</h3>" +
          '<div class="cap">' + startW + t("kg") + " → " + curW + t("kg") + "  ·  " + t("target") + " " + tgtW + t("kg") + "</div>" +
          lineChart(wSeries, "#27AE60", tgtW) + "</div>" +

        (moodDates.length ? '<div class="chart-card"><h3>' + t("pgMoodTrend") + "</h3>" +
          moodChart(moodDates, ws.mood) + "</div>" : "") +

        (sleepArr.length ? '<div class="chart-card"><h3>' + t("pgSleepTrend") + "</h3>" +
          '<div class="cap">' + sleepAvg + t("slHours") + " · " + t("slAvg") + "</div>" +
          sleepChart(sleepArr.slice(-7)) + "</div>" : "") +
      "</div>" +
      V.tabbar("progress") +
      "</div>",
      { onMount: function () {
        each("[data-go]", function (b) { b.addEventListener("click", function () { V.go(b.getAttribute("data-go")); }); });
      }}
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

  // faint horizontal gridlines
  function chGrid(w, top, bot, padX) {
    return [0.25, 0.5, 0.75].map(function (f) {
      var gy = top + f * (bot - top);
      return '<line x1="' + padX + '" y1="' + gy + '" x2="' + (w - padX) + '" y2="' + gy + '" stroke="var(--line)" stroke-width="1" opacity=".5"/>';
    }).join("");
  }

  function lineChart(series, color, targetVal) {
    var w = 320, h = 156, padX = 16, padTop = 22, padBot = 16;
    var min = Math.min.apply(null, series.concat([targetVal])) - 1.5;
    var max = Math.max.apply(null, series.concat([targetVal])) + 1.5;
    var sx = function (i) { return padX + (i / (series.length - 1)) * (w - 2 * padX); };
    var sy = function (v) { return padTop + (1 - (v - min) / (max - min)) * (h - padTop - padBot); };
    var pts = series.map(function (v, i) { return { x: sx(i), y: sy(v) }; });
    var d = "M" + pts[0].x + "," + pts[0].y;
    for (var i = 0; i < pts.length - 1; i++) { var cx = (pts[i].x + pts[i + 1].x) / 2; d += " C" + cx + "," + pts[i].y + " " + cx + "," + pts[i + 1].y + " " + pts[i + 1].x + "," + pts[i + 1].y; }
    var area = d + " L" + pts[pts.length - 1].x + "," + (h - padBot) + " L" + pts[0].x + "," + (h - padBot) + " Z";
    var ty = sy(targetVal), last = pts[pts.length - 1], first = pts[0];
    return '<svg viewBox="0 0 ' + w + " " + h + '" class="ln-chart">' +
      '<defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".22"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      chGrid(w, padTop, h - padBot, padX) +
      '<path d="' + area + '" fill="url(#lg)"/>' +
      '<line x1="' + padX + '" y1="' + ty + '" x2="' + (w - padX) + '" y2="' + ty + '" stroke="' + color + '" stroke-width="1.3" stroke-dasharray="4 4" opacity=".55"/>' +
      '<text x="' + (w - padX) + '" y="' + (ty - 5) + '" text-anchor="end" class="ch-ax">' + t("target") + " " + targetVal + "</text>" +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + last.x + '" cy="' + last.y + '" r="9" fill="' + color + '" opacity=".18"/><circle cx="' + last.x + '" cy="' + last.y + '" r="4.5" fill="' + color + '"/>' +
      '<circle cx="' + first.x + '" cy="' + first.y + '" r="3.2" fill="' + color + '" opacity=".55"/>' +
      '<text x="' + last.x + '" y="' + (last.y - 12) + '" text-anchor="end" class="ch-val" fill="' + color + '">' + series[series.length - 1] + "</text>" +
      "</svg>";
  }

  function barChart(series) {
    var w = 320, h = 156, padX = 16, padTop = 22, padBot = 18, n = series.length, max = 100;
    var bw = (w - 2 * padX) / n * 0.58;
    return '<svg viewBox="0 0 ' + w + " " + h + '" class="bar-chart">' + chGrid(w, padTop, h - padBot, padX) +
      series.map(function (v, i) {
        var x = padX + (i + 0.5) * ((w - 2 * padX) / n) - bw / 2;
        var bh = (v / max) * (h - padTop - padBot), y = h - padBot - bh;
        var col = v >= 71 ? "#27AE60" : v >= 41 ? "#F2B83B" : "#ED2E7E";
        var lbl = (i === 0 || i === n - 1) ? '<text x="' + (x + bw / 2) + '" y="' + (y - 6) + '" text-anchor="middle" class="ch-val" fill="' + col + '">' + v + "</text>" : "";
        var ax = (i === 0 || i === n - 1) ? '<text x="' + (x + bw / 2) + '" y="' + (h - 5) + '" text-anchor="middle" class="ch-ax">' + t("pgWeek").charAt(0) + (i + 1) + "</text>" : "";
        return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="5" fill="' + col + '" opacity="' + (0.6 + 0.4 * (i / n)) + '"/>' + lbl + ax;
      }).join("") +
      "</svg>";
  }

  var CH_TONE = { green: "#2BA94C", blue: "#4a90d9", yellow: "#e6b800", crimson: "#e8536b" };
  function moodChart(dates, moodMap) {
    var w = 320, h = 150, padX = 16, padTop = 14, padBot = 18, n = dates.length;
    var bw = (w - 2 * padX) / n * 0.62;
    var scores = dates.map(function (iso) { return moodMap[iso].score || 1; });
    var avg = scores.reduce(function (a, b) { return a + b; }, 0) / scores.length;
    var avgY = padTop + (1 - avg / 5) * (h - padTop - padBot);
    var bars = dates.map(function (iso, i) {
      var sc = moodMap[iso].score || 1, m = V.MOODS[sc - 1];
      var bh = (sc / 5) * (h - padTop - padBot), y = h - padBot - bh;
      var x = padX + (i + 0.5) * ((w - 2 * padX) / n) - bw / 2;
      var ax = (i % 3 === 0 || i === n - 1) ? '<text x="' + (x + bw / 2) + '" y="' + (h - 5) + '" text-anchor="middle" class="ch-ax">' + iso.slice(8) + "</text>" : "";
      return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="4" fill="' + (CH_TONE[m.tone] || CH_TONE.green) + '"/>' + ax;
    }).join("");
    return '<svg viewBox="0 0 ' + w + " " + h + '" class="bar-chart">' + bars +
      '<line x1="' + padX + '" y1="' + avgY + '" x2="' + (w - padX) + '" y2="' + avgY + '" stroke="var(--muted)" stroke-dasharray="4 4" stroke-width="1.2" opacity=".6"/>' +
      '<text x="' + (w - padX) + '" y="' + (avgY - 5) + '" text-anchor="end" class="ch-ax">' + t("chAvg") + " " + (Math.round(avg * 10) / 10) + "</text>" +
      "</svg>";
  }

  function sleepChart(arr) {
    var w = 320, h = 150, padX = 16, padTop = 14, padBot = 18, n = arr.length, max = 10;
    var bw = (w - 2 * padX) / n * 0.62;
    var bandTop = padTop + (1 - 9 / max) * (h - padTop - padBot), bandBot = padTop + (1 - 7 / max) * (h - padTop - padBot);
    var bars = arr.map(function (s, i) {
      var hrs = Math.min(s.hours, max), bh = (hrs / max) * (h - padTop - padBot), y = h - padBot - bh;
      var x = padX + (i + 0.5) * ((w - 2 * padX) / n) - bw / 2;
      var col = s.hours < 6 ? CH_TONE.crimson : s.hours < 7 ? CH_TONE.yellow : CH_TONE.blue;
      return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="4" fill="' + col + '"/>' +
        '<text x="' + (x + bw / 2) + '" y="' + (h - 5) + '" text-anchor="middle" class="ch-ax">' + s.date.slice(8) + "</text>";
    }).join("");
    return '<svg viewBox="0 0 ' + w + " " + h + '" class="bar-chart">' +
      '<rect x="' + padX + '" y="' + bandTop + '" width="' + (w - 2 * padX) + '" height="' + (bandBot - bandTop) + '" fill="' + CH_TONE.blue + '" opacity=".09"/>' +
      bars + "</svg>";
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
    var streak = V.waterStreak ? V.waterStreak() : 0;

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
            (V.state.profile && V.state.profile.weight ? '<div class="water-goalnote">' + t("waterGoalNote") + "</div>" : "") +
            (streak > 0 ? '<div class="tag green" style="margin-top:10px">' + V.icon("bolt") + " " + t("waterStreak", { n: streak }) + "</div>"
              : ml >= goal ? '<div class="tag green" style="margin-top:10px">' + t("waterGoalHit") + "</div>" : "") +
          "</div>" +
        "</div>" +

        '<div class="water-presets">' +
          [[200, "wpCup"], [250, "wpGlass"], [500, "wpBottle"]].map(function (p) {
            return '<button class="water-preset" data-water="' + p[0] + '">' + V.icon("drop") + "<b>" + p[0] + "</b><span>" + t(p[1]) + "</span></button>";
          }).join("") +
          '<button class="water-preset" data-watercustom>' + V.icon("plus") + "<span>" + t("wpCustom") + "</span></button>" +
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
        var cu = $("[data-watercustom]");
        if (cu) cu.addEventListener("click", function () {
          var v = prompt(t("wpCustomPrompt"));
          var n = parseInt(v, 10);
          if (n && n > 0) { V.waterAdd(Math.min(2000, n)); V.render(); }
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
        (pct > 1 && pct < 100 ?
          '<path d="M-40 ' + fillY + ' q 20 -5 40 0 t 40 0 t 40 0 t 40 0 v 30 h -160 Z" fill="#8FD4F0" opacity=".55">' +
            '<animateTransform attributeName="transform" type="translate" from="0 0" to="80 0" dur="2.4s" repeatCount="indefinite"/></path>' : "") +
        '<ellipse cx="40" cy="' + fillY + '" rx="42" ry="5" fill="#A7E0F5" opacity=".7"/>' +
      "</g>" +
      '<path d="M28 8 h24 v10 q12 6 12 22 v66 q0 10 -12 10 h-24 q-12 0 -12 -10 v-66 q0 -16 12 -22 Z" fill="none" stroke="var(--line)" stroke-width="2.5"/>' +
      '<rect x="31" y="2" width="18" height="7" rx="2" fill="var(--line)"/>' +
      "</svg>";
  }

  /* ===================== CLINICS (finder + booking) ===================== */
  var clinicCtx = null, clinicSort = "rating";
  V.openClinics = function (checkupId, title) {
    clinicCtx = { checkupId: checkupId, category: V.checkupCategory(checkupId), title: title };
    clinicSort = "rating";
    V.go("clinics");
  };
  V.screens.clinics = function () {
    if (!clinicCtx) clinicCtx = { checkupId: "general", category: "medical", title: { ka: "ზოგადი ანალიზები", en: "General panel" } };
    var res = V.clinicsFor(clinicCtx.category, clinicSort);

    function clinicCard(c) {
      return '<div class="clinic">' +
        '<div class="clinic__top"><div class="clinic__t"><b>' + esc(c.name) + "</b>" +
          '<small>' + L(c.district) + " · " + esc(c.address) + "</small></div>" +
          '<span class="clinic__rate">★ ' + c.rating.toFixed(1) + "</span></div>" +
        '<div class="clinic__meta">' +
          '<span>' + V.icon("location") + " " + c.distance + " " + t("clKm") + "</span>" +
          '<span>' + (c.priceFrom ? "₾" + c.priceFrom + " " + t("clFrom") : t("clFree")) + "</span>" +
        "</div>" +
        '<div class="clinic__act">' +
          '<a class="clinic__call" href="tel:' + c.phone + '">' + V.icon("bell") + " " + t("clCall") + "</a>" +
          '<button class="btn btn-primary clinic__book" data-book=\'' + JSON.stringify({ id: c.id, name: c.name, phone: c.phone }).replace(/'/g, "&#39;") + '\' style="padding:11px 22px;font-size:15px">' + t("clBook") + "</button>" +
        "</div></div>";
    }

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("clTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + L(clinicCtx.title) + " · " + t("clDesc") + "</p>" +
        '<div class="seg" style="margin-bottom:16px">' +
          ["rating", "price", "distance"].map(function (s) {
            return '<button data-sort="' + s + '" class="' + (clinicSort === s ? "on" : "") + '">' + t(s === "rating" ? "clSortRating" : s === "price" ? "clSortPrice" : "clSortDist") + "</button>";
          }).join("") +
        "</div>" +
        res.items.map(clinicCard).join("") +
        '<a class="set-link" href="' + res.vitaUrl + '" target="_blank" rel="noopener" style="justify-content:center;border:0;color:var(--green-dark);font-weight:600;margin-top:6px">' + V.icon("globe") + " " + t("clViewSite") + "</a>" +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("checkup"); });
        each("[data-sort]", function (b) { b.addEventListener("click", function () { clinicSort = b.getAttribute("data-sort"); V.render(); }); });
        each("[data-book]", function (b) {
          b.addEventListener("click", function () { openBookSheet(JSON.parse(b.getAttribute("data-book"))); });
        });
      }}
    );

    function openBookSheet(clinic) {
      var phone = root.querySelector(".phone");
      var def = new Date(); def.setDate(def.getDate() + 3);
      var defISO = def.getFullYear() + "-" + String(def.getMonth() + 1).padStart(2, "0") + "-" + String(def.getDate()).padStart(2, "0");
      var times = ["09:00", "11:00", "14:00", "16:00"];
      phone.insertAdjacentHTML("beforeend",
        '<div class="sheet-overlay on" id="bkSheet"><div class="sheet">' +
        '<div class="sheet__grab"></div><h3>' + esc(clinic.name) + "</h3>" +
        '<p class="s-sub" style="margin-bottom:14px">' + t("clPick") + "</p>" +
        '<div class="field"><input type="date" id="bkDate" value="' + defISO + '"></div>' +
        '<div class="chips" id="bkTimes" style="margin-bottom:16px">' + times.map(function (tm, i) { return '<button class="chip ' + (i === 1 ? "on" : "") + '" data-time="' + tm + '">' + tm + "</button>"; }).join("") + "</div>" +
        '<p class="cal-note" style="text-align:left;margin:0 0 14px">' + t("clManualNote") + "</p>" +
        '<button class="btn btn-primary" id="bkConfirm" style="width:100%">' + t("clConfirm") + "</button>" +
        "</div></div>");
      var sheet = root.querySelector("#bkSheet");
      var time = "11:00";
      sheet.addEventListener("click", function (e) { if (e.target === sheet) sheet.remove(); });
      each("#bkTimes .chip", function (c) { c.addEventListener("click", function () {
        each("#bkTimes .chip", function (x) { x.classList.remove("on"); }); c.classList.add("on"); time = c.getAttribute("data-time");
      }); });
      $("#bkConfirm").addEventListener("click", function () {
        V.book(clinicCtx.checkupId, clinic, $("#bkDate").value, time, clinicCtx.title);
        sheet.remove();
        V.go("visits");
      });
    }
  };

  /* ===================== MY VISITS ===================== */
  V.screens.visits = function () {
    var bookings = (V.state.bookings || []).slice().sort(function (a, b) { return (a.date || "").localeCompare(b.date || ""); });

    function visitCard(b) {
      var attended = b.status === "attended";
      return '<div class="visit ' + (attended ? "done" : "") + '">' +
        '<div class="visit__top">' + V.iconBox(attended ? "check" : "calendar", attended ? "green" : "blue") +
          '<div class="visit__t"><b>' + L(b.title || { ka: "ვიზიტი", en: "Visit" }) + "</b><small>" + esc(b.clinic) + " · " + (b.date || "") + " " + (b.time || "") + "</small></div>" +
          '<span class="tag ' + (attended ? "green" : "blue") + '">' + t(attended ? "vsAttended" : "vsPlanned") + "</span></div>" +
        '<div class="visit__act">' +
          (attended
            ? '<button class="btn btn-primary" data-upload="' + b.checkupId + '" style="flex:1;padding:11px;font-size:15px">' + V.icon("upload") + " " + t("vsUpload") + "</button>"
            : '<button class="btn btn-primary" data-attend="' + b.id + '" style="flex:1;padding:11px;font-size:15px">' + V.icon("check") + " " + t("vsAttend") + "</button>") +
          '<button class="visit__cancel" data-cancel="' + b.id + '">' + V.icon("x") + "</button>" +
        "</div></div>";
    }

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("visitsTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("visitsDesc") + "</p>" +
        (bookings.length ? bookings.map(visitCard).join("")
          : '<div class="empty-state"><div class="empty-ic">' + V.iconBox("calendar", "green") + "</div>" +
            '<p class="cal-note">' + t("vsNone") + "</p>" +
            '<button class="btn btn-primary" data-tocheckup style="margin-top:8px">' + t("vsBook") + "</button></div>") +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("home"); });
        var tc = $("[data-tocheckup]");
        if (tc) tc.addEventListener("click", function () { V.go("checkup"); });
        each("[data-attend]", function (b) { b.addEventListener("click", function () { V.confirmVisit(b.getAttribute("data-attend")); V.render(); }); });
        each("[data-cancel]", function (b) { b.addEventListener("click", function () { V.cancelVisit(b.getAttribute("data-cancel")); V.render(); }); });
        each("[data-upload]", function (b) {
          b.addEventListener("click", function () {
            var cat = V.checkupCategory(b.getAttribute("data-upload"));
            var panel = { medical: "general", dental: "dental", mental: "mental", aesthetic: "skin" }[cat] || "general";
            if (V.setResultsPanel) V.setResultsPanel(panel);
            V.go("results");
          });
        });
      }}
    );
  };

  /* ===================== CALENDAR (month view) ===================== */
  var calY = null, calM = null, calSel = null;
  V.screens.calendar = function () {
    var now = new Date();
    if (calY == null) { calY = now.getFullYear(); calM = now.getMonth() + 1; }
    var ev = V.calendarEvents(calY, calM);
    var todayISO = V.todayISO();
    var first = new Date(calY, calM - 1, 1);
    var startPad = (first.getDay() + 6) % 7;       // Mon=0
    var daysIn = new Date(calY, calM, 0).getDate();
    var cells = [];
    for (var i = 0; i < startPad; i++) cells.push(null);
    for (var d = 1; d <= daysIn; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);

    function cell(d) {
      if (d == null) return '<div class="cal-cell empty"></div>';
      var iso = calY + "-" + String(calM).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      var evs = ev[iso] || [];
      var isToday = iso === todayISO, isSel = iso === calSel;
      var dots = evs.slice(0, 3).map(function (e) { return '<i style="background:' + e.color + '"></i>'; }).join("");
      return '<button class="cal-cell ' + (isToday ? "today " : "") + (isSel ? "sel " : "") + (evs.length ? "has" : "") + '" data-day="' + iso + '">' +
        "<span>" + d + "</span><div class='cal-dots'>" + dots + "</div></button>";
    }

    var selEvs = calSel ? (ev[calSel] || []) : [];

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("calTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("calDesc") + "</p>" +

        '<div class="cal-nav"><button class="cal-arrow" data-mn="-1">' + V.icon("back") + "</button>" +
          "<b>" + V.monthName(calM) + " " + calY + "</b>" +
          '<button class="cal-arrow" data-mn="1">' + V.icon("next") + "</button></div>" +

        '<div class="cal-grid cal-head">' + ["mon","tue","wed","thu","fri","sat","sun"].map(function (k) { return "<span>" + V.dayShort(k) + "</span>"; }).join("") + "</div>" +
        '<div class="cal-grid">' + cells.map(cell).join("") + "</div>" +

        '<div class="cal-legend-row">' +
          '<span><i style="background:var(--green)"></i>' + t("calLegendScreen") + "</span>" +
          '<span><i style="background:var(--green)"></i>' + t("calLegendVisit") + "</span>" +
          (V.state.profile.sex === "woman" ? '<span><i style="background:var(--pink)"></i>' + t("calLegendPeriod") + "</span><span><i style=\"background:var(--blue)\"></i>" + t("calLegendFertile") + "</span>" : "") +
        "</div>" +

        '<div class="section-head"><h3>' + (calSel ? (V.monthName(calM) + " " + parseInt(calSel.slice(8))) : t("calToday")) + "</h3></div>" +
        (selEvs.length ? '<div class="list-card">' + selEvs.map(function (e) {
          return '<div class="list-row"><span class="sc-dot" style="background:' + e.color + '"></span>' +
            '<div class="list-row__t"><b>' + L(e.label) + "</b></div></div>";
        }).join("") + "</div>" +
        '<div class="upload-grid" style="margin-top:12px">' +
          '<button class="upload-opt" data-gcal>' + V.iconBox("calendar", "blue") + "<div><b>" + t("calAddGoogle") + "</b></div></button>" +
          '<button class="upload-opt" data-ics>' + V.iconBox("upload", "green") + "<div><b>" + t("calAddIcs") + "</b></div></button>" +
        "</div>"
        : '<p class="cal-note">' + t("calNoEvents") + "</p>") +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("home"); });
        each("[data-mn]", function (b) {
          b.addEventListener("click", function () {
            calM += parseInt(b.getAttribute("data-mn"));
            if (calM < 1) { calM = 12; calY--; } else if (calM > 12) { calM = 1; calY++; }
            calSel = null; V.render();
          });
        });
        each("[data-day]", function (b) {
          b.addEventListener("click", function () { calSel = b.getAttribute("data-day"); V.render(); });
        });
        var g = $("[data-gcal]");
        if (g) g.addEventListener("click", function () {
          var e = selEvs[0];
          window.open(V.gcalLink("VITA: " + L(e.label), calSel), "_blank", "noopener");
        });
        var ics = $("[data-ics]");
        if (ics) ics.addEventListener("click", function () { V.features.exportICS(); });
      }}
    );
  };

  /* ===================== WOMEN'S CYCLE ===================== */
  var cycleView = null;   // {y, m} month being viewed in the calendar (persists across re-renders)
  V.screens.cycle = function () {
    var c = V.cycle();
    var info = V.cycleInfo();
    var today = V.todayISO();
    var todayLog = (c.logs && c.logs[today]) || [];
    var tip = V.cyclePhaseTip(info.phase);
    var hasData = Object.keys(c.periodDays).length > 0;
    var ka = V.lang() === "ka";

    function calendar() {
      if (!cycleView) { var n = new Date(today); cycleView = { y: n.getFullYear(), m: n.getMonth() }; }
      var y = cycleView.y, m = cycleView.m;
      var startDow = (new Date(y, m, 1).getDay() + 6) % 7;          // Monday-first
      var dim = new Date(y, m + 1, 0).getDate();
      var cells = "";
      for (var i = 0; i < startDow; i++) cells += '<span class="cal-cell cal-empty"></span>';
      for (var dd = 1; dd <= dim; dd++) {
        var iso = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(dd).padStart(2, "0");
        var type = V.cycleDayType(iso);
        cells += '<button class="cal-cell' + (type ? " cal-" + type : "") + (iso === today ? " cal-today" : "") + '" data-day="' + iso + '">' + dd + "</button>";
      }
      var dow = ka ? ["ორ", "სა", "ოთ", "ხუ", "პა", "შა", "კვ"] : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
      return '<div class="cal-card">' +
        '<div class="cal-head"><button class="cal-nav" data-mon="-1">' + V.icon("back") + "</button>" +
          "<b>" + V.monthName(m + 1) + " " + y + "</b>" +
          '<button class="cal-nav" data-mon="1">' + V.icon("next") + "</button></div>" +
        '<div class="cal-dow">' + dow.map(function (d) { return "<span>" + d + "</span>"; }).join("") + "</div>" +
        '<div class="cal-grid">' + cells + "</div>" +
        '<div class="cal-legend">' +
          '<span><i class="cal-lg cal-period"></i>' + t("cyLegPeriod") + "</span>" +
          '<span><i class="cal-lg cal-predPeriod"></i>' + t("cyLegPred") + "</span>" +
          '<span><i class="cal-lg cal-fertile"></i>' + t("cyLegFertile") + "</span>" +
          '<span><i class="cal-lg cal-ovulation"></i>' + t("cyLegOv") + "</span>" +
        "</div></div>";
    }

    var FLOWS = [["light", "cyFlowLight"], ["med", "cyFlowMed"], ["heavy", "cyFlowHeavy"]];

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("cyTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("cyDesc") + "</p>" +

        '<div class="cycle-card">' + cycleRing(info) + "</div>" +

        '<div class="cycle-pred">' +
          '<div class="cycle-pred__item"><span class="sc-dot" style="background:var(--pink)"></span>' +
            "<div><b>" + t("cyNextPeriod") + "</b><small>" + V.monthName(parseInt(info.nextDate.slice(5, 7))) + " " + parseInt(info.nextDate.slice(8)) + " · " + t("cyInDays", { n: info.nextIn }) + "</small></div></div>" +
          '<div class="cycle-pred__item"><span class="sc-dot" style="background:var(--blue)"></span>' +
            "<div><b>" + t("cyFertile") + "</b><small>" + t("cyDay") + " " + info.fertileStart + "–" + info.fertileEnd + "</small></div></div>" +
        "</div>" +

        (!hasData ? '<div class="cy-hint">' + V.icon("calendar") + "<span>" + t("cyTapHint") + "</span></div>" : "") +
        calendar() +

        '<div class="list-card" style="padding:14px 16px;margin:16px 0"><div style="display:flex;gap:10px;align-items:flex-start">' +
          V.iconBox("sparkle", "pink") + "<div><b style='display:block;font-size:15px'>" + t("cyTip") + "</b><small style='color:var(--muted);font-size:14px'>" + L(tip) + "</small></div></div></div>" +

        '<div class="section-head"><h3>' + t("cyDailyLog") + "</h3></div>" +
        '<p class="cy-sub2">' + t("cyFlow") + "</p>" +
        '<div class="chips">' + FLOWS.map(function (f) {
          return '<button class="chip ' + (c.flow[today] === f[0] ? "on" : "") + '" data-flow="' + f[0] + '">' + t(f[1]) + "</button>";
        }).join("") + "</div>" +
        '<p class="cy-sub2">' + t("cySymptoms") + "</p>" +
        '<div class="chips">' +
          V.cycleSymptoms().map(function (s) {
            return '<button class="chip ' + (todayLog.indexOf(s) >= 0 ? "on" : "") + '" data-sym="' + s + '">' + t(s) + "</button>";
          }).join("") +
        "</div>" +

        '<div class="section-head"><h3>' + t("cySettings") + "</h3></div>" +
        '<div class="field"><label>' + t("cyLen") + '</label><input id="cyLen" type="number" inputmode="numeric" value="' + (c.cycleLen || 28) + '"></div>' +
        '<div class="field"><label>' + t("cyPeriodLen") + '</label><input id="cyPlen" type="number" inputmode="numeric" value="' + (c.periodLen || 5) + '"></div>' +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("home"); });
        each("[data-day]", function (b) {
          b.addEventListener("click", function () { V.cycleToggleDay(b.getAttribute("data-day")); V.render(); });
        });
        each("[data-mon]", function (b) {
          b.addEventListener("click", function () {
            var d = +b.getAttribute("data-mon");
            var nm = cycleView.m + d, ny = cycleView.y;
            if (nm < 0) { nm = 11; ny--; } else if (nm > 11) { nm = 0; ny++; }
            cycleView = { y: ny, m: nm }; V.render();
          });
        });
        each("[data-flow]", function (b) {
          b.addEventListener("click", function () {
            var f = b.getAttribute("data-flow");
            c.flow[today] = c.flow[today] === f ? null : f; V.save(); V.render();
          });
        });
        each("[data-sym]", function (b) {
          b.addEventListener("click", function () {
            var s = b.getAttribute("data-sym");
            var arr = c.logs[today] = c.logs[today] || [];
            var i = arr.indexOf(s);
            if (i >= 0) arr.splice(i, 1); else arr.push(s);
            V.save(); b.classList.toggle("on");
          });
        });
        function saveLen() {
          var l = parseInt($("#cyLen").value) || 28, p = parseInt($("#cyPlen").value) || 5;
          c.cycleLen = Math.min(40, Math.max(20, l));
          c.periodLen = Math.min(10, Math.max(2, p));
          V.save();
        }
        $("#cyLen").addEventListener("change", function () { saveLen(); V.render(); });
        $("#cyPlen").addEventListener("change", function () { saveLen(); V.render(); });
      }}
    );
  };

  V.screens.sexhealth = function () {
    var topics = V.sexHealthTopics();
    var sexLabel = (V.state.profile.sex === "woman") ? { ka: "ქალის", en: "Women's" } : { ka: "მამაკაცის", en: "Men's" };
    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("shTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + L(sexLabel) + " · " + t("shDesc") + "</p>" +
        topics.map(function (x, i) {
          return '<div class="sh-card">' +
            '<div class="sh-card__h">' + V.iconBox(x.icon, x.tone) +
              "<div><b>" + L(x.title) + "</b><small>" + L(x.body) + "</small></div></div>" +
            (x.steps ? '<details class="sh-steps"><summary>' + V.icon("check") + " " + t("shHow") + "</summary><ol>" +
              L(x.steps).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></details>" : "") +
            (x.clinic ? '<button class="btn btn-ghost sh-book" data-book="' + i + '">' + V.icon("location") + " " + L(x.clinic.label) + "</button>" : "") +
          "</div>";
        }).join("") +
        '<p class="hr-multi-note">' + t("shDisc") + "</p>" +
      "</div>" + V.tabbar("home") + "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("home"); });
        each("[data-book]", function (b) {
          b.addEventListener("click", function () {
            var x = topics[+b.getAttribute("data-book")];
            if (V.openClinics) V.openClinics("general", x.clinic.label); else V.go("clinics");
          });
        });
      } }
    );
  };

  function cycleRing(info) {
    var R = 78, cx = 100, cy = 100, C = 2 * Math.PI * R;
    // phase segments as arc dashes
    var segs = [
      { from: 0, to: info.plen, color: "var(--pink)" },
      { from: info.plen, to: info.ovDay - 1, color: "var(--green)" },
      { from: info.ovDay - 1, to: info.ovDay + 1, color: "var(--blue)" },
      { from: info.ovDay + 1, to: info.len, color: "var(--yellow)" },
    ];
    var ring = segs.map(function (s) {
      var len = (s.to - s.from) / info.len * C;
      var off = -(s.from / info.len) * C;
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + s.color + '" stroke-width="14" ' +
        'stroke-dasharray="' + len + " " + (C - len) + '" stroke-dashoffset="' + off + '" transform="rotate(-90 ' + cx + " " + cy + ')"/>';
    }).join("");
    var ang = (info.day - 1) / info.len * 2 * Math.PI - Math.PI / 2;
    var mx = cx + R * Math.cos(ang), my = cy + R * Math.sin(ang);
    var phaseName = t("cyPhase" + info.phase.charAt(0).toUpperCase() + info.phase.slice(1));
    return '<svg viewBox="0 0 200 200" class="cycle-svg">' + ring +
      '<circle cx="' + mx + '" cy="' + my + '" r="9" fill="#fff" stroke="' + V.cyclePhaseColor(info.phase) + '" stroke-width="4"/>' +
      '<text x="100" y="92" text-anchor="middle" font-size="15" fill="var(--muted)">' + t("cyDay") + "</text>" +
      '<text x="100" y="120" text-anchor="middle" font-size="40" font-weight="800" fill="var(--ink)">' + info.day + "</text>" +
      '<text x="100" y="140" text-anchor="middle" font-size="13" fill="var(--muted)">/ ' + info.len + " " + t("cyOf") + "</text>" +
      "</svg>" +
      '<div class="cycle-phase" style="color:' + V.cyclePhaseColor(info.phase) + '">' + phaseName + "</div>";
  }

  /* ===================== REWARDS / ELEMENTS ===================== */
  V.screens.rewards = function () {
    var pts = V.state.points || 0;
    var life = V.state.lifetime || 0;
    var toNext = V.ELEMENT_EVERY - (life % V.ELEMENT_EVERY);
    var nextPct = Math.round((life % V.ELEMENT_EVERY) / V.ELEMENT_EVERY * 100);
    var elTotal = V.elementsTotal();
    var log = V.state.rewardLog || [];
    var reasonKey = { task: "rwReasonTask", med: "rwReasonMed", workout: "rwReasonWorkout", water: "rwReasonWater", booking: "rwReasonBooking", lab: "rwReasonLab" };

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("rwTitle") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("rwDesc") + "</p>" +

        '<div class="rw-balance">' +
          '<div class="rw-pts">' + pts + '<span> ' + t("rwPoints") + "</span></div>" +
          '<div class="rw-next"><div class="rw-next__row"><span>' + toNext + " " + t("rwPoints") + " " + t("rwNext") + "</span><span>" + elTotal + " 🧫</span></div>" +
            '<div class="rw-next__bar"><span style="width:' + nextPct + '%"></span></div></div>' +
        "</div>" +

        '<div class="section-head"><h3>' + t("rwElements") + "</h3></div>" +
        '<div class="rw-elements">' +
          V.ELEMENT_ORDER.map(function (type) {
            var n = (V.state.elements || {})[type] || 0;
            return '<div class="rw-el">' + V.jelly(type, 54, n ? "" : "dim") +
              '<b>' + n + "</b></div>";
          }).join("") +
        "</div>" +

        '<button class="btn btn-primary" data-redeem style="width:100%;margin:8px 0 4px">' + V.icon("sparkle") + " " + t("rwRedeem") + "</button>" +

        '<div class="section-head"><h3>' + t("rwHowTo") + "</h3></div>" +
        '<div class="list-card">' +
          [["task", "check"], ["water", "drop"], ["med", "pill"], ["workout", "bolt"], ["booking", "calendar"], ["lab", "flask"]].map(function (r) {
            return '<div class="list-row">' + V.iconBox(r[1], "gray") +
              '<div class="list-row__t"><b>' + t(reasonKey[r[0]] || "rwReasonTask") + "</b></div>" +
              '<span class="pts-badge earned">+' + V.POINTS[r[0]] + "</span></div>";
          }).join("") +
        "</div>" +

        '<div class="section-head"><h3>' + t("rwHistory") + "</h3></div>" +
        (log.length ? '<div class="list-card">' + log.slice(0, 12).map(function (e) {
          return '<div class="list-row"><span class="sc-dot" style="background:var(--green)"></span>' +
            '<div class="list-row__t"><b>' + t(reasonKey[e.reason] || "rwReasonTask") + "</b><small>" + e.date + "</small></div>" +
            '<span class="rw-plus">' + t("rwEarned", { n: e.pts }) + "</span></div>";
        }).join("") + "</div>" : '<p class="cal-note">—</p>') +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("home"); });
        $("[data-redeem]").addEventListener("click", openRedeem);
      }}
    );

    function openRedeem() {
      var phone = root.querySelector(".phone");
      var tiers = V.rewardTiers();
      var html = '<div class="sheet-overlay on" id="rdSheet"><div class="sheet">' +
        '<div class="sheet__grab"></div><h3>' + t("rwRedeemTitle") + "</h3>" +
        tiers.map(function (tr) {
          var can = pts >= tr.cost;
          return '<div class="rd-row"><div class="rd-row__t"><b>' + t(tr.key) + "</b><small>" + tr.cost + " " + t("rwPoints") + "</small></div>" +
            (can ? '<button class="btn btn-primary rd-get" data-tier="' + tr.id + '" style="padding:10px 20px;font-size:15px">' + t("rwGet") + "</button>"
                 : '<span class="rd-need">' + t("rwNeed", { n: tr.cost - pts }) + "</span>") + "</div>";
        }).join("") +
        '<a class="set-link" href="https://vitaapp.ge/" target="_blank" rel="noopener" style="justify-content:center;border:0;color:var(--green-dark);font-weight:600;margin-top:6px">' + V.icon("globe") + " " + t("rwOpenSite") + "</a>" +
        '<div id="rdResult"></div>' +
        "</div></div>";
      phone.insertAdjacentHTML("beforeend", html);
      var sheet = root.querySelector("#rdSheet");
      sheet.addEventListener("click", function (e) { if (e.target === sheet) sheet.remove(); });
      each("[data-tier]", function (b) {
        b.addEventListener("click", function () {
          var tr = V.rewardTiers().filter(function (x) { return x.id === b.getAttribute("data-tier"); })[0];
          if (!tr || (V.state.points || 0) < tr.cost) return;
          V.state.points -= tr.cost;
          var code = "VITA-" + Math.random().toString(36).slice(2, 7).toUpperCase();
          V.state.redeemed = V.state.redeemed || [];
          V.state.redeemed.push({ tier: tr.id, code: code, date: V.todayISO() });
          V.save();
          root.querySelector("#rdResult").innerHTML =
            '<button class="tag green rd-copy" data-copy="' + code + '" title="' + t("rwCopy") + '" style="margin-top:12px;width:100%;justify-content:center;border:none;cursor:pointer">' + t("rwGotCode") + " <b style='margin-left:6px'>" + code + "</b> " + V.icon("file") + "</button>";
          var cp = root.querySelector("[data-copy]");
          if (cp) cp.addEventListener("click", function () {
            var c = cp.getAttribute("data-copy");
            if (navigator.clipboard) navigator.clipboard.writeText(c).catch(function () {});
            V.toast && V.toast(t("rwCopied"));
          });
          // refresh the sheet's affordability state
          setTimeout(function () { var sh = root.querySelector("#rdSheet"); if (sh) sh.remove(); V.render(); }, 2800);
        });
      });
    }
  };

  /* ===================== MENU / HUB ===================== */
  V.screens.menu = function () {
    function tile(icon, tone, labelKey, attr, badge) {
      return '<button class="menu-tile" ' + attr + '>' +
        (badge ? '<i class="menu-badge">' + badge + "</i>" : "") +
        V.iconBox(icon, tone) + "<span>" + t(labelKey) + "</span></button>";
    }
    var upVisits = (V.state.bookings || []).filter(function (b) { return b.status !== "cancelled"; }).length;
    var screenP = V.screeningProgress ? V.screeningProgress() : null;
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
          tile("calendar", "pink", "mAnnual", 'data-go="annual"', screenP && screenP.total ? screenP.pct + "%" : null),
          tile("shield", "blue", "mBody", 'data-go="bodymap"'),
          tile("flask", "yellow", "mResults", 'data-go="results"'),
          tile("shield", V.state.profile.sex === "woman" ? "pink" : "blue", "mSexHealth", 'data-go="sexhealth"'),
        ].concat(V.state.profile.sex === "woman" ? [tile("heart", "pink", "mCycle", 'data-go="cycle"')] : [])) +
        group("grpCare", [
          tile("plan", "green", "mPlan", 'data-go="plan"'),
          tile("heart", "green", "mCare", 'data-go="careplans"'),
          tile("bolt", "blue", "mWorkouts", 'data-go="workouts"'),
          tile("walk", "green", "mSteps", 'data-go="steps"'),
          tile("food", "yellow", "mFood", 'data-go="food"'),
          tile("drop", "blue", "mWater", 'data-go="water"'),
          tile("calendar", "green", "mCalendar", 'data-go="calendar"'),
          tile("flask", "pink", "mCheckup", 'data-go="checkup"'),
          tile("location", "blue", "mVisits", 'data-go="visits"', upVisits || null),
        ]) +
        group("grpAssistant", [
          tile("chat", "blue", "mChat", 'data-go="vita"'),
          tile("progress", "green", "mProgress", 'data-go="progress"'),
          tile("eye", "blue", "mWellness", 'data-go="wellness"'),
          tile("stethoscope", "crimson", "mTelemed", 'data-go="telemed"'),
          tile("sparkle", "yellow", "mPlus", 'data-go="plus"', V.isPlus() ? "✓" : null),
          tile("bolt", "blue", "mWearable", 'data-go="wearable"', (V.state.wearable && V.state.wearable.connected) ? "✓" : null),
          tile("sparkle", "yellow", "mRewards", 'data-go="rewards"', (V.state.points || 0) || null),
          tile("globe", "green", "mVitaapp", 'data-go="vitaapp"'),
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

  /* ===================== VITAAPP.GE ACCOUNT / INTEGRATION ===================== */
  V.screens.vitaapp = function () {
    var acc = V.state.vitaAccount || { connected: false };
    var pts = V.state.points || 0;

    function serviceCard(s) {
      return '<a class="va-svc" href="' + s.url + '" target="_blank" rel="noopener">' +
        V.iconBox(s.icon, s.tone) + '<span>' + L(s.name) + '</span></a>';
    }

    var hero = acc.connected
      ? '<div class="va-hero on">' +
          '<div class="va-hero__top">' + V.logoBadge(40) +
            '<div><b>' + t("vaConnected") + '</b><small>' + esc(acc.email || "vitaapp.ge") + '</small></div>' +
            '<span class="tag green">' + t("vaPlan" + (acc.plan === "premium" ? "Premium" : "Basic")) + '</span></div>' +
          '<div class="va-hero__act">' +
            '<a class="btn btn-primary" href="' + V.VITAAPP_URL + '" target="_blank" rel="noopener" style="flex:1">' + V.icon("globe") + ' ' + t("vaOpen") + '</a>' +
            '<button class="btn btn-ghost" data-unlink>' + t("vaUnlink") + '</button></div>' +
        '</div>'
      : '<div class="va-hero">' +
          '<div class="va-hero__top">' + V.logoBadge(40) +
            '<div><b>' + t("vaTitle") + '</b><small>' + t("vaSub") + '</small></div></div>' +
          '<ul class="va-benefits">' +
            '<li>' + V.icon("check") + t("vaB1") + '</li>' +
            '<li>' + V.icon("check") + t("vaB2") + '</li>' +
            '<li>' + V.icon("check") + t("vaB3") + '</li></ul>' +
          '<a class="btn btn-primary" href="' + V.vitaRegisterUrl() + '" target="_blank" rel="noopener" style="width:100%">' + V.icon("globe") + ' ' + t("vaRegister") + '</a>' +
          '<div class="va-link"><p class="cal-note" style="margin:14px 0 8px">' + t("vaLinkHint") + '</p>' +
            '<div class="field"><input type="email" id="vaEmail" placeholder="' + t("vaEmailPh") + '"></div>' +
            '<button class="btn btn-ghost" id="vaLinkBtn" style="width:100%">' + t("vaLinkBtn") + '</button></div>' +
        '</div>';

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("vaHeader") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("x") + "</button></div>" +
        '<p class="s-sub">' + t("vaIntro") + "</p>" +
        hero +
        '<button class="va-points" data-rewards>' + V.iconBox("sparkle", "yellow") +
          '<div style="flex:1;text-align:left"><b>' + t("vaPointsTitle") + '</b><small>' + t("vaPointsSub", { n: pts }) + '</small></div>' +
          V.icon("back") + '</button>' +
        '<div class="section-head"><h3>' + t("vaServices") + '</h3></div>' +
        '<p class="cal-note" style="text-align:left;margin:0 0 12px">' + t("vaServicesSub") + '</p>' +
        '<div class="va-svc-grid">' + V.vitaServices.map(serviceCard).join("") + '</div>' +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("menu"); });
        var rw = $("[data-rewards]"); if (rw) rw.addEventListener("click", function () { V.go("rewards"); });
        var unlink = $("[data-unlink]");
        if (unlink) unlink.addEventListener("click", function () { V.unlinkVitaAccount(); V.render(); });
        var linkBtn = $("#vaLinkBtn");
        if (linkBtn) linkBtn.addEventListener("click", function () {
          var email = ($("#vaEmail").value || "").trim();
          if (!email || email.indexOf("@") < 0) { $("#vaEmail").focus(); return; }
          V.linkVitaAccount(email, "basic");
          V.render();
          V.toast && V.toast(t("vaLinked"));
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
            : '<span class="pts-badge ' + (isDone ? "earned" : "") + '" style="margin-right:8px">' + (isDone ? "✓ " : "+") + V.POINTS.workout + "</span>" +
              '<button class="wo-check ' + (isDone ? "on" : "") + '" data-wo="' + d.key + '">' + V.icon("check") + "</button>") +
        "</div>" +
        (d.items.length ? '<ul class="wo-list">' + d.items.map(function (x) {
          var mv = V.repMoveForExercise ? V.repMoveForExercise(x.name) : null;
          return "<li><span>" + L(x.name) + '</span><b>' + esc(x.scheme) + "</b>" +
            (mv ? '<button class="wo-cam" data-rep="' + mv.id + '" title="' + t("rcLive") + '">' + V.icon("camera") + "</button>" : "") +
            "</li>";
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
            if (V.state.doneWorkouts[k]) V.awardOnce("wo:" + k, V.POINTS.workout, "workout");
            V.save();
            V.render();
          });
        });
        each("[data-rep]", function (b) {
          b.addEventListener("click", function () {
            var mv = V.repMove(b.getAttribute("data-rep"));
            if (!mv || !V.openRepCounter) return;
            V.openRepCounter({ move: mv, onDone: function (reps) {
              if (reps >= Math.ceil(mv.target * 0.6)) {
                V.state.reps = V.state.reps || {};
                V.state.reps[mv.id] = (V.state.reps[mv.id] || 0) + reps;
                V.awardOnce("rep:" + mv.id + ":" + new Date().toISOString().slice(0, 10), V.POINTS.workout, "workout");
                V.toast && V.toast(t("rcSaved", { n: reps }));
                V.save();
              }
            }});
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

    var catTone = { cardio: "pink", metabolic: "yellow", cancer: "blue", mental: "blue", general: "green" };
    var catOrder = ["cardio", "metabolic", "cancer", "mental", "general"];
    var prog = V.screeningProgress();
    var riskCount = rec.now.filter(function (s) { return s.risk; }).length;
    var upcoming = byMonth.filter(function (mo) { return mo.month >= curMonth; });
    var nextMonth = (upcoming[0] || byMonth[0] || {}).month;

    // expandable, selectable recommended row (tap = info, checkbox = add to plan, book = clinics)
    function row(s) {
      var on = sel.indexOf(s.id) >= 0, why = V.screeningWhy(s.id), done = V.isScreeningDone(s.id);
      return '<div class="sc-item' + (on ? " on" : "") + (done ? " done" : "") + '" data-rg="' + s.region + '">' +
        '<div class="sc-item__head" data-expand>' +
          (done ? '<span class="sc-doneflag">' + V.icon("check") + "</span>" : '<span class="sc-dot" style="background:' + V.catColor(s.cat) + '"></span>') +
          '<div class="sc-item__t"><b>' + L(s.name) + "</b>" + (s.risk && !done ? ' <span class="sc-risk">' + V.icon("warn") + " " + t("scRisk") + "</span>" : "") +
            "<small>" + L(V.freqLabel(s.freq)) + " · " + V.regionLabel(s.region) + "</small></div>" +
          '<button class="sc-box" data-sc="' + s.id + '" aria-label="select">' + V.icon("check") + "</button>" +
          '<span class="sc-chev">' + V.icon("next") + "</span>" +
        "</div>" +
        '<div class="sc-detail">' +
          (why ? '<p class="sc-why">' + L(why) + "</p>" : "") +
          '<p class="sc-basis2">' + t("scSrc") + ": " + L(s.basis) + "</p>" +
          '<div class="sc-detail__act">' +
            '<button class="btn btn-primary sc-book" data-book="' + s.id + '">' + V.icon("calendar") + " " + t("scBook") + "</button>" +
            '<button class="btn ' + (done ? "btn-primary" : "btn-ghost") + ' sc-donebtn" data-done="' + s.id + '">' + V.icon("check") + " " + t(done ? "scDoneBadge" : "scMarkDone") + "</button>" +
          "</div>" +
        "</div></div>";
    }

    var grouped = catOrder.map(function (cat) {
      var items = rec.now.filter(function (s) { return s.cat === cat; });
      if (!items.length) return "";
      var ci = V.screenCats[cat];
      return '<div class="sc-cat">' + V.iconBox(ci.icon, catTone[cat]) + "<b>" + L(ci.label) + '</b><i>' + items.length + "</i></div>" +
        items.map(row).join("");
    }).join("");

    function yearStrip() {
      var map = {}; byMonth.forEach(function (mo) { map[mo.month] = mo.items; });
      var cells = "";
      for (var m = 1; m <= 12; m++) {
        var items = map[m] || [];
        var dots = items.slice(0, 4).map(function (s) { return '<span class="ys-dot" style="background:' + V.catColor(s.cat) + '"></span>'; }).join("");
        cells += '<div class="ys-cell' + (m === curMonth ? " cur" : "") + (items.length ? " has" : "") + '" data-ym="' + m + '">' +
          "<b>" + V.monthShort(m) + "</b><div class='ys-dots'>" + (dots || "<span class='ys-empty'></span>") + "</div></div>";
      }
      return '<div class="year-strip">' + cells + "</div>";
    }

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("anTitleScreen") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("back") + "</button></div>" +
        '<p class="s-sub">' + t("scBasis", { age: p.age || 36 }) + "</p>" +

        '<div class="an-prog-card">' +
          '<div class="an-prog-ring" style="--p:' + prog.pct + '"><b>' + prog.pct + "%</b></div>" +
          '<div class="an-prog__t"><b>' + t("scYearProg") + " " + new Date().getFullYear() + "</b>" +
            "<small>" + prog.done + " / " + prog.total + " " + t("scDoneYear") + "</small>" +
            '<p class="an-prog__hint">' + (prog.total && prog.done >= prog.total ? t("scAllDone") : t("scProgHint")) + "</p></div>" +
        "</div>" +

        '<div class="an-summary">' +
          '<div class="an-stat"><b>' + rec.now.length + "</b><small>" + t("scRecCount") + "</small></div>" +
          '<div class="an-stat"><b>' + sel.length + "</b><small>" + t("scSelected") + "</small></div>" +
          '<div class="an-stat"><b>' + (nextMonth ? V.monthShort(nextMonth) : "—") + "</b><small>" + t("scNext") + "</small></div>" +
        "</div>" +
        (riskCount ? '<div class="an-riskline">' + V.icon("warn") + " " + t("scRiskCount", { n: riskCount }) + "</div>" : "") +

        '<div class="scbody-card"><div class="scbody">' + screeningBody() + markers + "</div></div>" +

        '<div class="section-head"><h3>' + t("scRecommended") + '</h3><small>' + sel.length + " " + t("scSelected") + "</small></div>" +
        '<p class="s-sub" style="margin:-6px 0 12px">' + t("scTapHint2") + "</p>" +
        grouped +

        (rec.later.length ? '<div class="section-head"><h3>' + t("scLater") + "</h3></div>" +
          rec.later.map(function (s) {
            return '<div class="sc-item muted" data-rg="' + s.region + '"><div class="sc-item__head" style="cursor:default">' +
              '<span class="sc-dot" style="background:' + V.catColor(s.cat) + '"></span>' +
              '<div class="sc-item__t"><b>' + L(s.name) + "</b><small>" + V.regionLabel(s.region) + " · " + t("scFromAge", { age: s.fromAge }) + "</small></div></div></div>";
          }).join("") : "") +

        '<div class="section-head"><h3>' + t("scYear") + "</h3></div>" +
        '<div class="freq-legend">' + ["q", "b", "a"].map(function (f) { return "<span>" + L(V.freqLabel(f)) + "</span>"; }).join("") + "</div>" +
        (byMonth.length ? yearStrip() + byMonth.map(function (mo) {
          return '<div class="amonth ' + (mo.month === curMonth ? "cur" : "") + '" data-month="' + mo.month + '">' +
            '<div class="amonth__h"><b>' + V.monthName(mo.month) + "</b>" +
              (mo.month === curMonth ? '<span class="tag green">' + (V.lang() === "ka" ? "მიმდინარე" : "Now") + "</span>" : "") + "</div>" +
            mo.items.map(function (s) {
              var dn = V.isScreeningDone(s.id);
              return '<div class="arow' + (dn ? " done" : "") + '">' +
                (dn ? '<span class="sc-doneflag sm">' + V.icon("check") + "</span>" : '<span class="sc-dot" style="background:' + V.catColor(s.cat) + '"></span>') +
                '<div style="flex:1"><b>' + L(s.name) + "</b><small>" + L(V.freqLabel(s.freq)) + "</small></div>" +
                '<button class="arow__book" data-book="' + s.id + '">' + V.icon("calendar") + "</button></div>";
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
          el.addEventListener("click", function (e) { e.stopPropagation(); toggle(el.getAttribute("data-sc")); });
        });
        each("[data-expand]", function (h) {
          h.addEventListener("click", function (e) {
            if (e.target.closest("[data-sc]")) return;
            h.parentNode.classList.toggle("open");
          });
        });
        each("[data-book]", function (b) {
          b.addEventListener("click", function (e) {
            e.stopPropagation();
            var id = b.getAttribute("data-book");
            var cat = V.screeningCatalog().filter(function (x) { return x.id === id; })[0];
            if (V.openClinics) V.openClinics(V.screeningCheckup(id), cat ? cat.name : { ka: "ვიზიტი", en: "Visit" }); else V.go("clinics");
          });
        });
        each("[data-done]", function (b) {
          b.addEventListener("click", function (e) {
            e.stopPropagation();
            V.toggleScreeningDone(b.getAttribute("data-done"));
            V.render();
          });
        });
        each("[data-ym]", function (c) {
          c.addEventListener("click", function () {
            var m = c.getAttribute("data-ym");
            var card = root.querySelector('.amonth[data-month="' + m + '"]');
            if (card) { card.scrollIntoView({ behavior: "smooth", block: "center" }); card.classList.add("flash"); setTimeout(function () { card.classList.remove("flash"); }, 1200); }
          });
        });
        each("[data-region]", function (mk) {
          mk.addEventListener("click", function () {
            var r = mk.getAttribute("data-region");
            var first = root.querySelector('[data-rg="' + r + '"]');
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
'<svg viewBox="0 8 200 268" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">' +
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
  V.setResultsPanel = function (p) { ruPanel = p; };

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
          var demoFilled = false;
          if (!Object.keys(values).length) {
            // nothing anywhere → demo-fill the open panel so the flow always works
            demoFilled = true;
            panel.refs.forEach(function (r) { values[r.id] = r.demo; });
            var box0 = root.querySelectorAll("[data-lab]");
            box0.forEach(function (inp) { var r = refById(inp.getAttribute("data-lab")); if (r) inp.value = r.demo; });
          }
          applyResults(values);
          V.state.labResults = [{ date: V.todayISO(), values: values, demo: demoFilled }];
          V.save();
          V.awardOnce("lab", V.POINTS.lab, "lab");
          var box = $("#ruResult");
          box.innerHTML = (demoFilled ? '<div class="note-warn" style="margin-bottom:12px">' + V.icon("info") + " " + t("ruDemoNote") + "</div>" : "") + resultBlock();
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

  /* ===================== VITA+ subscription (freemium) ===================== */
  V.screens.plus = function () {
    var active = V.isPlus();
    var benefits = ["vpB1", "vpB2", "vpB3", "vpB4", "vpB5"];
    function planCard(id, price, per, sub, best) {
      return '<button class="vp-plan' + (best ? " vp-plan--best" : "") + '" data-plan="' + id + '">' +
        (best ? '<span class="vp-plan__badge">' + t("vpBest") + "</span>" : "") +
        '<b class="vp-plan__price">' + price + '</b><small class="vp-plan__per">' + per + "</small>" +
        '<span class="vp-plan__sub">' + sub + "</span></button>";
    }
    var body = active
      ? '<div class="vp-hero vp-hero--on">' + V.iconBox("sparkle", "green") +
          '<div><b>' + t("vpActiveTitle") + "</b><small>" + t("vpActiveSince") + " " + esc(V.state.plus.since || "") + " · " + t("vp_" + (V.state.plus.plan || "monthly")) + "</small></div></div>" +
        '<ul class="vp-benefits">' + benefits.map(function (k) { return "<li>" + V.icon("check") + t(k) + "</li>"; }).join("") + "</ul>" +
        '<button class="btn btn-ghost" id="vpCancel" style="width:100%">' + t("vpCancel") + "</button>"
      : '<div class="vp-hero">' + V.iconBox("sparkle", "yellow") +
          '<div><b>VITA+</b><small>' + t("vpTagline") + "</small></div></div>" +
        '<ul class="vp-benefits">' + benefits.map(function (k) { return "<li>" + V.icon("check") + t(k) + "</li>"; }).join("") + "</ul>" +
        '<div class="vp-plans">' +
          planCard("monthly", "₾9.99", t("vpPerMonth"), t("vpMonthlySub"), false) +
          planCard("yearly", "₾79", t("vpPerYear"), t("vpYearlySub"), true) +
        "</div>" +
        '<p class="cal-note" style="text-align:center;margin:14px 0 0">' + t("vpDemoNote") + "</p>";

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>VITA+</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("x") + "</button></div>" +
        '<p class="s-sub">' + t("vpIntro") + "</p>" +
        body +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("menu"); });
        each("[data-plan]", function (b) {
          b.addEventListener("click", function () {
            V.activatePlus(b.getAttribute("data-plan"));
            V.toast && V.toast(t("vpActivated"));
            V.render();
          });
        });
        var c = $("#vpCancel");
        if (c) c.addEventListener("click", function () { V.cancelPlus(); V.toast && V.toast(t("vpCancelled")); V.render(); });
      } }
    );
  };

  /* ===================== Wearable / health-data integration (seam + demo) ===================== */
  V.screens.wearable = function () {
    function srcName(id) { var s = (V.WEARABLES || []).filter(function (x) { return x.id === id; })[0]; return s ? L(s.name) : id; }
    var sources = V.wearableSources(), connected = sources.length > 0, c = V.wearableCombined();

    // 3 concentric activity rings (Apple-style: move / exercise / stand)
    function rings(d) {
      function ring(r, pct, col) {
        var C = 2 * Math.PI * r, len = Math.min(1, pct / 100) * C;
        return '<circle cx="62" cy="62" r="' + r + '" fill="none" stroke="var(--field)" stroke-width="11"/>' +
          '<circle cx="62" cy="62" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="11" stroke-linecap="round" stroke-dasharray="' + len + " " + (C - len) + '" transform="rotate(-90 62 62)"/>';
      }
      return '<svg viewBox="0 0 124 124" class="we-rings">' +
        ring(52, d.movePct, "#e8536b") +
        ring(39, Math.round(d.exerciseMin / d.exerciseGoal * 100), "#2BA94C") +
        ring(26, Math.round(d.standHr / d.standGoal * 100), "#4a90d9") + "</svg>";
    }
    function ringRow(col, label, val, goal, unit) {
      return '<div class="we-ringrow"><span class="we-ringdot" style="background:' + col + '"></span>' +
        "<b>" + label + "</b><small>" + val + "/" + goal + " " + unit + "</small></div>";
    }
    // weekly bars (generic)
    function weBars(series, color, goal) {
      var w = 320, h = 110, padX = 14, padTop = 16, padBot = 16, n = series.length;
      var max = Math.max.apply(null, series.concat([goal || 0])) * 1.12 || 1, bw = (w - 2 * padX) / n * 0.56;
      var gy = goal ? padTop + (1 - goal / max) * (h - padTop - padBot) : 0;
      return '<svg viewBox="0 0 ' + w + " " + h + '" class="bar-chart">' +
        (goal ? '<line x1="' + padX + '" y1="' + gy + '" x2="' + (w - padX) + '" y2="' + gy + '" stroke="var(--muted)" stroke-dasharray="4 4" stroke-width="1.1" opacity=".55"/>' : "") +
        series.map(function (v, i) {
          var x = padX + (i + 0.5) * ((w - 2 * padX) / n) - bw / 2, bh = (v / max) * (h - padTop - padBot), y = h - padBot - bh;
          var lbl = (i === n - 1) ? '<text x="' + (x + bw / 2) + '" y="' + (y - 5) + '" text-anchor="middle" class="ch-val" fill="' + color + '">' + v + "</text>" : "";
          return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="4" fill="' + color + '" opacity="' + (i === n - 1 ? 1 : 0.4) + '"/>' + lbl;
        }).join("") + "</svg>";
    }
    function sleepStages(d) {
      var tot = (d.sleepDeep + d.sleepRem + d.sleepLight) || 1;
      function seg(v, col) { return '<span style="width:' + (v / tot * 100) + "%;background:" + col + '"></span>'; }
      function leg(v, col, lbl) { return '<span class="we-sl"><i style="background:' + col + '"></i>' + lbl + " " + v + "h</span>"; }
      return '<div class="we-sleepbar">' + seg(d.sleepDeep, "#3a52a0") + seg(d.sleepRem, "#7a5bd0") + seg(d.sleepLight, "#9fb6e8") + "</div>" +
        '<div class="we-sleglegend">' + leg(d.sleepDeep, "#3a52a0", t("weDeep")) + leg(d.sleepRem, "#7a5bd0", t("weRem")) + leg(d.sleepLight, "#9fb6e8", t("weLight")) + "</div>";
    }
    function statBox(icon, val, label) { return '<div class="we-stat">' + V.icon(icon) + "<b>" + val + "</b><small>" + label + "</small></div>"; }
    function sourceChip(s) {
      return '<span class="we-chip">' + V.icon("bolt") + esc(srcName(s.id)) + '<button class="we-chip__x" data-disc="' + s.id + '" aria-label="x">' + V.icon("x") + "</button></span>";
    }

    var body;
    if (!connected) {
      body = '<div class="we-hero">' + V.iconBox("bolt", "blue") +
          '<div><b>' + t("weTitle") + "</b><small>" + t("weSub") + "</small></div></div>" +
        '<div class="we-srcs">' + (V.WEARABLES || []).map(function (s) {
          return '<button class="we-src" data-src="' + s.id + '">' + V.iconBox("bolt", "gray") + "<span>" + L(s.name) + "</span>" + V.icon("next") + "</button>";
        }).join("") + "</div>" +
        '<p class="cal-note" style="text-align:left;margin:14px 0 0">' + t("weSeamNote") + "</p>";
    } else {
      var unconnected = (V.WEARABLES || []).filter(function (s) { return !sources.some(function (x) { return x.id === s.id; }); });
      body =
        // connected source chips + combined note
        '<div class="we-chips">' + sources.map(sourceChip).join("") + "</div>" +
        (c.count > 1 ? '<p class="we-merged">' + V.icon("check") + " " + t("weMerged", { n: c.count }) + "</p>" : "") +

        // activity rings
        '<div class="card-soft we-act">' +
          '<div class="we-act__rings">' + rings(c) + "</div>" +
          '<div class="we-act__legend">' +
            ringRow("#e8536b", t("weMove"), c.kcalActive, c.moveGoal, t("weKcal")) +
            ringRow("#2BA94C", t("weExercise"), c.exerciseMin, c.exerciseGoal, t("weMin")) +
            ringRow("#4a90d9", t("weStand"), c.standHr, c.standGoal, t("weHr")) +
          "</div></div>" +

        // steps
        '<div class="card-soft we-block"><div class="we-block__head"><div>' + V.icon("walk") + " <b>" + t("weSteps") + '</b></div><span class="we-big">' + c.steps.toLocaleString() + "</span></div>" +
          weBars(c.series.steps, "#2BA94C", 10000) + "</div>" +

        // sleep
        '<div class="card-soft we-block"><div class="we-block__head"><div>' + V.icon("moon") + " <b>" + t("weSleepT") + '</b></div><span class="we-big">' + c.sleepH + "<small>" + t("weH") + "</small></span></div>" +
          sleepStages(c) + '<div class="we-trend">' + weBars(c.series.sleepH, "#7a5bd0", 8) + "</div></div>" +

        // heart
        '<div class="card-soft we-block"><div class="we-block__head"><div>' + V.icon("heart") + " <b>" + t("weHeart") + "</b></div></div>" +
          '<div class="we-hr">' +
            '<div><b>' + c.restHR + '</b><small>' + t("weRestHR") + "</small></div>" +
            '<div><b>' + c.hrAvg + '</b><small>' + t("weHRAvg") + "</small></div>" +
            '<div><b>' + c.hrv + '</b><small>HRV ms</small></div>' +
            '<div><b>' + c.spo2 + '%</b><small>SpO₂</small></div>' +
          "</div></div>" +

        // more stats
        '<div class="we-stats">' +
          statBox("location", c.distanceKm + " " + t("weKm"), t("weDistance")) +
          statBox("trend", c.floors, t("weFloors")) +
          statBox("bolt", c.exerciseMin + " " + t("weMin"), t("weActiveMin")) +
          statBox("flame", c.workouts, t("weWorkouts")) +
        "</div>" +

        '<p class="cal-note" style="text-align:left;margin:2px 0 14px">' + t("weFeeds") + "</p>" +

        // manage: add more / disconnect all
        (unconnected.length ? '<div class="section-head"><h3>' + t("weAddMore") + "</h3></div>" +
          '<div class="we-srcs">' + unconnected.map(function (s) {
            return '<button class="we-src" data-src="' + s.id + '">' + V.iconBox("bolt", "gray") + "<span>" + L(s.name) + "</span>" + V.icon("next") + "</button>";
          }).join("") + "</div>" : "") +
        '<button class="btn btn-ghost" id="weDiscAll" style="width:100%;margin-top:12px">' + t("weDisconnectAll") + "</button>";
    }

    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="pad-lg fade-in">' +
        '<div class="s-head" style="justify-content:space-between"><div style="display:flex;align-items:center;gap:12px">' + V.logoBadge(34) + "<h1>" + t("weHeader") + "</h1></div>" +
          '<button class="icon-box gray" data-x>' + V.icon("x") + "</button></div>" +
        '<p class="s-sub">' + t("weIntro") + "</p>" +
        body +
      "</div>" +
      V.tabbar("home") +
      "</div>",
      { onMount: function () {
        $("[data-x]").addEventListener("click", function () { V.go("menu"); });
        each("[data-src]", function (b) {
          b.addEventListener("click", function () { V.connectWearable(b.getAttribute("data-src")); V.toast && V.toast(t("weConnected")); V.render(); });
        });
        each("[data-disc]", function (b) {
          b.addEventListener("click", function () { V.disconnectWearable(b.getAttribute("data-disc")); V.render(); });
        });
        var da = $("#weDiscAll");
        if (da) da.addEventListener("click", function () { V.disconnectWearable(); V.render(); });
      } }
    );
  };
})();
