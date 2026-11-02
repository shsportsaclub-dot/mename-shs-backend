# Single Avatar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** Deliver one original avatar and actual images from its standalone code.
**Architecture:** An original detailed head mesh and fitted facial accessories use the existing articulated body and physical gear code. An isolated study scene and generated offline HTML expose portrait/body/helmet/rotation controls.
**Tech Stack:** JavaScript, WebGL2, authored numeric mesh surfaces, Playwright.
**Spec:** docs/superpowers/specs/2026-11-02-single-avatar-design.md

## Global Constraints
- No purchased/downloaded character assets; no AI image as code proof.
- Do not modify match behavior or scorer authority.
- Generic original identity; do not claim face likeness or reference-equivalent realism.

## Review Focus
- Head topology/normals, finite facial landmark placement and proportion.
- Eye/lid/nose/beard intersections in front and side view.
- Bat dimensions and paired hand targets remain unchanged.
- Single avatar mode cannot affect connected match scenes.
- Offline file controls, viewport sizing and no network dependencies.

### Task 1: Original face and study scene
- [x] Add/run failing geometry and isolation tests.
- [x] Implement `originalStudyAvatarMeshes()` and `studyFacePoint(x,y)` in avatar-study.mjs; integrate only the study character into runtime.
- [x] Add study controls and build original-avatar.html, using one shared renderer and no feed/tracker code.
- [x] Run build, viewer suite and browser control/network/GL checks.

### Task 2: Actual output
- [x] Inspect portrait, side and full-body screenshots; correct substantial geometry defects.
- [x] Fresh review, fixes and final validation.
- [x] Commit code, save user screenshots, deliver HTML and actual preview. Stop before adding match features.


Evidence: first geometry/build tests failed for missing study surface/file, then passed. Build and86 viewer tests,9 engine tests and1 persistence test pass. Actual WebGL2 screenshots inspected; hair intersection and waist clipping corrected. Fresh review identified narrow viewport bat clipping; camera coverage test failed then passed after aspect-fit. Collar outward normals test failed then passed after winding correction; document title corrected. Browser checks: portrait/side/body/helmet/rotation, no JS errors or HTTP requests, GL0,390px layout and projected blade within clip bounds. Generic original identity and procedural visual limits remain explicit. User-facing output is screenshot of the actual HTML, not a generated concept. No further match features added.
