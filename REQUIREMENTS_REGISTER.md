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
| R17 | Match category/eligibility (Men/Women/Mixed, age, level, ball type) | Rem. 1 | Match Start | - | - | - | NOT BUILT |
| R18 | Match Start wizard | Workflow doc | Score | - | - | - | NOT BUILT |
| R19 | Board/league administration, affiliation | Rem. 2 | Admin | - | Board admins | - | NOT BUILT |
| R20 | Live-telecast viewing passes (separate from stadium tickets) | Rem. 3 | Watch | payment + entitlement | Server-side | - | NOT BUILT (payment gateway + stream source required) |
| R21 | Subscriptions, entitlements, expiry never deletes records | Rem. 4 | Plans | - | Server-side | - | NOT BUILT (SOURCE: plan/settlement rules required) |
| R22 | Formulas: ranking, auction category, MVP, Team 11, Best Team (each separate) | Rem. 5 | - | - | - | - | SOURCE/DEFINITION REQUIRED |
| R23 | Tournament leaders, caps, awards, certificates | Rem. 6 | Tournament | - | - | Existing basic leaders only | PARTIAL |
| R24 | Venue local time + viewer local time; neutral weather if missing | Rem. 7 | Match | - | - | - | NOT BUILT |
| R25 | Support/dispute flows (7 types) with audit | Rem. 8 | Support | - | Role-based | Support page exists; no case flows | PARTIAL (policy text SOURCE REQUIRED) |
| R26 | Canonical share links/QR and notification deep links | Rem. 9 | Share | - | - | Share text only | PARTIAL |
| R27 | Accessibility, reduced motion, sessions/devices, account closure | Rem. 10 | Settings | - | - | - | NOT BUILT |
| R28 | Email optional | User | Register | cleanProfile | - | Tested | BUILT-TESTED |
| R29 | Voice AI integration | Rem. 11 | - | - | - | - | SOURCE/DEFINITION REQUIRED (source code + contract) |
| R30 | Approved logo/icon/background assets | Rem. 11 | - | - | - | - | SOURCE/DEFINITION REQUIRED |
| R31 | Welcome screen with language + country | Workflow | Entry | - | - | - | NOT BUILT |

Open flags: first registered user becomes admin; PIN login does not prove number ownership; legacy OTP client mode is India-only.
