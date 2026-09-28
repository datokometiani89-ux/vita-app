---
name: mobile-check
description: Verify VITA screens at real phone widths (375×812 mobile UA and 470×960) — overflow, clipped Georgian titles, chip rows, safe-area status bar, tab bar. Use after UI changes or when the owner reports "looks bad on the phone".
---
1. rsync the repo to /tmp/vita-preview and open the preview (`preview_start {name:"vita-backend"}`), load `app.html?cb=<random>#/<route>`; if assets look stale, unregister the service worker and delete caches from the page.
2. `resize_window preset:"mobile"` (375×812, mobile UA). Inject `*{animation:none!important}.fade-in{opacity:1!important}` before screenshots.
3. Load `tools/ui_audit.js` in the page and run `await vitaUiAudit({routes:[...]})` — `overflow` must be empty; then screenshot the screens in question in KA (light + dark).
4. Known phone rules live in css/apple.css under "real phones (≤480px)": fake status bar hidden (safe-area padding kept), titles 30px, `.scn-mods` single scrollable row. Add new phone-only rules there.
5. Camera/mic paths cannot be tested in the emulator — say so explicitly; check the code guards instead (playsinline + autoplay + off-screen (not display:none) video, AudioContext.resume on tap, torch via applyConstraints with catch).
6. `resize_window preset:"desktop"` when done. Report per screen with file:line for each fix.
