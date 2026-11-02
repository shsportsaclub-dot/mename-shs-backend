# Original scorer-connected cricket viewer

Open `/virtual-live?mid=MATCH_ID` on the same backend as the scorer. Existing `/?scene=ccast&mid=MATCH_ID#overlay` links redirect to it, including current studio/OBS entry points. A match must first be published through the existing scorer sync.

The page is bundled in `public/original-virtual-live.html`. It contains our WebGL2 renderer, procedural stadium, player rigs, synthesized crowd and ball effects, commentary UI, and read-only feed client. No APK, Three.js, third-party models, recordings, CDN scripts, credentials, or new write API are required by this viewer. The renderer uses original procedural shapes; it is a stylized prototype, not photorealistic faces or real-player likenesses.

## Runtime

- Initial connection displays the authoritative current score and waits for the next saved ball. Historical balls are not replayed as live.
- Player IDs for each delivery come from the saved event's batsman, bowler, and pre-delivery non-striker. Names, handedness and fielding XI come from the published match roster. Identity-derived appearances are illustrative, not photographs.
- New saved events queue in order; duplicate snapshots do not replay them. Shot sectors come from the scorer's field map. Without a usable map or unambiguous commentary direction, the trajectory is illustrative. Fielding positions and motion are illustrative rather than measured live tracking.
- Undo, score correction, innings changes, penalties and non-ball dismissals cancel playback and resync the score. Unsupported actions such as overthrows update the score with a notice instead of inventing another play.
- Existing `/api/shared-stream` messages trigger reads of `/api/shared/matches/:id`; a 2.5-second poll also checks for missed updates. Readers need no auth token. The viewer never writes to these APIs.
- Click **ENABLE SOUND** for synthesized crowd, bat, bounce and wicket sounds. Optional English/Telugu/Hindi speech depends on a locally installed device voice. Commentary text is preserved from saved data when present; otherwise a simple English description is generated. Selecting a language does not translate supplied text. OBS browser audio must also be enabled in OBS.

## Build and checks

`npm ci && npm run build` regenerates the standalone page from `scripts/original-cricket/`, `virtual-live-feed.mjs`, and the connection bootstrap. Edit those sources rather than only the generated HTML.

`npm run test:virtual-live`: 46 checks, covering event mapping, queueing, score correction, authenticated scorer saves/public reads, legacy redirect and generated bundle lifecycle. The bundle lifecycle check stubs DOM/GPU calls and does not validate GPU pixels.

`npm run test:engine` and `npm run test:neon`: existing regression checks pass. Build validates browser script syntax. The updated bundled renderer was rendered with Chromium headless-shell using software WebGL2. A same-origin fixture browser check verifies the connected baseline, new saved ball, automatic camera, score result, undo, 390px layout and framebuffer resize, with no JavaScript errors and GL error 0. Actual mobile GPU/audio/OBS acceptance remains necessary.

This change is prepared on a feature branch. Merging and deploying it is a separate release step. After deployment, use the existing Virtual Live entry or `/virtual-live?mid=...`. Opening a downloaded HTML file with `file://` runs the manual demonstration; a live feed requires serving it on this backend origin.

## Automatic broadcast cameras

AUTO cuts on the delivery playback clock: bowler close-up, bowling end, batting contact, ball follow (aerial for lofted shots), fielding/catch action, running between wickets, then umpire/dismissed-batter or crowd/batter reaction. Idle views alternate every five seconds between batter, bowler and ground. STADIUM and PLAYER lock the camera until AUTO is selected again. Seeking chooses the corresponding shot without advancing score twice or replaying audio. This camera change does not upgrade character model fidelity or add a replay sequence.

## Captains, XI walkouts and bowler cards

For a newly connected, scoreless first innings, the original avatars introduce the published captains face to face (when both are set), then each published XI walks out. Saved `m.cap`, `m.keeper`, `m.toss` and `m.dec` are used; absent captain/toss data is not invented. The intro is not an animated coin toss. New balls preempt presentation immediately; undo does not replay it automatically. MATCH INTRO / TEAM WALKOUT may be triggered again while no ball is playing. Missing current batsman/bowler selection leaves an empty ground rather than default demo players.

BOWLING XI displays names, recorded roles/styles and jersey numbers, highlighting the bowler selected in the scorer. These are read-only roster cards, not the reference game’s photo/rating cards. The existing scorer remains the selection authority. No ratings are fabricated or inferred from identity. Player likenesses, detailed uniforms, stadium entrances and human-quality motion from the references are still outside this procedural prototype; these changes add presentation flow, not equivalent graphics fidelity.

