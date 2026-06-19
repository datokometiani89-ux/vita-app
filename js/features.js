/* VITA quick-win features: reminders (notifications), .ics export,
   data export (JSON), and a printable doctor summary. All client-side. */
window.VITA = window.VITA || {};

(function (V) {
  var F = {};
  V.features = F;

  function L(o) { return o && (o[V.lang()] || o.en) || ""; }
  function ka() { return V.lang() === "ka"; }
  function todayISO() { return V.todayISO(); }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: (mime || "text/plain") + ";charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }

  /* ---------------- Reminders / notifications ---------------- */
  F.notifSupported = function () { return "Notification" in window; };
  F.notifOn = function () { return !!(V.state.reminders && V.state.reminders.on) && F.notifSupported() && Notification.permission === "granted"; };

  F.notify = function (title, body) {
    if (!F.notifSupported() || Notification.permission !== "granted") return;
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(function (reg) {
          reg.showNotification(title, { body: body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "vita" });
        }).catch(function () { new Notification(title, { body: body, icon: "icons/icon-192.png" }); });
      } else {
        new Notification(title, { body: body, icon: "icons/icon-192.png" });
      }
    } catch (e) {}
  };

  // build today's reminder items from the plan
  F.todaysReminders = function () {
    var out = [];
    out.push({ h: 8, m: 0, title: ka() ? "დილის წყალი 💧" : "Morning water 💧",
      body: ka() ? "დალიე 1 ჭიქა წყალი და დაიწყე დღე ცილოვანი საუზმით." : "Drink a glass of water and start with a protein breakfast." });
    var meds = (V.medications && V.medications()) || [];
    if (meds.some(function (m) { return m.when === "morning"; }))
      out.push({ h: 8, m: 30, title: ka() ? "დილის მედიკამენტები 💊" : "Morning meds 💊",
        body: ka() ? "ომეგა-3 + ვიტამინი D3 საუზმესთან ერთად." : "Omega-3 + vitamin D3 with breakfast." });
    out.push({ h: 14, m: 0, title: ka() ? "მოძრაობის შესვენება 🚶" : "Movement break 🚶",
      body: ka() ? "ადექი, გაიარე 10–15 წთ — შაქარს დააწევს." : "Stand up, walk 10–15 min — it lowers your blood sugar." });
    if (meds.some(function (m) { return m.when === "evening"; }))
      out.push({ h: 19, m: 0, title: ka() ? "საღამოს მედიკამენტები 💊" : "Evening meds 💊",
        body: ka() ? "ვახშამთან ერთად, ექიმის დანიშნულებით." : "With dinner, as prescribed by your doctor." });
    // daily mood check-in nudge — only if not logged yet today
    var moodToday = V.state.wellness && V.state.wellness.mood && V.state.wellness.mood[V.todayISO()];
    if (!moodToday)
      out.push({ h: 20, m: 30, title: ka() ? "დღის განწყობა 🙂" : "Today's mood 🙂",
        body: ka() ? "ერთ შეხებაში ჩაინიშნე როგორ გრძნობ თავს — შეინარჩუნე სტრიქი." : "Log how you feel in one tap — keep your streak going." });
    out.push({ h: 21, m: 30, title: ka() ? "ძილის რეჟიმი 🌙" : "Wind down 🌙",
      body: ka() ? "1 სთ ეკრანის გარეშე — მიზანი 7–8 სთ ძილი." : "1 screen-free hour — aim for 7–8h sleep." });
    return out;
  };

  var timers = [];
  function clearTimers() { timers.forEach(function (t) { clearTimeout(t); }); timers = []; }

  // schedule remaining reminders for today (only fires while the app/PWA is open)
  F.scheduleToday = function () {
    clearTimers();
    if (!F.notifOn()) return;
    var now = new Date();
    F.todaysReminders().forEach(function (r) {
      var when = new Date(); when.setHours(r.h, r.m, 0, 0);
      var delay = when - now;
      if (delay > 0 && delay < 16 * 3600 * 1000) {
        timers.push(setTimeout(function () { F.notify(r.title, r.body); }, delay));
      }
    });
  };

  F.enableNotifications = function () {
    if (!F.notifSupported()) return Promise.resolve(false);
    return Notification.requestPermission().then(function (perm) {
      var ok = perm === "granted";
      V.state.reminders = { on: ok }; V.save();
      if (ok) {
        F.notify(ka() ? "შეხსენებები ჩაირთო ✅" : "Reminders enabled ✅",
                 ka() ? "VITA შეგახსენებს წყალს, მედიკამენტებსა და ძილს." : "VITA will nudge you about water, meds and sleep.");
        F.scheduleToday();
      }
      return ok;
    });
  };
  F.disableNotifications = function () { V.state.reminders = { on: false }; V.save(); clearTimers(); };

  /* ---------------- .ics calendar export ---------------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function icsDate(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00"; }
  function icsEsc(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }

  // booked checkups → events on upcoming days (10:00, 30 min)
  F.icsText = function () {
    var plan = (V.checkupPlan && V.checkupPlan()) || [];
    var booked = plan.filter(function (it) { return V.state.calendar.indexOf(it.id) >= 0; });
    if (!booked.length) booked = plan.slice(0, 3); // demo if none booked
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VITA Health AI//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    var base = new Date(); base.setHours(0, 0, 0, 0);
    booked.forEach(function (it, i) {
      var ex = (V.checkupExtra && V.checkupExtra(it.id)) || {};
      var start = new Date(base.getTime() + (i + 1) * 3 * 86400000); start.setHours(10, 0, 0, 0);
      var end = new Date(start.getTime() + 30 * 60000);
      lines.push("BEGIN:VEVENT");
      lines.push("UID:vita-" + it.id + "-" + start.getTime() + "@vita");
      lines.push("DTSTAMP:" + icsDate(new Date()));
      lines.push("DTSTART:" + icsDate(start));
      lines.push("DTEND:" + icsDate(end));
      lines.push("SUMMARY:" + icsEsc("VITA: " + L(it.title)));
      if (ex.spec) lines.push("LOCATION:" + icsEsc(L(ex.spec) + (ex.clinic ? " · " + ex.clinic : "")));
      lines.push("DESCRIPTION:" + icsEsc(L(it.note) + (ex.spec ? " — " + L(ex.spec) : "")));
      lines.push("BEGIN:VALARM\r\nTRIGGER:-PT2H\r\nACTION:DISPLAY\r\nDESCRIPTION:VITA reminder\r\nEND:VALARM");
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  };
  F.exportICS = function () { download("vita-checkups.ics", F.icsText(), "text/calendar"); };

  /* ---------------- data export (JSON) ---------------- */
  F.exportJSON = function () {
    var data = { exported: new Date().toISOString(), app: "VITA Health AI", state: V.state };
    download("vita-data-" + todayISO() + ".json", JSON.stringify(data, null, 2), "application/json");
  };

  /* ---------------- printable doctor summary ---------------- */
  F.printSummary = function () {
    var p = V.state.profile;
    var bmi = V.bmi(), score = V.healthScore();
    var concerns = V.concerns().map(function (c) { return { name: V.t(c.key), sev: c.sev }; });
    var vals = (V.state.labResults[0] && V.state.labResults[0].values) || {};
    var refs = (V.labRefs && V.labRefs()) || [];
    var labRows = refs.filter(function (r) { return vals[r.id] != null; }).map(function (r) {
      var st = V.labStatus(r, vals[r.id]);
      var lbl = st === "good" ? (ka() ? "ნორმა" : "Normal") : st === "high" ? (ka() ? "მაღალი" : "High") : (ka() ? "დაბალი" : "Low");
      var color = st === "good" ? "#27AE60" : st === "high" ? "#ED2E7E" : "#F2B83B";
      return "<tr><td>" + L(r.name) + "</td><td>" + vals[r.id] + " " + (r.unit || "") +
        "</td><td>" + r.low + "–" + (r.high < 9000 ? r.high : "∞") + "</td><td style='color:" + color + ";font-weight:600'>" + lbl + "</td></tr>";
    }).join("");
    var goalNames = { weight: V.t("gWeight"), waist: V.t("gWaist"), sugar: V.t("gSugar"), energy: V.t("gEnergy"), wellbeing: V.t("gWellbeing"), skin: V.t("gSkin"), hair: V.t("gHair"), oral: V.t("gOral") };
    var goals = (V.state.goals || []).map(function (g) { return goalNames[g] || g; }).join(", ");
    var T = ka() ? {
      title: "VITA — ჯანმრთელობის რეზიუმე", sub: "გენერირებულია " + todayISO(),
      profile: "პროფილი", score: "ჯანმრთელობის ქულა", areas: "ყურადღების სფეროები",
      labs: "ბოლო ანალიზები", goals: "მიზნები", none: "—", note: "მომზადებულია VITA Health AI-ით. არ წარმოადგენს სამედიცინო დიაგნოზს."
    } : {
      title: "VITA — Health Summary", sub: "Generated " + todayISO(),
      profile: "Profile", score: "Health score", areas: "Areas of concern",
      labs: "Latest labs", goals: "Goals", none: "—", note: "Prepared by VITA Health AI. Not a medical diagnosis."
    };
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>' + T.title + '</title>' +
      '<style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#14181f;max-width:720px;margin:32px auto;padding:0 20px}' +
      'h1{font-size:24px;margin:0 0 2px} .sub{color:#8A94A6;margin-bottom:22px}' +
      'h2{font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:#27AE60;margin:24px 0 8px;border-bottom:2px solid #E4F4EA;padding-bottom:4px}' +
      '.row{display:flex;gap:24px;flex-wrap:wrap} .row div{font-size:15px} .row b{display:block;font-size:22px}' +
      'table{width:100%;border-collapse:collapse;font-size:14px} td,th{text-align:left;padding:7px 6px;border-bottom:1px solid #eee}' +
      '.tag{display:inline-block;padding:3px 10px;border-radius:99px;font-size:13px;margin:2px 4px 2px 0}' +
      '.note{margin-top:28px;color:#8A94A6;font-size:12px}</style></head><body>' +
      "<h1>" + T.title + "</h1><div class='sub'>" + T.sub + "</div>" +
      "<h2>" + T.profile + "</h2><div class='row'>" +
        "<div><b>" + (p.name || "—") + "</b>" + (p.age || "—") + " " + V.t("years") + " · " + (p.sex === "woman" ? V.t("woman") : V.t("man")) + " · " + (p.location || "") + "</div>" +
        "<div><b>" + (p.weight || "—") + V.t("kg") + "</b>" + V.t("weight") + "</div>" +
        "<div><b>" + (p.height || "—") + V.t("cm") + "</b>" + V.t("height") + "</div>" +
        "<div><b>" + (bmi || "—") + "</b>BMI</div>" +
        "<div><b>" + score + "/100</b>" + T.score + "</div></div>" +
      "<h2>" + T.areas + "</h2><div>" + (concerns.length ? concerns.map(function (c) {
        var bg = c.sev === "high" ? "#FCE6F0;color:#ED2E7E" : c.sev === "medium" ? "#FBF0D7;color:#B98A1B" : "#E4F4EA;color:#1E8E4F";
        return "<span class='tag' style='background:" + bg + "'>" + c.name + "</span>";
      }).join("") : T.none) + "</div>" +
      (labRows ? "<h2>" + T.labs + "</h2><table><tr><th>" + (ka() ? "მაჩვენებელი" : "Marker") + "</th><th>" + (ka() ? "შედეგი" : "Value") + "</th><th>" + V.t("ruNormRange") + "</th><th></th></tr>" + labRows + "</table>" : "") +
      "<h2>" + T.goals + "</h2><div>" + (goals || T.none) + "</div>" +
      "<div class='note'>" + T.note + "</div>" +
      "</body></html>";
    var w = window.open("", "_blank");
    if (!w) return;
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(function () { try { w.focus(); w.print(); } catch (e) {} }, 350);
  };
})(window.VITA);
