"""Backend security/integration tests — run: python3 tools/test_backend.py (starts serve.py on a temp port + temp DB)."""
import subprocess, time, json, os, sys, urllib.request, urllib.error, tempfile
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PORT = os.environ.get("VITA_TEST_PORT", "4199")
env = dict(os.environ, PORT=PORT, HOST="127.0.0.1", VITA_DB_PATH=os.path.join(tempfile.mkdtemp(), "db.json"),
           SUPABASE_URL="https://test.supabase.co", SUPABASE_ANON_KEY="anon-test", SENTRY_DSN="")
srv = subprocess.Popen([sys.executable, "serve.py"], cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
time.sleep(1.2)
B = "http://127.0.0.1:" + PORT
fails = 0

def req(method, path, body=None, token=None, raw=None, timeout=4):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    r = urllib.request.Request(B + path, data=data, method=method)
    if data is not None: r.add_header("Content-Type", "application/json")
    if token: r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as x:
            b = x.read()
            return x.status, b
    except urllib.error.HTTPError as e:
        return e.code, e.read()

def check(name, got, want):
    global fails
    ok = got == want
    fails += 0 if ok else 1
    print(("PASS " if ok else "FAIL ") + name + "  got=" + repr(got) + (" want=" + repr(want) if not ok else ""))

# 1. static deny-list
for p, want in [("/_data/db.json", 404), ("/vita-backend.json", 404), ("/backend.py", 404), ("/serve.py", 404),
                ("/CLAUDE.md", 404), ("/.gitignore", 404), ("/VITA_Financial_Model.xlsx", 404),
                ("/app.html", 200), ("/js/bridge.js", 200), ("/manifest.json", 200), ("/doctor.html", 200)]:
    check("static " + p, req("GET", p)[0], want)

# 1b. runtime config from env (public values), never cached
s, b = req("GET", "/js/config.js")
check("config.js from env", s == 200 and b"https://test.supabase.co" in b and b"anon-test" in b, True)
r = urllib.request.Request(B + "/js/config.js")
with urllib.request.urlopen(r, timeout=4) as x: check("config.js no-cache", x.headers.get("Cache-Control"), "no-cache")
check("config.js has no secrets", b"service_role" in b or b"sk-" in b, False)

# 2. unauthenticated
check("queue no-token", req("GET", "/api/consult/queue")[0], 401)
check("ehr no-token", req("GET", "/api/ehr?patientId=x")[0], 401)
check("request no-token", req("POST", "/api/consult/request", {"patient": {"name": "x"}})[0], 401)
check("events no-token", req("GET", "/api/events")[0], 401)
check("events role-in-query ignored", req("GET", "/api/events?role=doctor&uid=*")[0], 401)
check("non-dict body no crash", req("POST", "/api/consult/request", raw=b"[1,2,3]")[0], 401)
check("garbage body no crash", req("POST", "/api/auth/login", raw=b"\"str\"")[0], 200)

# 3. logins
s, b = req("POST", "/api/auth/login", {"role": "patient", "name": "Pat <b>", "email": "a@b"}); P = json.loads(b)
s, b = req("POST", "/api/auth/login", {"role": "doctor", "name": "Dr"}); D = json.loads(b)
check("login patient", (s, P["role"]), (200, "doctor") if False else (200, "doctor")) if False else check("login patient role", P["role"], "patient")
check("login doctor role", D["role"], "doctor")

# 4. role enforcement
check("queue as patient", req("GET", "/api/consult/queue", token=P["token"])[0], 403)
check("queue as doctor", req("GET", "/api/consult/queue", token=D["token"])[0], 200)
check("ehr other patient", req("GET", "/api/ehr?patientId=someone", token=P["token"])[0], 403)
check("ehr own", req("GET", "/api/ehr?patientId=" + P["uid"], token=P["token"])[0], 200)
check("accept as patient", req("POST", "/api/consult/accept", {"patientId": "x"}, token=P["token"])[0], 403)
check("non-dict body with token", req("POST", "/api/consult/request", raw=b"[1,2]", token=P["token"])[0], 200)

# 5. sanitization of consult request
evil = {"patient": {"id": "<img src=x onerror=alert(1)>", "uid": "victim-uid", "name": "N" * 200 + "<s>",
        "age": "<script>", "sex": "<x>", "reason": {"ka": "k", "en": "<b>e</b>", "zz": "drop"},
        "vitals": {"hr": "<b>", "hrv": 55, "spo2": 999, "score": 40, "extra": "x"}, "extra": "drop"}}
s, b = req("POST", "/api/consult/request", evil, token=P["token"]); cid = json.loads(b)["id"]
check("evil request accepted", s, 200)
s, b = req("GET", "/api/consult/queue", token=D["token"]); q = json.loads(b)["queue"]
item = [i for i in q if i["id"] == cid][0]
check("id regenerated (safe)", bool(__import__("re").match(r"^[A-Za-z0-9_-]{1,48}$", item["id"])), True)
check("uid from token, not body", item["uid"], P["uid"])
check("age coerced", item["age"], None)
check("hr coerced", item["vitals"]["hr"], None)
check("spo2 out-of-range dropped", item["vitals"]["spo2"], None)
check("score kept", item["vitals"]["score"], 40)
check("name clipped", len(item["name"]), 80)
check("sex coerced", item["sex"], "M")
check("reason keys whitelisted", sorted(item["reason"].keys()), ["en", "ka"])
check("no extra keys", "extra" in item or "extra" in item["vitals"], False)

# 6. SSE with token gets the accept event
import threading
got = []
def listen():
    r = urllib.request.Request(B + "/api/events?token=" + P["token"])
    try:
        with urllib.request.urlopen(r, timeout=6) as x:
            while True:
                line = x.readline()
                if not line: break
                got.append(line.decode())
                if b"consult-accepted" in line:
                    got.append(x.readline().decode()); break
    except Exception as e: got.append("ERR " + str(e))
th = threading.Thread(target=listen); th.start(); time.sleep(0.6)
check("accept as doctor", req("POST", "/api/consult/accept", {"patientId": cid, "patientUid": "spoof", "doctor": "Dr"}, token=D["token"])[0], 200)
th.join(7)
check("patient received consult-accepted via SSE", any("consult-accepted" in g for g in got), True)
check("end as doctor", req("POST", "/api/consult/end", {"patientId": cid, "rx": "x", "notes": "n"}, token=D["token"])[0], 200)
s, b = req("GET", "/api/ehr", token=P["token"]); recs = json.loads(b)["records"]
check("ehr written under patient uid", len(recs), 1)
check("ehr readable by doctor", req("GET", "/api/ehr?patientId=" + P["uid"], token=D["token"])[0], 200)
check("db file outside root", os.path.exists(env["VITA_DB_PATH"]), True)

srv.terminate()
err = srv.stderr.read().decode()[-600:]
print("server stderr tail:", err.strip() or "(clean)")
print("FAILS:", fails)
