# Boundary chase implementation plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation.

**Goal:** Make the selected fielder react and chase boundary shots rather than remain motionless.
**Architecture:** A deterministic movement sampler controls boundary-only fielder roots and facing. The scorer and existing ball path remain authoritative; a boundary must never become a pickup or catch because an illustrative fielder gets close.
**Tech Stack:** Existing JavaScript/WebGL2 renderer and Node tests, no new dependencies.
**Spec:** User-supplied cricket behavior reference and existing cricket-behavior-design.md. This is a bounded behavior correction, not completion of the requested game or face reconstruction.

## Global constraints
- Original authored movement, no commercial game assets or extracted animation.
- Keep model JSON and single-avatar appearance unchanged.
- Preserve scores, event queue, camera timing and undo.

## Review focus
- FOUR/SIX must both chase without touching the ball or changing the result.
- No movement before impact/reaction delay; seeking must be deterministic.
- Root speed must remain bounded and the fielder must stay inside the 75m x 65m rope ellipse.
- Target reached: idle, not running in place; zero-distance chase must remain finite.
- Named fielders outside default slots must use the same behavior.

### Task 1: Movement and renderer integration
**Files:** new boundary-chase.mjs; build-original-cricket.mjs; runtime.js; new virtual-live-boundary-chase.test.mjs; virtual-live-runtime.test.mjs.
**Interfaces:** sampleBoundaryChase({time,start,end,boundary}) returns null for non-boundaries, otherwise {position,yaw,mode,localTime,phase}.
- [x] Write failing tests for movement speed, rope containment, timing, deterministic seeking and actual renderer selected-fielder movement for FOUR and SIX.
- [x] Implement original chase movement with 0.18s reaction delay and 7m/s cap; integrate into both fielder draw paths.
- [x] Build and run viewer, engine and persistence tests; verify actual WebGL2 playback and scorer regression.
- [x] Document limits, commit and publish draft branch; deliver code and actual evidence.

Evidence: build; 98 viewer/runtime/geometry/feed tests, 9 engine tests and 1 persistence fixture pass. Real Chromium WebGL2 verifies default FOUR/SIX fielders, off-slot named fielder and explicitly selected bowler move 6.79m from 2.7s to 4s while ball trajectory and confirmed score remain unchanged; GL error 0 and no JS errors. Scorer append, camera, result, undo and 390px checks pass.

Review: selected bowler was excluded from both fielding loops. Added a failing regression then integrated chase at its actual contact-time root [9.5,0,0]; all tests pass.

Ruling: limit this correction to boundary shots; ordinary pickups/catches remain approximate and require separate contact/IK work. Reaction delay and speed are original illustrative settings, not measured EA motion. The realistic avatar, photo-to-3D reconstruction, full playable game and Android build are not completed by this patch. No production deployment.
