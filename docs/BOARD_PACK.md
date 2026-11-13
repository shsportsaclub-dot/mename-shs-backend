# Broadcast Board Pack (OBS scenes)
- `?scene=manhattan` runs-per-over chart (orange bar = 12+ runs, red dot = wicket over), footer EXTRAS | score | OVERS
- `?scene=bowlcard` bowling card (overs, dots, runs, wickets, economy) + fall of wickets 1st..10th
- `?scene=strip` auto banner on every FOUR / SIX / WICKET / WIDE / NO BALL for ~5s (`&ev=four` to preview)
- `?scene=zone&t=POWERPLAY ZONE&s=Sponsor` sponsor segment lower third
Tests: tests/board-pack.cjs. Existing comic burst / umpire sign / sticker 4-6-OUT animations are in the vfx kinds (big_burst, big_board, big_sticker).
