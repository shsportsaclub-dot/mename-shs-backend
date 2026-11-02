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

`npm run test:virtual-live`: 29 checks, covering event mapping, queueing, score correction, authenticated scorer saves/public reads, legacy redirect and generated bundle lifecycle. The bundle lifecycle check stubs DOM/GPU calls and does not validate GPU pixels.

`npm run test:engine` and `npm run test:neon`: existing regression checks pass. Build validates browser script syntax. The earlier renderer was visually checked in Chromium; a fresh integrated Chromium render could not be run in this environment because the browser download returned an invalid archive. Device/audio/OBS visual acceptance remains necessary.

This change is prepared on a feature branch. Merging and deploying it is a separate release step. After deployment, use the existing Virtual Live entry or `/virtual-live?mid=...`. Opening a downloaded HTML file with `file://` runs the manual demonstration; a live feed requires serving it on this backend origin.
