/* VITA realtime bridge — connects the patient app (app.html) and the doctor
   app (doctor.html) live, across browser tabs, with NO server: BroadcastChannel
   (+ a localStorage 'storage' event fallback). This stands in for the real
   backend signalling (WebSocket / WebRTC) in the prototype. Same-origin only. */
(function (V) {
  if (!V) return;
  var CH = "vita-telemed";
  var bc = (typeof BroadcastChannel !== "undefined") ? new BroadcastChannel(CH) : null;
  var listeners = {};
  function emit(type, payload) { (listeners[type] || []).forEach(function (cb) { try { cb(payload); } catch (e) {} }); }
  if (bc) bc.onmessage = function (e) { var m = e.data; if (m && m.type) emit(m.type, m.payload); };
  window.addEventListener("storage", function (e) {
    if (e.key !== CH || !e.newValue) return;
    try { var m = JSON.parse(e.newValue); if (m && m.type) emit(m.type, m.payload); } catch (_) {}
  });
  V.bridge = {
    available: true,
    send: function (type, payload) {
      var m = { type: type, payload: payload, t: Date.now() };
      if (bc) { try { bc.postMessage(m); } catch (_) {} }
      try { localStorage.setItem(CH, JSON.stringify(m)); localStorage.removeItem(CH); } catch (_) {}
    },
    on: function (type, cb) { (listeners[type] = listeners[type] || []).push(cb); },
    _emit: emit, // exposed for in-tab demo/testing
  };
})(window.VITA);
