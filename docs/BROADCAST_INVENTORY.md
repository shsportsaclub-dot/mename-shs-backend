# Broadcast inventory (match start to end) — build strictly from this list
Status: DONE / PARTIAL / TODO. Update on every push.

## Pre-match
- Title / match preview — DONE (library)
- Venue, weather, pitch report — PARTIAL (venue only; manual weather/pitch inputs TODO)
- Playing XI both teams — DONE
- Toss: real-coin flip (supplied gold/red/silver images), result card — DONE
- Toss reference (photos supplied 14 Nov): captains + referee, coin tossed high, call and result lower-third — TODO (coin rises and falls in frame; no generated people)
- Fielding positions chart (two reference charts supplied 14 Nov, original redraw, off/leg side, named positions) — TODO
- Select Batter / Select Bowler cards — DONE

## In play
- Ticker + score bar, one family per match, 3 modules — DONE
- Colours: team jersey / 20 presets / custom, score bar colours — DONE (Stream tab)
- FOUR (low bounces to boards), SIX (arc, crowd landing, flashes, phones, tak-tak) — DONE (basic physics, CSS)
- Wicket, 50, 100, hat-trick, free hit, no ball, wide, maiden, DRS — DONE (ticker animations)
- Camera push-in, shake, flash, light sweep, sparks — DONE
- Event sounds (WebAudio, off by default, ?sound=1) — DONE (cannot be heard by the builder)
- Wagon wheel / shot map — DONE
- Per-player tournament 4s/6s — PARTIAL: counting function done (shStats.tourFS); display on player cards TODO
- Win probability, required rate, projected score — DONE (library)
- DLS — TODO (only with an official table)

## Breaks / end
- Over summary, innings break, target card — PARTIAL
- Result, player of the match, scorecard — DONE (library)
- Tournament points table, top players — PARTIAL
- Records, Players status — TODO
- All other sports — TODO

## Added 14 Nov (from the "Scoring Heroes Cricket Laws & Umpiring" reference sheets) — all TODO, original drawings only
Rule-explainer scenes (full screen, score bar at bottom, same colour selection):
- Umpire signals: Out, Four, Six, Wide, No Ball, Dead Ball, Leg Bye, Bye, Short Run (original pictogram umpire, shown automatically on the matching event)
- No Ball (Law 21): foot behind / beyond crease
- Wide (Law 22): inside / outside batting reach
- LBW (Law 36): pitching, impact, wickets hitting, Umpire's Call
- Run Out (Law 38), Stumping (Law 39), Catch (Law 33)
- All 13 dismissal types card
- DRS: ball tracking, UltraEdge, Hawk-Eye, review flow (Umpire decision, Review, Final decision)
- Fielding Placements complete map (named positions, off/leg side)
- Powerplay fielding restrictions (30-yard circle, max 2 outside in first 6 overs of a T20)
- Super Over procedure card
- DLS result card (only with an official table; never invented numbers)
- Match formats card (Test, ODI, T20, T10, The Hundred, Six-a-side, Super 6)
- Ball / Equipment / Ground and Pitch (22 yards, popping crease) info cards

## BROADCAST SPEC (rules every graphic follows; built from the global-broadcast research)
Layout: one lower-third ticker lane + one centre banner lane + permanent score bar at the bottom of EVERY screen.
Per ticker (one family per match, never mixed): 1 centre banner, 3 live-data chips (primary + 1 rotating + toss), 1 entrance style, 1 chip style, 1 font.
| Event | Banner | Effects (all one family look) | Sound | Hold |
|---|---|---|---|---|
| Four | FOUR + batter 24(11) | camera push-in, low-bounce ball to boards, board flash | whoosh + 4 taps + thud | ~2.5 s |
| Six | SIX + batter | push-in + shake, ball arc into stands, crowd camera flashes, phone lights, bounces down seats | riser + whoosh + impact + taps + crowd | ~3.5 s |
| Wicket | WICKET + dismissal + bowler | white flash, shake, light sweep, sparks | impact + crack + crowd gasp | ~3.5 s |
| 50 / 100 | milestone + balls faced + 4s/6s | light sweep, sparks | riser + shimmer + crowd | ~3.5 s |
| Hat-trick | HAT-TRICK + 3 victims | 3 impacts, flash, sparks | 3 hits + riser + shimmer | ~4 s |
| Free hit / No ball / Wide / Maiden / DRS | short banner | tint, light sweep | beep / whoosh / shimmer | ~1.8 s |
Colours: ONE set for every graphic: team jersey colour, preset or custom; score bar follows the same set by default or its own custom colours.
Toss: coin tossed high on a gravity arc, flips, lands with a small bounce, result card; coin chip in every ticker.
