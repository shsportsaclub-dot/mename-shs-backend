# Scoring Heroes — Broadcast Animation Playbook
Which graphic / animation is used in which situation, with timing, placement and safety rules.

Source tags: [R] researched on the web (linked at bottom) · [P] standard broadcast practice / our design decision (not from a single source).
Honesty: the phone scorer has no sensors, so tracking visuals are Scorer-entered / Derived / Estimated and labeled.

## 1. Golden rules
| Rule | Value | Src |
|---|---|---|
| Score bug is always-on base layer; score + clock/overs dominate, extra info layered around | always | [R] SVG scorebug 2026 |
| Bug may shrink/slide/reshape for a few seconds to show extra info, then return to base | 3–8 s | [R] |
| Keep base state clean; expanded states appear only when relevant | — | [R] |
| Lower-third stays at least 3–6 s; simple fade/slide in and out | 3–6 s | [R] School of Motion |
| Data-triggered animations fine; manual triggers risk missing the moment | — | [R] |
| Every extra feature adds failure risk — keep a fallback (plain text) | — | [R] |
| Flashing: max 3 flashes/second (or small area) | ≤3/s | [R] WCAG / ITU-R BT.1702 |
| Keep text inside title-safe area (approx. 90%), graphics inside action-safe (approx. 93%) | — | [R] EBU R95 / safe-area refs |
| Respect prefers-reduced-motion | — | [P] |
| One hero event at a time; lower priority waits or is dropped | queue | [P] |
| In/out motion 0.25–0.5 s, hold, then out; no loops on important text | — | [P] |

## 2. Layers (what lives where)
| Layer | Placement | Always on? | Use |
|---|---|---|---|
| L1 Score bug | bottom-left or top-left | yes | score, overs, batters, bowler, target |
| L2 Expansion strip | attached to bug | on demand | CRR/RRR, last 6 balls, partnership |
| L3 Event ticker (our tk1–tk14) | bottom band | per ball | ball outcome |
| L4 Hero VFX | center/full | per big event | SIX/FOUR/OUT/50/100 |
| L5 Lower third | lower third | per player moment | batter/bowler card, milestone |
| L6 Full-screen / panel | full | breaks, reviews | DRS, summary, scorecard |
| L7 Scroll lane | bottom edge | optional | announcements, sponsor (labeled) |

