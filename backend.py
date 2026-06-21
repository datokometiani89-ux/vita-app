#!/usr/bin/env python3
"""
VITA backend — the real server side of the telemedicine marketplace.

Pure stdlib (no pip deps). Imported by serve.py, which wires the HTTP routes.
Gives the prototype a genuine server instead of the client-only BroadcastChannel
bridge: realtime signalling over SSE, demo auth, consult routing, an EHR store
with JSON-file persistence, and clearly-stubbed payment / video-SDK seams.

State lives in memory and is mirrored to `vita-backend.json` (best-effort).

Endpoints (dispatched from serve.py):
    POST /api/auth/login        {email, role, name} -> {token, uid, role, name}
    GET  /api/events?role&uid   -> SSE stream of events for that role/uid  (in serve.py)
    POST /api/consult/request   {patient:{id,uid,name,...}} -> {id}   (notifies doctors)
    POST /api/consult/accept    {patientUid, patientId, doctor}        (notifies patient)
    POST /api/consult/end       {patientUid, patientId, rx, notes}     (notifies patient + EHR)
    GET  /api/consult/queue     -> {queue:[...]}   (waiting consults; for a fresh doctor app)
    GET  /api/ehr?patientId     -> {records:[...]}
    POST /api/payment/intent    {amount,currency} -> stub PaymentIntent (NEVER charges)
    POST /api/video/token       {room,identity}   -> stub room+token (no real video)
"""

import json
import os
import time
import uuid
import threading
import queue

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vita-backend.json")

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
    _db.setdefault("users", {})
    _db.setdefault("consults", [])
    _db.setdefault("ehr", {})


def _save():
    # atomic write (temp + replace) so a crash mid-write can't truncate the DB
    try:
        tmp = DB_PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(_db, f, ensure_ascii=False, indent=2)
        os.replace(tmp, DB_PATH)
    except Exception:
        pass


_load()


def _now():
    return time.strftime("%Y-%m-%dT%H:%M:%S")


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
def login(email, role, name):
    role = role if role in ("patient", "doctor", "org") else "patient"
    # random suffix so two users sharing an email local-part don't collide onto one event bucket
    uid = "u_" + ((email or role).split("@")[0]) + "_" + role + "_" + uuid.uuid4().hex[:4]
    token = uuid.uuid4().hex
    with _lock:
        _db["users"][token] = {"uid": uid, "email": email, "role": role, "name": name, "since": _now()}
        _save()
    return {"token": token, "uid": uid, "role": role, "name": name}


def user_for(token):
    with _lock:
        return dict(_db["users"].get(token) or {})


# --- consult routing -------------------------------------------------------
def _find(cid):
    for c in _db["consults"]:
        if c["id"] == cid:
            return c
    return None


def request_consult(patient):
    patient = patient if isinstance(patient, dict) else {}  # guard: a non-dict body must not crash **patient
    cid = patient.get("id") or ("c_" + uuid.uuid4().hex[:10])
    c = {"id": cid, "status": "waiting", "patient": patient, "created": _now(), "doctor": None}
    with _lock:
        # de-dupe by id
        if not _find(cid):
            _db["consults"].append(c)
            if len(_db["consults"]) > 300:
                _db["consults"] = _db["consults"][-300:]
            _save()
    _push("doctor", "*", "consult-request", dict({"id": cid}, **patient))
    return {"id": cid}


def accept_consult(patient_id, patient_uid, doctor):
    with _lock:
        c = _find(patient_id)
        if not c:
            return None
        c["status"] = "active"
        c["doctor"] = doctor
        _save()
    _push("patient", patient_uid, "consult-accepted", {"patientId": patient_id, "doctor": doctor})
    _push("doctor", "*", "consult-claimed", {"id": patient_id})
    return {"ok": True}


def end_consult(patient_id, patient_uid, rx, notes):
    with _lock:
        c = _find(patient_id)
        if c:
            c["status"] = "done"
            c["rx"] = rx
            c["notes"] = notes
            c["ended"] = _now()
            vitals = (c.get("patient") or {}).get("vitals")
            _db["ehr"].setdefault(patient_uid or patient_id, []).append(
                {"date": _now(), "doctor": c.get("doctor"), "notes": notes, "rx": rx, "vitals": vitals})
            _save()
    _push("patient", patient_uid, "consult-ended", {"patientId": patient_id, "rx": rx, "notes": notes})
    return {"ok": True}


def queue_list():
    with _lock:
        return [dict({"id": c["id"], "created": c["created"]}, **(c.get("patient") or {}))
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
            "amount": amount, "currency": currency or "GEL", "demo": True}


# --- video token seam (STUB — no real media) -------------------------------
def video_token(room, identity):
    # INTEGRATION POINT: mint a real room + access token from a WebRTC provider, e.g.
    #   Daily:   POST https://api.daily.co/v1/rooms  with DAILY_API_KEY  -> room url + meeting token
    #   LiveKit: AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET).to_jwt()
    #   Twilio:  AccessToken + VideoGrant(room=...)
    # The front-end <video> elements then attach the provider's tracks.
    return {"provider": "daily-stub", "room": room or ("vita-" + uuid.uuid4().hex[:8]),
            "token": "demo_tok_" + uuid.uuid4().hex, "demo": True}


# --- REST dispatch (serve.py calls this for non-SSE /api/* routes) ---------
def _q1(query, key, default=""):
    v = query.get(key)
    if isinstance(v, list):
        return v[0] if v else default
    return v if v is not None else default


def handle(method, path, query, body):
    """Return (status, obj) for a handled route, or None if not ours."""
    if path == "/api/auth/login" and method == "POST":
        return 200, login(body.get("email"), body.get("role", "patient"), body.get("name"))
    if path == "/api/consult/request" and method == "POST":
        return 200, request_consult(body.get("patient") or body)
    if path == "/api/consult/accept" and method == "POST":
        r = accept_consult(body.get("patientId"), body.get("patientUid"), body.get("doctor"))
        return (200, r) if r else (404, {"error": "consult not found"})
    if path == "/api/consult/end" and method == "POST":
        r = end_consult(body.get("patientId"), body.get("patientUid"), body.get("rx", ""), body.get("notes", ""))
        return (200, r) if r else (404, {"error": "consult not found"})
    if path == "/api/consult/queue" and method == "GET":
        return 200, {"queue": queue_list()}
    if path == "/api/ehr" and method == "GET":
        return 200, {"records": ehr_for(_q1(query, "patientId"))}
    if path == "/api/payment/intent" and method == "POST":
        return 200, payment_intent(body.get("amount", 0), body.get("currency", "GEL"))
    if path == "/api/video/token" and method == "POST":
        return 200, video_token(body.get("room"), body.get("identity"))
    return None
