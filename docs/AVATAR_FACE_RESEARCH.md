# Profile-based stylized avatar: source research

Research date: 2 November 2026. The user accepts the supplied illustrated portraits A–F as a visual target. Priority is the reference character's facial features and consistent identity, followed by expressions. This note does not claim a finished matching model or automatic conversion.

## Findings from primary documentation and public source

| Component | Source inspected | Finding |
| --- | --- | --- |
| Identity geometry | [MPFB targets](https://static.makehumancommunity.org/mpfb/docs/assets/concept_targets.html), [modeling](https://static.makehumancommunity.org/mpfb/docs/characters/modeling.html), [TargetService code](https://github.com/makehumancommunity/mpfb2/blob/master/src/mpfb/services/targetservice.py) | Modeling targets describe vertex displacements. TargetService loads target data into Blender shape keys and assigns weights. This supplies a concrete model-shaping approach, not automatic identity matching from a photo. |
| Facial expressions | [MPFB expression implementation notes](https://static.makehumancommunity.org/mpfb/releases/release_2016.html) | The expression composer uses face-unit shape keys, saves expression combinations as JSON, and blends their weighted contributions. The faceunits01 data pack is required for that feature. |
| Browser playback | [Three.js official face example](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_morphtargets_face.html), [Mesh API](https://threejs.org/docs/pages/Mesh.html) | The example loads a GLB, plays its animation through AnimationMixer and exposes morphTargetDictionary / morphTargetInfluences. Those APIs operate on morph targets already present in a model; they do not generate a face from an image. |
| Engine interchange | [Godot glTF import](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/available_formats.html) | Godot recommends glTF 2.0; GLB packages mesh and textures. Its import guidance includes blend-shape export settings. A static custom JSON is not interchangeable with this rigged asset pipeline. |
| Expression capture | [MediaPipe Face Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker) | Outputs include face landmarks, expression coefficients and transformation matrices. These can drive an existing compatible face; they are not a complete textured head, hair and cricket rig. |
| Image-to-3D generation | [Microsoft TRELLIS.2 code and prerequisites](https://github.com/microsoft/TRELLIS.2) | Produces textured 3D assets from images. The repository specifies Linux and an NVIDIA GPU with at least 24 GB memory. Its generated-mesh path is not evidence of an identity-matched facial rig. No conversion has been executed here. |

[MPFB's license file](https://github.com/makehumancommunity/mpfb2/blob/master/LICENSE.md) declares GPLv3 for its program source and CC0 for bundled graphical assets/output. TRELLIS.2 declares MIT for its model/code, with separately licensed dependencies. These are the projects' statements, not a recommendation to copy an entire application into ours. No assets, model weights or paid packs were downloaded in this research.

## Recommended design for our requirement

This is an engineering recommendation derived from those sources:

1. Author one neutral head with suitable eye/mouth topology. Fit its proportions to the supplied portrait; preserve identity parameters separately from expression weights. Style the hair, eyebrows, beard and materials to the user's illustrated target.
2. Add eyelid, brow, cheek, jaw and mouth deformation targets. Keep the neutral identity fixed while testing blink, focus and smile.
3. Export a real GLB containing the head geometry, texture mapping and morph targets. Add the body rig and cricket clips after face acceptance. Retain editable source assets.
4. Associate the resulting asset with player ID and profile-image revision. Generate/review it when a profile changes, then reuse it during the match rather than regenerating every frame.

Acceptance: compare the actual neutral render to the supplied image, then inspect front, 45-degree and side views. Check blink closure, lips, smile and brow motion while keeping head identity unchanged. Do not substitute a generated poster for this evidence.

## Current gap and execution status

The published SH asset is a stylized static mesh export with no skin or animation tracks. The experimental procedural face and portrait-projection changes did not establish a convincing likeness. They were checkpointed locally and were not published as a completed solution. A frontal portrait projection remains an approximation with invented side/back geometry and cannot by itself deliver the required expressions.

The execution environment currently has no Blender executable or PyTorch, and nvidia-smi is unavailable. The image-to-3D path was researched, not run. Installing authoring tools or adding a loader would not by itself prove visual success; a fitted, reviewed character asset remains the essential missing deliverable.

## Subsequent anatomy study

The neutral head topology foundation is now implemented and documented in [HUMAN_HEAD_STUDY.md](HUMAN_HEAD_STUDY.md). It uses an explicitly CC0 head source, not an image-generation model. It does not establish player likeness or complete facial expressions.
