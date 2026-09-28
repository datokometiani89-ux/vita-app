#!/usr/bin/env python3
"""
VITA backend — the real server side of the telemedicine marketplace.

Pure stdlib (no pip deps). Imported by serve.py, which wires the HTTP routes.
Gives the prototype a genuine server instead of the client-only BroadcastChannel
bridge: realtime signalling over SSE, demo auth, consult routing, an EHR store
with JSON-file persistence, and clearly-stubbed payment / video-SDK seams.

State lives in memory and is mirrored to a JSON file (best-effort). The file
lives OUTSIDE the static web root (`_data/` — which serve.py refuses to serve —
or wherever $VITA_DB_PATH points), so tokens and EHR records are never
downloadable.

Auth model (prototype): `POST /api/auth/login` hands out a bearer token with a
role. No passwords — BUT every other endpoint requires a token, the role is
enforced server-side (doctor-only routes, patients see only their own EHR), and
the patient's uid is taken from the token, never from the request body.
Set `VITA_DOCTOR_KEY=<secret>` to require that key for doctor/org logins.

Endpoints (dispatched from serve.py):
    POST /api/auth/login        {email, role, name, key?} -> {token, uid, role, name}
    GET  /api/events?token      -> SSE stream for the token's role/uid  (in serve.py)
    POST /api/consult/request   {patient:{id,name,age,sex,reason,vitals}} -> {id}   (patient; notifies doctors)
    POST /api/consult/accept    {patientId, doctor}                    (doctor; notifies patient)
    POST /api/consult/end       {patientId, rx, notes}                 (doctor; notifies patient + EHR)
    GET  /api/consult/queue     -> {queue:[...]}   (doctor)
    GET  /api/ehr?patientId     -> {records:[...]} (doctor, or the patient themself)
    POST /api/payment/intent    {amount,currency} -> stub PaymentIntent (NEVER charges)
    POST /api/video/token       {room,identity}   -> stub room+token (no real video)
"""

import json
import os
import re
import time
import uuid
import threading
import queue

_HERE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("VITA_DB_PATH") or os.path.join(_HERE, "_data", "vita-backend.json")
DOCTOR_KEY = os.environ.get("VITA_DOCTOR_KEY", "")  # empty = demo mode (any doctor login accepted)
MAX_USERS = 500  # token table cap — oldest sessions are evicted

_lock = threading.RLock()
_db = {"users": {}, "consults": [], "ehr": {}}
_subs = {}  # role -> { uid -> set(Queue) }


def _load():
    global _db
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            _db = json.load(f)
    except Exception:
        pass
    if not isinstance(_db, dict):
        _db = {}
    _db.setdefault("users", {})
    _db.setdefault("consults", [])
    _db.setdefault("ehr", {})


def _save():
    # atomic write (temp + replace) so a crash mid-write can't truncate the DB
    try:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        tmp = DB_PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(_db, f, ensure_ascii=False, indent=2)
        os.replace(tmp, DB_PATH)
    except Exception:
        pass


_load()


def _now():
    return time.strftime("%Y-%m-%dT%H:%M:%S")


# --- input sanitization ------------------------------------------------------
_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,48}$")


def _sid(v):
    """A safe identifier ([A-Za-z0-9_-], ≤48) or None."""
    return v if isinstance(v, str) and _ID_RE.match(v) else None


def _str(v, n):
    return v[:n] if isinstance(v, str) else ""


def _text(v, n):
    """A plain string or a {ka,en} pair — anything else is dropped."""
    if isinstance(v, dict):
        return {k: _str(v.get(k), n) for k in ("ka", "en") if isinstance(v.get(k), str)}
    return _str(v, n)


def _num(v, lo, hi):
    """A finite number within [lo, hi], else None (strings/objects never pass through)."""
    if isinstance(v, bool) or not isinstance(v, (int, float, str)):
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if f != f or f < lo or f > hi:
        return None
    return int(f) if f == int(f) else round(f, 1)


