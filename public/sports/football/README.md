# Football development package — Scoring Heroes

Source files: scorer.js (already pushed), tickers.js (50 registered ticker components), characters.js (8 schematic characters with four poses, parametric avatars, 20 effects, 15 WebAudio cues, commentary banks).

IMPORTANT: This is not production approved. The 50 ticker components have distinct metadata and entry presets but DO NOT yet satisfy the requirement for 50 genuinely unique layouts and choreography. 12 differentiated avatar presets are not complete. Effects are skeletal. Football rules are not comprehensively validated across all competitions. Do not describe these as final, 4K/60fps QA-approved, or deployed.

Sources to verify: https://www.theifab.com/laws/latest/ ; https://www.theifab.com/documents/ ; https://www.the-aiff.com/regulations ; https://inside.fifa.com/ .

Integration: load /sports/football/scorer.js, /sports/football/tickers.js, /sports/football/characters.js in this order. All expose window.SH_SCORERS or window.SH_PACKS. No app navigation integration yet.
