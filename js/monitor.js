/* VITA error monitoring — Sentry when VITA_CONFIG.sentryDsn is set, otherwise a tiny
   in-memory ring buffer (V.monitor.last()) so QA can read recent errors from the console. */
(function () {
  var V = window.VITA, CFG = window.VITA_CONFIG || {};
  var buf = [];
  function record(kind, msg, extra) { buf.push({ t: new Date().toISOString(), kind: kind, msg: String(msg).slice(0, 500), extra: extra }); if (buf.length > 50) buf.shift(); }
  window.addEventListener("error", function (e) { record("error", e.message, (e.filename || "") + ":" + (e.lineno || "")); });
  window.addEventListener("unhandledrejection", function (e) { record("rejection", (e.reason && (e.reason.message || e.reason)) || "unhandled"); });
  V.monitor = { last: function () { return buf.slice(); }, capture: function (err, ctx) { record("captured", err && err.message || err, ctx); if (window.Sentry) { try { Sentry.captureException(err, { extra: ctx }); } catch (_) {} } } };
  if (!CFG.sentryDsn) return;
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@sentry/browser@8/build/bundle.min.js"; s.async = true; s.crossOrigin = "anonymous";
  s.onload = function () {
    try {
      Sentry.init({ dsn: CFG.sentryDsn, release: CFG.release || "vita", environment: location.hostname === "localhost" ? "dev" : "prod",
        sendDefaultPii: false, tracesSampleRate: 0,
        beforeSend: function (ev) { // never ship health data: strip state-like payloads
          if (ev.extra) delete ev.extra.state;
          return ev;
        } });
      Sentry.setTag("lang", V.lang ? V.lang() : "ka");
    } catch (e) {}
  };
  document.head.appendChild(s);
})();
