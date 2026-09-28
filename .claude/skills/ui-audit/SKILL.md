---
name: ui-audit
description: Run the VITA design-system audit across all routes (style violations vs "white surfaces, one accent", horizontal overflow, missing headers) via tools/ui_audit.js in the preview. Use after any CSS or screen change, or when screenshots are unavailable.
---
1. Sync the mirror and open the preview at `app.html?cb=<random>#/home` (see `.claude/skills/mobile-check` for stale-SW handling).
2. In the page: `eval(await (await fetch("/tools/ui_audit.js")).text()); await vitaUiAudit()` — at desktop width, then at `resize_window preset:"mobile"`.
3. Expected: `violations: []`, `overflow: {}`, `noHeader: []`. State-carrying classes (selected chips, today cells, tone rings, avatars, badges) are skipped by design; if a NEW state class is flagged, add it to the skip list in tools/ui_audit.js rather than styling it away.
4. Fix decorative violations in css/apple.css (flatten to `var(--surface)` + hairline `var(--separator)`), re-run until clean, then check no white-on-white text was created inside the flattened cards.
