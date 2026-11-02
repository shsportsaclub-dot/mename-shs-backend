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
