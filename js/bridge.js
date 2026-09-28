/* VITA realtime bridge — connects the patient app (app.html) and the doctor
   app (doctor.html). Two transports behind one send()/on() API:

     • SERVER  — when serve.py/backend.py is up (/api/health → backend:true):
                 EventSource('/api/events') in + fetch POST out. Works across
                 devices and networks (real signalling). Every call carries a
                 bearer token from POST /api/auth/login (demo auth: no password,
                 but the server binds role + uid to the token and enforces them).
     • LOCAL   — fallback for static hosting: BroadcastChannel (+ localStorage
                 'storage' event). Same-origin, same browser, cross-tab only.

   Call V.bridge.init(role) once ('patient' | 'doctor'); it probes the backend
   and upgrades to server mode if available, else stays local. */
(function (V) {
  if (!V) return;
  var CH = "vita-telemed";
  var bc = (typeof BroadcastChannel !== "undefined") ? new BroadcastChannel(CH) : null;
  var listeners = {};
  var mode = "local", role = "patient", uid = "*", token = "", es = null, esRetry = 0;
  var EVENTS = ["consult-request", "consult-accepted", "consult-ended", "consult-claimed"];

  function emit(type, payload) { (listeners[type] || []).forEach(function (cb) { try { cb(payload); } catch (e) {} }); }
  function lsGet(k) { try { return localStorage.getItem(k) || ""; } catch (_) { return ""; } }
  function lsSet(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (_) {} }

  // --- local transport (BroadcastChannel + storage) ---
  if (bc) bc.onmessage = function (e) { var m = e.data; if (m && m.type) emit(m.type, m.payload); };
  // storage is only a FALLBACK — if BroadcastChannel exists it already delivers
  // cross-tab, so listening to both would emit every event twice.
  window.addEventListener("storage", function (e) {
    if (bc || e.key !== CH || !e.newValue) return;
    try { var m = JSON.parse(e.newValue); if (m && m.type) emit(m.type, m.payload); } catch (_) {}
  });
  function localSend(type, payload) {
    var m = { type: type, payload: payload, t: Date.now() };
    if (bc) { try { bc.postMessage(m); } catch (_) {} }
    try { localStorage.setItem(CH, JSON.stringify(m)); localStorage.removeItem(CH); } catch (_) {}
  }
  function localUid(r) {
    var k = "vita.uid." + r, v = lsGet(k);
    if (!v) { v = "u_" + r + "_" + Math.random().toString(36).slice(2, 9); lsSet(k, v); }
    return v;
  }

  // --- server transport (SSE + fetch, bearer-token auth) ---
  function doctorKey() {
    // deploys that set VITA_DOCTOR_KEY: pass ?key=… once, it is remembered per browser
    try { var q = new URLSearchParams(location.search).get("key"); if (q) lsSet("vita.doctorKey", q); } catch (_) {}
    return lsGet("vita.doctorKey");
  }
  function login() {
    var name = "";
    try { name = (V.state && V.state.profile && V.state.profile.name) || ""; } catch (_) {}
    return fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: role, name: name, key: role === "doctor" ? doctorKey() : "" }) })
      .then(function (x) { return x.ok ? x.json() : x.json().then(function (j) { throw j; }); })
      .then(function (s) { token = s.token; uid = s.uid; lsSet("vita.token." + role, token); lsSet("vita.uid." + role, uid); return s; });
  }
  function ensureToken() { return token ? Promise.resolve() : login(); }
  function authFetch(url, opts, retried) {
    opts = opts || {};
    return ensureToken().then(function () {
      opts.headers = Object.assign({}, opts.headers || {}, { Authorization: "Bearer " + token });
      return fetch(url, opts);
    }).then(function (x) {
      if (x.status === 401 && !retried) { token = ""; return authFetch(url, opts, true); } // stale session (server restarted)
      return x;
    });
  }
  function openES() {
    if (es) { try { es.close(); } catch (_) {} es = null; }
    ensureToken().then(function () {
      es = new EventSource("/api/events?token=" + encodeURIComponent(token));
      EVENTS.forEach(function (name) { es.addEventListener(name, function (e) { try { emit(name, JSON.parse(e.data)); } catch (_) {} }); });
      es.onopen = function () { esRetry = 0; };
      es.onerror = function () {
        // CLOSED = the server refused (401 → token invalid after a restart): re-login and reopen, with backoff
        if (es && es.readyState === EventSource.CLOSED) { token = ""; setTimeout(openES, Math.min(30000, 1000 * Math.pow(2, esRetry++))); }
      };
    }).catch(function (err) { emit("auth-denied", err); });
  }
  function serverSend(type, payload) {
    var url, body;
    if (type === "consult-request") { url = "/api/consult/request"; body = { patient: payload }; }
    else if (type === "consult-accepted") { url = "/api/consult/accept"; body = { patientId: payload.patientId, doctor: payload.doctor }; }
    else if (type === "consult-ended") { url = "/api/consult/end"; body = { patientId: payload.patientId, rx: payload.rx, notes: payload.notes }; }
    else { localSend(type, payload); return; }
    authFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (x) { if (!x.ok) throw x; })
      .catch(function () { localSend(type, payload); });
  }

  V.bridge = {
    available: true,
    mode: function () { return mode; },
    uid: function () { return uid; },
    init: function (r) {
      role = r || "patient"; uid = localUid(role); token = lsGet("vita.token." + role);
      fetch("/api/health").then(function (x) { return x.ok ? x.json() : null; }).then(function (j) {
        if (!j || !j.backend) return;
        mode = "server";
        // validate a remembered token before trusting it (the server may have restarted)
        return authFetch("/api/ehr").then(function (x) {
          if (x.status === 403 || x.status === 401) throw new Error("auth");
        }).then(function () {
          openES();
          if (role === "doctor") { // replay the waiting queue into the doctor app
            authFetch("/api/consult/queue").then(function (x) { return x.json(); }).then(function (d) {
              (d.queue || []).forEach(function (item) { emit("consult-request", item); });
            }).catch(function () {});
          }
        });
      }).catch(function (err) { emit("auth-denied", err); });
    },
    send: function (type, payload) { if (mode === "server") serverSend(type, payload); else localSend(type, payload); },
    on: function (type, cb) { (listeners[type] = listeners[type] || []).push(cb); },
    _emit: emit, // in-tab demo/testing
  };
})(window.VITA);