## Original character geometry and rig improvements

`avatars.mjs` creates six head meshes with shaped jaw, nose bridge/tip, eye sockets, brow, cheeks, mouth and chin; plus original torso uniform, hair and helmet surfaces. Runtime geometry adds eyes, lips, cap/brim, helmet grille, jersey collar/panels, gloves/fingers, pads and shoe laces. All geometry is generated here from numeric profiles. No external character files, texture images or purchased animation clips are loaded. Face variants are generic original characters, not a reconstruction of the person named by a player ID. A player registered through SHCricket.registerPlayer can supply faceVariant (0–5) as well as existing height/skin properties.

Two-bone arm/leg IK preserves segment lengths and clamps unreachable targets. Walkout uses a slower walk cycle; bowler/shot/run poses retain scorer timing. Cloth/skin shading uses original shader noise and weave. This is a geometry/rig improvement, not proof of photorealism or physically simulated cloth/skin. Tests validate mesh indices/normals, bone lengths and finite rig transforms across actions; a fresh software WebGL2 render now passes; real-device performance and visual acceptance remain outstanding.

## Daylight stadium and kit view

The original generated ground now includes three seating decks and concourse facades, cantilever roof panels and radial trusses, four lattice floodlight towers, and 3,600 simplified spectators whose static geometry is cached. The sky/clouds are generated in the shader. Warm directional light, sky fill, rim shading and atmospheric haze replace the earlier dark background.

PLAYER view uses a lower, closer camera and a bat-holding pose. A separate color/depth framebuffer applies bounded background blur to portrait shots; DOM score/commentary overlays remain sharp. STADIUM stays unblurred. The original kit gains generated jersey lettering and pattern, collar/trim, helmet grille, wood grain, grip bands and glove pads. Generic faces remain stylized; this is not a photorealistic upgrade and no percentage similarity is claimed. No reference image is used as fake gameplay imagery.

Browser QA also exposed a native Window.fetch receiver issue in the default feed connection. The default now calls fetch through globalThis; a regression test covers the receiver requirement and an actual browser fixture verifies the connection.


## Equipment scale and broadcast overlays

All equipment uses metres. The default 1.85 m player carries an 86 cm bat (61 cm blade, 25 cm handle, 10.4 cm blade width), with a 3.1 cm handle diameter and 8.4 cm grip spacing. Player height changes the bat within the configured size range; the ball stays about 7.21 cm in diameter. Earlier code incorrectly drew the ball at roughly twice that diameter. The authored blade now has tapered shoulders, wood grain and an original generated branding sticker. Shared handle targets drive both gloves before arm IK, and the bat length remains fixed through the swing. Delivery/impact paths use the held-ball and bat-contact locations. This is illustrative animation, not a rigid-body bat/ball simulator.

FOUR, SIX, WICKET and milestone overlays animate at the event result. A persistent scrolling score/commentary ticker, HIGHLIGHTS, SCORECARD and ACHIEVEMENTS panels use confirmed current-innings data. Tables separate bat runs, extras, legal balls and bowler-credit dismissals. Undo/correction replaces the baseline summary, so removed milestones disappear. Live tables show the latest saved scorer state; animation may still be playing an earlier queued delivery. Highlights are text event summaries, not video replays or permanent archives. Records are current-innings statistics, not player career records. Panels open between deliveries and close when a new live ball starts.

Original stylized faces now blink, narrow their eyes while focused, and make limited eyebrow/mouth changes for celebration and dismissal. These are small rig reactions; the faces remain visibly procedural and do not match the supplied realistic game references. Browser checks cover 4/6/W banners, ticker visibility, tables, highlights, records, a 390 px layout, scorer connection/undo, and GL error 0. Physical-device performance and visual acceptance remain unverified.

## Hybrid source video and commentary studio

Open `/virtual-live?mid=MATCH_ID&studio=1` for a scorer-connected operator view, or open the standalone HTML and click SOURCE STUDIO. Controls accept a local video file, direct browser-playable media URL, camera, or screen share. Native video controls keep source audio with its video clock. A YouTube webpage is not a direct media URL; no downloader or media proxy is included. Camera preview is muted and does not request camera audio. Screen audio depends on browser/share selection. Capture needs HTTPS or localhost.

