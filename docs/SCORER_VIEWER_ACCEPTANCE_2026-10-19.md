# Scorer and viewer acceptance — 19 October 2026

This record supersedes code-presence labels in PARITY-MATRIX-2026-10-19.md. It does not mark the whole scorer, all references or every sport complete.

## Original requirements examined
- Pin-to-Pin Development Bible Master V1, 23 September 2026: complete retrieved text, 20 pages. Scorer IDs SH-SCORER-001–015, Match Centre SH-MATCH-001–010, QA gate SH-QA-005.
- SH Master Ideology, 13 October 2026: scoring, match-centre, identity, multi-sport and delivery requirements in pages 3–8; scorer/match appendix pages 10–12.
- REQUIREMENTS_REGISTER.md and previous review/parity notes.
- The separately named Total Project Executable Bible V2 was not retrieved in this pass. Earlier review notes saying it was read are historical, not proof of a new full-document audit.

Acceptance rule: intended user-visible behavior, correct persisted data, permissions/error paths and runtime evidence. A tab opening does not establish that every feature within it works.

## Public reference research
| Reference | Source | Applicable workflow |
|---|---|---|
| CricHeroes | https://blog.cricheroes.com/how-to-score-a-cricket-match-with-cricheroes-app/ and https://blog.cricheroes.com/how-to-edit-scorecards-in-live-matches-on-cricheroes/ | Squad/XI, toss, opening players, score deliveries, correction workflow |
| Crickslab | https://crickslab.com/products and https://crickslab.com/products/live-streams | Scoring feeds viewer and broadcast event graphics |
| Stumps | https://stumpsapp.com/features/ | Scorekeeping, live score and automatic calculations |
| CricHome | https://apps.apple.com/in/app/crichome/id6781682706 | Publisher description: scorer, streaming, tournament/career continuity |
| CricGiri Live | https://play.google.com/store/apps/details?id=com.cricgiri.live.score | Publisher description: live score, graphs, official/competition records |
| CricAuction | https://cricauction.live/faq | Registration, budgets, live bidding and public auction view |
| Cricbuzz | https://www.cricbuzz.com/cricket-match/live-scores | Viewer reference retained from earlier review; no new exhaustive tab inspection this pass |
| Cricket Australia | https://www.cricket.com.au/matches/ | Distinct match centre, scorecard and commentary |
| CREX | https://crex.com/about | Ball-by-ball, scorecard, squads and match context |

Public documentation and publisher listings are not access to proprietary code, nor an inspection of every authenticated/native screen. SH code remains original.

Rule checked: ICC clause 21.19 and Cricket Australia 2025–26 One Day Cup conditions 21.19. A wide/no-ball does not consume a pending free hit. Sources:
https://www.icc-cricket.com/news/mens-t20i-match-clause-21-no-ball
https://resources.cricket-australia.pulselive.com/cricket-australia/document/2025/11/07/a219316b-ffbe-4119-89fa-ae540abe9dae/2025-26-One-Day-Cup-Playing-Conditions-1-September-2025.pdf

## Repairs in this batch
1. Visible match workspace supplies Live window, Resume scoring / Start innings and Scorecard throughout setup, live, innings break and result.
2. Selecting the scorer's fallback match also selects the action target, preventing view/action context disagreement.
3. Duplicate innings submission is rejected; opening players must belong to the appropriate playing XIs.
4. Free hit remains through intervening wides; Test/multi-day innings do not get a free hit after a completed no-ball.
5. Current-over chips show extras before the first legal delivery; completed-over/score context remains during next-player/bowler selection.
6. Local viewer receives explicit wide/no-ball fields, so extras remain illegal deliveries in viewer over totals and chips.
7. New deliveries have stable IDs and times. Undo retains an audit snapshot. This is local match audit, not a complete server-enforced immutable correction system.
8. Run-arrival effects include two running figures. Existing moving ball, FOUR/SIX and wicket effects remain; reduced motion suppresses motion. These are event graphics, not measured ball/player tracking.
9. Viewer controls remain separate from scorer controls. Compact navigation preserves live-window visibility on narrow phones.

