/* VITA screens — splash, intro, and the 5-step onboarding wizard */
(function () {
  var V = window.VITA;
  V.screens = V.screens || {};
  var root = document.getElementById("app");

  function $(sel) { return root.querySelector(sel); }
  function each(sel, fn) { root.querySelectorAll(sel).forEach(fn); }
  var t = V.t, esc = V.esc;

  /* ===================== SPLASH ===================== */
  V.screens.splash = function () {
    var blobs =
      '<div class="blob b-green"  style="width:120px;height:118px;top:60px;left:30px;animation:floaty 7s ease-in-out infinite"></div>' +
      '<div class="blob b-yellow" style="width:165px;height:150px;top:120px;right:24px;animation:floaty 8s ease-in-out infinite .6s"></div>' +
      '<div class="blob b-pink"   style="width:140px;height:120px;top:240px;left:14px;animation:floaty 9s ease-in-out infinite 1.2s"></div>';
    V.mount(
      V.statusbar() +
      '<div class="screen"><div class="splash">' +
      blobs +
      '<div class="splash__logo">' + V.mark(116) +
        '<div class="word">VITA</div></div>' +
      '<div class="splash__cta">' +
        '<div><small>' + t("noAccount") + '</small><b>' + t("createNow") + "</b></div>" +
        '<button class="btn btn-primary" data-next>' + t("getStarted") + " " + V.icon("next") + "</button>" +
      "</div>" +
      '<div class="home-bar"></div>' +
      "</div></div>",
      { onMount: function () {
        $("[data-next]").addEventListener("click", function () { V.go("intro"); });
      }}
    );
  };

  /* ===================== INTRO ===================== */
  V.screens.intro = function () {
    var blobs =
      '<div class="blob b-green"  style="width:120px;height:110px;top:10px;left:18px;animation:floaty 7s ease-in-out infinite"></div>' +
      '<div class="blob b-blue"   style="width:150px;height:140px;top:40px;right:8px;animation:floaty 8s ease-in-out infinite .5s"></div>' +
      '<div class="blob b-pink"   style="width:120px;height:110px;top:150px;left:2px;animation:floaty 9s ease-in-out infinite 1s"></div>' +
      '<div class="blob b-yellow" style="width:130px;height:120px;top:150px;right:30px;animation:floaty 7.5s ease-in-out infinite 1.4s"></div>';
    V.mount(
      V.statusbar() +
      '<div class="screen">' +
        '<div class="intro-art"><div class="blobwrap">' + blobs + "</div></div>" +
        '<div class="intro-meta">' +
          '<div class="intro-tags">' +
            '<span class="tag pink">' + t("obSteps") + "</span>" +
            '<span class="tag blue">' + t("obMin") + "</span>" +
          "</div>" +
          "<h2>" + t("obTitle") + "</h2>" +
          "<p>" + t("obDesc") + "</p>" +
        "</div>" +
        '<div class="actionbar">' +
          '<button class="btn btn-ghost" data-back>' + V.icon("back") + " " + t("back") + "</button>" +
          '<button class="btn btn-primary" data-next>' + t("next") + " " + V.icon("next") + "</button>" +
        "</div>" +
      "</div>",
      { onMount: function () {
        $("[data-back]").addEventListener("click", function () { V.go("splash"); });
        $("[data-next]").addEventListener("click", function () { V.go("s1"); });
      }}
    );
  };

  /* ===================== wizard scaffold ===================== */
  function wizard(opts) {
    // opts: { step, title, hint, bodyHTML, onMount, route, prevRoute }
    var pct = (opts.step / 5) * 100;
    V.mount(
      '<div class="topbar tint">' +
        V.statusbar() +
        '<div class="topbar__row">' +
          '<button class="topbar__back" data-back><span class="nub">' + V.icon("back") + "</span> " + t("back") + "</button>" +
          '<span class="topbar__step">' + t("step") + " " + opts.step + "/5</span>" +
        "</div>" +
        '<div class="progressbar"><span style="width:' + pct + '%"></span></div>' +
      "</div>" +
      '<div class="screen"><div class="pad fade-in">' +
        '<div class="s-head">' + V.logoBadge(34) + "<h1>" + opts.title + "</h1></div>" +
        (opts.hint ? '<div class="bubble">' + opts.hint + "</div>" : "") +
        opts.bodyHTML +
      "</div>" +
      '<div class="actionbar">' +
        '<button class="btn btn-ghost" data-skip>' + t("skip") + "</button>" +
        '<button class="btn btn-primary" data-next>' + t("next") + " " + V.icon("next") + "</button>" +
      "</div></div>",
      { onMount: function () {
        $("[data-back]").addEventListener("click", function () { V.go(opts.prevRoute); });
        $("[data-skip]").addEventListener("click", function () { V.go(opts.nextRoute); });
        $("[data-next]").addEventListener("click", function () {
          if (opts.collect) opts.collect();
          V.save();
          V.go(opts.nextRoute);
        });
        if (opts.onMount) opts.onMount();
      }}
    );
  }

  // single-select chip group
  function chipGroup(field, options, multi) {
    var p = V.state.profile;
    return '<div class="chips" data-group="' + field + '" data-multi="' + (multi ? 1 : 0) + '">' +
      options.map(function (o) {
        var on = multi ? (p[field] || []).indexOf(o.v) >= 0 : p[field] === o.v;
        return '<button class="chip ' + (on ? "on" : "") + '" data-v="' + o.v + '">' +
          (o.icon ? V.icon(o.icon) : "") + esc(o.l) + "</button>";
      }).join("") + "</div>";
  }

  function wireChips() {
    each("[data-group]", function (grp) {
      var field = grp.getAttribute("data-group");
      var multi = grp.getAttribute("data-multi") === "1";
      grp.querySelectorAll(".chip").forEach(function (c) {
        c.addEventListener("click", function () {
          var v = c.getAttribute("data-v");
          var p = V.state.profile;
          if (multi) {
            p[field] = p[field] || [];
            var i = p[field].indexOf(v);
            if (i >= 0) p[field].splice(i, 1); else p[field].push(v);
            c.classList.toggle("on");
          } else {
            p[field] = v;
            grp.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("on"); });
            c.classList.add("on");
          }
          V.save();
        });
      });
    });
  }

  /* ===================== STEP 1 — basic info ===================== */
  V.screens.s1 = function () {
    var p = V.state.profile;
    var body =
      '<div class="field"><label>' + t("selectSex") + "</label>" +
        '<div class="choice-row">' +
          sexChoice("woman", t("woman")) + sexChoice("man", t("man")) +
        "</div></div>" +
      '<div class="field"><label>' + t("fullname") + '</label><input id="f_name" placeholder="' + t("yourName") + '" value="' + esc(p.name || "") + '"></div>' +
      '<div class="field"><label>' + t("age") + '</label><input id="f_age" type="number" inputmode="numeric" placeholder="' + t("yourAge") + '" value="' + (p.age || "") + '"></div>' +
      '<div class="grid2">' +
        '<div class="field"><label>' + t("weight") + '</label><input id="f_weight" type="number" inputmode="decimal" placeholder="' + t("yourWeight") + '" value="' + (p.weight || "") + '"></div>' +
        '<div class="field"><label>' + t("height") + '</label><input id="f_height" type="number" inputmode="numeric" placeholder="' + t("yourHeight") + '" value="' + (p.height || "") + '"></div>' +
      "</div>" +
      '<div class="field"><label>' + t("waist") + '</label><input id="f_waist" type="number" inputmode="numeric" placeholder="' + t("yourWaist") + '" value="' + (p.waist || "") + '"></div>' +
      '<div class="field"><label>' + t("location") + '</label><input id="f_loc" placeholder="Tbilisi" value="' + esc(p.location || "") + '"></div>';

    wizard({
      step: 1, route: "s1", prevRoute: "intro", nextRoute: "s2",
      title: t("s1Title"), hint: t("s1Hint"), bodyHTML: body,
      onMount: function () {
        each(".choice", function (c) {
          c.addEventListener("click", function () {
            V.state.profile.sex = c.getAttribute("data-sex");
            each(".choice", function (x) { x.classList.remove("on"); });
            c.classList.add("on");
            V.save();
          });
        });
      },
      collect: function () {
        var g = function (id) { var el = $("#" + id); return el ? el.value.trim() : ""; };
        p.name = g("f_name");
        p.age = parseInt(g("f_age")) || null;
        p.weight = parseFloat(g("f_weight")) || null;
        p.height = parseInt(g("f_height")) || null;
        p.waist = parseInt(g("f_waist")) || null;
        p.location = g("f_loc");
        if (p.weight) {
          var today = V.todayISO();
          if (!V.state.weightLog.some(function (w) { return w.date === today; }))
            V.state.weightLog.push({ date: today, kg: p.weight });
        }
      },
    });
  };

  function sexChoice(v, label) {
    var on = V.state.profile.sex === v;
    var wave = '<svg class="wave" viewBox="0 0 200 96" preserveAspectRatio="none"><path d="M0 70 C40 50 70 90 110 70 S180 55 200 72" fill="none" stroke="' +
      (on ? "rgba(39,174,96,.35)" : "rgba(20,24,31,.06)") + '" stroke-width="2"/><path d="M0 40 C50 20 90 60 140 38 S190 30 200 44" fill="none" stroke="' +
      (on ? "rgba(39,174,96,.22)" : "rgba(20,24,31,.05)") + '" stroke-width="2"/></svg>';
    return '<button class="choice ' + (on ? "on" : "") + '" data-sex="' + v + '">' +
      wave + esc(label) +
      '<span class="choice__tick">' + V.icon("check") + "</span></button>";
  }

  /* ===================== STEP 2 — lifestyle ===================== */
  V.screens.s2 = function () {
    var body =
      qblock(1, "c2", "walk", t("dailyActivity"),
        chipGroup("activity", [
          { v: "sitting", l: t("actSitting") }, { v: "light", l: t("actLight") },
          { v: "active", l: t("actActive") }, { v: "very", l: t("actVery") }])) +
      qblock(2, "c3", "smoke", t("smoking"),
        chipGroup("smoking", [
          { v: "no", l: t("smokeNo") }, { v: "occ", l: t("smokeOcc") }, { v: "daily", l: t("smokeDaily") }])) +
      qblock(3, "c4", "wine", t("alcohol"),
        chipGroup("alcohol", [
          { v: "never", l: t("alcNever") }, { v: "occ", l: t("alcOcc") }, { v: "soc", l: t("alcSoc") },
          { v: "weekly", l: t("alcWeekly") }, { v: "daily", l: t("alcDaily") }])) +
      qblock(4, "c1", "food", t("food"),
        chipGroup("food", [
          { v: "balanced", l: t("foodBalanced") }, { v: "irregular", l: t("foodIrregular") },
          { v: "diet", l: t("foodDiet") }, { v: "veg", l: t("foodVeg") }])) +
      qblock(5, "c2", "drop", t("water"),
        chipGroup("water", [
          { v: "low", l: t("waterLow") }, { v: "mid", l: t("waterMid") },
          { v: "good", l: t("waterGood") }, { v: "high", l: t("waterHigh") }])) +
      qblock(6, "c2", "moon", t("sleepHours"),
        chipGroup("sleep", [
          { v: "<5", l: "<5" }, { v: "5-6", l: "5–6" }, { v: "6-8", l: "6–8" }, { v: "8+", l: "8+" }]));
    wizard({ step: 2, route: "s2", prevRoute: "s1", nextRoute: "s3",
      title: t("s2Title"), hint: t("s2Hint"), bodyHTML: body, onMount: wireChips });
  };

  /* ===================== STEP 3 — health status ===================== */
  V.screens.s3 = function () {
    var body =
      qblock(1, "c1", "bolt", t("conditions"),
        '<div class="chips" data-group="conditions" data-multi="1">' +
          '<button class="chip add" data-v="__add">' + V.icon("plus") + "</button>" +
          multiChips("conditions", [
            { v: "pre", l: t("condPre") }, { v: "chol", l: t("condChol") },
            { v: "hyper", l: t("condHyper") }, { v: "thyroid", l: t("condThyroid") }, { v: "none", l: t("condNone") }]) +
        "</div>") +
      qblock(2, "c3", "file", t("lastCheck"),
        '<div class="chips" data-group="lastCheck" data-multi="1">' +
          multiChips("lastCheck", [
            { v: "sugar", l: t("lcSugar") }, { v: "chol", l: t("lcChol") },
            { v: "bp", l: t("lcBp") }, { v: "none", l: t("lcNone") }]) +
        "</div>") +
      qblock(3, "c1", "pill", t("meds"),
        chipGroup("meds", [{ v: "yes", l: t("yes") }, { v: "no", l: t("no") }]));
    wizard({ step: 3, route: "s3", prevRoute: "s2", nextRoute: "s4",
      title: t("s3Title"), hint: t("s3Hint"), bodyHTML: body, onMount: wireChips });
  };

  function multiChips(field, options) {
    var p = V.state.profile;
    return options.map(function (o) {
      var on = (p[field] || []).indexOf(o.v) >= 0;
      return '<button class="chip ' + (on ? "on" : "") + '" data-v="' + o.v + '">' + esc(o.l) + "</button>";
    }).join("");
  }

  /* ===================== STEP 4 — mental & energy ===================== */
  V.screens.s4 = function () {
    var body =
      qblock(1, "c2", "bolt", t("energy"),
        chipGroup("energy", [
          { v: "vlow", l: t("eVeryLow") }, { v: "low", l: t("eLow") },
          { v: "mod", l: t("eMod") }, { v: "high", l: t("eHigh") }])) +
      qblock(2, "c3", "smile", t("mood"),
        chipGroup("mood", [
          { v: "pos", l: t("mPos") }, { v: "neutral", l: t("mNeutral") },
          { v: "low", l: t("mLow") }, { v: "anx", l: t("mAnx") }])) +
      qblock(3, "c1", "brain", t("stress"),
        chipGroup("stress", [
          { v: "calm", l: t("stCalm") }, { v: "mod", l: t("stMod") },
          { v: "high", l: t("stHigh") }, { v: "burn", l: t("stBurn") }])) +
      qblock(4, "c4", "moon", t("sleepQ"),
        chipGroup("sleepQ", [
          { v: "great", l: t("sqGreat") }, { v: "ok", l: t("sqOk") },
          { v: "poor", l: t("sqPoor") }, { v: "ins", l: t("sqIns") }]));
    wizard({ step: 4, route: "s4", prevRoute: "s3", nextRoute: "s5",
      title: t("s4Title"), hint: t("s4Hint"), bodyHTML: body, onMount: wireChips });
  };

  /* ===================== STEP 5 — appearance ===================== */
  V.screens.s5 = function () {
    var body =
      qblock(1, "c2", "skin", t("skinC"),
        chipGroup("skin", [
          { v: "normal", l: t("skNormal") }, { v: "dry", l: t("skDry") },
          { v: "oily", l: t("skOily") }, { v: "sens", l: t("skSens") }])) +
      qblock(2, "c3", "hair", t("hairC"),
        chipGroup("hair", [
          { v: "normal", l: t("hNormal") }, { v: "thin", l: t("hThin") }, { v: "loss", l: t("hLoss") }])) +
      qblock(3, "c1", "tooth", t("oral"),
        chipGroup("oral", [
          { v: "twice", l: t("oTwice") }, { v: "once", l: t("oOnce") }, { v: "irr", l: t("oIrr") }]));
    wizard({ step: 5, route: "s5", prevRoute: "s4", nextRoute: "analyse",
      title: t("s5Title"), hint: t("s5Hint"), bodyHTML: body, onMount: wireChips });
  };

  function qblock(n, color, icon, title, inner) {
    return '<div class="qblock"><div class="qhead">' +
      '<span class="qnum ' + color + '">' + n + "</span>" +
      "<h3>" + esc(title) + "</h3></div>" + inner + "</div>";
  }
})();
