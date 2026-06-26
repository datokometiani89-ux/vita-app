#!/usr/bin/env python3
"""
VITA local server.

Serves the static site/app AND proxies the VITA AI assistant to a real LLM.

Two ways to enable real AI (pick one):

  • FREE — Google Gemini (no credit card needed):
        1. https://aistudio.google.com  →  "Get API key"  (sign in with Google)
        2. export GEMINI_API_KEY=AIza...
        3. python3 serve.py            # no pip install needed
        Great for demos / a few users — Gemini has a free tier.

  • Claude (Anthropic) — most capable, requires billing:
        pip install anthropic
        export ANTHROPIC_API_KEY=sk-ant-...
        python3 serve.py

If both keys are set, Claude wins. With no key the site still works fully —
the app falls back to the built-in offline assistant.

Endpoints:
    GET  /api/health      -> {"ok": true, "ai": <bool>, "provider": "...", "model": "..."}
    POST /api/chat        -> Server-Sent Events stream of the assistant reply
    POST /api/interpret   -> {"summary": "..."} AI reading of lab results
"""

import json
import os
import time
import queue
import http.server
import socketserver
import urllib.request
import urllib.error
from urllib.parse import urlparse, parse_qs

import backend  # real server side: auth, SSE bus, consult routing, EHR, payment/video seams

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "4170"))
# 127.0.0.1 for local; hosting platforms (Render/Railway) need 0.0.0.0 — set HOST=0.0.0.0
HOST = os.environ.get("HOST", "127.0.0.1")

CLAUDE_MODEL = os.environ.get("VITA_CLAUDE_MODEL", "claude-opus-4-8")
GEMINI_MODEL = os.environ.get("VITA_GEMINI_MODEL", "gemini-2.0-flash")
# free-tier quota is per-model, so on a 429 we fall back to sibling models that
# have their own buckets — this keeps the chat alive under rate limits.
# Fallbacks must be CURRENT models (Gemini 1.5 was retired by Google → 404).
# Each has its own free-tier quota bucket, so falling across them survives a 429.
GEMINI_FALLBACKS = [m.strip() for m in os.environ.get(
    "VITA_GEMINI_FALLBACKS", "gemini-2.5-flash,gemini-2.0-flash-lite,gemini-2.5-flash-lite").split(",") if m.strip()]
# When a model returns 429 we park it here (model -> epoch when it's usable again)
# so we don't waste an attempt re-hitting a throttled model on every request.
_MODEL_COOLDOWN = {}

# --- provider resolution ---------------------------------------------------
_claude = None
_provider = None
_model = None
_err = None

if os.environ.get("ANTHROPIC_API_KEY"):
    try:
        import anthropic  # type: ignore
        _claude = anthropic.Anthropic()
        _provider, _model = "claude", CLAUDE_MODEL
    except Exception:
        _err = "anthropic SDK not installed (pip install anthropic)"

if _provider is None and os.environ.get("GEMINI_API_KEY"):
    _provider, _model = "gemini", GEMINI_MODEL

if _provider is None and _err is None:
    _err = "no API key set (GEMINI_API_KEY for free, or ANTHROPIC_API_KEY)"


def ai_on():
    return _provider is not None


# --- prompts ---------------------------------------------------------------
def system_prompt(profile, lang):
    lang_line = "Respond in Georgian (ქართული)." if lang == "ka" else "Respond in English."
    return (
        "You are VITA, a warm, proactive personal health AI inside the VITA app. "
        "You combine general, mental, body/fitness and aesthetic (skin, hair, oral) "
        "health into one holistic, longevity-focused plan. You are not a doctor and "
        "never diagnose definitively or prescribe; defer medication/clinical decisions "
        "to the user's physician. Be concise, practical and encouraging — short "
        "paragraphs, concrete daily actions, and reference the user's own data when "
        "relevant. " + lang_line +
        " The user's health profile (JSON, use it, don't echo it back verbatim): " +
        json.dumps(profile or {}, ensure_ascii=False)
    )


def interpret_prompt(values, refs, lang):
    lines = []
    for r in refs or []:
        v = (values or {}).get(r.get("id"))
        if v is None:
            continue
        lines.append("- %s: %s %s (normal %s-%s %s)" % (
            r.get("name"), v, r.get("unit"), r.get("low"), r.get("high"), r.get("unit")))
    body = "\n".join(lines) if lines else "(no values provided)"
    lang_line = "Write in Georgian." if lang == "ka" else "Write in English."
    return ("These are the user's lab results. Give a short, plain-language interpretation: "
            "which values are out of range and what that means, then 2-3 concrete next steps. "
            "Under 120 words, no markdown headers. Remind them to confirm medication changes "
            "with their doctor. " + lang_line + "\n\n" + body)


