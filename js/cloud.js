/* VITA cloud layer (P0) — Supabase Auth + per-user state sync.

   • Off by default: without VITA_CONFIG.supabaseUrl/anonKey everything stays local/demo
     exactly as before (V.cloud.enabled() === false).
   • On: email OTP / Google / Apple sign-in; V.state is mirrored to public.state_snapshots
     (one JSONB row per user, RLS "own rows only"), debounced after every V.save(),
     pulled on sign-in and on realtime UPDATE from another device. Last-write-wins on
     the client's saved_at; localStorage stays the offline cache.
   Public API: V.cloud.enabled/init/user/signInWithOtp/verifyOtp/signInWithOAuth/signOut/push/pull */
(function () {
  var V = window.VITA;
  function CFG() { return window.VITA_CONFIG || {}; } // read lazily: QA can swap in tools/supabase_mock.js at runtime
  var SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  var sb = null, user = null, pushTimer = null, pushing = false, dirty = false, channel = null, ready = null;
  var listeners = [];

  function enabled() { var c = CFG(); return !!(c.supabaseUrl && c.supabaseAnonKey); }
  function emit(ev) { listeners.forEach(function (fn) { try { fn(ev, user); } catch (e) {} }); }

  function loadSdk() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = SDK; s.async = true;
      s.onload = function () { res(); }; s.onerror = function () { rej(new Error("supabase sdk failed to load")); };
      document.head.appendChild(s);
    });
  }

  // strip the heavy parts before upload: photo proofs are base64 (~60 KB each)
  function snapshot() {
    var s = JSON.parse(JSON.stringify(V.state));
    if (s.taskLogs) Object.keys(s.taskLogs).forEach(function (d) { Object.keys(s.taskLogs[d] || {}).forEach(function (t) { if (s.taskLogs[d][t]) delete s.taskLogs[d][t].photo; }); });
    return s;
  }

  function push() {
    if (!sb || !user) return Promise.resolve(false);
    if (pushing) { dirty = true; return Promise.resolve(false); }
    pushing = true;
    var savedAt = new Date(V.state.savedAt || Date.now()).toISOString();
    return sb.from("state_snapshots").upsert({ user_id: user.id, state: snapshot(), saved_at: savedAt }, { onConflict: "user_id" })
      .then(function (r) { if (r.error) throw r.error; emit("pushed"); return true; })
      .catch(function (e) { try { console.warn("[VITA cloud] push failed:", e.message || e); } catch (_) {} emit("push-failed"); return false; })
      .then(function (ok) { pushing = false; if (dirty) { dirty = false; schedulePush(); } return ok; });
  }
  function schedulePush() { clearTimeout(pushTimer); pushTimer = setTimeout(push, 1500); }

  function pull() {
    if (!sb || !user) return Promise.resolve(false);
    return sb.from("state_snapshots").select("state, saved_at").eq("user_id", user.id).maybeSingle()
      .then(function (r) {
        if (r.error) throw r.error;
        if (!r.data) { schedulePush(); return false; }           // first device: seed the cloud with local state
        var remoteAt = Date.parse(r.data.saved_at) || 0, localAt = V.state.savedAt || 0;
        if (remoteAt > localAt) {                                // another device wrote later → take it
          V.hydrate(r.data.state); V.state.savedAt = remoteAt; V.save({ local: true });
          emit("pulled"); if (V.render) V.render();
          return true;
        }
        if (localAt > remoteAt) schedulePush();                  // we are newer → publish
        return false;
      })
      .catch(function (e) { try { console.warn("[VITA cloud] pull failed:", e.message || e); } catch (_) {} return false; });
  }

  function subscribe() {
    if (!sb || !user || channel) return;
    try {
      channel = sb.channel("state:" + user.id)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "state_snapshots", filter: "user_id=eq." + user.id }, function () { pull(); })
        .subscribe();
    } catch (e) {}
  }
  function unsubscribe() { if (channel) { try { sb.removeChannel(channel); } catch (e) {} channel = null; } }

  function onSession(session) {
    var u = session && session.user ? session.user : null;
    var changed = (u && u.id) !== (user && user.id);
    user = u;
    if (u) {
      var meta = u.user_metadata || {};
      V.state.auth = { provider: (u.app_metadata && u.app_metadata.provider) || "email", name: meta.full_name || meta.name || "", email: u.email || "", connected: true, uid: u.id };
      if (V.state.auth.name && V.state.profile && !V.state.profile.name) V.state.profile.name = V.state.auth.name.split(" ")[0];
      V.save({ local: true });
      if (changed) { emit("signed-in"); pull().then(subscribe); }
    } else if (changed) {
      unsubscribe(); V.state.auth = null; V.save({ local: true }); emit("signed-out");
    }
  }

  function init() {
    if (!enabled()) return Promise.resolve(false);
    if (ready) return ready;
    ready = loadSdk().then(function () {
      sb = window.supabase.createClient(CFG().supabaseUrl, CFG().supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      sb.auth.onAuthStateChange(function (_ev, session) { onSession(session); });
      return sb.auth.getSession().then(function (r) { onSession(r.data && r.data.session); return true; });
    }).catch(function (e) { try { console.warn("[VITA cloud] init failed:", e.message || e); } catch (_) {} return false; });
    return ready;
  }

  // hook V.save: every local save schedules a cloud push (unless it came from a pull)
  var _save = V.save;
  V.save = function (opts) {
    V.state.savedAt = Date.now();
    var ok = _save.apply(this, arguments);
    if (!(opts && opts.local) && user) schedulePush();
    return ok;
  };

  V.cloud = {
    enabled: enabled,
    init: init,
    user: function () { return user; },
    on: function (fn) { listeners.push(fn); },
    signInWithOtp: function (email) {
      return init().then(function () { return sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true } }); })
        .then(function (r) { if (r.error) throw r.error; return true; });
    },
    verifyOtp: function (email, token) {
      return init().then(function () { return sb.auth.verifyOtp({ email: email, token: token, type: "email" }); })
        .then(function (r) { if (r.error) throw r.error; onSession(r.data && r.data.session); return r.data.user; });
    },
    signInWithOAuth: function (provider) {  // "google" | "apple" — full-page redirect back to app.html
      return init().then(function () {
        return sb.auth.signInWithOAuth({ provider: provider, options: { redirectTo: location.origin + location.pathname } });
      }).then(function (r) { if (r.error) throw r.error; return true; });
    },
    signOut: function () {
      unsubscribe();
      var p = sb ? sb.auth.signOut() : Promise.resolve();
      return p.then(function () { user = null; V.state.auth = null; V.save({ local: true }); emit("signed-out"); });
    },
    push: push, pull: pull,
  };
})();
