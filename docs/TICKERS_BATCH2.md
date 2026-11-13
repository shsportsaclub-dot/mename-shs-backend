# Ticker Batch 2 (tk15 to tk37): 23 match-state tickers
Each has its own shape, motion and palette. Auto-fire on the overlay (#overlay) from match state; also "Send ticker to TV" in the Stream tab.

| ID | Situation | Look / motion | Trigger |
|---|---|---|---|
| tk15 | Toss | spinning gold coin | first sight of a new match |
| tk16 | Playing XI | roll-call board, names stagger in | after toss |
| tk17 | Target | counting-up number, sunburst | innings 2 starts |
| tk18 | Innings break | ledger paper unrolls | innings changes |
| tk19 | Powerplay start | radar sweep | first ball of innings |
| tk20 | Powerplay over | ring closes | last powerplay ball |
| tk21 | Over summary | beads slide on a rod | over ends |
| tk22 | Maiden | shield, six bars stack | over with 0 runs |
| tk23 | Chase equation | ball-depletion bar, need/off | over end in chase, 30 balls or fewer left |
| tk24 | 25 runs | ribbon medal swings | batter crosses 25 |
| tk25 | 75 runs | progress ring to 100 | batter crosses 75 |
| tk26 | 150 / 200 | gold wreath | batter crosses 150 or 200 |
| tk27 | Partnership 50/100/150 | two bars grow | partnership crosses |
| tk28 | 3 wickets | three stumps light | bowler's 3rd wicket |
| tk29 | Five-for | five stars pop | bowler's 5th wicket |
| tk30 | Fall of wicket | doors open | wicket (not all out) |
| tk31 | Byes / leg byes | ball passes stumps | bye event |
| tk32 | Free hit | hex shield pulse | after no-ball |
| tk33 | Drinks | cup fills | manual |
| tk34 | Rain stopped play | rain streaks, cover | manual |
| tk35 | Strategic timeout | countdown ring | manual |
| tk36 | Super over | hazard stripes, bolt | manual |
| tk37 | Result | trophy and confetti | match status done |

Rules: ball tickers (batch 1) interrupt these; these queue and wait until the screen is free (expire after 14 s). No flashing faster than 3/s; reduced-motion supported. Free-hit text: out only by run out, hit twice or obstructing (ICC). Fall-of-wicket card does not guess the next batter.
Preview: docs/tickers-batch2-sheet.png. Test: tests/tickers-b2.cjs.
