# Scoring Heroes — Global Broadcast Animation Catalog (A to Z)
Reference list of every animation / graphic type used in sports broadcasts and live-score apps worldwide, grouped A–Z by job, with who uses it and our status.

Tags: [R] confirmed in a page I read (source list at bottom) · [G] general industry knowledge, not verified on a page this session · [N] not found (no claim made).
Our status: BUILT / PLANNED / NEEDS-DATA (cannot be done from a phone scorer without entered values) / NO (needs pro hardware).
Rule from Hemasundar: every item must exist for ALL sports, not only cricket (see section 12 for mapping).

## 0. Network-by-network (what I could confirm)
| Network / provider | Confirmed graphics & tech | Tag |
|---|---|---|
| Star Sports / Disney Star (IPL 2022) | Mixed-reality studio analysis with Hawk-Eye data (MR headset), virtual multi-screen telestration, ball-by-ball fielding analysis in digital-twin stadiums with player tracking, 3D player avatars, virtual studio with positional tracking, AR on drone cameras, "Cricko" stats robot, live viewer polls, Dolby Atmos (audio) | [R] |
| Star / Hotstar (Vizrt case study) | AR + VR for IPL live online coverage; CricViz partner for stats | [R] (titles) |
| Sony Sports Network | Only found: fans compare scorecard graphics (JioHotstar vs Sony) — no feature list | [N] |
| Sky Sports (ECB cricket 2025) | Hawk-Eye AR ball-by-ball path via Spidercam, Quidich HyperView live fielder positions, fielder movement between balls, batter's-helmet bird's-eye field view, AR "jumbotron" match-state + partnership display, big-screen batting analysis | [R] |
| Sky Sports (football) | Virtual studio (Unreal Engine 4), camera tracking, Vizrt editorial graphics on set screens, AR team formations with player avatars (2018 rollout) | [R] |
| ICC world feed 2023 | Hawk-Eye ball tracking (pitch, speed, height, edge detection), off-bat tracking (bat speed, launch angle, launch velocity, peak height, throw), Quidich live field plot, Field 360 gaps, 3D shot playback, AE Live graphics, CricViz data, drone and buggy cam | [R] |
| ICC 2019 | Tracab, Hawk-Eye, Piero, Spidercam AR, AE Graphics 100+ templates | [R] (earlier session) |
| Fox / Kayo (Australia) | HyperLayer 6-camera AI ball tracking, 600 fps "Emperor" ultra-motion camera (ball + player tracking, pose estimation, replays), 4D 360 replays from ~100 cameras on companion app | [R] |
| 2026 India series (network not named) | Magic 360 cam (freeze and rotate), Skel Track (biomechanics: balance, head angle, weight transfer), Umpire Cam (AI-stabilised), player trackers | [R] |
| US (CBS/Fox/ESPN/NBC football) | Animations, scorebugs, insert packages, AR overlays, data visualisation (general) | [R] (no per-network detail) |
| Live apps (Cricbuzz, ESPNcricinfo, CricHeroes) | Not fetched this session; feature list below is [G] from common knowledge | [G] |