## Evidence and limits
| Area | Evidence | Current status |
|---|---|---|
| Cricket setup/score/viewer/reload | tests/scorer-workspace.cjs, widths 320/412/1280; runtime-evidence/scorer-workspace.json | Tested isolated fixtures; not entire scorer acceptance |
| Live window and 22 local tabs | tests/live-window-browser.cjs | Narrow-screen routes, powerplay persistence, expand/Escape, animation; tab opening alone not complete content acceptance |
| FOUR/SIX/wicket effects | tests/delivery-effects-browser.cjs and tests/delivery-effects.test.cjs | Synthetic arrivals, both skins, 320/412, reduced motion and no historical replay |
| Test/multi-day | tests/test-match.cjs | Declaration, follow-on thresholds, innings victory, chase/tie/draw and undo tested |
| Overthrows/concussion | tests/overthrow-concussion.cjs | Tested recorded operations; full officiating approval system pending |
| Cricket/football/kabaddi/badminton/volleyball sharing | tests/sports-live.cjs; isolated server with DATABASE_URL empty | Scorer → server → separate viewer, remote controls hidden, unauthorized mutation 403; not full federation-rule certification |
| Full historical edit/delete | SH-SCORER-008 | Pending; undo is not arbitrary past-ball correction with replay |
| Canonical career/roster permissions | SH-SCORER-003/015 | Partial; universal identity, official permissions and post-match credit approval remain |
| Manual scorecard entry and all format laws | SH-SCORER-011 | Not exhaustively accepted; Hundred and competition-specific rules need separate cases |
| Offline/reconnect | SH-SCORER-012/013 | Existing journal foundation; new stable IDs do not alone prove conflict/idempotency/recovery acceptance |
| External world-match delivery coverage | SH-MATCH-007 | Provider-dependent; missing delivery data must not generate invented balls or effects |
| Auction registration → sale → tournament roster | SH-COMP-005–008 | Existing partial flow, not rerun end to end in this batch |
| Every sport | SH-CORE-001 | Pending native rules, scorer, viewer, period/set/result/statistics and permission acceptance per sport |

## Remaining execution order
1. Cricket delivery correction/replay and server audit, full match lifecycle, format/ball rules and disconnected recovery.
2. Complete viewer data acceptance per tab, career attribution and official roster rights.
3. Auction/competition continuity with verified permissions.
4. Each remaining sport's official rules, native scoring/viewing and end-to-end acceptance. Do not mark every catalogue entry ready or copy cricket rules into other sports.

## Follow-up: fielding, results and reported ecosystem omissions

Latest steering on 19 October explicitly retains all of the following. No module is removed from accepted scope.

### Additional scorer/viewer repairs
- Replaced the incorrect fixed “4 after powerplay” men's T20 wording. Versioned ICC men's T20I/ODI profiles use the October 2026 official tables, including reduced innings. A scorer selects the applicable profile and records any umpire-applied slow-over-rate fielding penalty. This is fielding guidance and phase calculation, not automatic observation of fielder positions or certification of all playing conditions.
- ICC source of current conditions: https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions ; T20I PDF https://images.icc-cricket.com/image/upload/prd/bsxcho7ufe2pjban0wjp.pdf ; ODI PDF https://images.icc-cricket.com/image/upload/prd/bxkzkcyvfn6tvi70zh0w.pdf .
- BCCI source index: https://www.bcci.tv/playing-condition . Its indexed 2025–26 men's T20 PDF did not open in this research pass. BCCI/women/Hundred/local profiles are not claimed as verified.
- Final result now appears above the delivery window; the last delivery cannot obscure the result.
- Restored local live/commentary language and voice controls below the live window. Spoken audio depends on browser/device-installed voices. Worldwide natural-voice coverage is not demonstrated.
- Viewers now see an explicit video-not-connected state when no stream is configured, instead of the whole stream section silently disappearing.

