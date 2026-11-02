# Hybrid Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Run visible body motion and timed commentary alongside confirmed scorer-driven original avatar playback.

**Architecture:** Pure caption/pose validators feed a bounded tracking buffer. A browser studio owns media lifecycle and optional vision worker. Runtime retargets limb directions without changing score or body lengths.

**Tech Stack:** Existing WebGL2 JavaScript; MediaPipe Tasks Vision (optional pinned free external dependency); browser media/SpeechRecognition.

**Spec:** docs/superpowers/specs/2026-11-02-hybrid-input-design.md

## Global Constraints
- No paid packs/APK, no invented score or hidden movement.
- No network model request before Start tracking.
- Single mapped subject; world positions and ball path remain illustrative.
- Media stop/seek/change and confidence loss release tracked pose.

## Review Focus
- Source clock seeks/restarts must not reuse future poses or captions.
- Low visibility and malformed points must not produce NaN or stretched limbs.
- Microphone/camera/screen tracks must stop on explicit stop/page exit.
- Caption text containing runs/wickets must never mutate scorer state.
- Tracker download/worker failure must be visible and recoverable.

### Task 1: Validated hybrid data
**Files:** scripts/original-cricket/hybrid.mjs; tests/virtual-live-hybrid.test.mjs
**Interfaces:** parseCricketCaption(text), parseHybridVtt(text), retargetCricketPose(worldLandmarks), HybridPoseBuffer.push/sample/reset.
- [x] Write and run failing tests for confident pose directions, missing joints, stale/out-of-order samples, caption ambiguity and VTT seek behavior.
- [x] Implement validation and bounded media-clock buffer.
- [x] Run tests; commit.

### Task 2: Runtime and source studio
**Files:** runtime.js; template.html; hybrid-studio.js; hybrid-worker.js; build-original-cricket.mjs; connect.js; tests/virtual-live-runtime.test.mjs
**Interfaces:** SHCricket.applyTrackedPose(playerId, pose), clearTracking(), setSourceCaption(text), getState().tracking; SHHybridStudio snapshot/stop/caption methods.
- [x] Write failing runtime tests for retargeted limbs, score isolation and tracking reset.
- [x] Implement rig direction overrides and explicit observed/illustrative status.
- [x] Implement source lifecycle, optional vision worker, caption controls, source preview and timed VTT.
- [x] Build and run entire virtual-live suite.

### Task 3: Browser proof and handoff
**Files:** VIRTUAL_LIVE.md and actual preview screenshots outside repo.
- [x] Exercise source file clock/seek/stop, mock deterministic pose input and real optional model inference if network permits, no score changes from captions, responsive UI and GPU errors.
- [x] Record actual dependency/inference limits, review code, fix important findings, commit and update existing draft PR.
