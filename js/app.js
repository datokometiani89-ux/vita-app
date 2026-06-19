/* VITA app core: router, phone chrome, navigation, settings sheet */
(function () {
  var V = window.VITA;
  var root = document.getElementById("app");

  /* ---------- routes ---------- */
  // onboarding flow order
  var FLOW = ["splash", "intro", "s1", "s2", "s3", "s4", "s5", "analyse", "profile", "bodymap", "checkup", "goals"];
  var TABS = ["home", "plan", "vita", "progress"];

  var current = null;

  function go(route) {
    location.hash = "#/" + route;
  }
  V.go = go;

  function routeFromHash() {
    var h = location.hash.replace(/^#\/?/, "");
    return h || (V.state.onboarded ? "home" : "splash");
  }

  /* ---------- chrome helpers ---------- */
  V.statusbar = function (onGreen) {
    return (
      '<div class="statusbar ' + (onGreen ? "on-green" : "") + '">' +
      "<span>9:41</span>" +
      '<span class="dots">' +
      '<svg viewBox="0 0 24 16" fill="currentColor"><rect x="0" y="9" width="3.4" height="6" rx="1"/><rect x="5" y="6.5" width="3.4" height="8.5" rx="1"/><rect x="10" y="3.6" width="3.4" height="11.4" rx="1"/><rect x="15" y="1" width="3.4" height="14" rx="1"/></svg>' +
      '<svg viewBox="0 0 22 16" fill="currentColor"><path d="M11 3.2c2.7 0 5.2 1 7.1 2.8l1.5-1.6A12.4 12.4 0 0 0 11 .9 12.4 12.4 0 0 0 2.4 4.4L3.9 6A10 10 0 0 1 11 3.2Zm0 4.2c1.6 0 3 .6 4.1 1.6l1.5-1.6A8.2 8.2 0 0 0 11 5.3a8.2 8.2 0 0 0-5.6 2.1L6.9 9A6 6 0 0 1 11 7.4Zm0 4.1c.7 0 1.4.3 1.9.8L11 14.6 9.1 12.3c.5-.5 1.2-.8 1.9-.8Z"/></svg>' +
      '<svg viewBox="0 0 28 16" fill="none" stroke="currentColor"><rect x="1" y="2.5" width="22" height="11" rx="3"/><rect x="3" y="4.5" width="17" height="7" rx="1.5" fill="currentColor" stroke="none"/><rect x="24.5" y="6" width="2.2" height="4" rx="1" fill="currentColor" stroke="none"/></svg>' +
      "</span></div>"
    );
  };

  V.tabbar = function (active) {
    function tab(id, icon, key) {
      return '<button class="tab ' + (active === id ? "on" : "") + '" data-tab="' + id + '">' +
        V.icon(icon) + "<span>" + V.t(key) + "</span></button>";
    }
    return (
      '<nav class="tabbar">' +
      tab("home", "home", "nHome") +
      tab("plan", "plan", "nPlan") +
      '<button class="fab" data-fab="1">' + V.icon("plus") + "</button>" +
      tab("vita", "chat", "nVita") +
      tab("progress", "progress", "nProgress") +
      "</nav>"
    );
  };

  /* mount a screen: { body, tab, scrollClass } */
  function mount(html, opts) {
    opts = opts || {};
    root.innerHTML =
      '<div class="app-stage"><div class="phone">' +
      '<div class="phone__notch"></div>' +
      html +
      "</div></div>";
    wireChrome();
    if (opts.onMount) opts.onMount();
  }
  V.mount = mount;

  /* ---------- settings sheet ---------- */
  function settingsSheet() {
    var s = V.state;
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    return (
      '<div class="sheet-overlay" id="setSheet"><div class="sheet">' +
      '<div class="sheet__grab"></div>' +
      "<h3>" + V.t("setTitle") + "</h3>" +
      '<div class="set-row"><span>' + V.t("setLang") + "</span>" +
      '<div class="seg"><button data-lang="ka" class="' + (V.lang() === "ka" ? "on" : "") + '">ქარ</button>' +
      '<button data-lang="en" class="' + (V.lang() === "en" ? "on" : "") + '">EN</button></div></div>' +
      '<div class="set-row"><span>' + V.t("setTheme") + "</span>" +
      '<div class="toggle ' + (dark ? "on" : "") + '" id="themeToggle"></div></div>' +
      (V.features && V.features.notifSupported()
        ? '<div class="set-row"><span>' + V.t("setReminders") + "</span>" +
          '<div class="toggle ' + (V.features.notifOn() ? "on" : "") + '" id="remToggle"></div></div>'
        : "") +
      '<div class="set-sub">' + V.t("setData") + "</div>" +
      '<button class="set-link" id="icsBtn">' + V.icon("calendar") + " " + V.t("setExportICS") + "</button>" +
      '<button class="set-link" id="jsonBtn">' + V.icon("file") + " " + V.t("setExportJSON") + "</button>" +
      '<button class="set-link" id="printBtn">' + V.icon("file") + " " + V.t("setPrint") + "</button>" +
      '<button class="set-reset" id="resetBtn">' + V.t("setReset") + "</button>" +
      "</div></div>"
    );
  }
  V.settingsSheet = settingsSheet;

  function wireChrome() {
    // tabs
    root.querySelectorAll("[data-tab]").forEach(function (b) {
      b.addEventListener("click", function () { go(b.getAttribute("data-tab")); });
    });
    // fab → results upload
    var fab = root.querySelector("[data-fab]");
    if (fab) fab.addEventListener("click", function () { go("results"); });

    // settings sheet open
    root.querySelectorAll("[data-open-settings]").forEach(function (b) {
      b.addEventListener("click", openSettings);
    });

    wireSettingsSheet();
  }

  V.openSettings = function () { openSettings(); };
  function openSettings() {
    var existing = root.querySelector("#setSheet");
    if (!existing) {
      var phone = root.querySelector(".phone");
      phone.insertAdjacentHTML("beforeend", settingsSheet());
      wireSettingsSheet();
    }
    requestAnimationFrame(function () {
      var sh = root.querySelector("#setSheet");
      if (sh) sh.classList.add("on");
    });
  }

  function wireSettingsSheet() {
    var sheet = root.querySelector("#setSheet");
    if (!sheet) return;
    sheet.addEventListener("click", function (e) {
      if (e.target === sheet) sheet.classList.remove("on");
    });
    sheet.querySelectorAll("[data-lang]").forEach(function (b) {
      b.addEventListener("click", function () {
        V.setLang(b.getAttribute("data-lang"));
        render();
      });
    });
    var tog = sheet.querySelector("#themeToggle");
    if (tog) tog.addEventListener("click", function () {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      setTheme(!dark);
      tog.classList.toggle("on", !dark);
    });
    var rem = sheet.querySelector("#remToggle");
    if (rem) rem.addEventListener("click", function () {
      if (V.features.notifOn()) { V.features.disableNotifications(); rem.classList.remove("on"); }
      else {
        V.features.enableNotifications().then(function (ok) {
          rem.classList.toggle("on", ok);
          if (!ok && V.features.notifSupported() && Notification.permission === "denied") alert(V.t("setNotifBlocked"));
        });
      }
    });
    var ics = sheet.querySelector("#icsBtn");
    if (ics) ics.addEventListener("click", function () { V.features.exportICS(); });
    var jsonb = sheet.querySelector("#jsonBtn");
    if (jsonb) jsonb.addEventListener("click", function () { V.features.exportJSON(); });
    var pr = sheet.querySelector("#printBtn");
    if (pr) pr.addEventListener("click", function () { V.features.printSummary(); });

    var reset = sheet.querySelector("#resetBtn");
    if (reset) reset.addEventListener("click", function () {
      if (confirm(V.t("setResetConfirm"))) { V.reset(); go("splash"); render(); }
    });
  }

  function setTheme(dark) {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("vita.theme", dark ? "dark" : "light");
  }
  V.setTheme = setTheme;

  /* ---------- render dispatch ---------- */
  function render() {
    var r = routeFromHash();
    current = r;

    // guard: app tabs require onboarding
    if ((TABS.indexOf(r) >= 0 || r === "results") && !V.state.onboarded) {
      // allow preview anyway (demo) — but seed nothing
    }

    var S = V.screens;
    var fn = S[r];
    if (!fn) { go(V.state.onboarded ? "home" : "splash"); return; }
    fn();
    var sc = root.querySelector(".screen");
    if (sc) sc.scrollTop = 0;
  }
  V.render = render;

  V.flowNext = function (from) {
    var i = FLOW.indexOf(from);
    if (i >= 0 && i < FLOW.length - 1) go(FLOW[i + 1]);
  };
  V.flowPrev = function (from) {
    var i = FLOW.indexOf(from);
    if (i > 0) go(FLOW[i - 1]);
  };

  /* ---------- boot ---------- */
  if (V.pruneState) try { V.pruneState(); } catch (e) {}
  setTheme(localStorage.getItem("vita.theme") === "dark");
  V.setLang(V.lang());
  window.addEventListener("hashchange", render);
  // probe for the local AI backend; re-render the chat if it's live so the
  // "powered by Claude" hint and streaming path activate.
  if (V.api && V.api.ready) {
    V.api.ready().then(function (on) {
      if (on && current === "vita") render();
    });
  }
  // re-arm today's reminders if the user has them on
  if (V.features && V.features.notifOn()) V.features.scheduleToday();
  render();
})();
