---
name: security-review
description: Security pass over VITA (server auth/roles/sanitization, client XSS, secrets, headers, static deny-list) using tools/test_backend.py plus a manual checklist. Use before releases and after backend/doctor-console changes.
---
Delegate to the `vita-security` agent for a full review, or for a quick gate do:
1. `python3 tools/test_backend.py` → must print `FAILS: 0` (auth, roles, sanitization, SSE, static deny-list).
2. `grep -rn "innerHTML\|insertAdjacentHTML" js/*.js | grep -v "V.esc\|esc(" | head` — inspect any line that interpolates user/server data without escaping.
3. `grep -rn "sk-ant\|AIza\|BEGIN PRIVATE\|api_key\s*=" --include=*.py --include=*.js --include=*.html .` → nothing.
4. `curl -s -o /dev/null -w "%{http_code}" http://localhost:4170/CLAUDE.md` → 404; `/api/consult/queue` without a token → 401.
Report findings critical → low with file:line and a failure scenario; add a test to tools/test_backend.py for every fixed finding.