def clean_patient(p, uid):
    """Whitelist + type-check the patient object a consult request carries.
    The uid ALWAYS comes from the auth token (never from the body)."""
    p = p if isinstance(p, dict) else {}
    v = p.get("vitals") if isinstance(p.get("vitals"), dict) else {}
    return {
        "id": _sid(p.get("id")),
        "uid": uid,
        "name": _str(p.get("name"), 80) or "Patient",
        "age": _num(p.get("age"), 0, 120),
        "sex": "F" if p.get("sex") == "F" else "M",
        "reason": _text(p.get("reason"), 200),
        "vitals": {k: _num(v.get(k), 0, 300) for k in ("hr", "hrv", "spo2", "bioAge", "score")},
    }


# --- realtime pub/sub (backs the SSE stream) -------------------------------
def subscribe(role, uid):
    q = queue.Queue(maxsize=200)  # bounded: an orphaned (disconnected) subscriber can't grow without limit
    with _lock:
        _subs.setdefault(role, {}).setdefault(uid, set()).add(q)
    return q


def unsubscribe(role, uid, q):
    with _lock:
        try:
            _subs.get(role, {}).get(uid, set()).discard(q)
        except Exception:
            pass


def _push(role, uid, event, data):
    with _lock:
        bucket = _subs.get(role, {})
        targets = []
        if uid == "*":
            for s in bucket.values():
                targets += list(s)
        else:
            targets += list(bucket.get(uid, set()))
    for q in targets:
        try:
            q.put_nowait({"event": event, "data": data})
        except Exception:
            pass


def online_counts():
    with _lock:
        return {role: sum(len(s) for s in uids.values()) for role, uids in _subs.items()}


# --- demo auth (no passwords; clearly a prototype) -------------------------
def login(email, role, name, key=""):
    """Returns a session dict, or None when a doctor/org login lacks the deploy key."""
    role = role if role in ("patient", "doctor", "org") else "patient"
    if role != "patient" and DOCTOR_KEY and key != DOCTOR_KEY:
        return None
    email = _str(email, 120)
    name = _str(name, 80)
    # random suffix so two users sharing an email local-part don't collide onto one event bucket
    uid = "u_" + re.sub(r"[^A-Za-z0-9_-]", "", (email or role).split("@")[0])[:24] + "_" + role + "_" + uuid.uuid4().hex[:6]
    token = uuid.uuid4().hex
    with _lock:
        users = _db["users"]
        users[token] = {"uid": uid, "email": email, "role": role, "name": name, "since": _now()}
        if len(users) > MAX_USERS:  # evict the oldest sessions
            for old in sorted(users, key=lambda t: users[t].get("since", ""))[: len(users) - MAX_USERS]:
                users.pop(old, None)
        _save()
    return {"token": token, "uid": uid, "role": role, "name": name}


def user_for(token):
    if not isinstance(token, str) or not token:
        return {}
    with _lock:
        return dict(_db["users"].get(token) or {})


# --- consult routing -------------------------------------------------------
def _find(cid):
    for c in _db["consults"]:
        if c["id"] == cid:
            return c
    return None


def request_consult(patient, user):
    patient = clean_patient(patient, user["uid"])
    cid = patient["id"] or ("c_" + uuid.uuid4().hex[:10])
    patient["id"] = cid
    c = {"id": cid, "status": "waiting", "patient": patient, "created": _now(), "doctor": None}
    with _lock:
        # de-dupe by id
        if not _find(cid):
            _db["consults"].append(c)
            if len(_db["consults"]) > 300:
                _db["consults"] = _db["consults"][-300:]
            _save()
    _push("doctor", "*", "consult-request", patient)
    return {"id": cid}


def accept_consult(patient_id, doctor):
    with _lock:
        c = _find(patient_id)
        if not c:
            return None
        c["status"] = "active"
        c["doctor"] = doctor
        patient_uid = (c.get("patient") or {}).get("uid")
        _save()
    _push("patient", patient_uid, "consult-accepted", {"patientId": patient_id, "doctor": doctor})
    _push("doctor", "*", "consult-claimed", {"id": patient_id})
    return {"ok": True}


def end_consult(patient_id, rx, notes):
    with _lock:
        c = _find(patient_id)
        if not c:
            return None
        c["status"] = "done"
        c["rx"] = rx
        c["notes"] = notes
        c["ended"] = _now()
        patient = c.get("patient") or {}
        patient_uid = patient.get("uid")
        _db["ehr"].setdefault(patient_uid or patient_id, []).append(
            {"date": _now(), "doctor": c.get("doctor"), "notes": notes, "rx": rx, "vitals": patient.get("vitals")})
        _save()
    _push("patient", patient_uid, "consult-ended", {"patientId": patient_id, "rx": rx, "notes": notes})
    return {"ok": True}


