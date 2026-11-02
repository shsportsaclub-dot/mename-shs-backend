# Avatar refinement

Continue the single-avatar study the user says is closer but needs improvement. Keep the actual HTML render as the deliverable and do not add match features or use a generated illustration as evidence.

- [x] Replace sticker-like eye discs/tube outlines with eye surfaces fitted to the face and skin eyelid ribbons; add shaped upper/lower lip surfaces and a mouth seam.
- [x] Refine nose/jaw, short hair silhouette, beard coloration and portrait lighting; reduce shoulder sleeve protrusion and collar length. Keep physical gear and main match geometry unchanged.
- [x] Run geometric fit tests and viewer suite, render actual portrait/side/body/phone output, inspect; fresh review and correction of important findings.
- [x] Save a new actual-code preview, commit/publish the feature branch and hand off the updated standalone HTML.

Validation must establish mesh bounds/normals and eye/lid seams, offline controls and no network errors, mobile bat framing, scorer regressions. No photorealistic or face-likeness claim. Existing original skin/head remains analytic, not a scan.


Evidence: missing eye/lid/lip surfaces and oversized sleeve-cap tests failed first, then passed. Fresh review found no Critical/Important issues. Its minor open-patch seam and squared-head observations were addressed with RED→GREEN open-edge-normal and crown-bound tests; collapsed lip-corner normals were corrected using a finite-difference surface limit. Eye seam assertion covers midpoints, not a mathematical proof of every boundary segment. Final build and92 viewer tests,9 engine,1 persistence tests pass. Actual avatar and scorer browser checks pass. User-facing preview is actual renderer output; stylized geometry and remaining reference-quality gap are explicit. No new match feature added.
