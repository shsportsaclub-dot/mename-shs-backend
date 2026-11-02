# Original avatar model JSON

`public/models/sh-original-avatar.model.json` contains actual original mesh data: 24 meshes, 29,800 vertices and 222 transformed parts. It is exported from the existing single-avatar study; it does not improve the model's stylized appearance or reproduce the realistic reference.

## Open the avatar

1. Download `public/original-avatar-json.html` and the model JSON.
2. Open the HTML in a WebGL2-capable browser, then choose the JSON using **Load avatar JSON**. The scene starts without an avatar until a file loads. No server, API key, asset download or paid pack is required.
3. Inspect full body, face, rotation and helmet variants. **Export model JSON** downloads the currently loaded dataset.

`public/original-avatar.html` also supports export and import, with the authored procedural avatar as its starting asset. After import, both viewers draw the loaded arrays without calling `posePlayer` or regenerating the character's geometry. The viewer still contains its common renderer and stadium code.

## Format version 1

This is the custom `sh-avatar-model` format, not glTF, Three.js ObjectLoader JSON or a JSON schema that other engines can load unchanged.

| Field | Meaning |
| --- | --- |
| `format`, `version` | `sh-avatar-model`, `1` |
| `units`, `coordinateSystem` | Metres, +Y up, +Z front |
| `meshes` | IDs with positions, unit normals, triangle indices and optional original bind-surface coordinates |
| `materials` | IDs with RGB color, roughness and SH renderer shader number |
| `parts` | Mesh/material references, column-major transform matrices, and helmet visibility variants |
| `textures.kit` | Embedded original PNG used by kit/bat shaders |
| `pose`, `skin`, `animations` | Static inspection pose, `null` skin, empty animation list |

Transforms support rotation, translation and independent axis scaling. Shear is rejected (normalized column dot tolerance 0.005 accommodates six-decimal export precision). Surface coordinates are 3D shader inputs, not standard UV coordinates. Shader IDs refer to the bundled SH renderer.

Validation bounds mesh, vertex, index, part, transform and material data before GPU allocation. Embedded PNG dimensions are limited to 2048 per axis and checked against the renderer's texture limit before upload. Failed validation or GPU uploads retain the previous loaded model; replacement releases the previous model's GPU resources. Imported file authorship cannot be verified, so the UI labels it as a model file.

## Verification and limits

`npm run build`, `npm run test:virtual-live` (96 tests), `npm run test:engine` (9 tests), and `npm run test:neon` (1 fixture test) pass. Real Chromium WebGL2 checks covered file-picker loading, empty initial JSON-only scene, helmet variants, GPU replacement cleanup, 390px layout and zero external HTTP requests / JavaScript errors / GL errors. Round-trip pixel mean absolute difference was 0.00437 on the 0–255 channel scale. The procedural posing function was replaced with a throwing function during loaded-model rendering to verify independence.

This export contains no skeleton, skin weights, animation tracks, blendshapes, phoneme timings or talking-video generation. A D-ID talking-photo video is a separate video deliverable and does not supply these 3D data. The current face remains stylized and does not match the photorealistic target. Animation and facial anatomy require further authored assets and rigging.
