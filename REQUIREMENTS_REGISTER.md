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
| R04 | Scorers: cricket + 12 other sports | App master | Score | S.sg | Scorer | Per-sport tests | BUILT-TESTED (rule fidelity per sport not independently verified) | (Home row + scorer hub now show only user-selected sports)
| R05 | Worldwide mobile numbers, E.164, no India-only rule | Number doc | Register/Login | server pk/e164 | Public | IN/US/UK/UAE tests | PARTIAL (no maintained metadata library: npm unreachable) |
| R06 | SMS OTP delivery country-aware | Number doc 8 | OTP | SMS_REGIONS | Server | Unsupported status tested | DEFERRED: user chose email OTP instead; existing MSG91 code left in place, unused |
| R07 | OTP for registration | User 2026-10-14: email OTP is the best option; no SMS/network gateway | Register (email mode), Forgot PIN | /api/email/send, /api/email/verify, /api/auth/reset | Public | Playwright with console provider: register needs code, wrong code rejected, proof single-use, forgot-PIN works; SMTP client verified against a local fake SMTP server | PARTIAL: BUILT-TESTED for email accounts. Real delivery NOT verified (needs EMAIL_PROVIDER=smtp/resend env on Render; TLS/STARTTLS paths untested against a real server). Mobile-number accounts still have no OTP (PIN only) |
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
| R36 | ePaper (English/Hindi/Telugu, local-to-global editions, archive) | Media doc 5, Social doc 4 | ePaper | /api/paper | - | Playwright epaper-lang | PARTIAL: Local/Global editions, English/Hindi/Telugu labels, dates and result lines, archive of the last saved days built. Article bodies and headlines are NOT translated (needs an AI/translation service); Hindi/Telugu wording needs a native-speaker check; /api/news now takes ?lang= but the ePaper uses the app's own newsroom |
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
| R48 | Register/login with mobile OR email (PIN), neither OTP-verified | User 2026-10-14 | Register/Login (Mobile/Email toggle) | account key e:<email> | Public | Playwright: email register, wrong PIN rejected, login, duplicate and bad email rejected, phone unchanged, shared auction ownership | BUILT-TESTED for PIN mode with the online server. Not built: PIN reset for email users, email verification, merge of one person's mobile and email accounts (they are separate accounts today) |
| R49 | Cricket scorer: dismissal types per MCC Laws (Obstructing the field incl. handling the ball, Hit the ball twice; no bowler credit; no-ball/free-hit allow only run out, obstructing, hit twice) | User order step 3; MCC Law 37 (lords.org), Free hit (Wikipedia) | Scorer > Wicket | calc/ball | Scorer | Browser script: bowler credit unchanged, caught on no-ball not counted, obstructing on no-ball counted | PARTIAL: built and browser-tested: penalty runs, concussion replacement, follow-on, overthrows, dead ball, short run, retired out, timed out, Law 38.3 non-striker run out before delivery (ball not counted, no bowler credit). Still NOT verified: full line-by-line audit of the scorer against the current Laws, umpire-decision review (DRS) interplay |
| R50 | Login persistence: once logged in, the device stays logged in (no repeated OTP); a new device asks for the emailed code | User 2026-10-14 | Login (Email) | /api/auth/email-login, token ~10 years | Public | Playwright: wrong code rejected, code login, 3 reloads stay logged in, token valid, fresh device shows login | BUILT-TESTED for email accounts. Mobile-number accounts still use PIN on a new device (no SMS OTP). Not built: device list / remote sign-out (R27), token revocation, clearing browser data logs the device out |
| R51 | Cricket: Retired out (Law 25) and Timed out (Law 40) as wickets with no ball and no bowler credit; undo | MCC Laws | Scorer buttons | inn.dis | Scorer | Browser script: wicket count, fall of wickets, bowler credit unchanged, undo restores | BUILT-TESTED. Timed-out time limit is the umpire's call (not enforced) |
| R52 | Guest access: no restrictions for now (guest has local admin rights), but guest-created matches, auctions and tournaments are kept 24 hours on the device, then removed; never synced to the server; kept if the guest logs in or registers | User 2026-10-14 | Login screen > Continue as guest | local only | Guest | Playwright: guest scores a match, 23h kept, 25h removed, earlier records untouched, reload purges, login keeps guest records, banner shown | BUILT-TESTED. Teams/players/venues made as a guest are not purged. A different account logging in on the same device also inherits the guest records |

Open flags: first registered user becomes admin; PIN login does not prove number ownership; legacy OTP client mode is India-only.


## Match skins (Oct 2026)
- Matches list and match page now have a visible 2-skin switch: Cricbuzz style / Cricket Australia style (setting `mskin`). Styled after the reference apps' look in the SH colours scheme; not pixel copies. BUILT, tested in browser.