def to_gemini(messages):
    out = []
    for m in messages:
        role = "model" if m.get("role") == "vita" else "user"
        text = (m.get("text") or "").strip()
        if text:
            out.append({"role": role, "parts": [{"text": text}]})
    return out


# --- LLM calls -------------------------------------------------------------
def claude_stream(system, messages, emit):
    msgs = [{"role": ("assistant" if m.get("role") == "vita" else "user"),
             "content": m.get("text", "")} for m in messages if (m.get("text") or "").strip()]
    with _claude.messages.stream(model=CLAUDE_MODEL, max_tokens=1024, system=system, messages=msgs) as s:
        for text in s.text_stream:
            emit(text)


def _gemini_models():
    seen, out = set(), []
    for m in [GEMINI_MODEL] + GEMINI_FALLBACKS:
        if m and m not in seen:
            seen.add(m); out.append(m)
    now = time.time()
    ready = [m for m in out if _MODEL_COOLDOWN.get(m, 0) <= now]
    return ready or out   # if every model is cooling down, still try them all


def _note_429(model, e):
    """Read Google's 429 body for the retry delay + which quota was hit, and park
    the model on a cooldown. Returns (delay_seconds, quota_metric)."""
    delay, metric = 30, ""
    try:
        body = json.loads(e.read().decode("utf-8", "ignore"))
        for d in body.get("error", {}).get("details", []):
            ty = d.get("@type", "")
            if "RetryInfo" in ty and d.get("retryDelay"):
                try:
                    delay = int(float(str(d["retryDelay"]).rstrip("s")))
                except Exception:
                    pass
            if "QuotaFailure" in ty:
                for v in d.get("violations", []):
                    # quotaId carries the window (…PerDay… / …PerMinute…); prefer it.
                    metric = v.get("quotaId") or v.get("quotaMetric") or metric
    except Exception:
        pass
    delay = min(max(delay, 5), 300)
    _MODEL_COOLDOWN[model] = time.time() + delay
    return delay, metric


def _raise_gemini(last, q429):
    """Raise the most useful error after the whole fallback chain failed."""
    if last is None:
        return
    if getattr(last, "code", None) == 429 and q429:
        delay, metric = q429
        per = "per-day" if "Day" in (metric or "") else ("per-minute" if "Minute" in (metric or "") else "rate")
        raise RuntimeError("Gemini free-tier quota reached (%s limit) — try again in ~%ss." % (per, delay))
    raise last


def _better_err(prev, e):
    # Keep the most diagnostic error across the fallback chain: a 429/5xx is far
    # more informative than a 404/400 (a 404 just means that fallback model is
    # retired/unknown). Without this, a rate-limit (429) gets masked by a later
    # retired-model 404 and the client sees the wrong cause.
    if prev is None:
        return e
    if prev.code in (400, 404) and e.code not in (400, 404):
        return e
    return prev


def _gemini_open(model, payload, stream):
    key = os.environ["GEMINI_API_KEY"]
    verb = "streamGenerateContent?alt=sse&" if stream else "generateContent?"
    url = "https://generativelanguage.googleapis.com/v1beta/models/%s:%skey=%s" % (model, verb, key)
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                 headers={"Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=60)


def gemini_stream(system, messages, emit):
    payload = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": to_gemini(messages),
        "generationConfig": {"maxOutputTokens": 1024, "temperature": 0.7},
    }
    last = None; q429 = None
    for model in _gemini_models():
        try:
            with _gemini_open(model, payload, True) as resp:  # 429/404 raises here, before any emit
                for raw in resp:
                    line = raw.decode("utf-8", "ignore").strip()
                    if not line.startswith("data:"):
                        continue
                    chunk = line[5:].strip()
                    if not chunk or chunk == "[DONE]":
                        continue
                    try:
                        obj = json.loads(chunk)
                        for cand in obj.get("candidates", []):
                            for part in cand.get("content", {}).get("parts", []):
                                if part.get("text"):
                                    emit(part["text"])
                    except Exception:
                        continue
            return  # this model succeeded
        except urllib.error.HTTPError as e:
            last = _better_err(last, e)
            if e.code == 429:
                q429 = _note_429(model, e); continue           # park it, try next model
            if e.code in (400, 404):
                continue                                        # model unavailable → next model
            raise
    _raise_gemini(last, q429)


