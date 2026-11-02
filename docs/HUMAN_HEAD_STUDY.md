# Human topology study

The isolated `public/original-avatar.html` now uses an adapted human head/neck mesh instead of the analytic rounded head. This is a static anatomy foundation for the user's soft 3D character target. The visible result remains a generic identity; it is not a verified likeness of any supplied player portrait, a finished facial-expression rig or automatic photo-to-avatar conversion.

## Source and ownership

The underlying head topology is adapted from the MakeHuman/MPFB base mesh, which explicitly identifies itself as CC0. It is **not wholly original SH geometry**. The source header credits Data Collection AB, Joel Palmius and Jonas Hauquier. SH changes extract head/neck only, subdivide the topology, fit it in metres, shape the lower neck, calculate normals and fit scalp/eyes/brows. Kit/equipment and the surrounding viewer remain authored SH code.

- Source: https://github.com/makehumancommunity/mpfb2/blob/6ff1eb358f6c1959ced77e79e6dd2406d9a71f49/src/mpfb/data/3dobjs/base.obj
- Raw source SHA-256: `8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c`
- Project license declaration: https://github.com/makehumancommunity/mpfb2/blob/6ff1eb358f6c1959ced77e79e6dd2406d9a71f49/LICENSE.md
- CC0 legal text: https://creativecommons.org/publicdomain/zero/1.0/legalcode

No proprietary cricket-game asset, purchased character pack or generative AI model was used for this head. The supplied reference portraits were visual references, not texture projections.

## Rebuild and inspect

Download the pinned source OBJ, verify its checksum, then run:

```sh
python3 scripts/build-human-head.py /path/to/base.obj 6ff1eb358f6c1959ced77e79e6dd2406d9a71f49
npm run build
```

The converted head has 17,355 vertices and 34,608 triangles. The independently exported `public/models/sh-human-head-study.model.json` contains 19 meshes, 26,988 total vertices and 93 parts, including the source provenance. Its original custom SH format remains a static model; no skin or animation tracks are fabricated. Material 15 is the native-head skin shader. Earlier model JSON files remain loadable.

Open `public/original-avatar-json.html` and choose that JSON to inspect the asset separately. The JSON-only page omits the baked source head and allocates no authored character meshes at startup. Original main-match character geometry and scoring remain unchanged.

## Evidence and limits

Build, 101 viewer/geometry/feed/runtime tests, 9 engine tests and 1 persistence fixture pass. Chromium WebGL2 checks covered front/side/body views, helmet, phone framing, zero HTTP/JS/GL errors, scorer append/result/camera/undo, and independent JSON loading with procedural posing disabled. JSON round-trip pixel mean absolute difference was approximately 0.0034 on the 0–255 channel scale.

Review found inward brow normals and unnecessary native source data in the JSON-only page. Regression tests reproduced both and the corrections pass. Remaining work is reference-specific face sculpting, polished hair/materials, body refinement, facial blendshapes and game integration. Passing tests does not establish visual likeness or acceptance.