## 3. Situation → graphic (cricket)
Columns: Situation | Graphic | Motion | Duration | Layer | Priority (1 high) | Our status
### A. Ball outcomes
| Situation | Graphic | Motion | Dur | Layer | Pri | Status |
|---|---|---|---|---|---|---|
| Dot ball | tiny dot pip, dots-in-row counter | fade | 1.5 s | L3 | 4 | tk1 built |
| 3+ dots in a row (pressure) | "DOT BALLS 3" pressure meter | pulse | 2.5 s | L3 | 3 | tk2 built |
| 1–3 runs | run chip + running-score | slide | 2 s | L3 | 4 | tk3 built |
| FOUR | boundary ripple + ball to rope | shock ring | 4.6 s | L4+L3 | 2 | VFX+tk4 built |
| 2+ fours in over | "BOUNDARY STREAK" | streak flames | 3 s | L3 | 2 | tk5 built |
| SIX | arc trail, crowd burst, distance/height if entered | comet | 5.2 s | L4+L3 | 1 | VFX+tk6 built |
| Wide / No-ball | extra badge, +1, free-hit alert | snap-in | 2.5 s | L3 | 3 | tk7/tk8 built |
| Free hit next ball | green FREE HIT shield on bug | steady badge | until ball | L1 | 2 | planned |
| Byes / leg byes / penalty runs | extras chip | slide | 2 s | L3 | 4 | planned |
### B. Dismissals
| Situation | Graphic | Dur | Pri | Status |
|---|---|---|---|---|
| Bowled | stump shatter | 5.2 s | 1 | tk9 built |
| Caught | catch arc + fielder name | 5.2 s | 1 | tk10 built |
| LBW | pitch/impact/wicket 3-dot strip | 5.2 s | 1 | tk11 built |
| Run out | direct-hit line, fielder name | 5.2 s | 1 | tk12 built |
| Stumped / hit wicket / retired / obstructing | mode-specific card | 4.6 s | 1 | planned |
| Golden duck | "GOLDEN DUCK" 0(1) | 5 s | 1 | tk13 built |
| Hat-trick | triple-flame banner | 6 s | 1 | tk14 built |
| New batter in | batter lower-third (career line) | 5 s | 4 | planned |
### C. Reviews (DRS)
| Stage | Graphic | Status |
|---|---|---|
| Review signalled | "REVIEW" T-box icon, bug dims | studio built |
| Checks | ball-track (pitch / impact / wickets), edge trace, heat check | built (labeled illustration) |
| Verdict | OUT / NOT OUT / UMPIRE'S CALL | built |
| Reviews left | 2-pip counter on bug | built |
### D. Milestones / records
| Situation | Graphic | Pri |
|---|---|---|
| 25 / 50 / 75 / 100 / 150 / 200 | milestone card + innings sparkline | 1 (50/100 built VFX) |
| Fastest 50/100 of match | compare-with-record bar | 2 |
| Partnership 50/100/150 | partnership bar, both contributions | 3 |
| Bowler 3-fer / 5-fer / maiden / best figures | bowler card | 2–3 |
| 1000 career runs / record broken | record banner | 2 |
### E. Phases and equation
| Situation | Graphic | Layer |
|---|---|---|
| Toss | toss coin + decision card | L6 |
| Playing XI | XI grid w/ captain/keeper marks | L6 |
| Pitch/weather report | pitch card (labeled estimate) | L6 |
| Innings start | target / overs card | L5 |
| Powerplay start/end | PP bar on bug, field restriction | L1/L2 |
| Over end | over summary dots (1 1 W 2 1 4), runs/over | L2 |
| Chase equation (≤ 30 balls or on request) | NEED X OFF Y, RRR vs CRR | L2 |
| Strategic timeout / drinks / rain | break card + scroll lane | L6 |
| Innings break | innings summary: top scorer, top bowler | L6 |
| Super over | SUPER OVER bug skin | L1 |
| Result | winner card, margin, POTM | L6 |
### F. Analysis (use at breaks or after wickets, not mid-ball)
| Graphic | When |
|---|---|
| Wagon wheel | after 4/6, or batter at 30+ |
| Worm / run progression | over break, chase |
| Manhattan (runs per over) | innings break |
| Pitch map (bowler length) | over break, new spell |
| Beehive | bowler spell review |
| Field placement map | before key ball / new batter |
| Scoring zones / strike rate by zone | batter analysis |
| Head-to-head (batter vs bowler) | on new match-up |
| Win-probability line | after big moments (labeled model) |
### G. Tracking (pro tools: Hawk-Eye, Quidich, Tracab — [R] ICC feed 2023)
Ball path, pitch/release/speed/height; off-bat speed/angle/peak height; live fielder plot; Field 360° gaps; 3D shot replay; AR match-state/partnership display (Sky ECB). Our phone version: speed dial / height-distance only if Scorer enters values; otherwise hidden. Never fake sensor data.
### H. Non-cricket moments
Sponsor stinger, ad slate (always labeled "SPONSORED"), social / QR, lane announcement, tournament table, fixtures, point table, MVP, fantasy tip. Blocked: betting, tobacco, alcohol, abusive text.

## 4. Priority rule
1 Wicket/Six/100 > 2 Four/50/Free-hit/Review > 3 Extras/pressure/partnership > 4 Single runs/dots > 5 Info/sponsor. Higher interrupts lower; equal waits in queue (max ~5 s); stale events (>10 s) are dropped.

## 5. Safe-use checklist
- ≤3 flashes/second, no full-screen red strobe; reduced-motion fallback.
- Text min about 3 s on screen, high contrast, inside safe area.
- Labels: Scorer-entered / Derived / Estimated / Illustration / Sponsored.
- No copyrighted logos, music, or copied trademarked graphics.

## 6. Build status vs our matrix
446 situations in docs/ticker-matrix.csv; 14 base tickers + 5 hero VFX + DRS studio + lane built. Next batches: toss, XI, powerplay, chase equation, over end, result, impact player, pitch/weather.

## Sources
- SVG "Designing the Modern Scorebug" (2026-06-09): https://www.sportsvideo.org/2026/06/09/designing-the-modern-scorebug-how-broadcast-graphics-teams-are-rethinking-the-most-important-element-on-screen/
- School of Motion, sports lower thirds: https://www.schoolofmotion.com/blog/sports-lower-thirds
- SVG Europe, Sky Sports/ECB cricket graphics: https://www.svgeurope.org/blog/headlines/graphical-teamwork-sky-sports-leans-into-graphics-to-enhance-the-english-cricket-board-viewing-experience/
- SVG Europe, ICC World Cup 2023 tracking: https://www.svgeurope.org/blog/headlines/behind-the-icc-mens-cricket-world-cup-2023-innovations-with-vertical-video-feed-plus-ball-and-player-tracking/
- W3C WCAG three flashes: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- ITU-R BT.1702: https://www.itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.1702-0-200502-I!!PDF-E.pdf
- EBU R95 safe areas: https://tech.ebu.ch/docs/r/r095.pdf
- BBC GEL motion: https://bbcbreakingnews.pages.dev/gel/features/abcs-of-motion
