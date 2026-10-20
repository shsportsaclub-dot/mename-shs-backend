# Scoring Heroes: corrective delivery register — 20 October 2026

This register corrects blanket “Done” entries in the earlier requirements register. Code presence, synthetic screenshots, and live customer acceptance are separate states. No whole module below is certified complete by this batch.

Authority read: Pin-to-Pin Development Bible V1 (23 September, 20 pages); Authoritative Total Project Executable Bible V2 (1 October, 74 pages); SH Master Ideology (13 October, 20 pages); Service Hub Rules and Regulations (17 September, 30 pages). Latest user corrections on 20 October take precedence. No proprietary source code was accessed or copied.

Active target verified: `shsportsaclub-dot/mename-shs-backend`, `main`, Render `scoring-heroes-api`; pre-change health returned `ce2e4d3`, database configured and connected. The Android shell loads this website. An old APK is not evidence of an old web build; verify deployed commit and HTML checksum.

## Concrete corrections in this batch

| ID | Problem | Implemented correction | Acceptance |
|---|---|---|---|
| M06/M08-PP | Viewer rounded powerplay to whole overs, independent of scorer; a reduced 5-over T20 changed at 2.0 instead of 1.3 | Use the scorer's versioned, explicitly applicable ICC men's ODI/T20I plan in viewer; exact legal-ball boundaries; reduced second innings; umpire-recorded fielding penalty; no fabricated ICC limits for custom rules | Unit + browser boundary tests |
| M06-TARGET | Viewer recomputed original first-innings-plus-one despite scorer revised target | Prefer recorded target, preserving ordinary target fallback | Browser revised target 50 / chase needs 49 after one run |
| M14-MODE | Auction only used points despite locked Money/Points requirement | Money/Points selector, explicit currency, unit in budgets/bids/purses/results/export; old auctions retain points; prevent denomination change after bidding; prevent budget below spent allocations and squad below occupied slots | Browser allocation and invalid-edit tests; not a payment gateway |
| M14-PHOTO | Public registration required photo but organiser manual addition did not; live player card showed an initial | Validate and resize uploaded PNG/JPEG/WebP; require a photo for new manual entries; show actual stored photo on block | Browser absent-photo rejection and valid image test; old records retained |
| M22-VIDEO | Provider match video player was unconditionally removed | Configured authorized sources can appear on provider matches; scorers manage up to four links; no unrelated global-channel fallback; fans see configured playback only; external broadcaster video receives no SH overlay; own broadcasts retain SH branding | Browser source/role/switcher tests; playback with real authorized feeds remains a separate acceptance gate |

ICC sources verified on 20 October:
- https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions
- Men's T20I October 2026, clause 28.7: https://images.icc-cricket.com/image/upload/prd/bsxcho7ufe2pjban0wjp.pdf
- Men's ODI October 2026, clause 28.7: https://images.icc-cricket.com/image/upload/prd/bxkzkcyvfn6tvi70zh0w.pdf

BCCI competitions, women's formats, Hundred and local playing conditions are not certified by an ICC men's profile. Authorized match rules must identify the applicable competition/version. Video source buttons are playback choices, not four transcoding servers. An embedded player is not camera ingest, encoding, or direct YouTube publishing.

## Entire user request retained in the execution queue

| Master module | Existing foundation observed | Remaining acceptance / implementation |
|---|---|---|
| M05–M08 scorer/viewer | Separate scorer console/live viewer, ball strip, running and 4/6/W effects, result header, scorecard and corrections | Real two-device scoring→viewer→finish→career; full official format-specific rules, offline conflict and correction propagation; no claim of universal complete live ball coverage |
| M06 graphs/prediction | Manhattan/worm/run-rate/partnership/shot views and match intelligence code | Verify each graph against saved events and actual provider coverage; avoid invented shots and uncalibrated predictions |
| M09 all sports | Several distinct partial engines plus catalogue | Official-rule research, own state/result/penalties/periods/sets, graph and end-to-end scorer/viewer acceptance per sport; catalogue count is not implementation count |
| M11 identity/career/rankings | Profiles, scope filters, history and imports exist | Authorized external link/QR adapters, canonical dedup/provenance/merge audit; complete local→global ranking methodology, version/population/cutoff; external link alone cannot transfer another platform's data |
| M12/M36 academy/officials | Students, batches, attendance/fee/training/ratings UI; academy sync and parent endpoint | Service Hub identity and business authority integration; real cross-device parent privacy, coach/referee permissions, durable student→player link |
| M13/M14 tournament/auction | Public registration, mandatory photos, categories, franchises/social links, bid/purse/retention/RTM UI | Server-authoritative concurrent bidding, atomic SOLD, role assignments, durable history, projector and full tournament→registration→franchises→officials→sponsors→broadcast→auction→groups→fixtures→points→final→awards journey |
| M15/M36 ground booking | Configurable rates, slots, blackouts and online request/clash routes | Integrate authoritative Service Hub availability; per-session/date/holiday pricing, maintenance/academy/tournament blocks, owner panels, hold races, verified payments, passes and access; do not substitute duplicate accounting |
| M18 voice/lounge | Device TTS and language choice, event commentary foundation | Server commentary/TTS/audio mixer, pronunciation, multilingual fact grounding, real commentary rooms/lounge moderation and permissions; device voices are not worldwide AI production |
| M19–M22 broadcast | Link players, score overlays, studio guide and presentation scene | Own camera/contribution APK, protected stream keys, ingest/transcode/HLS, YouTube output, source health/failover, recording/replay; actual feed/territory authorization required; never cover third-party watermarks |
| M24–M27 AI/media | Rule-based reports/ePaper, poster templates, logo/photo brand kit, draft/post manager | Real configured AI agency/model with event grounding, editorial controls, avatar integration, durable media storage, background jobs and authorized social publishing/receipts; template generation is not an AI agency |
| M29 sponsors | Sponsor/overlay foundations | Franchise/sponsor campaign records, consent, inventory, placements and reporting across media |
| M30–M35 commerce | Marketplace/listing/offer/moderation and shop UI foundations | Full OLX-style used-gear lifecycle, seller/stock/order/payment/refund verification and canonical ledger; end-to-end customer acceptance |
| M37–M46 platform/security | Admin/config/server APIs, Android WebView shell, CI | Resource-level rights/tenant isolation, backups/restore, release provenance and actual native device matrix; separate scorer/broadcast apps remain separate work |

## Delivery gates

1. Run syntax/build and rule tests locally.
2. Run browser acceptance and capture fixture evidence at 320/412/1280. Synthetic fixtures are labelled, never represented as external live matches.
3. Publish only the tested source commit; verify Render health commit plus served HTML SHA256.
4. Record actual CI, deployment and device outcomes separately. A failed or unavailable gate remains open.
5. Continue with server-authoritative auction and Service Hub integration using this queue, preserving source identities and working foundations.

The current browser is unavailable in the local environment because its download returned invalid archives; GitHub CI is the browser acceptance runner. Real phone installation, live broadcaster playback, direct camera streaming, and every listed pending module require their own evidence.
