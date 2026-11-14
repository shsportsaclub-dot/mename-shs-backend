# Everything the owner has asked for (recap — check before every push)
Status: DONE / PARTIAL / TODO (updated 14 Nov, build after ee14401)

## Standing rules
1. Reply in Telugu; app content English. 2. Free options only. 3. Original designs, never copies of Star/Sony.
4. Research real rules and global broadcast practice first. 5. Test, verify, fix, retest, then preview (no preview before tests pass).
6. Build in bulk, one push; after EVERY push give the Render link and the build sha.
7. Whatever is on the main screen, the live score board stays at the bottom. 8. Ticker/score-card animation looks identical on the main display.
9. Everything built for cricket must work for every sport (TODO, cricket only so far).
10. 200+ animations, think big. 11. One ticker = one animation style for every event (DONE: one family per match).
12. Colours constant within a selection; selectable: team jersey, presets, custom; score bar colours too, for every graphic (DONE for tickers, library, toss, score bar hub; panels custom).
13. Realistic, cinematic, current-generation: flashes, zoom, sound, ball physics (PARTIAL, see below).
14. Keep this checklist and build strictly from it.

## Events (ticker, one family look, own physical scene)
- Four: DONE (bounces to boards) | Six: DONE (arc into crowd, camera flashes, phones, taps)
- Wicket: DONE (ball hits stumps, stumps and bails fly, dust, red flash)
- Hat-trick: DONE (3 stump sets in sequence) | Wide: DONE (wide lines, ball outside) | No ball: DONE (foot over crease, red flash)
- Free hit: DONE (pulsing ball, rings) | Maiden: DONE (six balls fill) | Fifty / Hundred: DONE (bat raised, rays, confetti) | DRS: DONE (track, pitching/impact/hitting, edge wave)
- Dismissal variants (caught, LBW, run out, stumped) with their own pictures: TODO
- Sounds for all events: DONE (WebAudio, off by default); cannot be heard by the builder.

## Toss and squads
- Toss: supplied Heads/Tails coins (gold, red, silver), flies up and lands: DONE. Squads (Playing XI both teams, Captain/Keeper) after the toss: DONE.
- Toss photo style with captains and referee: TODO

## Data
- Tournament 4s/6s per player: counting DONE, display on player cards/wagon/ticker TODO.

## Reference sheets (14 Nov): fielding map, umpire signals, no ball/wide/LBW/run out/stumping/catch/DRS rule scenes, powerplay circle, super over, DLS (official table only), formats, equipment: TODO (see BROADCAST_INVENTORY.md)

## Older open items
Player records, Players status, Records, Tournament top players, Weather and Pitch (manual), Tomorrow strip, mini stats table, all other sports, verify Points table on real data.

## Added 14 Nov (afternoon)
- Score card detail strip under every skin (striker lit dot, runner, bowler name + overs-runs-wkts, ball-by-ball over timeline): DONE (`&strip=0` hides)
- Players status (`?scene=status`: batting / at crease / out / yet to bat; bowling figures): DONE
- Tournament records (`?scene=records`: most runs, wickets, sixes, fours): DONE
- DRS mapping (`?scene=drsmap`, manual inputs in the Stream tab): DONE | Boundary graphic (`?scene=boundary`, last four/six path, estimated six distance, innings and tournament 4s/6s of the batter): DONE
- Innings break, bats/bowl cards, result card, stats, pcard scenes already existed: PARTIAL (need review against the reference sheets)

## Reference catalogue categories (the 300-scene sheet) — status
Fixtures: today / tomorrow / upcoming / calendar: TODO | Venue: aerial, dimensions, history, records: TODO | Weather, dew, wind, pitch report (manual inputs): TODO
Toss and squads: DONE | Player intros, form, gallery: PARTIAL | Scorebars and lower thirds: DONE | Event flashes: DONE
Batting / bowling stats, partnership, run-rate, Manhattan, worm, pressure meter: PARTIAL (library) | Pitch map, field placement, catching map: PARTIAL
Win probability and predictions: PARTIAL (library) | DRS: DONE | Replays (boundary, wicket, ball flight, camera orbit): TODO (needs video)
Breaks (drinks, timeout, rain, super over): PARTIAL | Scorecards and summaries: PARTIAL | Milestones and records: PARTIAL
Tables and brackets: PARTIAL | Awards, trophy, sponsors, credits: TODO | Other sports (baseball, football, hockey, kabaddi, basketball, volleyball, badminton, rugby): TODO

## Added 14 Nov (evening) — all DONE unless noted
- Tickers: big animated 4 / 6 / OUT, player panel, bottom-right tournament 4s/6s panel. Wagon wheel colours (white 1, blue 2, orange 4, green 6) + team zone map (`?scene=wagon&who=team`).
- `?scene=ppsum` powerplay replay, `?scene=hl` innings highlights, `ppbar` / `hlbar` transparent corner strips.
- `innbreak`, `runtype` (&who=team), `fixtures`, `fieldpos` (&hand=left), `umpire`, `rules` (&r=...), `dismiss` (&k=...), `potm`, `trophy`, `sponsors`, `credits`, `venue`, `weather` + `pitch` (typed in Stream tab), `tossphoto`.
- Cricket completion batch: `?scene=auto` director (toss captains before the first ball, powerplay strip then replay at powerplay end, innings highlights then innings break, player of the match / champions / credits after the result), `?scene=mini` transparent mini stats table, left-hand batter mirroring in wagon wheel zones, fielder name on dismissal pictures, points table + NRR verified against hand-computed values (tests/points-table.cjs).
- STILL TODO (cricket): real video replays (needs a video source), DLS (official table only). Everything else for cricket is built.
- STILL TODO (other): all other sports (baseball, football, hockey, kabaddi, basketball, volleyball, badminton, rugby), mini stats / scenes for them, verify scenes on real match data from the field.