def _gemini_nonstream(payload):
    last = None; q429 = None
    for model in _gemini_models():
        try:
            with _gemini_open(model, payload, False) as resp:
                obj = json.loads(resp.read().decode("utf-8"))
            parts = obj.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            return "".join(p.get("text", "") for p in parts).strip()
        except urllib.error.HTTPError as e:
            last = _better_err(last, e)
            if e.code == 429:
                q429 = _note_429(model, e); continue
            if e.code in (400, 404):
                continue
            raise
    _raise_gemini(last, q429)
    return ""


def gemini_once(prompt):
    return _gemini_nonstream({"contents": [{"role": "user", "parts": [{"text": prompt}]}],
                              "generationConfig": {"maxOutputTokens": 600}})


def gemini_vision(image_b64, mime, prompt):
    return _gemini_nonstream({"contents": [{"role": "user", "parts": [
        {"text": prompt},
        {"inline_data": {"mime_type": mime or "image/jpeg", "data": image_b64}},
    ]}], "generationConfig": {"maxOutputTokens": 500, "temperature": 0.3}})


def claude_vision(image_b64, mime, prompt):
    resp = _claude.messages.create(model=CLAUDE_MODEL, max_tokens=500, messages=[{"role": "user", "content": [
        {"type": "image", "source": {"type": "base64", "media_type": mime or "image/jpeg", "data": image_b64}},
        {"type": "text", "text": prompt},
    ]}])
    return "".join(b.text for b in resp.content if b.type == "text").strip()