## Avatar Studio (Oct 2026)
- After register/login (not guest) the app offers "Your hero photo": camera selfie (getUserMedia) or photo upload, drag/zoom the face into an oval, placed on a Scoring Heroes player avatar (Batter/Bowler/Fielder, team colours). Also menu: Account > Photo avatar. Saved on-device (S.user.avatar2, player photo). BUILT, tested in browser with a fake camera.
- NOT AI: it is manual placement with a soft-edged oval, no automatic face detection or real face-swap model. Real face-swap needs a model (verify licensing/privacy) - NOT BUILT.

## 30-year history store (Oct 2026)
- BUILT: server importer (history.mjs) reads a Cricsheet-format zip, keeps a match index and every player's career totals (batting, bowling, fielding; per format and overall). API: /api/history/status|players|player|matches, admin POST /api/history/import. App: Menu > History (30 years): player search + career tables, match archive filters, admin "Import" button with progress.
- TESTED only with synthetic Cricsheet-format files (10 files, and 3000 files in 0.35 s, 84 MB). NOT tested against the real Cricsheet download: the sandbox cannot reach cricsheet.org. File name/URL, JSON details and licence terms are from memory and MUST be verified.
- LIMIT: Cricsheet ball-by-ball coverage starts around the early 2000s, so 30 years (1996 on) cannot be complete from this source. Earlier years need another source (e.g. licensed data) - NOT BUILT.
- LIMIT: Render Free erases the disk on restart: use HISTORY_AUTOIMPORT=1 (re-imports on start) or a persistent disk.
- Career figures are computed from ball-by-ball data and can differ from official records (e.g. boundary and not-out edge cases, super overs excluded).

## Daily paper, watermark and Post manager (Oct 2026)
- BUILT: match-report engine (writes only from match data: SH ball-by-ball matches and provider results), graphic cards + uploaded match photos with the Scoring Heroes watermark, ePaper "Match reports of the day", server paper agent (saves finished world matches of the day every PAPER_AGENT_HOURS, default 3), publish of SH reports by scorers/admins (/api/paper).
- BUILT: Post manager (drafts, schedule reminders, per-platform share links, mark posted, duplicate, delete, posts from reports and from Social studio).
- It is a rule-based writer, NOT an AI model. Optional AI polishing needs an API key and cost: NOT BUILT.
- NOT BUILT: automatic posting to WhatsApp/Facebook/Instagram/X/YouTube (each needs its own approved API connection). Scheduled posts only remind while the app is open.
- NOT BUILT / REFUSED: pulling photos from other organisations' channels or news sites (copyright). Pictures come from own graphics, scorer-uploaded photos, or licensed/free-licence sources added deliberately.
- Tested with mock provider data and synthetic photos only. Photos uploaded by scorers stay on that device (published reports share text and a regenerated graphic).

## Free photo finder (Oct 2026)
- BUILT: Match > Gallery > "Find free photos" searches Openverse (Creative Commons / public domain, licence_type commercial+modification) through the server (/api/freephoto/search, /img), adds the picture with the SH watermark and keeps creator + licence as the photo credit, shown under the picture in the ePaper.
- TESTED only against a local mock of the Openverse API. NOT tested against the real Openverse API (sandbox cannot reach it): endpoint names, parameters, response fields and rate limits are from memory and must be verified. Anonymous requests have low limits; a free API key may be needed.
- NOT BUILT / REFUSED: scraping Google Images or other sites (terms of service and copyright). Licence conditions (e.g. CC BY-SA share-alike) must still be checked per picture.

## Own Android build (no third-party builder)
- `android/` is a native Android project (WebView shell that opens the live app at the Render address; camera permission for avatar capture, photo upload, Back button follows app screens, offline page).
- `.github/workflows/android.yml` builds it on GitHub's servers and publishes the APK as a GitHub Release (run 1 built OK: ScoringHeroes-test.apk, debug-signed). Runs on every change inside `android/`, or by hand from the Actions tab.
- NOT VERIFIED: installing and running the APK on a real phone (no device here). Play Store needs a release key: save ANDROID_KEYSTORE_BASE64, ANDROID_STORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD in repository secrets, then the workflow also makes a signed APK and an AAB.
- The shell loads the website, so the app needs the Render service running; a new APK is needed only when the shell itself changes.