## 1. A–Z catalog
Columns: Graphic | What it shows | When | Pro source | Tag | Our status
### A — Always-on / Alerts
| Graphic | What it shows | When | Tag | Status |
|---|---|---|---|---|
| Score bug | teams, score, overs/clock, batters, bowler | whole match | [R] | BUILT |
| Alert strip (urgent) | breaking info | rain, injury, protest | [G] | BUILT (lane alert) |
| Advert slate | sponsored card | breaks | [G] | BUILT (lane, labeled) |
| Anthem / team-line-up intro | players walking, names | pre-match | [G] | PLANNED |
| AR on-field graphic | virtual graphics on grass | breaks | [R] | NO |
### B — Ball / play tracking
| Graphic | What | When | Tag | Status |
|---|---|---|---|---|
| Ball path / trajectory | delivery line | each ball or replay | [R] | PLANNED (illustration) |
| Pitch map | where balls landed | over break | [G] | PLANNED |
| Beehive | pitching/line zone dots | spell review | [G] | PLANNED |
| Ball speed | km/h at release | each ball | [R] | NEEDS-DATA |
| Swing / spin / seam | deviation | replay | [G] | NEEDS-DATA |
| Bat speed / launch angle / peak height | off-bat data | six / catch replay | [R] | NEEDS-DATA |
| Six distance / height | length of hit | after six | [R] | NEEDS-DATA |
| Throw speed / direct hit line | fielding | run-out | [R] | NEEDS-DATA |
| Strike zone box (baseball), shot trail (golf), serve speed (tennis) | per-sport tracking | per play | [G] | NEEDS-DATA |
### C — Counters / equation
| Graphic | What | When | Tag | Status |
|---|---|---|---|---|
| Target / required rate | NEED x OFF y, RRR vs CRR | chase | [G] | PLANNED |
| Run rate / worm / Manhattan | scoring progress | over / innings break | [G] | PLANNED |
| Win probability | model line | big moments | [G] | PLANNED (labeled) |
| Last 6 balls / over summary | dots | each over | [G] | PLANNED |
| Powerplay / phase bar | PP overs left | phases | [G] | PLANNED |
| Possession / down & distance / count-outs-runners (US sports) | sport bug state | always | [R] general | PLANNED per sport |
### D — Dismissal / decision
| Graphic | What | When | Tag | Status |
|---|---|---|---|---|
| Wicket stinger (4 modes) | OUT word + mode | wicket | [G] | BUILT |
| DRS review studio | ball-track, edge, heat | review | [R] | BUILT |
| Umpire's call | marginal zone | review | [G] | BUILT |
| Hat-trick / golden duck | special banner | event | [G] | BUILT |
| Free hit / no-ball over-line | alert | no-ball | [G] | PARTIAL |
| Offside line / VAR (football) | line + decision | review | [R] | PLANNED |
### E — Effects (VFX)
| Graphic | When | Tag | Status |
|---|---|---|---|
| SIX arc & crowd burst | six | [G] | BUILT |
| FOUR shock ring | four | [G] | BUILT |
| 50 / 100 celebration | milestone | [G] | BUILT |
| Replay wipe / transition | replays | [G] | PLANNED |
| Slow-mo / freeze + rotate (Magic 360) | key moment | [R] | NO |
| Fireworks/confetti (result) | win | [G] | PLANNED |
### F — Fielding / field
| Graphic | What | Tag | Status |
|---|---|---|---|
| Field placement map | fielder positions | [R] | PLANNED (Scorer-set) |
| Field 360 gaps | spacing | [R] | NO |
| Fielder move between balls | repositioning | [R] | NO |
| Catch probability / reaction | tracking | [G] | NO |
### G — Game state
Toss card, playing XI, impact sub, innings break summary, drinks/rain/strategic timeout, super over, DLS par — [G] — PLANNED.
### H — Head-to-head / history
Batter vs bowler, career line, record bar, H2H team stats, venue stats — [R] CricViz data use; [G] layouts — PLANNED (using our own match data).
### I — Info / editorial
Pitch & weather report, pundit analysis board, telestration (draw on video), AR studio — [R] — NO / PLANNED lite.
### L — Lower thirds
Player ID, new batter, bowler change, commentator name, award — [R] 3–6 s — BUILT/PLANNED.
### M — Milestones / records
25/50/75/100, partnership 50/100, 3-fer/5-fer, career 1000, record broken, fastest — [G] — PARTIAL.
### O — Over / spell
Over summary, maiden, bowler figures, spell compare — [G] — PLANNED.
### P — Players / people
Avatars (3D), skeleton track (Skel Track), umpire cam — [R] — NO.
### R — Result & tables
Result card, POTM, series score, points table, NRR, qualification scenarios, fixtures — [G] — PARTIAL.
### S — Shot / scoring charts
Wagon wheel, scoring zones, shot playback in 3D, strike rate by zone — [R] (3D playback) / [G] — PLANNED.
### T — Ticker / lane
Ticker per ball (14 built), scroll lane (7 styles), social ticker, other-match scores ticker — [G] — BUILT/PLANNED.
### V — Virtual / fan
Viewer polls, quiz, QR / social, fantasy tip, MVP, stats robot (Cricko) — [R]/[G] — PLANNED.
### Z — Zones / formats
Powerplay zone, free-hit zone, deathovers zone, field restriction circle — [G] — PLANNED.

## 2. Cross-sport mapping (same system for every sport)
| Slot | Cricket | Football | Basketball | Tennis | Kabaddi/Volleyball/Badminton etc. |
|---|---|---|---|---|---|
| Bug | runs/wkts/overs | goals/clock | pts/clock/shot-clock | sets/games/points | points/raids/sets |
| Big event VFX | SIX/FOUR/OUT | GOAL | 3-POINTER/DUNK | ACE/BREAK | SUPER RAID/ALL OUT/SMASH |
| Milestone | 50/100 | hat-trick | double-double | match point | super 10 |
| Review | DRS | VAR | challenge | challenge | review |
| Phase | powerplay | half-time | quarter | set | half |
| Summary | scorecard | stats | box score | stats | stats |
Use docs/SPORTS_PROGRAM.md for per-sport rules.

## 3. What is NOT possible from a phone scorer
Pro-camera tracking (Hawk-Eye, Tracab, Quidich, HyperLayer), 600 fps cameras, drone/AR, Spidercam, 4D replays. We show estimates only when the Scorer enters values, labeled; otherwise the graphic stays hidden.

## 4. Priority to build next (suggestion)
Batch 2: toss, XI, powerplay, chase equation, over end, result, impact player. Then analysis (wagon wheel, worm, Manhattan), then other sports' event VFX (GOAL, 3-POINTER, ACE).

## Sources
- Star IPL 2022 tech: https://www.exchange4media.com/ipl-news/disney-star-announces-tech-innovations-for-ipl-2022-119375.html
- Hotstar/Vizrt: https://www.vizrt.com/case-studies/hotstar-indian-premier-league-cricket-vizrt/
- Kayo/Fox cricket tech: https://foxtelgroup.com.au/newsroom/game-changing-tech-innovations-unveiled-for-kayo-sports-biggest-ever-summer-of-cricket
- Sky/ECB cricket graphics: https://www.svgeurope.org/blog/headlines/graphical-teamwork-sky-sports-leans-into-graphics-to-enhance-the-english-cricket-board-viewing-experience/
- ICC 2023 tracking: https://www.svgeurope.org/blog/headlines/behind-the-icc-mens-cricket-world-cup-2023-innovations-with-vertical-video-feed-plus-ball-and-player-tracking/
- Sky football AR/virtual studio: https://www.svgeurope.org/blog/headlines/and-its-live-sky-sports-to-bolster-premier-league-coverage-with-more-ar/
- 2026 cricket broadcast tech: https://yourstory.com/2026/08/how-new-broadcast-technology-is-changing-the-way-fans-watch-cricket
- SVG NFL graphics panel: https://www.sportsvideo.org/2025/03/25/gridiron-graphics-national-broadcasters-discuss-the-latest-in-nfl-graphics-packages/
- SVG scorebug design: https://www.sportsvideo.org/2026/06/09/designing-the-modern-scorebug-how-broadcast-graphics-teams-are-rethinking-the-most-important-element-on-screen/
