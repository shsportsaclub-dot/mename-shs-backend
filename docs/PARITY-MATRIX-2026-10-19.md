# Scoring Heroes vs reference apps: feature parity (2026-10-19)

How to read: BUILT = found in app code (and tested in a browser in earlier batches). PARTIAL = exists but limited. MISSING = not in the app.
Reference facts marked (V) were read on the source page today; (U) = from general knowledge, NOT verified today.
Not every BUILT item was re-run today; the match-centre, scorer and tracker tests that were run are named in the commit history.

## A. Scorer (CricHeroes / Stumps point of view)
| Area | Reference | Status |
|---|---|---|
| Ball-by-ball scoring, international-style scorecard | CricHeroes (V) | BUILT |
| Extras: wide, no-ball, bye, leg-bye, penalty runs | CricHeroes (U) | BUILT |
| Dismissals incl. obstructing, hit twice, retired out, timed out (MCC laws) | MCC | BUILT |
| Retire hurt and return, swap strike, undo | CricHeroes (U) | BUILT |
| Powerplay, DLS revised target, super over | ICC | BUILT (DLS tables not re-verified today) |
| Wagon wheel, Manhattan, worm, run rate, MVP | CricHeroes (V) | BUILT |
| Live streaming from phone/OBS/vMix | CricHeroes (V) | BUILT (stream link card, OBS overlay) |
| Scorer, umpire, commentator registration | CricHeroes (V) | PARTIAL (roles exist; commentator flow minimal) |
| Tournament: leaderboard, points table, schedule, boundary tracker | CricHeroes (V) | BUILT |
| Auto fixtures + NRR calculator | CricHeroes (V) | BUILT (one fixture generator) |
| Multi-day matches: 4 innings, no over limit, declaration, follow-on, lead/trail, draw | MCC Law 14 (V) | MISSING |
| AI highlights and AI commentary after the match | CricHeroes (V) | MISSING |
| Overthrows as a separate input | Stumps (U) | MISSING |
| Concussion / impact substitute | ICC (U) | MISSING |
| Other sports: rule fidelity per sport | per federation | PARTIAL (modules exist, rules not independently verified) |

## B. Viewer (Cricbuzz / CREX / Cricket Australia point of view)
| Tab | Status |
|---|---|
| Live: score, batters, bowler, this over, CRR/RRR, projected | BUILT (SH Pulse) |
| Commentary: over cards, ball chips, 4/6/W motion | BUILT, shows only where delivery records exist |
| Scorecard, fall of wickets, partnerships | BUILT; FoW/partnerships need provider or Cricsheet data |
| Overs: runs, wickets, running total per over | BUILT, needs delivery records |
| Graphs: runs per over line, worm, observed intervals | BUILT, needs delivery records for the full shape |
| Info: toss, umpires, referee, POM | PARTIAL: filled from Cricsheet when published |
| Squads by role, Playing XI, SH Sports 11, Last 10 | BUILT |
| Player photos | PARTIAL: avatars; verified photos only from provider IDs |
| Highlights video | MISSING |

## C. Data source (the blocker for live commentary)
- CricketData replied "ERR: Not able to get BBB for match ..." for a Pakistan v Sri Lanka match: no ball-by-ball exists at that provider for it.
- The server tracker now follows live matches itself and saves a ball record only when exactly one delivery changed between two scorecard checks.
- Complete live ball-by-ball for every match needs a provider that sends it (Sportmonks lists it on every plan, 14-day trial, EUR 29/month from their pricing page (V)).
- Finished matches: Cricsheet ball-by-ball, filled in automatically after it is published (delay not verified).

## D. Order of work from here
1. Multi-day / Test scoring (innings model is two-innings everywhere: about 90 places use innings[i] and i===1 as the chase).
2. Live ball-by-ball source decision (Sportmonks trial token).
3. Overthrows, concussion substitute.
4. Highlights.
5. Per-sport rule audits, one sport at a time, starting from the official rulebook.