Start body tracking explicitly loads `@mediapipe/tasks-vision@0.10.32`, WASM and Google's Pose Landmarker Lite v1 from public CDNs. No model request occurs before this action. This is an optional third-party free vision dependency, not an original trained vision model or purchased character asset. Character meshes and retargeting code remain original. Tracking requires network loading; the base scorer/manual viewer works without it. A hanging download may stay loading until Stop body tracking is selected.

Select person crop, drag around one clearly visible full body, and map it manually to batsman or bowler. One estimated skeleton drives reliable limb directions at fixed rig bone lengths. Partial hidden limbs use procedural defaults. Invalid pose, paused/ended/seeking/stalled media, stale media samples (350 ms), stale received samples (500 ms), source replacement and role changes clear overrides. This does not identify players, reconstruct faces, rotate/lean the torso, track bat orientation/ball, calibrate pitch/world positions, recover off-screen action or reconstruct broadcast cameras. Bat orientation and field/ball paths remain explicitly illustrative.

Commentary accepts live typed text, timed WebVTT and optional browser microphone recognition with Telugu/English/Hindi selection. VTT uses source media time plus an offset; gaps/backward seeks clear captions. Mic monitoring is opt-in, intended for headphones. Speech recognition may send audio to the browser vendor service and is not universally supported. Source/broadcast audio is not automatically transcribed. Source captions appear in a separate UNMATCHED TO DELIVERY box; they do not steer confirmed-delivery cameras, create runs/wickets, select players or replace match commentary. Generic tracked poses are refused during confirmed delivery playback. Source audio, game sound and optional device speech have separate controls.

This is an operator-side hybrid prototype, not a deployed stream-conversion/distribution service. Source video/captions share a clock; confirmed scorer events still play on the existing arrival-driven illustration timeline. Exact external-video/delivery synchronization, calibrated multi-player/ball reconstruction, video replays and output encoding/distribution remain unimplemented. Body tracking does not improve face/model realism.

Validation: 64 virtual-live/core/HTTP/runtime/data tests pass, including pending caption replacement, microphone stop during pending audio playback and frozen-clock pose expiry regressions. Real browser validation ran actual downloaded MediaPipe JS/WASM/model bytes against Google's public `mediapipe-assets/pose.jpg`, encoded as a video fixture. Checks cover real inference/mapped rig, video input, VTT time/gaps/seeks, score isolation, pause/stop, 390px layout, no JS errors and GL error 0. Dependency requests were fulfilled with identical downloaded public bytes for reproducibility. This single-body sample test is not cricket-broadcast accuracy evidence. The software WebGL2 browser needed manual scene rendering to reliably observe tracking; continuous high-resolution rendering was too slow. Real-device performance, live camera/mic audio, screen-share acceptance, multi-person cricket footage and visual quality remain unverified.


## Coordinated six-stage behavior study

The standalone viewer adds RUN-UP / RELEASE / FOOTWORK / CONTACT / FOLLOW-THROUGH / FIELDING study buttons and Play coordinated flow. `SHCricket.previewBehavior(0..5)` seeks a single local demo delivery with matching study cameras, without duplicating score; connected scorer sessions reject it. The exported HTML includes the original motion and renderer inline.

`motion.mjs` authors numeric keys for the hips, pelvis/spine turn, lean, ground foot targets and hand/bat targets. `motion-skin.mjs` bends original torso surfaces and generates continuous elbow/knee limb surfaces. Shared posed shoulders drive paired grips, the rendered bat and trajectory contact point. Front feet hold through contact/release, the bowler root stops at the plant, and the batting follow-through recovers before running. Ball-follow camera movement blends out from contact. Generic source body estimates cannot replace this confirmed action.

Review caught and fixed idle/non-striker shots, a run-up/bound discontinuity, bowler plant sliding and a retained running-root teleport. Unchanged skin geometry is cached across frames; moving poses still require CPU mesh updates. Per-player GPU mesh caches remain retained for the session. Running turns, carry-grip transitions, fielding approach and ball paths remain approximate authored animation rather than motion-captured or physical simulation. The demonstration is one cover-drive flow, not a complete library of cricket techniques. Faces remain stylized original meshes and do not match the photorealistic concept. No new paid assets, reference-video motion extraction or purchased character/animation packs are included.

Validation: 81 viewer/core/feed/HTTP/runtime tests, including boundary continuity, idle-shot isolation, world root stability, pose-cache reuse and caption reset; actual software WebGL2 snapshots of all six stages; scorer append/result/undo and 390px browser checks with no JS errors and GL error 0. These checks do not establish mobile frame rate, realistic facial likeness, cricket-broadcast tracking accuracy or exact external-source synchronization.
