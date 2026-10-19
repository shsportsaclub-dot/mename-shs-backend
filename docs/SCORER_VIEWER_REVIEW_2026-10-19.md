# Scoring Heroes scorer and viewer review

Date: 18 October 2026 UTC / 19 October IST. Scope: current main plus identity and match-centre fixes. This is a gap register, not an assertion that the whole application is complete.

## Authority read
- Authoritative Total Project Executable Bible V2, 1 October 2026: all 74 pages.
- Pin-to-Pin Development Bible Master V1, 23 September 2026: all retrieved content.
- SH Master Ideology, 13 October 2026: all 20 pages.

Completion requires real actions, persistence/reload, responsive and runtime evidence. Cricket is the first complete sport; all other sports require native rules, terminology, periods/sets, scorer, result and graphs. Service Hub remains a separate authority.

## References and SH decisions
| Reference | Public source examined | SH application |
|---|---|---|
| CricHeroes | https://blog.cricheroes.com/how-to-score-a-cricket-match-with-cricheroes-app/ ; https://blog.cricheroes.com/wagon-wheel-in-cricket-how-to-make-with-cricheroes-app/ | Squad/XI, toss, striker/non-striker/bowler, runs/extras/wicket, manual shot direction, correction |
| Crickslab | https://apps.apple.com/in/app/crickslab/id1489726470 ; https://crickslab.com/products | Single-screen scorekeeper separated from public live sheet; roster/official/league continuity |
| CricHome | https://apps.apple.com/in/app/crichome/id6781682706 | Offline queue, event-based commentary/career, overlays, auction registration |
| CricGiri Live | https://play.google.com/store/apps/details?id=com.cricgiri.live.score | Squad versus XI, role management, substitutions, worm/over comparison |
| Stumps | https://stumpsapp.com/features | Fast scoring, automatic calculations, configurable settings and match analytics |
| CricAuction | https://cricauction.live/ ; https://cricauction.live/faq | Registration, bidding, wallets, sold/unsold, team allocation. Existing auction not exhaustively runtime-audited in this batch |
| Cricbuzz | https://www.cricbuzz.com/cricket-match/live-scores ; https://www.cricbuzz.com/live-cricket-scorecard/129453/england-vs-india | Dense viewer navigation, separate scorecard/commentary/overs/graphs and match context |
| Cricket Australia | https://www.cricket.com.au/matches ; https://www.cricket.com.au/matches/CA%3A8933/australia-men-v-india-men- | Public match centre, ball-by-ball versus scorecard and media. Authenticated/native app internals not inspected |
| CREX | https://apps.apple.com/in/app/crex-just-cricket/id1370408703?platform=ipad | Fast live context, player analysis, graph access and light/dark behavior with SH-owned styling |

Public guides/listings do not reveal proprietary code or every authenticated app tab. No claim of exhaustive A-to-Z native-app inspection. Original SH implementation; no copied proprietary code.

## Verified findings and action
| Requirement | Finding | Action/status |
|---|---|---|
| Live window reaches the phone | Production health remained 2b2c542 while GitHub main was d58103d | Deployment gap verified; must re-check after push, not assume auto deploy worked |
| Viewer versus scorer | Live-window and scorer console code exist with earlier synthetic browser evidence | Preserve separate controls and replay/event boundaries; re-run current runtime tests |
| Every local tab opens | Legacy vMatch reset unfamiliar tabs to Summary before added renderers executed | Replace inconsistent inherited shell with explicit renderer per tab; runtime loop checks no reset |
| Playing XI versus squad | Local Squads displayed only selected XI | Separate selected XI and registered full team roster; two-column role-grouped squad view and Info summary |
| Ball/4/6/wicket effects | Existing event-keyed effects and reduced-motion handling exist | Preserve; genuine delivery records required. A poll containing several balls cannot invent missing deliveries |
| Over cards and line graph | Existing shared delivery grouping and gap-aware over graph | Local viewer now uses same exact event model for Overs and Graphs |
| SH Sports 11 | World implementation exists; local shell had no direct route | Local SH Sports 11 route uses same local roster and actual scoring events. Prediction still requires adequate sourced form |
| Country/board images | 24 generated country-ball variants for 23 countries plus 10 official IPL assets recovered | Add stable alias registry, optimized WebP, custom uploaded team logos retain priority, no player-photo substitution |
| Email/SMS | Public status currently emailReady=false, smsReady=false | Configuration not repaired by UI or new CricketData key; unresolved |
| Live provider deliveries | Earlier new-key PAK-SL check: bbbEnabled=false, returned delivery count 0; scorecard worked | Remains a per-match source limitation; actual SH local scorer events can provide full delivery history |
| Durable history | Journal supports optional database; free-host file is not redeploy-durable | Persistent database configuration/verification remains required |
| All sports | Existing catalogue marks many LIMITED/COMING SOON; football, tennis, racket/volleyball, basketball, rugby, kabaddi and others have distinct partial engines | Not all-sports complete. Each requires separate official-rule research and end-to-end acceptance; no mass relabeling |
| Auction/native APK family/AI broadcast | Significant locked scope beyond this match-centre patch | Pending dedicated acceptance batches; not declared complete |

## Current batch verification
Local syntax and identity alias/asset checks pass. GitHub CI performs actual narrow-screen app rendering, all local Match Centre tabs, viewer/scorer separation, animations, image decoding and persistence fixtures. Synthetic fixtures are not external live-data proof and not phone-install proof. Production deployment is reported separately.
