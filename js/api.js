/* VITA API client — talks to the local Claude proxy (serve.py).
   Falls back to the built-in offline assistant when no backend/key. */
window.VITA = window.VITA || {};

(function (V) {
  var state = { checked: false, ai: false, model: null, provider: null };

  // health check (once). Resolves to boolean "real AI available".
  V.api = {
    ready: function () {
      if (state.checked) return Promise.resolve(state.ai);
      return fetch("/api/health", { method: "GET" })
        .then(function (r) { return r.ok ? r.json() : { ai: false }; })
        .then(function (j) { state.checked = true; state.ai = !!j.ai; state.model = j.model || null; state.provider = j.provider || null; return state.ai; })
        .catch(function () { state.checked = true; state.ai = false; return false; });
    },

    aiOn: function () { return state.ai; },
    model: function () { return state.model; },
    provider: function () { return state.provider; },

    /* Stream a chat reply.
       onToken(text), onDone(fullText), onError(err).
       Returns a promise; if the backend is unavailable it rejects so the
       caller can use the offline mock. */
    chat: function (messages, onToken, onDone, onError) {
      return fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages, profile: V.state.profile, lang: V.lang() }),
      }).then(function (res) {
        if (!res.ok || !res.body) throw new Error("chat unavailable (" + res.status + ")");
        var reader = res.body.getReader();
        var dec = new TextDecoder();
        var buf = "", full = "";
        function pump() {
          return reader.read().then(function (r) {
            if (r.done) { if (onDone) onDone(full); return full; }
            buf += dec.decode(r.value, { stream: true });
            var parts = buf.split("\n\n");
            buf = parts.pop();
            parts.forEach(function (block) {
              var ev = "message", data = "";
              block.split("\n").forEach(function (line) {
                if (line.indexOf("event:") === 0) ev = line.slice(6).trim();
                else if (line.indexOf("data:") === 0) data += line.slice(5).trim();
              });
              if (!data) return;
              var obj; try { obj = JSON.parse(data); } catch (e) { return; }
              if (ev === "token" && obj.t) { full += obj.t; if (onToken) onToken(obj.t, full); }
              else if (ev === "error") { if (onError) onError(obj.message); throw new Error(obj.message || "ai error"); }
            });
            return pump();
          });
        }
        return pump();
      });
    },

    /* AI interpretation of lab results → resolves to summary string. */
    interpret: function (values, refs) {
      return fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: values, refs: refs, profile: V.state.profile, lang: V.lang() }),
      }).then(function (r) {
        if (!r.ok) throw new Error("interpret unavailable");
        return r.json();
      }).then(function (j) { return j.summary; });
    },
    // food photo → calorie estimate (multimodal). imageDataUrl = "data:image/..;base64,.."
    vision: function (imageDataUrl, mime) {
      return fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl, mime: mime, lang: V.lang() }),
      }).then(function (r) {
        if (r.ok) return r.json();
        // surface WHY it failed so the UI can say "busy, try again" vs "unavailable".
        return r.json().catch(function () { return {}; }).then(function (j) {
          var msg = (j && j.error) || ("vision unavailable (" + r.status + ")");
          var e = new Error(msg);
          e.status = r.status;
          e.busy = r.status === 429 || r.status === 502 || r.status === 503 || /429|quota|rate|too many|overload|busy/i.test(msg);
          throw e;
        });
      });
    },
  };
})(window.VITA);
