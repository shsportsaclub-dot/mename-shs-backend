# Human head topology study implementation plan

> **For agentic workers:** Use superpowers:executing-plans for inline execution.

**Goal:** Replace the single-avatar study's analytic doll-like head with an editable human-topology-based neutral head, then inspect the actual render against the user's soft 3D/cartoon references.
**Architecture:** Extract only head/neck topology from the explicitly CC0 MPFB base mesh. Bake metric coordinates and one subdivision step into a local data module. Fit eyes and brows to its actual surfaces. Keep the match viewer's original characters and scorer behavior unchanged. This is an anatomy foundation, not automatic photo likeness or completion of a facial rig.
**Tech stack:** Python asset conversion, current JavaScript/WebGL2 viewer, no paid API or purchased asset pack.
**Spec:** User's illustrated male avatars and latest polished soft-3D character references; priority is visible facial features and expressions, not stadium additions.

## Constraints and review focus
- Record upstream revision, checksum and CC0 provenance; do not call third-party base geometry wholly original.
- Include head/neck only, no unrelated body/helper geometry.
- Preserve outward, finite unit normals, valid indices and 16-bit index budgets.
- Eyeballs must sit inside the native lids; brows/lips must follow the actual head rather than floating proxy shapes.
- Export model provenance honestly and keep old JSON imports valid.
- Only actual code screenshots count as evidence. A visual mismatch remains a mismatch even when tests pass.

### Task 1: Converted head and fitting
**Files:** build-human-head.py, anatomical-head.mjs, avatar-study.mjs, build-original-cricket.mjs, runtime.js, avatar-model.mjs, avatar-study-ui.js, geometry/runtime tests, provenance note.
- [x] Write failing head-data/provenance/surface tests.
- [x] Convert the CC0 head topology and calculate smooth normals; integrate into the isolated avatar study with fitted eyes/brows and neutral soft materials.
- [x] Build and inspect real front/45-degree/side renders; do not publish an unconvincing face as matched.
- [x] Verify JSON round-trip, helmet, phone framing, scorer regressions and all existing checks.
- [x] Review, commit the concrete result and report remaining likeness/expression gaps.

Evidence: docs/HUMAN_HEAD_STUDY.md. Source pinned and checksum recorded; actual generic head render inspected. 101 viewer + 9 engine + 1 persistence tests and real WebGL2/JSON/scorer checks pass. Review findings (inward brow normals; source allocations in JSON-only viewer) fixed with RED→GREEN tests.

Ruling: this is an anatomy foundation rather than an accepted reference likeness. No automatic profile reconstruction or expressions are claimed. The earlier procedural/portrait-projection experiment remains checkpointed separately and was not restored.
