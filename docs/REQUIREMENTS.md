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

## Mascots (14 Nov, 14:30)
- Cartoon character per event (FOUR, SIX, OUT, DRS; 50/100/hat-trick/free hit/no ball/wide reuse the nearest pose) with speech bubble, popping above the player panel: DONE. Poses cut from the owner's reference sheet (public/mascots/*.webp). Owner can upload own pictures per event in the Stream tab; tiger + parrot built-in style kept as an option. `&mascot=0` hides, `&voice=1` speaks the word (browser speech, cannot be verified audibly).
- 4 / 6 / OUT numerals now metallic silver / gold / red 3D-style flashing digits.
- TODO: proper animated (moving) character, more poses (maiden, wide, no ball specific), characters for other sports.

## SH Tiger Hero mascot (user's own animated GIF, Nov 14)
- Source: user's own GIF (6 frames, SH tiger in navy/gold armour). Cut out frames 0-4 (frame 5 has baked "SIX" art, unused) -> public/mascots/sh.webp sprite sheet (5 frames).
- Default mascot style is now 'sh'; per-event frame sequences (six/hundred, four/fifty, wicket/hattrick, drs/freehit/noball/wide) via CSS steps; Ganesha and Tiger+Parrot remain selectable in Stream tab.
- TODO: more GIFs/poses per event (maiden, wide, no ball), same character for other sports.
- Nov 14 pack from user's 6 GIFs: six=jump (shsix), four=slide (shfour), wicket=stump smash (shwkt), hattrick=out-signal tiger (shout), drs/noball/wide/freehit/maiden=umpire tiger (shump), hundred=navy celebration (sh). Frames cut with rembg; baked words/effect frames excluded.

## SH Prime ticker pack (Nov 16) - one complete ticker module
- All 37 situation tickers (dot ball .. result) in ONE animation language (slab wipe, glyph pop, headline mask-slide, detail fade, chips), one font, colours from the user's colour selection. Default ON; "Classic (mixed)" stays available (Stream tab, first card). Preview: ?scene=tpackall / ?scene=tpack&n=4&t=2.
- Animation Lab (20 designs for 11 events) is a separate picker card at the top of the Stream tab (off by default).
- NOT yet verified/finished: cricket as a whole is NOT complete (see TODO lists above); do not call cricket done.

## Broadcast graphics review (live ODI reference, 2026-11-18) - build ORIGINAL versions, never copy a broadcaster's look
- [x] Wicket moment: full-width repeating "WICKET" band + small replay picture-in-picture (one animation style, same as ticker pack)
- [x] Boundary band: spaced-letter FOUR / SIX band across the bottom over the crowd shot (one style per ticker pack)
- [x] Score bar centre info line that rotates: need/balls, boundaries count (fours/sixes), partnership, run rate
- [ ] Bar: striker highlighted, bowler figures with over ball dots, target + overs under the team score
- [x] Score comparison worm (both innings, wicket dots, "requires N from B balls (RPO)") with run rates in the bar (exists as ar11Worm, needs overlay scene)
- [ ] Bowler profile lower-third (3 scouting bullets) when a bowler comes on
- [x] Batter career lower-third on arrival (age, matches, runs, SR, avg, best) - pcard exists, add as lower-third too
- [x] Batter scoring-zones mini pitch (hot spots by area, off/on side)
- [x] Bowler pitch map vs right/left handers: length zones (yorker/full/good/hard/short) with economy per zone and ball dots (dot/run/wicket/wide/boundary)
- [ ] Shot analysis split screen: bat arc + 3D landing path with distance (needs shot direction + distance data; manual entry optional)
- [ ] Release analytics (release speed, arm speed) - needs tracking hardware, optional manual speed only
- [x] LIVE badge corner mark on every overlay
- [ ] Every item above must work for all sports, colours selectable and constant

## Demo video: per-ball animation showcase (user request 2026-11-18)
- [ ] Each ball type has its own visible animation in the 3D stadium: dot, single (runs between wickets), two/three, FOUR, SIX, wicket (bowled, caught, lbw, run out), wide/no-ball
- [ ] Camera close enough to see: ball landing point on the pitch (pitch marker), ball path/trail to the field, fielder running, collecting, throwing back to keeper/bowler
- [ ] SIX: ball flies into the stands; FOUR: ball races along the ground to the rope with the fielder chasing
- [ ] Same event shows the matching ticker (Marquee/Prime) so ticker + 3D + sound agree
