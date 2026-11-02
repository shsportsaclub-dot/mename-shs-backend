# FBX Motion Studio Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement inline.

**Goal:** Inspect and play user-provided skinned FBX files locally, with a clearly labelled kit colour study.
**Architecture:** Isolated Three.js FBXLoader / AnimationMixer page. Native clips only; no silent retargeting or invented cricket action. The page reads files in the browser and never uploads the source.
**Tech Stack:** Three.js 0.187.0, esbuild 0.25.12 (build tool), native JavaScript.
**Spec:** User request: import cricket assets, skin and jersey them, then use the motions in Scoring Heroes.

## Global Constraints
- No paid purchases or raw Mixamo redistribution.
- Existing match/scorer stays unchanged.
- No claim of profile likeness, cricket action, or separate cloth mesh from a generic run clip.

## Review Focus
- Invalid files leave a readable error.
- Replacing a file releases old geometry/materials.
- Models with no clip remain visible without playback.
- Missing textures do not request local source paths.
- Phone controls fit the viewport.

### Task 1: Native FBX import and playback
- [x] Add tests for rig report, skin attributes, animation duration and disposal.
- [x] Run failing tests, then implement pure inspection helpers.
- [x] Build local-file viewer, pause/scrub, clip selection, skeleton toggle, kit colour study.
- [x] Verify uploaded FBX in Chromium: real skin/bone deformation between two times; invalid replacement, original-material restore, mobile layout.
- [x] Record actual screenshot and clip counts; commit code and asset-source catalogue. Do not commit user Mixamo binary.
