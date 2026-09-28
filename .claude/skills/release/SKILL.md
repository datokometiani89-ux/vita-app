---
name: release
description: Cut a VITA release — checks, tests, version bump (?v=NN + sw.js), mirror sync, CLAUDE.md version line, commit. Use when a batch of work is verified and ready for the owner to push.
---
Run the release runbook from `.claude/agents/vita-release.md` steps 1–8 yourself (or delegate to the `vita-release` agent when the change set is large). The version bump is mandatory after any js/css change because `?v=` assets are served immutable. Finish by giving the owner the single command `git push origin main` and the post-push checks (steps 9–10) to run once Render has deployed.
