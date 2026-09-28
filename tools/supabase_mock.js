/* In-page mock of the Supabase JS client subset VITA uses — lets QA exercise the sign-in
   and sync code paths in the preview without a real project.
   Usage (console, BEFORE the app loads cloud, or reload after setting):
     localStorage.setItem("vita.mockCloud", "1"); location.reload();
   OTP code is always 123456. Data lives in localStorage "vita.mockdb". */
(function () {
  if (localStorage.getItem("vita.mockCloud") !== "1") return;
  window.VITA_CONFIG = { supabaseUrl: "https://mock.supabase.co", supabaseAnonKey: "mock-anon", sentryDsn: "", release: "vita@mock" };
  var db = JSON.parse(localStorage.getItem("vita.mockdb") || "{}"); db.state_snapshots = db.state_snapshots || {};
  function saveDb() { localStorage.setItem("vita.mockdb", JSON.stringify(db)); }
  var session = JSON.parse(localStorage.getItem("vita.mocksession") || "null"), authCb = null;
  function setSession(s) { session = s; localStorage.setItem("vita.mocksession", JSON.stringify(s)); if (authCb) setTimeout(function () { authCb(s ? "SIGNED_IN" : "SIGNED_OUT", s); }, 0); }
  function userFor(email) { return { id: "u_" + btoa(email).replace(/=/g, "").slice(0, 12), email: email, app_metadata: { provider: "email" }, user_metadata: {} }; }
  function ok(data) { return Promise.resolve({ data: data, error: null }); }
  var client = {
    auth: {
      onAuthStateChange: function (cb) { authCb = cb; return { data: { subscription: { unsubscribe: function () { authCb = null; } } } }; },
      getSession: function () { return ok({ session: session }); },
      signInWithOtp: function (o) { db.pendingEmail = o.email; saveDb(); return ok({}); },
      verifyOtp: function (o) { if (o.token !== "123456") return Promise.resolve({ data: null, error: { message: "Invalid code" } }); var s = { user: userFor(o.email), access_token: "mock" }; setSession(s); return ok({ session: s, user: s.user }); },
      signInWithOAuth: function (o) { var s = { user: Object.assign(userFor(o.provider + "@mock.test"), { user_metadata: { full_name: "Mock " + o.provider } }), access_token: "mock" }; setSession(s); return ok({}); },
      signOut: function () { setSession(null); return ok({}); },
    },
    from: function (table) {
      var q = { _f: {} };
      q.upsert = function (row) { db[table][row.user_id] = Object.assign({}, row, { updated_at: new Date().toISOString() }); saveDb(); return ok(row); };
      q.select = function () { return q; }; q.eq = function (k, v) { q._f[k] = v; return q; };
      q.maybeSingle = function () { return ok(db[table][q._f.user_id] || null); };
      return q;
    },
    channel: function () { var ch = { on: function () { return ch; }, subscribe: function () { return ch; } }; return ch; },
    removeChannel: function () {},
  };
  window.supabase = { createClient: function () { return client; } };
  // helper for QA: simulate another device writing a newer snapshot
  window.mockOtherDevice = function (patch) { var s = session; if (!s) return "not signed in"; var row = db.state_snapshots[s.user.id]; var st = row ? row.state : {}; Object.assign(st, patch); db.state_snapshots[s.user.id] = { user_id: s.user.id, state: st, saved_at: new Date(Date.now() + 5000).toISOString() }; saveDb(); return "written"; };
})();
