# Scoring Heroes project recap — 15 October 2026

This review reconciles the current main branch, REQUIREMENTS_REGISTER.md and the user's phone screenshots. A feature label or mock test is not proof of production readiness.

## Product modules to retain

| Area | Required scope | Current evidence and remaining work |
|---|---|---|
| Main app | Country sports selection, worldwide SH identity, welcome, account, profile, notifications | Catalogue/preferences and identity exist; worldwide number metadata, location hierarchy, recovery and device management incomplete. |
| Authentication | Six-digit email and SMS OTP, expiry/resend/rate limits, persistent login | Code and mocked tests exist. Inbox and handset delivery unverified. Render configuration and gateway phone connectivity must be checked; no real OTP sent in this review. Keep the authorised 50-SMS total trial cap and email fallback. |
| Match Centre | Review, live, scorecard, commentary, XI, squads, overs, graphs, H2H, strength, insights, venue, highlights and news | Phone screenshots show only Info/Live/Scorecard/Squads. Concurrent commit d90f972 adds Commentary/Graphs and OTP diagnostics; real-provider validation still pending. Ball events, coverage, freshness, innings selection and full details need runtime validation. Do not fill unsupported tabs with invented match data. |
| Scorecard | Batters, dismissal/fielder/bowler, extras, total, DNB, bowling, FOW, partnerships | Current renderer omitted extras/FOW. This patch renders supplied extras/FOW and total, preserves the concurrent match_info request, and stops inferring DNB from an entire squad. Need provider response evidence for complete coverage. |
| Player | Photo/avatar, info, recent form, batting, bowling, career, rankings, academy progression, social and press | Existing SH profiles and provider career stats are partial. Academy timeline, verified ranking formulas and connected social publishing remain incomplete. Photo absent/broken/provider logo must show SH player avatar, not a provider badge or app icon. |
| Scorers | Cricket, football, kabaddi, badminton, volleyball and catalogue modules | Five-sport sharing was tested with fictional local fixtures. This does not establish full rules or complete international feeds. Audit cricket laws and each sport separately. |
| Predictions | Explainable forecast, input freshness and uncertainty | No validated prediction model or accuracy evidence. A run-rate projection is not a win-probability model. |
| Auctions | Public registration link, photo, review, pool, bids, budgets, sold/unsold, final squads | Core registration/review tested locally; online payment verification, eligibility, notifications and complete re-auction flow pending. |
| Academy/bookings/marketplace | Academy to career, coaches, grounds, events, OLX-style sports listings | End-to-end workflows and settlement rules remain incomplete. |
| Broadcast | Main APK, scorer, broadcast companion, OBS/Web Studio; streaming, switches, commentator, voice AI, avatars, visual effects | Android WebView build exists. OBS overlay is partial. Real avatar generation, voice model integration, preview/program, stream switching and effects package are not complete. |
| Tickers | Live scorebug, recent balls/overs, target/RRR, XI, FOW, player stats, sponsors, auction, awards | Basic overlay exists; full ticker pack and operator controls require verification and implementation. |
| Newsroom | Posters, articles, multilingual local-to-global ePaper, watermark, player press and social destinations | Rule-based reports/cards and manual post manager exist; real AI integration and authorised automatic social posting incomplete. |
| Operations | Roles, audit, disputes, backups, privacy, accessibility, offline/sync | Some roles and cases exist. Durability, device revocation and production checks incomplete. |

## Data research

- CricketData documentation: https://cricketdata.org/how-to-use-cricket-data-api.aspx . Public documentation extraction did not establish a supported commentary endpoint. The concurrent update adds match_bbb, but its schema is explicitly unverified against a real response. Lack of an implemented endpoint does not prove that the user's paid plan lacks the feature.
- Sportmonks official overview: https://www.sportmonks.com/cricket-api/ documents fixture includes for batting, bowling, lineup, balls and venue, including player photos. This is a capability comparison, not a recommendation to buy or a provider migration.
- Roanuz official ball API: https://www.cricketapi.com/docs/Core-API/Ball-By-Ball-API/ documents delivery records. Tournament coverage, licensing and access must be checked against actual needs before adopting another source.
- Existing historical importer and photo finder were tested with mocks. Real Cricsheet/Openverse imports and licensing still require verification; these are not live commentary substitutes.

## Patch and acceptance limits

Changed: SH SVG player-avatar fallback, rejection of common provider placeholder/logo paths, broken-image fallback, wrapping squad names, detailed match_info request, supplied extras/FOW/total display, removal of unconfirmed squad-to-DNB inference.

Test: tests/match-centre.cjs compiles inline scripts and checks fallback/photo paths, error handler markup, supplied score details and info loading. It is a unit/source check, not a phone/browser visual or provider delivery test.

Still open: real provider payload audit, live commentary/overs graphs, confirmed XI, complete player recent form, predictions, real OTP delivery and production deployment verification. Do not describe this patch as the complete app.