## Match page 2 and OTP diagnosis (2026-10-15)
- Match page tabs: Info (toss/winner from match_info), Live (batters at the crease, bowlers, run-rate outlook = arithmetic only), Commentary (match_bbb), Scorecard (+NB/WD when sent), Graphs (runs by batter with 4s/6s, bowlers; runs-per-over only if ball-by-ball arrives), Squads.
- NOT VERIFIED against the real provider: the match_bbb field names (the reader guesses common names and says so when it cannot read them). Ball-by-ball may need a paid CricketData plan; each match page costs about 4 API calls (cached 45 s).
- NOT IN THE FEED (not shown, not invented): fall of wickets, partnerships, umpires, Player of the Match, win-probability forecast.
- Missing player photos: the provider's placeholder logo is detected (keyword and 3+ repeats) and replaced by an initials avatar; broken pictures fall back the same way.
- OTP: Render runs with SMS_PROVIDER=console and no EMAIL_PROVIDER, so no real email or SMS is sent. Admin > More > Server status shows what is switched on, sends a test email and shows the provider's real error. Needs the owner to set Render Environment values.

## Batch 2026-10-19 (audit against first documents)

| Area | Status | Notes |
|---|---|---|
| Viewer live centre (head result, phases, ball-by-ball strip, 4/6/W animation) | Done | tests/live-centre.cjs, live-window-browser.cjs |
| Powerplay (ICC T20/ODI phases) | Done | Source: ICC playing conditions via Wikipedia "Powerplay (cricket)" |
| Live video servers 1-4, multi-view, SH logo on own player | Done | Own player only. Covering another channel's watermark is refused. |
| Phone/YouTube streaming from the app | Guide only | Direct page-to-YouTube push needs a streaming server (not built) |
| Match graphs (Manhattan, worm, run rate vs required, partnerships, wagon wheel, shots, win %) | Done | Wording is "win probability", never "odds" |
| Auction rules (price slabs, reserve, category/overseas limits, cap, undo, retention, RTM, re-auction, franchise profile + social handles) | Done | Points only, no money. tests/auction-rules.cjs |
| Auction player registration social handles | Done | server.js sanitises handles (https or @handle) |
| Ground booking (profiles, base/peak/weekend, slot calendar, blackout, advance %, cancellation, status flow, payment record, UPI link) | Done (local) | Requests reach the owner via WhatsApp link; no server-side booking sync yet |
| Academy (batches, students, attendance, fees, coach ratings, training log) | Done (local) | Fees are recorded/UPI link only. Parent login not built |
| Marketplace (listings, offers, moderation, reports) | Existing | Unchanged this batch |
| Social studio (14 templates, brand kit, player photo, auction SOLD) | Done | tests/social-studio-v2.cjs |
| ePaper (brand masthead, Local/Global editions, poster from article) | Done | AI desk articles already generated from match data |
| QR generator/scanner, CSV import from other apps | Done | No scraping of other apps. Link scan only opens SH links |
| Rankings World/Country/State/City | Done | City uses player profile city |
| App-wide UI translation | Telugu + Hindi done (383 labels); more languages need translated dictionaries | Names, scores and user text are never translated; picker is in the drawer |
| Referee/umpire ratings | Done | One rating per user, no self-rating |
| Ground booking online (public directory, server prices + clash check, owner accept) | Done | tests/gbook.test.mjs, ground-online.cjs. Academy sync and parent login still open |
| Streaming on outside (provider) matches | Removed | Streams only for matches scored in this app |

- Language (2026-10-20): UI translation now covers English + Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, Urdu (RTL). 383 labels each. Languages beyond te/hi need native-speaker review. Match result, toss, chase and count sentences are translated by pattern (11 languages); other free text stays English.

- Academy (2026-10-20): server backup/restore (`/api/academy`) and parent login view "My child" (`/api/academy/mine`, matched by signed-in mobile number; shows only that parent's child, owner number masked). Needs Render Manual Deploy.

- Batch 2026-10-20 (user screenshots): match setup Teams step has level filter, logo style/generate/upload/colour, demo teams (2 teams x 11 players, full XI); both-team Manhattan (towers + lines + wicket dots) for own matches and provider ball data; SH Sports 11 v2 (WK1-4/BAT3-6/AR1-4/BOWL3-6, 100 credits, max 7/team, C 2x, VC 1.5x, locks at start, fielding/economy/strike-rate points, practice-team leaderboard, no money); auction page restyled to app dark look + franchise logo picker (styles/generate/colour/upload/my teams); posters: stadium look, team crests, News and Article templates, Make poster on news cards.
- Not possible without a data source: ball-by-ball towers and commentary for provider matches where the provider sends no deliveries (e.g. CricketData bbbEnabled=false). Needs a paid ball-by-ball feed (e.g. Sportmonks token). Own-scored matches have full towers and commentary.

- 2026-10-20 Live tab (CREX-style `cx3Panel`): score + big last ball, CRR/RRR/Target, need line, this-over strip, batters, partnership, last wicket, bowler. Provider matches without ball-by-ball show scorecard-derived parts only.

- 2026-10-27 All features hub (XV.hub, menu 'All features'): 24 modules / tabs from the master report with icons. LIVE modules open the real feature; the rest show an honest 'interface ready, feature not built yet' state. QR, payments and login are deliberately last (owner instruction).
