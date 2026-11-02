# Avatar JSON data and loader

The user clarified that 'jonson' means JSON 3D model data. Create a real independently loadable model dataset using the original character's current geometry. This is a format/asset separation change, not a realism improvement.

- [x] Add a versioned original JSON schema and validator for actual position/normal/index/surface arrays, material parameters, part transforms, helmet variants and embedded original kit texture. Explicitly mark a static pose with no skin/animation tracks.
- [x] Export the canonical one-avatar geometry from the renderer, excluding ground/crowd. Add file-load and export controls. Loaded JSON must render without calling procedural pose/mesh generation; invalid loads leave the current model intact. Dispose replaced JSON GPU objects.
- [x] Create a JSON-only viewer with an empty scene until the model file loads, plus an exported model JSON. Verify round-trip geometry, source separation, helmet variants, offline loading, mobile framing, browser/GL errors and scorer regressions.
- [x] Save actual JSON-render evidence, document format/limitations, review, commit/publish feature branch and deliver the data plus viewer.

No purchased assets or reuse of EA game content. Custom SH JSON is not glTF; material coordinates are original renderer bind-surface coordinates. Geometry appearance remains the current stylized asset. Future artist/model changes can replace the JSON independently of viewer code. Rigging/animation data is not fabricated.

Evidence: docs/AVATAR_MODEL_JSON.md; 96 virtual-live + 9 engine + 1 persistence tests pass; real browser round-trip MAE 0.00437, zero HTTP/JS/GL errors. Review found texture upload atomicity and shear validation issues; fixed with regression coverage. Actual render: SH_Avatar_JSON_Code_Output.jpg.