# --- HTTP ------------------------------------------------------------------
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, code, obj):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _body(self):
        try:
            n = int(self.headers.get("Content-Length", "0") or "0")
        except (ValueError, TypeError):
            n = 0
        raw = self.rfile.read(n) if n else b""
        try:
            return json.loads(raw.decode("utf-8")) if raw else {}
        except Exception:
            return {}

    def do_GET(self):
        u = urlparse(self.path)
        path, qs = u.path, parse_qs(u.query)
        if path == "/api/health":
            return self._json(200, {"ok": True, "ai": ai_on(), "provider": _provider,
                                    "model": _model, "backend": True, "online": backend.online_counts()})
        if path == "/api/events":
            return self.handle_events(qs)
        r = backend.handle("GET", path, qs, {})
        if r is not None:
            return self._json(r[0], r[1])
        return super().do_GET()

    def do_POST(self):
        u = urlparse(self.path)
        path, qs = u.path, parse_qs(u.query)
        if path == "/api/chat":
            return self.handle_chat()
        if path == "/api/interpret":
            return self.handle_interpret()
        if path == "/api/vision":
            return self.handle_vision()
        r = backend.handle("POST", path, qs, self._body())
        if r is not None:
            return self._json(r[0], r[1])
        self._json(404, {"error": "not found"})

    def handle_events(self, qs):
        """Server-Sent-Events stream — the realtime channel between patient and
        doctor apps (replaces the client-only BroadcastChannel bridge)."""
        token = (qs.get("token") or [""])[0]
        user = backend.user_for(token) if token else {}
        role = user.get("role") or (qs.get("role") or ["patient"])[0]
        uid = user.get("uid") or (qs.get("uid") or ["*"])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        q = backend.subscribe(role, uid)
        try:
            self.wfile.write(b": connected\n\n")
            self.wfile.flush()
            while True:
                try:
                    ev = q.get(timeout=15)
                    self.wfile.write(("event: " + ev["event"] + "\ndata: " +
                                      json.dumps(ev["data"], ensure_ascii=False) + "\n\n").encode("utf-8"))
                except queue.Empty:
                    self.wfile.write(b": ping\n\n")  # keepalive
                self.wfile.flush()
        except Exception:
            pass
        finally:
            backend.unsubscribe(role, uid, q)

    def handle_chat(self):
        body = self._body()
        if not ai_on():
            return self._json(503, {"error": _err or "AI unavailable"})
        lang = body.get("lang", "ka")
        messages = body.get("messages", [])
        if not messages:
            return self._json(400, {"error": "no messages"})
        system = system_prompt(body.get("profile", {}), lang)

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Connection", "keep-alive")
        self.end_headers()

        def emit(text):
            self.wfile.write(b"event: token\n")
            self.wfile.write(("data: " + json.dumps({"t": text}, ensure_ascii=False) + "\n\n").encode("utf-8"))
            self.wfile.flush()

        try:
            if _provider == "claude":
                claude_stream(system, messages, emit)
            else:
                gemini_stream(system, messages, emit)
            self.wfile.write(b"event: done\ndata: {}\n\n")
            self.wfile.flush()
        except Exception as e:
            try:
                self.wfile.write(("event: error\ndata: " + json.dumps({"message": str(e)}) + "\n\n").encode("utf-8"))
                self.wfile.flush()
            except Exception:
                pass

    def handle_interpret(self):
        body = self._body()
        if not ai_on():
            return self._json(503, {"error": _err or "AI unavailable"})
        prompt = interpret_prompt(body.get("values", {}), body.get("refs", []), body.get("lang", "ka"))
        try:
            if _provider == "claude":
                resp = _claude.messages.create(model=CLAUDE_MODEL, max_tokens=600,
                                               messages=[{"role": "user", "content": prompt}])
                text = "".join(b.text for b in resp.content if b.type == "text").strip()
            else:
                text = gemini_once(prompt)
            return self._json(200, {"summary": text})
        except Exception as e:
            return self._json(502, {"error": str(e)})

    def handle_vision(self):
        """Food-photo → calorie estimate (multimodal). Returns {name, kcal, items, note}."""
        body = self._body()
        if not ai_on():
            return self._json(503, {"error": _err or "AI unavailable"})
        img = body.get("image") or ""
        mime = body.get("mime") or "image/jpeg"
        if "," in img and img.strip().startswith("data:"):
            head, img = img.split(",", 1)
            if "image/" in head:
                mime = head.split(":", 1)[1].split(";", 1)[0]
        if not img:
            return self._json(400, {"error": "no image"})
        lang = body.get("lang", "ka")
        kind = body.get("kind", "food")
        note_lang = "Write the note in Georgian." if lang == "ka" else "Write the note in English."
        if kind == "tongue":
            # Observable, NON-diagnostic tongue features only (traditional tongue-observation style).
            prompt = ("You are a wellness assistant describing a tongue photo by its OBSERVABLE features only. "
                      "Do NOT diagnose any disease or name conditions. "
                      "Return ONLY compact JSON, no markdown: "
                      '{"color":"pale|pink|red|purple","coating":"none|thin|thick-white|thick-yellow",'
                      '"signs":["short observable sign"],"note":"one short non-diagnostic wellness tip"}. '
                      "signs are short English tags like 'teeth marks','cracks','red tip','dry','swollen'. "
                      "If it is not a tongue, set color to 'none'. " + note_lang)
        else:
            prompt = ("You are a nutrition assistant. Estimate the food in this photo and its calories. "
                      "Return ONLY compact JSON, no markdown: "
                      '{"name":"short dish name","kcal":<integer total>,'
                      '"items":[{"name":"item","kcal":<int>}],"note":"one short caveat"}. '
                      "Estimate a typical single serving. If it is not food, set kcal to 0 and name to 'not food'. "
                      + ("Use Georgian for the name." if lang == "ka" else "Use English for the name."))
        try:
            text = claude_vision(img, mime, prompt) if _provider == "claude" else gemini_vision(img, mime, prompt)
            obj = _extract_json(text)
            if obj is None:
                if kind == "tongue":
                    return self._json(200, {"color": "", "coating": "", "signs": [], "note": text[:160], "raw": True})
                return self._json(200, {"name": "", "kcal": 0, "items": [], "note": text[:160], "raw": True})
            return self._json(200, obj)
        except Exception as e:
            return self._json(502, {"error": str(e)})


def _extract_json(text):
    if not text:
        return None
    s = text.strip()
    if s.startswith("```"):
        s = s.strip("`")
        if s.lower().startswith("json"):
            s = s[4:]
    a, b = s.find("{"), s.rfind("}")
    if a < 0 or b < a:
        return None
    try:
        return json.loads(s[a:b + 1])
    except Exception:
        return None


class Server(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    os.chdir(ROOT)
    with Server((HOST, PORT), Handler) as httpd:
        status = ("AI: %s (%s)" % (_provider, _model)) if ai_on() else ("AI: off — " + (_err or ""))
        shown = "127.0.0.1" if HOST in ("127.0.0.1", "0.0.0.0") else HOST
        print("VITA -> http://%s:%d   [%s]" % (shown, PORT, status))
        print("  landing: /index.html   app: /app.html")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nbye")
