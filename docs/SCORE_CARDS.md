# Score card package (original designs, inspired by the shapes in the references)
OBS Browser Source URLs (page address plus):
- `?scene=card#overlay`: score bar in the style chosen in Stream tab (Score card styles, tap Use). Fix one with `&style=sk5`; `&pos=top` puts it at the top.
- `?scene=stats#overlay`: match stats board (score, overs, run rate, fours, sixes, extras, dot balls, highest partnership for both innings).
- `?scene=resultcard#overlay`: result scorecard like the ICC style: both innings, top batters, bowlers, result line.

12 bar styles, each with its own shape, motion and palette:
sk1 Neon Edge (scan sweep), sk2 Pink Blue Plates (split reveal), sk3 Duel Bars (progress fills, hex hub), sk4 Versus Stripes (moving stripes), sk5 Timer Hub (overs hub, blinking arrows), sk6 LED Segments (28-segment progress), sk7 Chrome Rail (metal sweep), sk8 Orange Notch (glow), sk9 Hex Badge (team logos in hexagons), sk10 Twin Pill (colour dots), sk11 League Ribbon (flag circles, tournament name), sk12 Magenta Slabs (skew slide).
Data: batting team left with score/wickets, opposition right (first-innings score in a chase, dash otherwise), centre overs and target or run rate; "FULL TIME" when the match is done. The score pops with a gold glow when it changes. Reduced motion supported.
Preview: docs/score-card-styles.png. Test: tests/score-cards.cjs.
