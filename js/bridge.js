/* VITA realtime bridge — connects the patient app (app.html) and the doctor
   app (doctor.html). Two transports behind one send()/on() API:

     • SERVER  — when serve.py/backend.py is up (/api/health → backend:true):
                 EventSource('/api/events') in + fetch POST out. Works across
                 devices and networks (real signalling).
     • LOCAL   — fallback for static hosting: BroadcastChannel (+ localStorage
                 'storage' event). Same-origin, same browser, cross-tab only.

   Call V.bridge.init(role) once ('patient' | 'doctor'); it probes the backend
   and upgrades to server mode if available, else stays local. */
(function (V) {
  if (!V) return;
  var CH = "vita-telemed";
  var bc = (typeof BroadcastChannel !== "undefined") ? new BroadcastChannel(CH) : null;
  var listeners = {};
  var mode = "local", role = "patient", uid = "*", es = null;
  var EVENTS = ["consult-request", "consult-accepted", "consult-ended", "consult-claimed"];

  function emit(type, payload) { (listeners[type] || []).forEach(function (cb) { try { cb(payload); } catch (e) {} }); }

  // --- local transport (BroadcastChannel + storage) ---
  if (bc) bc.onmessage = function (e) { var m = e.data; if (m && m.type) emit(m.type, m.payload); };
  window.addEventListener("storage", function (e) {
    if (e.key !== CH || !e.newValue) return;
    try { var m = JSON.parse(e.newValue); if (m && m.type) emit(m.type, m.payload); } catch (_) {}
  });
  function localSend(type, payload) {
    var m = { type: type, payload: payload, t: Date.now() };
    if (bc) { try { bc.postMessage(m); } catch (_) {} }
    try { localStorage.setItem(CH, JSON.stringify(m)); localStorage.removeItem(CH); } catch (_) {}
  }

  // --- server transport (SSE + fetch) ---
  function uidFor(r) {
    try { var k = "vita.uid." + r, v = localStorage.getItem(k);
      if (!v) { v = "u_" + r + "_" + Math.random().toString(36).slice(2, 9); localStorage.setItem(k, v); }
      return v;
    } catch (_) { return "u_" + r; }
  }
  function openES() {
    try {
      es = new EventSource("/api/events?role=" + encodeURIComponent(role) + "&uid=" + encodeURIComponent(uid));
      EVENTS.forEach(function (name) { es.addEventListener(name, function (e) { try { emit(name, JSON.parse(e.data)); } catch (_) {} }); });
    } catch (_) {}
  }
  function serverSend(type, payload) {
    var url, body;
    if (type === "consult-request") { url = "/api/consult/request"; body = { patient: payload }; }
    else if (type === "consult-accepted") { url = "/api/consult/accept"; body = { patientId: payload.patientId, patientUid: payload.patientUid, doctor: payload.doctor }; }
    else if (type === "consult-ended") { url = "/api/consult/end"; body = { patientId: payload.patientId, patientUid: payload.patientUid, rx: payload.rx, notes: payload.notes }; }
    else { localSend(type, payload); return; }
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(function () { localSend(type, payload); });
  }

  V.bridge = {
    available: true,
    mode: function () { return mode; },
    uid: function () { return uid; },
    init: function (r) {
      role = r || "patient"; uid = uidFor(role);
      fetch("/api/health").then(function (x) { return x.ok ? x.json() : null; }).then(function (j) {
        if (!j || !j.backend) return;
        mode = "server";
        openES();
        if (role === "doctor") { // replay the waiting queue into the doctor app
          fetch("/api/consult/queue").then(function (x) { return x.json(); }).then(function (d) {
            (d.queue || []).forEach(function (item) { emit("consult-request", item); });
          }).catch(function () {});
        }
      }).catch(function () {});
    },
    send: function (type, payload) { if (mode === "server") serverSend(type, payload); else localSend(type, payload); },
    on: function (type, cb) { (listeners[type] = listeners[type] || []).push(cb); },
    _emit: emit, // in-tab demo/testing
  };
})(window.VITA);
