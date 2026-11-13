# Animation Lab (220 designs) + Points Table + Batting card
- 20 families x 11 events (FOUR, SIX, WICKET, FIFTY, HUNDRED, HAT-TRICK, FREE HIT, NO BALL, WIDE, MAIDEN, REVIEW). Each family has its own structure and motion; per event: palette, font, easing, tilt and geometry seed differ.
- Measured distinctness: all 24,090 pairs differ (active-area pixel distance min 0.078, median nearest 0.147).
- Preview: ?scene=anim&id=<family 1-20>_<event>  (e.g. 3_six, add &t=1.5 to freeze a frame). Contact sheet: docs/animation-lab-220.png
- Locked layer: Stream tab > Animation Lab: Off / Variety / fixed family. The same animation plays on main, card, tvbar, ribbon, stats, manhattan, bowlcard, pcard, rrgraph, tstat, strip, zone. Old tickers are hidden while it is on.
- ?scene=points (uses standings()), ?scene=bats (batting card with run bars, did-not-bat, extras/score/overs).
Tests: tests/anim-lab.cjs, tests/anim-lab2.cjs
- Every animation now carries an event-specific animated motif (rope+ball, arc+ball, stumps+bails, 50 ring, crown, 3 stumps, shield, crease+foot, arrows, 6 dots, DRS frame).
- Score bar (tvbar) is kept at the bottom of every board scene (Stream tab > Score bar under boards, default ON).
