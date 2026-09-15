@AGENTS.md

Claude-specific notes:
- Use `docs/MILESTONES.md` as the task queue (PR n.m inside the active phase); `docs/IMPLEMENTATION_PLAN.md` gives the phase intent. Work top-down; do not start a PR whose predecessor is unmerged unless marked parallel.
- Before any UI work, load `docs/DESIGN_SYSTEM.md` and `docs/RESPONSIVE.md`; before any server work, load `docs/SECURITY.md` and `docs/CODING_STANDARDS.md`.
- Verify in the browser at 375 px and 1440 px for every UI change and say so in the summary.
- Before each PR, quote the `docs/RISKS.md` rows for that phase back to the user in one line and confirm how the PR handles them. Never mark a risk row closed without a linked PR.
