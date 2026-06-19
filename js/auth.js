/* ============================================================
   VITA — social sign-in / registration
   Real OAuth (Google Identity Services + Facebook SDK) activates
   automatically once you set the client IDs in V.AUTH. Until then a
   prototype fallback resolves a demo identity so the flow works for
   the demo. No passwords are ever entered in-app — the real flow
   hands off to Google/Facebook's own consent popup.
   Public API:
     V.auth.signIn("google"|"facebook")  -> Promise<{provider,name,email}>
     V.applyAuth(identity)                -> store + prefill profile
     V.signOut()
   ============================================================ */
(function () {
  var V = window.VITA;

  // ↓ paste real credentials here to enable live OAuth (leave empty = demo mode)
  V.AUTH = { googleClientId: "", facebookAppId: "" };

  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (document.querySelector('script[src="' + src + '"]')) return res(true);
      var s = document.createElement("script");
      s.src = src; s.async = true; s.defer = true;
      s.onload = function () { res(true); };
      s.onerror = function () { rej(new Error("load failed")); };
      document.head.appendChild(s);
    });
  }

  /* ---------- real Google (only when googleClientId is set) ---------- */
  function realGoogle() {
    return loadScript("https://accounts.google.com/gsi/client").then(function () {
      return new Promise(function (resolve, reject) {
        if (!(window.google && google.accounts && google.accounts.oauth2)) return reject();
        var client = google.accounts.oauth2.initTokenClient({
          client_id: V.AUTH.googleClientId,
          scope: "openid profile email",
          callback: function (resp) {
            if (!resp || !resp.access_token) return reject();
            fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: "Bearer " + resp.access_token }
            }).then(function (r) { return r.json(); }).then(function (u) {
              resolve({ provider: "google", name: u.name || "", email: u.email || "", picture: u.picture || "" });
            }).catch(reject);
          },
        });
        client.requestAccessToken();
      });
    });
  }

  /* ---------- real Facebook (only when facebookAppId is set) ---------- */
  function realFacebook() {
    return loadScript("https://connect.facebook.net/en_US/sdk.js").then(function () {
      return new Promise(function (resolve, reject) {
        if (!window.FB) return reject();
        FB.init({ appId: V.AUTH.facebookAppId, cookie: true, xfbml: false, version: "v19.0" });
        FB.login(function (resp) {
          if (!resp || resp.status !== "connected") return reject();
          FB.api("/me", { fields: "name,email" }, function (u) {
            resolve({ provider: "facebook", name: u.name || "", email: u.email || "", picture: "" });
          });
        }, { scope: "public_profile,email" });
      });
    });
  }

  /* ---------- prototype fallback (demo identity) ---------- */
  function mock(provider) {
    var demo = {
      google: { name: "Giorgi Beridze", email: "giorgi.beridze@gmail.com" },
      facebook: { name: "Giorgi Beridze", email: "giorgi.beridze@facebook.com" },
    }[provider] || { name: "VITA User", email: "user@vita.ge" };
    // tiny delay so the button shows its loading state, like a real popup
    return new Promise(function (resolve) {
      setTimeout(function () { resolve({ provider: provider, name: demo.name, email: demo.email, mock: true }); }, 500);
    });
  }

  V.auth = {
    signIn: function (provider) {
      try {
        if (provider === "google" && V.AUTH.googleClientId) return realGoogle().catch(function () { return mock(provider); });
        if (provider === "facebook" && V.AUTH.facebookAppId) return realFacebook().catch(function () { return mock(provider); });
      } catch (e) {}
      return mock(provider);
    },
    isLive: function (provider) {
      return provider === "google" ? !!V.AUTH.googleClientId : provider === "facebook" ? !!V.AUTH.facebookAppId : false;
    },
  };

  V.applyAuth = function (id) {
    V.state.auth = { provider: id.provider, name: id.name || "", email: id.email || "", connected: true };
    if (id.name && V.state.profile && !V.state.profile.name) {
      V.state.profile.name = id.name.split(" ")[0];
    }
    // a social registration also links the vitaapp.ge account by email
    if (id.email && V.state.vitaAccount && !V.state.vitaAccount.connected) {
      V.state.vitaAccount = { connected: true, email: id.email, plan: "basic" };
    }
    V.save();
  };

  V.signOut = function () { V.state.auth = null; V.save(); };

  /* brand glyphs for the sign-in buttons */
  V.brandGlyph = function (provider) {
    if (provider === "google") {
      return '<svg class="sso-ic" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
        '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>' +
        '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>' +
        '<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>' +
        '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>';
    }
    if (provider === "facebook") {
      return '<svg class="sso-ic" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
        '<path fill="#1877F2" d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08V12h3.05V9.41c0-3 1.79-4.66 4.53-4.66 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38C19.61 22.95 24 17.99 24 12z"/></svg>';
    }
    return "";
  };
})();
