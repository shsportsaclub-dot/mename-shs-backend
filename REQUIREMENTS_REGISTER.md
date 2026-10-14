# Scoring Heroes — Master Requirements Register

Columns: ID | Requirement | Source | Module/Screen | Data/API | Permissions | Test | Evidence | Status.
Status values: BUILT-TESTED, PARTIAL, NOT BUILT, SOURCE/DEFINITION REQUIRED.
Requirements are kept separate from implementation status. Conflicts: latest explicit user instruction wins.
"Evidence" = what was actually run in a real browser/server in this project. Blank = none.

| ID | Requirement | Source | Module / Screen | Data / API | Permissions | Evidence | Status |
|---|---|---|---|---|---|---|---|
| R01 | Global sports catalogue, status separate from module readiness | Catalogue doc | More / My Sports / Admin | S.cat, /api/catalogue | Admin-only edit | Playwright, cross-device sync | BUILT-TESTED |
| R02 | Full approved 500+ names | Lists 1-600 | Catalogue import | CAT_IMP | Admin | 600 rows imported; classification/icons/local names missing | PARTIAL (SOURCE REQUIRED for approved final list) |
| R03 | Country-based sport defaults, user sports primary | Catalogue doc | Prefs | S.prefs, /api/prefs | User | Tested | BUILT-TESTED |
| R04 | Scorers: cricket + 12 other sports | App master | Score | S.sg | Scorer | Per-sport tests | BUILT-TESTED (rule fidelity per sport not independently verified) |
| R05 | Worldwide mobile numbers, E.164, no India-only rule | Number doc | Register/Login | server pk/e164 | Public | IN/US/UK/UAE tests | PARTIAL (no maintained metadata library: npm unreachable) |
| R06 | OTP delivery country-aware, unsupported shown honestly | Number doc 8 | OTP | SMS_REGIONS | Server | Unsupported status tested | PARTIAL (no SMS provider configured) |
| R07 | OTP mandatory for registration | User "Ok" | Register | - | - | - | NOT BUILT (needs SMS/WhatsApp provider) |
| R08 | Permanent SH ID separate from phone | Number doc 6 | Profile | server-issued | - | Tested | BUILT-TESTED |
| R09 | Change number / recovery / merge review | Number doc 7 | Account | - | - | - | NOT BUILT |
| R10 | Scorer private phone lookup, minimum participant profile | Number doc 5 | Scorer squad | - | Role-based | - | NOT BUILT |
| R11 | World location hierarchy with stable IDs | Number doc 3 | Location | - | - | - | NOT BUILT (SOURCE: dataset required) |
| R12 | Guardian/student links | Number doc 10 | Account | - | - | - | NOT BUILT |
| R13 | Player profile tabs (Overview..Social), filters, empty states | Player doc | Player | ppBody | Public | Playwright, 10 tabs screenshotted, no JS errors | BUILT-TESTED for cricket data from SH matches; Academy/Gallery/Social are honest placeholders |
| R14 | Career timeline with Verified/Imported/Self-declared labels | Player doc 4 | Career tab | - | - | Basic timeline from matches only | PARTIAL |
| R15 | Rankings per sport with disclosed method | Player doc 6, Rem. 5 | Rankings tab | - | - | Simple runs/wickets leaderboard, disclosed as NOT a points formula | PARTIAL; formulas SOURCE/DEFINITION REQUIRED |
| R16 | Social auto-posting to connected accounts | Player doc 5 | Social | - | Connected accounts + editorial review | - | NOT BUILT |
| R17 | Match category/eligibility (Men/Women/Mixed, age, level, ball type) | Rem. 1 | Match Start wizard, Format step | m.cat | Scorer | Playwright: required category, saved on match, shown in header | PARTIAL: labels built; competition-specific player eligibility and inherited approved rules NOT BUILT |
| R18 | Match Start wizard (9 steps already existed: mode, teams, format, players, venue, officials, broadcast, toss, review) | Workflow doc | Score | S.wiz | Scorer | Existing + category step tested | PARTIAL: Select Sport step and competition/fixture linkage NOT BUILT (wizard is cricket only) |
| R19 | Board/league administration, affiliation | Rem. 2 | Admin | - | Board admins | - | NOT BUILT |
| R20 | Live-telecast viewing passes (separate from stadium tickets) | Rem. 3 | Watch | payment + entitlement | Server-side | - | NOT BUILT (payment gateway + stream source required) |
| R21 | Subscriptions, entitlements, expiry never deletes records | Rem. 4 | Plans | - | Server-side | - | NOT BUILT (SOURCE: plan/settlement rules required) |
| R22 | Formulas: ranking, auction category, MVP, Team 11, Best Team (each separate) | Rem. 5 | - | - | - | - | SOURCE/DEFINITION REQUIRED |
| R23 | Tournament leaders, caps, awards, certificates | Rem. 6 | Tournament | - | - | Existing basic leaders only | PARTIAL |
| R24 | Venue local time + viewer local time; neutral weather if missing | Rem. 7 | Match | - | - | - | NOT BUILT |
| R25 | Support/dispute flows (7 types) with audit | Rem. 8 | Support > Report a problem | /api/cases | User files; admin decides | 2-user Playwright: validation, case number, admin needs reason, user cannot decide (403), history shown | PARTIAL: request, decision and audit built; evidence is text/link only; a decision does NOT auto-correct scores/stats/rankings (admin edits the record separately); no notifications; Privacy/Terms/Refund text SOURCE REQUIRED |
| R26 | Canonical share links/QR and notification deep links | Rem. 9 | Share | ?player= ?match= | - | Playwright: both links open the record | PARTIAL: links built; player records are not on the server so ?player= opens only where the record exists on that device; match links need the match shared to the server; QR and notification deep links NOT BUILT |
| R27 | Accessibility, reduced motion, sessions/devices, account closure | Rem. 10 | Settings | - | - | - | NOT BUILT |
| R28 | Email optional | User | Register | cleanProfile | - | Tested | BUILT-TESTED |
| R29 | Voice AI integration | Rem. 11 | - | - | - | - | SOURCE/DEFINITION REQUIRED (source code + contract) |
| R30 | Approved logo/icon/background assets | Rem. 11 | - | - | - | - | SOURCE/DEFINITION REQUIRED |
| R31 | Welcome screen with language + country | Workflow | Entry | S.prefs | Public | Playwright: first launch shows it, saves, not shown again | PARTIAL: Role/Avatar/SH ID claim steps NOT BUILT; app text not translated |
| R32 | Auction public-link registration: organiser setup (categories, base prices, fee, dates), player form with mandatory photo, status flow, duplicate prevention, organiser review, approve to pool, per-player base/max in bidding | Auction reg doc | Auction > Register tab; ?reg= link | /api/aucreg/* (server decides status) | Player / organiser / admin | Playwright 2-user test: photo required, duplicate blocked, unpaid cannot be approved, changes-required loop, approve adds to pool, player cannot approve | PARTIAL: BUILT-TESTED core; NOT BUILT: online fee payment + server verification (only organiser-recorded), QR, OTP step, eligibility rules/extra required fields, tournament linkage, notify player on SOLD, re-auction |
| R33 | External profile link import (CricHeroes, CrickBro, CricGiri Live, CricLabs) | Import doc | Registration form | link + provenance | Player | Source detection tested for CricHeroes | PARTIAL: link attached as self-declared/unverified only. Automatic fetch/preview NOT BUILT: no verified public API or permission route; sandbox cannot reach those sites; QR scan not built |
| R34 | Media engine: automatic posters (13 types, presets), editable, publish workflow | Media doc 1-3 | - | - | Editorial approval | - | NOT BUILT (assets/branding SOURCE REQUIRED) |
| R35 | Articles (8 types), canonical article + translations, correction history | Media doc 4, Social doc 5-6 | - | - | Editor | - | NOT BUILT |
| R36 | ePaper (English/Hindi/Telugu, local-to-global editions, archive) | Media doc 5, Social doc 4 | - | - | - | - | NOT BUILT |
| R37 | Broadcast graphics, auction live screen, OBS/vMix output | Media doc 6 | - | - | - | Existing OBS overlay + auction live screen (earlier work) | PARTIAL |
| R38 | Player social accounts: profile link vs authorised connection | Social doc 1-3 | Player > Social | S.psoc (device only) | Own profile/admin | Playwright: host check, add/hide/remove | PARTIAL: profile links only (https, platform host check, show/hide). Authorised connection, tagging, auto-publish NOT BUILT (needs platform authorisation). Links are not yet synced to the server |
| R39 | Player media portfolio + publishing dashboard (per-destination status, retry, withdrawal, real metrics only) | Social doc 7-8 | Player > Media/Press | - | - | - | NOT BUILT |
| R40 | Live score tickers: scorebug, bottom strip, ball-by-ball, recent overs, target + RRR, status/result, other live scores | Ticker pack 1 | Overlay (#overlay) | S match data | Operator | Earlier work: basic scoreboard overlay, OBS browser source | PARTIAL (exact coverage per item not re-verified this session) |
| R41 | Player/team graphics: intros, photo/avatar, career stats, XI, partnership/FOW, scorecard | Ticker pack 2 | Overlay | - | Operator | - | NOT BUILT (verify what overlay already has) |
| R42 | Competition tickers: fixtures, points table, leaders, qualification, awards, auction bid/wallet, SOLD/UNSOLD, final squads | Ticker pack 3 | Overlay | - | Operator | Auction live screen exists in app only | NOT BUILT as overlay |
| R43 | News/sponsor tickers, registration link + QR, labelled ads | Ticker pack 4 | Overlay | - | Operator | - | NOT BUILT (sponsor assets SOURCE REQUIRED) |
| R44 | Effects pack (FOUR/SIX/WICKET, milestones, POM, trophy, replay IN/OUT, sound cues), per-sport event names | Ticker pack 5 | Overlay | - | Operator | - | NOT BUILT |
| R45 | Operator controls: on/off, position/size, language, template, speed, duration, queue/priority, Preview-Program, auto/manual | Ticker pack 6 | Overlay controls | - | Operator | - | NOT BUILT (basic overlay settings exist) |
| R46 | Outputs: App/Web/TV/Big screen, OBS browser source, vMix overlay, transparent background, safe margins; manual announcements separate from official scores | Ticker pack 7 | Overlay | - | - | OBS browser source existed earlier | PARTIAL |
| R47 | Shared graphics package (templates, assets, render engine, data contract, versioned updates) used by Broadcast Companion and Windows/Web Studio | Ticker pack 8 | - | - | - | - | NOT BUILT |

Build order (latest user instruction): 1 Existing SMS gateway preserved/integrated -> 2 Main App: Welcome + OTP + Profile + Home -> 3 Scorer: cricket complete, then sport-specific modules -> 4 Broadcast Companion -> 5 remaining ecosystem modules in Main App.

Open flags: first registered user becomes admin; PIN login does not prove number ownership; legacy OTP client mode is India-only.
