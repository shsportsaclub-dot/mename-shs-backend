# Scoring Heroes Global Broadcast Theme Factory — LOCKED MASTER WORKFLOW V1.0 (2026-11-02)

Scope: complete broadcast themes: fixtures/schedule, pre-match, toss, live, innings break, result, player/team archives, tournament awards. Each theme targets 200+ screens/components (screen count != animation frame count).

## Non-negotiable standards
- Independently original graphics and motion; study third-party functionality, never copy proprietary appearance.
- Each theme is a coherent package; every screen has mapped graphics, effects, animation states, data/event triggers.
- States: ENTER, HOLD, UPDATE, EXIT, EVENT. 100–200 frames per sequence where appropriate.
- Production target: native 3840x2160 @ 60 fps, true 3D where required, alpha overlays, QA over live video.
- Outputs: editable source, RGBA PNG sequences, alpha video, lightweight preview, manifest.
- Cross-sport, cricket first. Each theme visually distinct beyond palette (own geometry/layout/motion).
- No claim of rendered/approved/deployed work without verified evidence.

## Gates
G01 Global research and sources — PARTIAL
G02 Worldwide graphics family classification — PARTIAL
G03 Master inventory >=200 named screens — DONE (260 names, 26 families; see THEME_FACTORY_INVENTORY.md)
G04 Data fields and event-trigger mapping — NOT STARTED
G05 Art direction and motion choreography — NOT STARTED
G06 Tools, architecture, reusable components — NOT STARTED
G07 Native 3D rendered prototype — NOT STARTED
G08 Transparent output and live-footage tests — NOT STARTED
G09 Human uniqueness and quality approval — NOT STARTED
G10 GitHub/Render integration and verification — NOT STARTED

## Per-screen loop
research (functional only) -> register entry -> original design -> build screen file in public/themes/ -> test (data binding, ordering, states, alpha) -> sample image in docs/ -> status update -> commit in bulk.
Status vocabulary: SPEC_DRAFT -> BUILT_PROTOTYPE (verified in headless browser) -> APPROVED (only after user's visual approval).

## Sources (G01, partial)
Functional-only references: crickpro.com broadcast graphics/panels, crickhunt.com overlays, mediaspy sports-presentation threads. Used to learn which screens exist, not how they look.
