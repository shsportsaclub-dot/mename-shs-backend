# Cricket asset pipeline — verified 2026-11-02

## What works now

`/fbx-motion-studio.html` loads a local With Skin FBX in the browser. It preserves the source rig and native animation, supports clip selection, pause, scrub, orbit, skeleton and a vertex-colour kit study. No file upload or source asset CDN request occurs. Missing source textures are substituted locally. No animation retargeting or face conversion is claimed.

Rebuild: `npm ci && npm run build`. Focused tests: `npm run test:fbx`.

The supplied `X Bot@Unarmed Run Forward.fbx` parses as 2 weighted meshes, 147,336 vertices and 129 bone objects (not 129 unique anatomical joints). There are 2 animation stacks: empty `Take 001`, and `mixamo.com` with 53 tracks, duration 0.8000000119 seconds. Only the second is playable. The empty first stack initially stopped playback; playable clip filtering fixes that. Actual browser evidence compares head world position at 0.1 and 0.65 seconds. This proves native rig animation; the clip is generic running, not verified cricket bowling.

Kit colour is a material/vertex-colour study using bone influences. It does not create shirt seams, a separate garment, facial features or portrait likeness. Those require fitted/weighted geometry and authored textures/morph targets. Existing static head study is not automatically compatible with this rig.

## Sources and acquisition status

| Source | Verified content | Status / use |
| --- | --- | --- |
| User-supplied Mixamo FBX | X Bot, running native clip with skin | Locally loaded and tested; raw FBX not published |
| [Adobe Mixamo FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) | Free with Adobe ID; characters/animations usable in games | Generic movement source; account download required |
| [Adobe hosted distribution FAQ](https://community.adobe.com/questions-696/mixamo-faq-licensing-royalties-ownership-eula-and-tos-589400) | Team collaboration allowed; raw animation/character redistribution restricted | Publish importer code, not a public raw Mixamo asset pack |
| [HK cricket bowling pack](https://assetstore.unity.com/packages/3d/animations/cricket-bowling-animations-pack-8-cricket-bowling-animations-281523) | Listing FREE; 8 cricket actions, pacers/spinners, both arms, humanoid and FBX, root motion | Source verified; not downloaded or motion-quality tested; Unity acquisition required; Standard Asset Store EULA |
| [nrgs LP Cricket Model Pack](https://nrgs.itch.io/lp-cricket-model-pack) | Bats, balls, stumps, bails, pitches and textures; CC0 | Equipment, not player bodies or animations; downloaded; six self-contained GLB files validated and included in `public/models/cricket-equipment/` |
| [PlayerMotion cricket catalogue](https://playermotion.games/animations/cricket) | Cricket-specific paid animation catalogue | Reference only; no purchase or download |

Official implementation references: [FBXLoader](https://threejs.org/docs/pages/FBXLoader.html), [SkinnedMesh](https://threejs.org/docs/pages/SkinnedMesh.html), [animation system](https://threejs.org/manual/pages/animation-system.html). Three.js 0.187.0 MIT; loader includes fflate MIT, notices retained in generated bundle. Build tool esbuild 0.25.12 MIT.

## Required cricket motion catalogue

Availability below means **required**, not downloaded. Accept a clip only after visual preview and rig/prop contact verification.

- Locomotion: idle, walk, jog, sprint, start, stop, turn, running between wickets.
- Batting: stance, guard, backlift, front/back foot defence, drive, cut, pull, sweep, loft, follow-through, crease grounding. Check both-hand bat grip and actual contact frame.
- Bowling: pace run-up, bound, front-foot plant, release, follow-through; spin gather/release; left/right arm. Record release timestamp and root distance per clip.
- Fielding: ready, pickup, high/low catch, overarm throw, dive, recovery. Verify ball-hand attachment/release.
- Wicketkeeping: crouch, take, lateral movement, stumping.
- Reactions: appeal, wicket celebration, boundary reaction, umpire four/six/out.

## Integration contract

1. Keep one consistent humanoid rest pose and bone naming scheme. Native clips on their original rig work first; other rigs require explicit retargeting.
2. Preserve bind matrices, skin indices and normalized weights. Jersey mesh shares the target skeleton and fitted body proportions; a texture alone cannot fix geometry.
3. Work in metres: calibrate body height and equipment before evaluating grip. Preserve separate root motion data for movement vs in-place actions.
4. Annotate contact/release/footplant events after inspecting the actual clip; never guess game outcomes from an animation name.
5. Match events choose actions, ball physics and camera transitions. Commentary reads confirmed events; animation must not alter the score.
6. Face identity and facial expressions remain a separate weighted head/morph-target task, tested in close-up before match integration.

Downloaded equipment archive: 5,372,434 bytes. SHA256 recorded in the equipment manifest; each GLB has its own SHA256. Six files contain meshes and embedded textures/buffers; they are not animations. Full multi-format archive is retained locally; the web project includes GLB only to avoid duplicate formats.
