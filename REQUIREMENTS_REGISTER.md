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
| R09 | Change number / recovery / merge review | Number doc 7 | Account | - | - | - | Number change + merge with admin review, alias sign-in (block 85, tests/number-change*) | BUILT |
| R10 | Scorer private phone lookup, minimum participant profile | Number doc 5 | Scorer squad | - | Role-based | - | Scorer lookup, minimum profile, logged (block 85) | BUILT |
| R11 | World location hierarchy with stable IDs | Number doc 3 | Location | - | - | - | NOT BUILT (SOURCE: dataset required) |
| R12 | Guardian/student links | Number doc 10 | Account | - | - | - | Request by SH ID, player approves, either side ends; no contact details shared (block 90, tests/guardian-links*) | BUILT (links record responsibility only; no extra data access yet) |
| R13 | Player profile tabs (Overview..Social), filters, empty states | Player doc | Player | ppBody | Public | Playwright, 10 tabs screenshotted, no JS errors | BUILT-TESTED for cricket data from SH matches; Academy/Gallery/Social are honest placeholders |
| R14 | Career timeline with Verified/Imported/Self-declared labels | Player doc 4 | Career tab | - | - | Achievements tab: VERIFIED vs SELF-DECLARED labels, own career entries (block 86, tests/career-labels.cjs) | BUILT |
| R15 | Rankings per sport with disclosed method | Player doc 6, Rem. 5 | Rankings tab | - | - | Simple runs/wickets leaderboard, disclosed as NOT a points formula | BUILT-TESTED for plain statistics with disclosed qualification and tie-break per measure (block 91, tests/rankings-method.cjs). An ICC-style points rating is NOT built: no public official formula (SOURCE/DEFINITION REQUIRED); football/other sports rankings not built |
| R16 | Social auto-posting to connected accounts | Player doc 5 | Social | - | Connected accounts + editorial review | - | NOT BUILT |
| R17 | Match category/eligibility (Men/Women/Mixed, age, level, ball type) | Rem. 1 | Match Start wizard, Format step | m.cat | Scorer | Playwright: required category, saved on match, shown in header | BUILT-TESTED for age group, ball and category inheritance from the tournament, plus date-of-birth age check at match start (block 89, tests/tour-eligibility.cjs). Per-player gender is not recorded, so category is a label only |
| R18 | Match Start wizard (9 steps already existed: mode, teams, format, players, venue, officials, broadcast, toss, review) | Workflow doc | Score | S.wiz | Scorer | Existing + category step tested | BUILT-TESTED: Select Sport row (other sports open their own scorer) and tournament/series fixture linkage in step 1 (block 94, tests/wizard-sport.cjs). Non-cricket sports keep their own start forms, not this 9-step wizard |
| R19 | Board/league administration, affiliation | Rem. 2 | Admin | - | Board admins | - | Boards: found, admins, affiliation requests, approve/reject/revoke (block 84, tests/boards*) | BUILT |
| R20 | Live-telecast viewing passes (separate from stadium tickets) | Rem. 3 | Watch | payment + entitlement | Server-side | - | PARTIAL: direct UPI collection built (organiser's own UPI ID, QR/link, payer submits UTR, organiser confirms; no gateway, never auto-confirmed; block 95, tests/upi-collect*). Tournament entry fee by UPI built (block 96, tests/tour-fee-ui.cjs). Passes/entitlements tied to a confirmed payment and a stream source NOT built | UPDATE: per-stream paid viewing pass built (block 98): scorer/admin ties a stream to a UPI charge; server withholds the link from anyone without a confirmed payment (tests/paid-stream*). Still NOT built: time-limited passes, tournament-wide passes, a stream source of our own, gateway auto-confirmation |
| R21 | Subscriptions, entitlements, expiry never deletes records | Rem. 4 | Plans | - | Server-side | - | NOT BUILT (SOURCE: plan/settlement rules required) | UPDATE: entitlement = confirmed payment on the charge tied to the stream; passes can be time-limited (1-366 days, expiry counted from the organiser's confirmation, renewable) and one pass can unlock several streams (season pass); expired payments stay on record, nothing is deleted (tests/pass-expiry); recurring auto-renew billing NOT BUILT (needs a gateway) |
| R22 | Formulas: ranking, auction category, MVP, Team 11, Best Team (each separate) | Rem. 5 | - | - | - | - | SOURCE/DEFINITION REQUIRED |
| R23 | Tournament leaders, caps, awards, certificates | Rem. 6 | Tournament | - | - | Leaders, caps, awards + printable certificates (block 83, tests/certificates.cjs) | BUILT |
| R24 | Venue local time + viewer local time; neutral weather if missing | Rem. 7 | Match | - | - | Playwright venue-time | PARTIAL: match start time is saved with the venue time zone (the scorer's phone zone at the ground) and viewers in another zone see both times. Weather BUILT on the match page (Open-Meteo, no key; its free tier is for non-commercial use, so a paid plan is needed once the app earns money); provider/world matches carry no venue zone |
| R25 | Support/dispute flows (7 types) with audit | Rem. 8 | Support > Report a problem | /api/cases | User files; admin decides | 2-user Playwright: validation, case number, admin needs reason, user cannot decide (403), history shown | PARTIAL: request, decision and audit built; evidence is text/link only; a decision does NOT auto-correct scores/stats/rankings (admin edits the record separately); no notifications; Privacy/Terms/Refund text SOURCE REQUIRED |
| R26 | Canonical share links/QR and notification deep links | Rem. 9 | Share | ?player= ?match= | - | Playwright: both links open the record | PARTIAL: links built; ?player= now opens a public player card on any phone once the player (or admin) has shared it (block 92, tests/player-card*); full profile is still device-only; match links need the match shared to the server; QR codes exist for payments; Web Push now built (block 97, webpush.mjs, sw.js push handler): payment submitted/decided alerts open /?pay=; opt-in per device in Settings; keys generated server-side (or VAPID_PUBLIC/VAPID_PRIVATE env). Match alerts built: followed teams (synced from My Cricket follows) get start / wicket (throttled 20s) / result pushes opening /?match= (tests/match-alerts); per-match and tournament alerts built (toggle inside the Share sheet, tests/alert-toggle-ui); player milestone alerts NOT BUILT; real-phone delivery unchecked |
| R27 | Accessibility, reduced motion, sessions/devices, account closure | Rem. 10 | Settings | - | - | Block 80: text size, contrast, reduced motion, sign-out-all, account closure | BUILT (real-phone check pending) |
| R28 | Email optional | User | Register | cleanProfile | - | Tested | BUILT-TESTED |
| R29 | Voice AI integration | Rem. 11 | - | - | - | - | SOURCE/DEFINITION REQUIRED (source code + contract) |
| R30 | Approved logo/icon/background assets | Rem. 11 | - | - | - | - | SOURCE/DEFINITION REQUIRED |
| R31 | Welcome screen with language + country | Workflow | Entry | S.prefs | Public | Playwright: first launch shows it, saves, not shown again | PARTIAL: welcome role choice (suggestions only) and claim-my-player-profile by phone match built (block 93, tests/welcome-claim.cjs); avatar step existed; app text not translated |
| R32 | Auction public-link registration: organiser setup (categories, base prices, fee, dates), player form with mandatory photo, status flow, duplicate prevention, organiser review, approve to pool, per-player base/max in bidding | Auction reg doc | Auction > Register tab; ?reg= link | /api/aucreg/* (server decides status) | Player / organiser / admin | Playwright 2-user test: photo required, duplicate blocked, unpaid cannot be approved, changes-required loop, approve adds to pool, player cannot approve | PARTIAL: BUILT-TESTED core; fee by UPI now built (organiser's own UPI ID, player submits UTR, the organiser's confirmation marks the registration paid; a charge the organiser does not own is ignored), QR for the link, push alerts: organiser on new registration, player on approve/changes/reject and on SOLD/UNSOLD (block 100, tests/auction-reg-fee, auction-fee-ui); NOT BUILT: OTP step, eligibility rules/extra required fields, tournament linkage, re-auction |
| R33 | External profile link import (CricHeroes, CrickBro, CricGiri Live, CricLabs) | Import doc | Registration form | link + provenance | Player | Source detection tested for CricHeroes | PARTIAL: link attached as self-declared/unverified only. Automatic fetch/preview NOT BUILT: no verified public API or permission route; sandbox cannot reach those sites; QR scan not built |
| R34 | Media engine: automatic posters (13 types, presets), editable, publish workflow | Media doc 1-3 | - | - | Editorial approval | - | PARTIAL: rule-based match reports and 14 poster templates exist; editor-written articles can be published. NOT built: 13 automatic poster types and presets, editorial approval step (assets/branding SOURCE REQUIRED) |
| R35 | Articles (8 types), canonical article + translations, correction history | Media doc 4, Social doc 5-6 | - | - | Editor | - | PARTIAL: 8 article types, drafts and publish, one canonical article with Telugu/Hindi translations written by the editor, correction history shown to readers. NOT built: automatic translation (needs a translation/AI service), article review/approval by a second editor, images inside articles |
| R36 | ePaper (English/Hindi/Telugu, local-to-global editions, archive) | Media doc 5, Social doc 4 | ePaper | /api/paper | - | Playwright epaper-lang | PARTIAL: Local/Global editions, English/Hindi/Telugu labels, dates and result lines, archive of the last saved days built. Article bodies and headlines are NOT translated (needs an AI/translation service); Hindi/Telugu wording needs a native-speaker check; /api/news now takes ?lang= but the ePaper uses the app's own newsroom |
| R37 | Broadcast graphics, auction live screen, OBS/vMix output | Media doc 6 | - | - | - | Existing OBS overlay + auction live screen (earlier work) | PARTIAL |
| R38 | Player social accounts: profile link vs authorised connection | Social doc 1-3 | Player > Social | S.psoc (device only) | Own profile/admin | Playwright: host check, add/hide/remove | PARTIAL: profile links only (https, platform host check, show/hide). Authorised connection, tagging, auto-publish NOT BUILT (needs platform authorisation). Links are not yet synced to the server |
| R39 | Player media portfolio + publishing dashboard (per-destination status, retry, withdrawal, real metrics only) | Social doc 7-8 | Player > Media/Press | - | - | - | Media portfolio + dashboard: draft, publish on SH, withdraw; external platforms not connected, no fake metrics (block 87, tests/player-media.cjs) | BUILT (external posting needs platform keys) |
| R40 | Live score tickers: scorebug, bottom strip, ball-by-ball, recent overs, target + RRR, status/result, other live scores | Ticker pack 1 | Overlay (#overlay) | S match data | Operator | Earlier work: basic scoreboard overlay, OBS browser source | PARTIAL (exact coverage per item not re-verified this session) |
| R41 | Player/team graphics: intros, photo/avatar, career stats, XI, partnership/FOW, scorecard | Ticker pack 2 | Overlay | - | Operator | - | PARTIAL: batter intro (career figures), both XIs, fall of wickets, scorecard built as overlay graphics; bowler/team intros with photos NOT built |
| R42 | Competition tickers: fixtures, points table, leaders, qualification, awards, auction bid/wallet, SOLD/UNSOLD, final squads | Ticker pack 3 | Overlay | - | Operator | Auction live screen exists in app only | PARTIAL: points table, next fixtures, leaders as overlay graphics; auction bid/SOLD, awards, qualification NOT built as overlay |
| R43 | News/sponsor tickers, registration link + QR, labelled ads | Ticker pack 4 | Overlay | - | Operator | - | PARTIAL: QR link graphic and sponsor logos built; news ticker and labelled ads now BUILT (news, ad graphics; ads always show an AD label); previously NOT built |
| R44 | Effects pack (FOUR/SIX/WICKET, milestones, POM, trophy, replay IN/OUT, sound cues), per-sport event names | Ticker pack 5 | Overlay | - | Operator | - | PARTIAL: FOUR/SIX/WICKET/FIFTY/HUNDRED banners from scored balls built; POM, trophy, replay and sound cues NOT built |
| R45 | Operator controls: on/off, position/size, language, template, speed, duration, queue/priority, Preview-Program, auto/manual | Ticker pack 6 | Overlay controls | - | Operator | - | PARTIAL: preview then Take to air, queue, position, size, effects on/off, safe margins, auto-hide built; language, speed and per-template controls NOT built |
| R46 | Outputs: App/Web/TV/Big screen, OBS browser source, vMix overlay, transparent background, safe margins; manual announcements separate from official scores | Ticker pack 7 | Overlay | - | - | OBS browser source existed earlier | PARTIAL |
| R47 | Shared graphics package (templates, assets, render engine, data contract, versioned updates) used by Broadcast Companion and Windows/Web Studio | Ticker pack 8 | - | - | - | - | Versioned manifest /api/graphics/package, data contract sh.graphic/1, JSON export, update check (block 88, tests/graphics-package*) | BUILT (Windows/Broadcast Companion apps themselves not in this repo) |

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

## Squad members and demo matches (2026-10-31)
- Squad members with an account (matched by mobile number, SH ID or the team registry) get the match in their own Matches list and a push when they are added and when the match starts or ends. Phone numbers are used only to find accounts on the server and are never stored with, or returned from, the shared match (block 102, tests/match-participants.test.mjs, my-matches-ui.cjs). A squad member who has no account yet only gets it after they register with the same number.
- Start a match: Demo match is a match type. A demo match is private to the device and deleted 24 hours after it starts (block 101, tests/qs-formats.cjs).
- Viewing passes: a tournament-wide pass (block 103, tests/tour-pass.test.mjs, tour-pass-ui.cjs): one UPI payment unlocks the paid streams of every match saved with that tournament; a match with its own pass needs both. Only the tournament's owner or an admin can set it.

## Permanent Player ID and Match ID (2026-11-01)
- Player ID `SH-P-YYYYMM-NNNNNN` (monthly sequence) and Match ID `SH-M-YYYYMMDD-NNNNNN` (daily sequence, creation date, IST via env ID_TZ) are issued by the server (ids.mjs, routes /api/ids/*), never reused, unchanged by status, verification, team or tournament changes. Sports never collide (match key is sport plus ref). External provider IDs are stored separately (admin only). Audit log is append-only.
- Same mobile number gives the same Player ID across teams and clubs. Shown in the match header, scorer screen, share text, profile and player lists (block 111). Tests: tests/ids.test.mjs, tests/ids-ui.cjs.
- Limits: runtime store is db.idReg (JSON/Neon kv), atomic on a single instance. migrations/20261101_player_match_ids.sql holds the SQL tables and is not applied by the runtime.

## Start a match: Select team / Create team and instant player add (2026-11-01)
- Each team slot offers two clear choices, Select team (searchable list of saved teams, the other side's team hidden) and Create team (name, logo, details), like CricHeroes' "select or create" step. Change team returns to the list.
- Players step: a quick-add row (name, optional mobile, role) is always visible for the XI and inside every Impact Player / Super Sub list. Name alone is enough (as in Play-Cricket's custom player). Added to the squad, to the XI when there is room, and auto-ticked as a substitute within the 5 / 1 limit. Enter key adds. Test: tests/qs-add.cjs.
- Start a match: long option rows (Ground, Match type, Format) are compact drop-down lists that open a scroll-down list inline (search box when more than 7 options), Ground and Match type side by side, to keep the screen short (block 113, tests/qs-formats.cjs).
- Match type list now includes Series, Tournament, League / Franchise, Academy and Practice (plus Individual, Corporate, Board, Club, Demo). Series / Tournament / League types pick an existing competition or create one in place (name and teams), then pick an open fixture (sets the two teams). The match follows the tournament rules: overs, format, ball and category are set from it and locked, age and eligibility checks apply at start, points rules are shown (block 114, tests/qs-series.cjs). Ground list names: Open ground, Outdoor box cricket, Indoor box cricket.

## Start a match: playing XI selection (2026-11-01)
- Players step follows Play-Cricket / MyCricket team selection: the selected Playing XI is a numbered list in batting order (move up / down, remove), the rest of the squad is listed below with a "+ Play" button and a search box, the XI is capped at 11, C (captain) and WK (wicket-keeper) toggles per player with a hint when missing, "Same XI as last match", and adding a new or registered player on the spot. Captain and keeper are stored on the match (m.cap, m.keeper per team). Block 115, tests/qs-xi.cjs. Scorecard markers for C and WK are not shown yet.

## Pitch types (2026-11-01)
- One shared pitch list: Turf, Black soil (clay), Red soil (clay), Matting, Cement / concrete, Astro turf, Synthetic / indoor, Dry mud, Mixed, each with a short behaviour note. Start a match: Pitch is a scroll-down list (search box); a registered ground's own pitches are listed first as "(this ground)" and the first one is picked when the ground is chosen. The match stores pitchType and shows it in the match header. Ground registration and owner edit use scroll-down selects with a second optional pitch; the server keeps up to 4 valid pitches per ground (pitches, with pitch = first). Block 116, tests/qs-pitch.cjs, tests/ground-registry.test.mjs.
- Captain and wicket-keeper chosen in the playing XI show as (c) and a dagger next to the name in the scorecard (batters, bowlers, did not bat). Test: tests/captain-mark.cjs.

## Toss (2026-11-01)
- Start a match, Toss step: Flip the coin (default) or Enter result. Coin flow: pick which team calls, call Heads or Tails, flip a spinning 3D coin (random from the device's secure random source, no replay on re-render, reduced-motion respected). The caller wins the toss if the call matches, otherwise the other team; the winner then chooses Bat first or Bowl first. A match cannot start in coin mode before the flip. The match stores tossInfo (mode, caller, call, result, winner). Block 117, tests/qs-toss.cjs.

## Umpire signals & player figures (CricHeroes style)
- Extras buttons (Wide/No ball/Bye/Leg bye) show umpire-signal icons; each scored ball shows a short pop-up (OUT, WIDE, NO BALL, BYE, LEG BYE, FOUR, SIX, FIFTY, HUNDRED) with the signal/figure.
- Scorer tools: Signals on/off toggle and Signals guide (umpire signals + bowler/batter/keeper/catch/celebration/century figures).
- Field map: no position names on screen; tap a point and the wagon-wheel input is taken from that point. Corner labels OFF SIDE / LEG SIDE.

## Video + live score strip
- When a stream is live, a score strip sits under the video: score-wickets, overs, CRR, target needed/RRR (2nd innings) and last two overs of ball chips.
- Scrolling past the video shrinks it into a small floating player (bottom right); scrolling back restores it. Signal pop-ups are hidden on the OBS overlay page.
- Test: tests/video-strip.cjs. Known pre-existing failure: tests/stream-modes.cjs (banner text) — not part of this change.

## Toss, continue scoring, My matches, section landing pages
- Toss: the coin only spins as a visual. The people at the ground select who won the toss and Bat/Bowl first (required); who called and Heads/Tails are optional. Saved on the match (tossInfo) and shown as "X won the toss and chose to bowl first. Y called TAILS".
- Home shows "Continue scoring" for any unfinished match the scorer started (setup/live/break) and "My matches" for matches I scored or played in (every player in a playing XI sees the match).
- Marketplace and Social studio open on a landing page: welcome note, icon tiles with a one-line description, tap goes inside, "back" button returns to the landing page.
- Tests: qs-toss, quick-start, landing-continue, marketplace-*, rfq, poster-v3, social-*. Pre-existing failures (same on c8e4512): desktop-match, device-layouts, interruptions, no-flash, over-strip, pitch-map, plus-drag, sbb-pad, registry*, logo-library, qs-teams, stream-modes, scorer-tools, overlay-tickers, ground-map.

## SH Auction — LIVE 3D TEAM BUILD-UP (V-shape formation), phase 1
- New "3D Teams" tab in every auction (all viewers), per-team: 3D Team / Squad List / Roles / Purchase History, with Labels, Zoom, Reduced motion and Replay welcome controls.
- Formation (window.shFormation): captain front-centre when confirmed and in the squad; otherwise the first acquired player is the temporary centre (not labelled captain). Highest-priced non-captain buy takes the first viewer-left place with TOP BUY and the real price; if the captain is also top buy he keeps both badges and the next highest takes viewer-left. Ties: earlier purchase wins. Remaining players fill viewer-right, then viewer-left farther back, alternating, in acquisition order. One avatar per player, all facing the camera.
- Committed SOLD only (A.auSold) records purchase order (p.seq, t.lastSeq) and plays one celebration overlay: SOLD reveal, WELCOME TO TEAM, new player entrance, squad applause, restrained confetti, "Back to Live Bidding" always visible, auto-closes after a.soldSecs (default 7). Pending/leading bids add nobody. Latest unseen purchase auto-plays once when the panel opens (t.seenSeq); manual replay is allowed.
- Franchise owner (team email matches the signed-in user) sees MY 3D TEAM on the Teams tab; an empty squad shows "Your team formation begins with your first player". Captain is chosen from the squad only (never buys a player).
- Avatars are the player photo or the SH helmet on a team-colour kit bust. NOT built yet (needs assets/server): approved real 3D avatar files and kits, sound, orbit camera, server-authoritative multi-device bidding, owner mobile bid room, TV/broadcast scenes, reversal/transfer animations.
- Test: tests/auction-fm.cjs.

## Default YouTube channel + demo auction
- Default stream/channel is SH Sports Club (UCEZj3e0XMZJmOQ7VteUM7Vg, https://www.youtube.com/@SHSPORTSCLUB) unless the organiser sets their own; matches without a stream show the channel link/live embed. Tests: default-channel.cjs, master-gap-browser.cjs.
- Demo auction "Hero Champions League" auto-seeded (8 franchises named after IPL teams, no IPL/BCCI logos, user-supplied HCL logo, 48 demo players); deletable and does not re-seed after delete. Test: auction-demo.cjs.

## Light theme contrast + menu icons
- Light look (mday) must keep light --bg/--card, a white drawer with dark text, and readable Service Hub pills/cards (the late dark "visual reference" sheet had forced dark panels on every theme). Every drawer item has a line icon (no "•••" placeholders); Service Hub tabs have meaningful icons (no empty squares).

## About us, Help centre, Laws and study (owner request 1 Nov 2026)
- First drawer group "About and help": About us (what the app offers, career benefit per feature, sports list with status, who it is for), Help centre (steps + tips per feature, searchable), Laws, umpiring and study (42 Laws of Cricket in simple words, umpire guidelines, scoring rules, formats, fielding positions, glossary, quiz; official source = MCC Laws / ICC playing conditions).
- Every screen with help text shows a "? Help" button opening a panel with that feature's steps. Tests: about-help.cjs.

## Schedule, Archives, Videos, Series, registered users (owner request 1 Nov 2026)
- Top menu Schedule = upcoming matches grouped by day in the viewer's time (live first), filters All / Scoring Heroes / World / series; Archives = results by year with Results, Series and Records tabs (reports, rankings, history). Pattern follows Cricbuzz/ESPNcricinfo schedule and series-archive pages.
- Every match card (world and SH, any page) opens its match centre when tapped; world cards on Matches had no handler before.
- Videos page is a landing (SH Sports Club channel, live streams, highlights, reels) instead of a blank screen; Series page lists current/upcoming/completed world series (tap opens Schedule or Archives for that series) above the organiser's own tournaments.
- Admin-only "Registered users" (drawer > Account, or tap the header users-count pill): name, role, kind, phone/email, location, joined date, SH ID, searchable; server `GET /api/admin/users` (admin session only). Tests: schedule-archive.cjs, users-admin.cjs.

## Branded backdrop + automatic team logos (owner request 1 Nov 2026)
- Every screen carries the faint Scoring Heroes helmet backdrop with the SCORING HEROES wordmark under it (light and dark looks); Social studio posters draw the same backdrop; the player hero card already does.
- Team logo library (admin: Menu > Account > Team logo library): add logos once with the names they match; any team whose name or short code matches shows the logo automatically (auction crests, match cards, posters). Shared with all users through server collection `logos` (admin write). No IPL/BCCI logos are bundled: supply logos you have the right to use. Test: logo-library-auto.cjs.
- Light look: auction pages and bottom tab bar made readable.

## Photo upload pipeline (owner request 1 Nov 2026)
- Any person photo uploaded (profile photo, registration, auction player, Social studio photo) is processed on the phone: face centred in a 4:5 frame (person mask, else FaceDetector, else upper-centre guess), background removed to a transparent PNG cut-out when the on-phone model can run (stored as `cut` on the profile), SH backdrop (helmet, rays, wordmark) drawn behind the cut-out in the profile hero. Without a cut-out the face-centred photo is shown. The page watermark is hidden on the profile page so it never covers the photo. Test: photo-face.cjs (segmentation stubbed; real model needs the phone's internet to load).

## Universal logo rule (block 133)
- Any team/auction/franchise logo (img.aucc, img.logo, data-lg) gets its solid black/white background removed (edge flood-fill, client-side, cached) and always sits on the SH banner (gradient + helmet). Applies to auction card/detail, crests, streaming. HCL demo logo pre-cut to transparent WebP. Test: tests/logo-banner.cjs.

## Any image: cut + SH banner (block 134)
- Person photos (register, auction player, social poster) are background-cut with the same segmentation as profile and composed onto the SH banner (shBannerCompose), face-centred. Logos: block 133. Test: tests/photo-banner.cjs.
- Block 135: segmentation mask keeps only the largest person (people behind in selfies are dropped). Test: tests/photo-main-person.cjs.

## SH Auction: owner bid room (blocks 136-137, server /api/aucroom)
- Organiser turns on "Owner bid room" in auction detail: gets a link (?bid=<auction id>) and a code per team. Owners open the link on their own phone (no account), pick team + code, see the player on the block, current bid, leader, own purse and limit, and tap BID.
- Server orders bids, rejects wrong code, stale screen, double-lead, purse over limit, ineligible team (quota/slab rules sent by organiser). Codes are never public. Organiser's app mirrors owner bids (pending list) and keeps sold/unsold control. Tests: tests/auction-room.test.mjs, tests/auction-room.cjs.

## SH Auction streaming scenes (block 138)
- OBS Browser Source URLs: ?scene=auclive|aucbid|aucsold|auctable|aucticker&auc=<auction id>#overlay. Fed by the public bid-room feed (GET /api/aucroom/<id>, photo only with ?full=1) plus /api/shared/auc/<id> for team logos, so no login in OBS. Auto SOLD/UNSOLD stamp for 8 s (server-time stamped). Studio page lists the scenes with Preview and Copy URL after choosing the auction. Tests: tests/auction-stream.cjs, tests/auction-room.test.mjs.

## Fresh start: clear history + complete demo (block 139)
- Matches page button "Clear history + full demo": confirm modal shows the count, then removes this phone's matches (players, teams, tournaments, settings stay) and builds one finished demo match (both innings, result). Published copies stay online. Test: tests/demo-fresh.cjs.

## Cricket game stream (block 140)
- OBS scene ?scene=ccast&mid=<published match id>#overlay (optional &sound=1): video-game style 3D stadium drawn on canvas (perspective camera behind the bowler, stands with animated crowd, floodlights, ad boards, pitch, keeper, umpire, fielders). Batter and bowler, their names, team jerseys and avatars are read from each ball of the published match, so strike changes, new batters and bowler changes need no setup.
- Each ball is played as scored: bowler run-up and delivery, batter swing, ball flight to the scorer's recorded direction (FOUR along the ground, SIX in the air), fielder chases, batters run for 1-3 runs, caught (named fielder catches), bowled, LBW, stumped, run out, wide. Camera follows the ball, crowd and confetti react, bat/crowd sounds and spoken commentary (after one tap, or &sound=1 in OBS). Commentary text and scoreboard update. History is not replayed on load; backlog over 4 balls is skipped.
- Studio card "Cricket game stream" (pick match, preview, copy URL). Stylised characters, not photoreal. Tests: tests/commentary-stream.cjs, tests/commentary-game.cjs.

## 3D Live inside the app (block 141)
- Any live match shows a "3D Live" strip on Matches and Live streams pages, a "Watch in 3D" button in Match centre, and a menu item. View live3d embeds the same 3D game scene (block 140) in a 16:9 player with Full screen and Scorecard buttons. It is an in-app live view of the published match, not an RTMP push to YouTube (that still needs OBS with the scene URL). Test: tests/live3d.cjs.

## Universal sports game stream (block 142/143)
- Every sport gets the same video-game stream as cricket: football, basketball, rugby, kabaddi, volleyball, beach volleyball, badminton, tennis, table tennis, pickleball. Each has its own venue (pitch, court, table), markings, goals/hoops/posts/net, crowd, ad boards.
- Scene: ?scene=sgame&mid=<published sports match id>#overlay. Score changes from the scorer become a scoring scene (goal, basket, try, point), commentary text and voice, crowd cheer and confetti. Idle play (passing or rallies) runs between events.
- In-app 3D Live lists cricket, sports and auctions with the bid room on, with the right scene per kind (ccast, sgame, auclive).
- Tests: tests/sports-game.cjs, tests/live3d-all.cjs.

## Real 3D humans in the game streams (block 144)
- All game streams (cricket and every sport) draw skinned, animated human models (idle, walk, run cycles, team-colour kit) with WebGL over the stadium, instead of flat figures. Model and engine are served from /vendor (three.js, GLTFLoader, Xbot.glb, MIT licensed); flat figures remain as fallback if WebGL or the model cannot load.
- Players face their direction of travel or the ball, arms-up celebration, bat and racket props, bowling arm. Football, rugby and basketball cameras follow the ball.
- Honest limit: mannequin-style model, not photoreal; sport-specific motion (kick, serve, full batting swing) is approximated by pose, not motion-captured. Realistic faces/kits need licensed character assets.
- Tests: tests/humans3d.cjs, tests/humans3d-cricket.cjs (software GL is slow, use a long timeout).

## Moments: auto poster and reel from the game streams (block 145)
- Sixes, fours, wickets (cricket) and goals, baskets, tries, points (other sports) automatically produce a branded poster (JPEG) and a short reel clip (about 7 s, silent; WebM, or MP4 on Safari) captured from the 3D scene, with the score or commentary line on it.
- The in-app 3D Live player lists the latest 8 moments with Share poster, Share reel and Save. Posting uses the phone share sheet; no social API keys, nothing is posted without the user tapping Share. Fully automatic posting to accounts needs each platform's API credentials and is not built.
- Test: tests/moments.cjs.
- 3D humans safety: on a real device, if the 3D layer runs slower than about 9 fps for 60 of 90 frames, it switches itself off and the flat figures take over, so a weak phone never freezes the stream.

## Virtual match viewer uses the real 3D humans too (block 144 + shV3dOpen)
- The in-app "Virtual match" screen (provider matches) now draws the same animated 3D human models for striker, non-striker, bowler, fielders and umpire, in the same camera, with a bat in the striker's hand. The button reads "Players: 3D" and switches to the older flat photo figures ("Players: Photo"). If WebGL or the model is unavailable, or the device is slow, it uses the flat figures automatically.
- Tests: tests/v3d-3d-humans.cjs.

## In-code player kit (no purchased assets)
- public/vendor/shdress.js builds jerseys (team colour via vertex colours), helmet+grill, caps, umpire hat, pads, gloves, surname name-plate on back, all from code on the open Xbot rig.
- Used by cricket, all-sports streams and Virtual match via shx; tests: humans3d*, v3d-3d-humans.

## Virtual match broadcast player cards
- When a new batter/bowler comes on, a card (provider photo or initials, role, runs/balls or figures) slides over the pitch for ~3 s; built in code. Test: v3d-3d-humans asserts it shows.

## Night stadium look (cricket scene)
- Dusk-to-night sky with stars, floodlight glow, soft light pool and edge vignette on the turf; drawn in code.

## 3D stadium + hero close-up + faces (cricket scene)
- public/vendor/shstadium.js builds the stadium in code: sky with clouds, striped turf with blade layer, pitch with creases, stumps, ad boards, two-tier crowd stands, roof canopy with struts, big screen, floodlight towers, sun shadows. Falls back to the flat 2D stadium if WebGL is unavailable.
- Humans get a stylised face (brows, eyes, nose, beard, hair); each ball starts with a short low-angle hero close-up of the batter.
- Honest limit: stylised game look, not photoreal.

## Real player faces on 3D heads
- Virtual match: when the data provider supplies a usable photo (not the CRICKET DATA badge, loaded with CORS), it is wrapped on the front of the 3D head (shdress photoCap); otherwise the stylised face is used. Test: v3d-face-photo.
- Limit: the provider has no photos for many players; those keep the stylised face and initials.

## Kit detail (code only)
- Gold collar ring, gold sleeve bands, chest logo (SH / SCORING HEROES) on every kitted player; chin beard instead of cheek patches.

## Admin-uploaded player face photos
- Admin: Virtual match -> "Face photo" -> pick player, choose a picture; it is cropped to a small JPEG and saved on the server (POST /api/faces, admin only, max 600 players, 90 KB each). Everyone then sees it on the 3D head and player card (GET /api/faces?names=). Tests: player-faces.test.mjs, v3d-face-upload.cjs.
- Photos are only those an admin uploads; nothing is scraped from other sites.

## 3D arenas for the other sports
- shstadium.js buildArena: every sport scene (football, rugby, basketball, kabaddi, volleyball, beach volleyball, badminton, tennis, table tennis, pickleball) now has a code-built 3D venue: textured striped floor with real court/pitch lines, goals/posts/hoops/nets/table, crowd banks, ad boards, floodlights, sun shadows, 3D ball. Falls back to the flat venue when WebGL is not available.
- Test: humans3d.cjs (SP=<sport>) waits for the arena and screenshots it.

## Original athlete body (shbody.js)
- Own character mesh built in code (no downloaded assets): torso with waist/chest/shoulders, thigh/calf, upper arm/forearm, palm and finger tubes, boots, neck, skull with jaw, nose, ears. Skinned to the Xbot skeleton so all clips, stroke pose, grip IK and kit paint keep working. Fallback to the old mesh: `window.SH_OLDBODY=1`.

## Virtual match viewer uses the 3D stadium
- The Virtual match screen (shV3dOpen) now draws the same 3D stadium as the game engine (env mode), real shadows, 3D ball, and the batting stroke on hit events (runs 1-6). 2D scene remains as fallback when WebGL is slow or flat mode is on.

## Profile avatar view (virtual match)
- "Profile avatar" button in the Virtual match screen opens a 3-tab live 3D view of the batter on strike: Face likeness (no helmet, provider/admin photo on the head when available), Full body + kit, Batting action (looping stroke). Built in code; uses each player's own photo.

## Cartoon player avatars (shAvatar, block 145)
- Vector portrait avatars generated in code (skin, hair style/colour, eyes, brows, beard, collar jersey in team colour, team logo and name). Deterministic from the player name, so each player keeps the same avatar. Used in the Virtual match player cards when no provider photo exists, and as the "Avatar" tab of Profile avatar (real photo shown as a small round badge when available).

## Avatar generated from the profile photo
- shAvatar.fromImg(photo) reads the player's profile photo in the browser (skin tone from cheeks, hair colour/length from top and sides, beard from chin/moustache area, face width) and returns options for the cartoon avatar. Virtual match 3D heads, Profile avatar and cards use this generated avatar; players without a photo get a name-based avatar. Heuristic (no ML): works best on front-facing headshots with a plain background.

## Own avatar generator (GPU worker)
- gpu-worker/ (FastAPI, Stable Diffusion XL + IP-Adapter + rembg, open-source) generates a stylised 3D-render avatar PNG from the profile photo; needs a rented NVIDIA GPU (see gpu-worker/README.md). Server: POST /api/avatars/generate (admin, forwards to AVATAR_GPU_URL with AVATAR_GPU_KEY), /api/avatars/save (admin upload), /api/avatars/delete, GET /api/avatars?names=. App: Profile avatar has Generate with AI and Upload avatar image for admins. Tested with a mock worker; the worker itself is untested on a GPU.

## Avatar batch mode (Lightning AI free plan)
- Admin queues players (`POST /api/avatars/queue`); GPU Studio runs `gpu-worker/batch.py`, reads `GET /api/avatars/queue` and pushes `POST /api/avatars/push`, both with header `x-avatar-key` = env AVATAR_GPU_KEY. Tested with mock (tests/avatars.test.mjs); real GPU run pending.

## Cricket bat model (user-supplied, free)
- Bat in the 3D match is now the low-poly "Cricket Bat" model by MiniPoly (user-supplied zip, Poly Pizza), converted to `public/vendor/shbat.js` (540 triangles, willow blade + dark grip), loaded in the shx engine; falls back to the old box bat if it fails to load (`window.SH_OLDBAT` forces old). Author credit needed (CC-BY style): "Cricket Bat by MiniPoly"; licence on the model page still to be confirmed by the user.

## Universal live 3D stream (OBS)
- Broadcast studio "Cricket game stream": dropdown now lists every match (live first, including matches scored by others), default "Auto: follow any live match". Link `?scene=ccast&mid=auto` (also used when no mid) follows the newest live shared match by itself, stays on it while live, switches when it ends or another starts, and waits when none is live. In-app 3D Live strip also lists everyone's live matches. Test: tests/ccast-auto.cjs.

## Virtual match TV camera
- Virtual match 3D default camera is now a TV broadcast view (high, behind the bowler's end, batter facing the camera); hero close-ups still blend in on each ball. Button "Camera: TV / Batter" switches back to the old behind-the-batter view.

## Score bar styles (OBS overlay)
- Six broadcast score bar designs drawn in code: Pro hexagon (default; team-logo circles, blue batters panel, centre hexagon, magenta bowler panel), Full-width strip, Glass card, Corner card, Mini score, Classic. Picker in Stream and OBS ("Score bar style", `S.stream.bug`); the default overlay and OBS bug scene use the chosen style. Test: tests/bug-styles.cjs. Not yet applied to the 3D game scene (its own HUD).

## Graphics studio (animated OBS graphics)
- 18 graphic kinds with transparent backgrounds: FOUR, SIX, bowled, caught, LBW, stumped, run out, hit wicket, DRS review taken (batter / bowler side), DRS result (OUT / NOT OUT / umpire's call), fifty, hundred (batter celebration figure), hat-trick, batter record (career + vs current bowler), bowler record (career + vs current batter). All drawn in code (SVG/CSS).
- Style = shape (8) x palette (12) x motion (7) x font (3) = 2016 combinations; "Random every time" mixes them. Streamers pick per graphic in Stream and OBS > Graphics studio (gallery of 12, "More styles"), preview on a checkerboard, "Send to OBS now".
- Fires automatically from live scoring: new ball (four, six, each wicket type), milestones, hat-trick, DRS log entries (review then result), new batter / new bowler (records). `?scene=fx#overlay` = graphics only.
- Premium: shapes burst/glass/neon, 4 palettes, flip/bounce motions are premium; locked unless admin or unlocked by an admin per phone (`S.settings.fxPremium`). Payment is taken manually by the admin. Test: tests/fx-studio.cjs.
