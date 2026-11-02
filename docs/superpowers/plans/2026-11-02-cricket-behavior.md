# Original Cricket Behavior Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** Render one coordinated six-stage delivery with pelvis/spine motion, planted feet, paired bat grip and matching camera/contact positions.
**Architecture:** Pure motion sampler and skeleton transforms feed original geometry/IK. Per-player torso mesh deformation replaces rigid trunk rendering. Shared contact sampling drives the ball. Explicit study controls render reproducible actual poses.
**Tech Stack:** Existing standalone JS/WebGL2, original authored mesh/keyframes; no new downloads.
**Spec:** docs/superpowers/specs/2026-11-02-cricket-behavior-design.md

## Global Constraints
- Preserve scorer event/score authority, undo and existing tests.
- Source commentary and unmatched video poses cannot masquerade as confirmed cricket action.
- No concept image as gameplay; preserve original assets.

## Review Focus
- Rendering/contact math must agree through height, handedness and torso movement.
- Foot planting and fixed limb/equipment lengths must survive every pose.
- Follow-through must not snap to idle; running starts after recovery.
- Animated meshes must reset per frame without leaks or stale instances.
- Source captions/tracking must not replace a confirmed delivery.

### Task 1: Authored coordinated motion
**Files:** motion.mjs, equipment.mjs, tests/virtual-live-motion.test.mjs
**Interfaces:** sampleCricketMotion(mode,time,hand), cricketBodyPoint(point,motion), cricketBodyVector(vector,motion), cricketArmAnchors(motion), cricketMotionBat(motion,height,hand).
- [x] Write/run failing behavioral tests for plant, spine twist, continuity, mirrored stance, body frame and paired grip.
- [x] Implement keyed batting/bowling/fielding motions and shared contact evaluator; run tests.

### Task 2: Real renderer integration
**Files:** runtime.js, avatars.mjs, motion-skin.mjs, camera.mjs, build-original-cricket.mjs, template.html, runtime tests.
- [x] Write failing pose/contact/source-isolation runtime tests.
- [x] Integrate torso skin deformation, articulated head/shoulder hierarchy, IK feet/grip, smoother recovery and shared ball-contact math.
- [x] Add actual-code six-stage study and source-caption labelling; block unmatched pose during delivery.
- [x] Build/run full suite.

### Task 3: Evidence and handoff
- [x] Render six actual stages, inspect geometry/camera/contact; run scorer regression browser check.
- [x] Fresh review, important fixes with regression tests, document remaining visual/performance limits.
- [x] Commit/update draft PR, provide standalone HTML and actual code preview.


Evidence: build and 81 tests pass. Actual six-stage WebGL2 render and scorer append/undo/390px browser checks pass. Fresh reviewer found idle-batter timeline and bowling plant discontinuities; fixed with regression tests. Also corrected running root discontinuity and cached unchanged geometry. Remaining limitations: stylized faces, approximate running/carry transitions and fielding, CPU dynamic meshing and session-retained GPU caches; no mobile performance claim. Publication remains a draft PR, not deployment.