def queue_list():
    with _lock:
        return [dict({"created": c["created"]}, **(c.get("patient") or {}))
                for c in _db["consults"] if c["status"] == "waiting"]


def ehr_for(pid):
    with _lock:
        return list(_db["ehr"].get(pid, []))


# --- payment seam (STUB — never moves money) -------------------------------
def payment_intent(amount, currency):
    # INTEGRATION POINT: with the real Stripe SDK this becomes
    #   stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    #   pi = stripe.PaymentIntent.create(amount=int(amount*100), currency=currency.lower())
    #   return {"provider":"stripe","clientSecret": pi.client_secret, "demo": False}
    # The front-end would then confirm it with Stripe.js / Apple Pay.
    return {"provider": "stripe-stub", "clientSecret": "demo_pi_" + uuid.uuid4().hex,
            "amount": _num(amount, 0, 1e7) or 0, "currency": _str(currency, 8) or "GEL", "demo": True}


# --- video token seam (STUB — no real media) -------------------------------
def video_token(room, identity):
    # INTEGRATION POINT: mint a real room + access token from a WebRTC provider, e.g.
    #   Daily:   POST https://api.daily.co/v1/rooms  with DAILY_API_KEY  -> room url + meeting token
    #   LiveKit: AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET).to_jwt()
    #   Twilio:  AccessToken + VideoGrant(room=...)
    # The front-end <video> elements then attach the provider's tracks.
    return {"provider": "daily-stub", "room": _sid(room) or ("vita-" + uuid.uuid4().hex[:8]),
            "token": "demo_tok_" + uuid.uuid4().hex, "demo": True}


# --- REST dispatch (serve.py calls this for non-SSE /api/* routes) ---------
def _q1(query, key, default=""):
    v = query.get(key)
    if isinstance(v, list):
        return v[0] if v else default
    return v if v is not None else default


PROTECTED = ("/api/consult/request", "/api/consult/accept", "/api/consult/end",
             "/api/consult/queue", "/api/ehr", "/api/payment/intent", "/api/video/token")
_UNAUTH = (401, {"error": "auth required"})
_FORBID = (403, {"error": "forbidden"})


def handle(method, path, query, body, user=None):
    """Return (status, obj) for a handled route, or None if not ours.
    `user` is the session resolved from the bearer token ({} when absent)."""
    body = body if isinstance(body, dict) else {}
    user = user or {}
    role = user.get("role")

    if path == "/api/auth/login" and method == "POST":
        s = login(body.get("email"), body.get("role", "patient"), body.get("name"), _str(body.get("key"), 200))
        return (200, s) if s else (403, {"error": "doctor key required"})

    if path not in PROTECTED:
        return None
    if not role:  # every backend route below needs a session
        return _UNAUTH

    if path == "/api/consult/request" and method == "POST":
        return 200, request_consult(body.get("patient") or body, user)
    if path == "/api/consult/accept" and method == "POST":
        if role != "doctor":
            return _FORBID
        r = accept_consult(_sid(body.get("patientId")), _str(body.get("doctor"), 80) or user.get("name") or "Doctor")
        return (200, r) if r else (404, {"error": "consult not found"})
    if path == "/api/consult/end" and method == "POST":
        if role != "doctor":
            return _FORBID
        r = end_consult(_sid(body.get("patientId")), _str(body.get("rx"), 500), _str(body.get("notes"), 2000))
        return (200, r) if r else (404, {"error": "consult not found"})
    if path == "/api/consult/queue" and method == "GET":
        if role != "doctor":
            return _FORBID
        return 200, {"queue": queue_list()}
    if path == "/api/ehr" and method == "GET":
        pid = _q1(query, "patientId") or user.get("uid")
        if role != "doctor" and pid != user.get("uid"):
            return _FORBID
        return 200, {"records": ehr_for(pid)}
    if path == "/api/payment/intent" and method == "POST":
        return 200, payment_intent(body.get("amount", 0), body.get("currency", "GEL"))
    if path == "/api/video/token" and method == "POST":
        return 200, video_token(body.get("room"), body.get("identity"))
    return None
