# Ticker matrix: which ticker fires when (cricket first)

File: `docs/ticker-matrix.csv` (446 rows). One row = one ticker that fires for one situation.
Columns: id, group, trigger, context, formats, ticker_shows, lane_text, vfx_family, data, theme, motion, priority.

## Rules
1. A ticker is tied to ONE trigger + context. Same event in a different context gets a different ticker (a FOUR to reach 50 is not the same as a plain FOUR).
2. Each row has its own `theme` + `motion` pair. The pair is unique across all 446 rows (checked by script). Theme = look and story (Monsoon, Railway board, Kite festival ...), motion = how it enters and moves.
3. `formats` says where it can fire. Test-only rows never fire in T20; limited-overs rows never fire in a Test.
4. `data` says where the facts come from: `entered` (scorer taps it), `derived` (computed from balls), `entered/derived`. Nothing is presented as measured by cameras.
5. Every ticker also owns a scroll lane line (`lane_text`) for notices and sponsors, with Sponsored label rules from the DRS/lane build.
6. Priority 1 = wickets (win the screen), 2 = scoring and milestones, 3 = tournament and rules, 4 = info and system. A higher priority interrupts a lower one; same priority queues (max 5).
7. Original designs only. No Star / Sony / Sky / ICC / IPL layouts, colours, fonts or sounds. Free assets only.

## Coverage by group
| Group | Rows |
|---|---|
| A Ball outcomes (dot, 1-2-3, FOUR, SIX, extras, free hit, penalty) | 53 |
| B Dismissals (16 modes x 4 contexts + 20 special contexts) | 84 |
| C Milestones and records (batter, team, partnership, bowler, fielding, records) | 73 |
| D Match phases and situations (toss, powerplay, chase equation, death overs, super over, rain, DLS, DRS, result) | 67 |
| E Long form (day, session, lead, follow-on, declaration, new ball, draw) | 38 |
| F Tournament (table, qualification, caps, leaderboards, bracket) | 30 |
| G Audience, info, sponsor | 35 |
| H Format-specific rule reminders (T10, Hundred, 6-a-side, Gully, ODI, T20, Test) | 46 |
| I Scorer and system | 20 |

## Format profiles that decide which rows apply
| Format | Key facts used |
|---|---|
| Test | 5 days, 2 innings per side, follow-on, declaration, new ball, sessions, draw possible |
| ODI | 50 overs, powerplay phases, bowler 10-over limit, free hit, DLS |
| T20 | 20 overs, bowler 4 overs, powerplay 6 overs, free hit, strategic timeout, super over |
| T10 | 10 overs, bowler 2 overs, fast run-rate meter |
| The Hundred | 100 balls, sets of 5/10 balls, shorter powerplay |
| 6-a-side | 5 overs, each bowler 1 over, retire at a set score, wides and no-balls count 2 |
| Gully / local | local rules banner (one-pitch catch, wall boundary, lost ball), overs per bowler set by organiser |

Rule details must be confirmed against the current official playing conditions before each ticker text is finalised (ICC conditions change; for example the 2025 change that rounds a reduced-overs T20I powerplay to the nearest ball, 8 overs = 2.2 overs, 9 overs = 2.4 overs). Local and gully rules vary by organiser, so they are entered in match setup, not hard-coded.

## Sources used
- ICC T20I playing-condition change on powerplay in shortened matches: https://www.wionews.com/sports/after-making-several-changes-to-odis-and-tests-icc-updates-playing-conditions-in-mens-t20is-details-inside-1751001724400/amp
- Short-form cricket formats (6-a-side, T10, Hundred, evening cricket): https://cavac.at/cavacopedia/Short_form_cricket
- Earlier program research: docs/SPORTS_PROGRAM.md

## Not verified here
- Exact 2026 ICC playing conditions for Test, ODI and women's cricket (read the official documents before finalising rule-reminder text).
- Franchise-specific rules (impact player etc.) differ by league and year.

## Next steps (build order)
1. Group B + A (wickets and scoring) because they fire most often.
2. Group D (phases, chase equation, powerplay) and C (milestones).
3. E (Test), F (tournament), H (format rules), G (info), I (system).
Each batch: identity card, code, uniqueness table, 390px and OBS test, then push.