### Scope retained and actual gaps
| User requirement | Existing foundation found | Acceptance still required |
|---|---|---|
| Social posters, achievement graphics | Canvas studio, image/caption download/share, report cards | Approved templates and player imagery, complete poster types, canonical performance linkage, actual authorized publishing |
| News/ePaper | Rule-based match reports, daily reports, post manager | Editorial/version/translation workflows, supported news sources, publication and archive acceptance |
| Second-hand / OLX-style marketplace | Device-local item/shop forms, photo/price/location, mark sold | Server-owned listings, seller permissions, moderation/reporting, search, contact/privacy, cross-device persistence; current local actions are not production marketplace acceptance |
| Ground booking admin and booking panels | Local booking form, fixed SLOTS array, local rate/paid/cancel data | SERVICE HUB API integration; per-ground admin rights; editable slots/prices/dates, holds/concurrency, blackout/academy blocks, advance/refund policy, verified payments/receipts, passes/check-in, actual customer and admin end-to-end tests |
| Academy, coach, referee and student profiles | Basic student attendance/fee cards and officials names | Canonical student↔player identity, academy/coach/referee roles, training and career linkage, guardian permissions, SERVICE HUB attendance/fees authority, role-specific panels |
| Local-to-global ranking | Simple runs/wickets cohort leaderboards | Approved versioned role/sport formulas, geography cohorts, eligibility, tie-breaks, explainability, audited real-data publication; not claimed complete |
| Any scorer link/QR → SH data | Attached self-declared links; some importer/history foundations | Authorized source adapters, QR resolver, identity confirmation, match/delivery normalization, deduplication, provenance, durable import retry and career reconciliation. A saved link is not an imported career |
| Server-based live video for a whole match, source/server 1–4 | Saved YouTube/Facebook/HLS/MP4 links and browser embed; OBS score overlays and score-data scene | No media ingest/transcoding/relay service or four independently provisioned playback servers is implemented by those links. Requires a real authorized feed/camera, media service deployment, source health/failover, measured bandwidth/latency and full-duration playback evidence |
| Private scorer → own YouTube stream | Separate scorer/viewer controls; OBS overlay workflow | Authenticated channel/encoder integration, source contribution, program/preview and live publish/end verification. No connected channel or running camera/encoder was verified in this batch |
| Other channels plus SH branding | Viewer embed and SH overlay foundations | Use authorized feeds. Keep original source branding; do not replace/cover another channel's watermark. An SH page badge alone is not a branded rebroadcast |
| Player avatar profiling | Manual photo/avatar tooling and initials fallbacks | Approved likeness, cross-device canonical profile/media persistence, reusable celebration assets and tested generation engine; no worldwide avatar catalogue completed |

The local scorer/browser tests and “AI scene” test prove deterministic score graphics only. They do not prove video ingest, automatic filming, neural commentary, YouTube publication or real licensed broadcast playback.

### Auction/franchise follow-up retained
- Registration → mandatory photo/profile → payment-status record → organiser review → approved pool → category/base/max → bidding → sold/unsold → franchise squad remains one acceptance journey.
- Existing code is point-only in several visible labels/forms (pts, Pts/Team and registration settings). Currency-based budgets, denomination/rounding, minimum bid and reserve/roster rules require an explicit consistent mode across setup, registration, live bidding, results and audit.
- Franchise social handles are not delivered by the current team-name/short-name/owner-email form. Add franchise profile/logo, owner rights and validated social profile links; authorized posting is a separate connection.
- Category/valuation rules must be editable and versioned. No approved performance-points-to-price formula has been supplied; never present an invented valuation as the user's approved rule.
- Live action handlers and server-owner mutation rules must both be tested; hidden buttons alone are not adequate authorization.
- No new claim of auction/franchise completion is made by the scorer/fielding release.

### AI agency engine and media follow-up retained
- Current match reports are deterministic/rule-based; the canvas poster and manual avatar tools are not a deployed autonomous AI agency.
- Required journey: verified match facts → grounded AI article/caption draft → approved reusable logo/avatar assets → designed poster → translations/edition layout → editorial approval → per-destination publish → delivered/failed/retry/withdrawal history.
- AI text/image providers, generation queue/worker, asset authorization and identity/version linkage, publication accounts, job costs/quotas and model/output validation must be connected and tested. No provider credential, account connection or real publication was established by this release.
- Keep generated narrative separate from official score facts. Never infer a player's likeness, achievement, score or publishing permission from a generic placeholder.



