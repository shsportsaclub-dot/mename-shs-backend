# Delivery flow diagnosis — 18 October 2026

User goal: real commentary/balls/FOW, live match visibility, Info with venue and pitch, Scorecard with FOW/partnerships, and actual innings graphs.

## Confirmed current state
Direct GET /health returned version 7130d00. GitHub main at review start was fec00a5152f774d669f496c2428d1f8ba86341d0. Therefore the newer Cricsheet recent-match fallback was not verified live. Dashboard uptime alone does not identify the deployed build.

## Incorrect assumptions to avoid
CricketData publicly advertises paid squads and ball-by-ball: https://cricketdata.org/ . This does not prove delivery coverage on every fixture/account, and an error for one match does not prove the entire provider lacks live BBB.
Cricsheet is a published match archive with listed coverage, not a replacement for a live feed: https://cricsheet.org/matches/ and https://cricsheet.org/downloads/ .
The current server already falls through to CricketData when a finished-match Cricsheet lookup does not supply deliveries. It is incorrect to describe all finished-match data as exclusively Cricsheet.
Sportmonks official scoreboard documentation: https://docs.sportmonks.com/v2/cricket-api/relationships/scoreboards . Retain supplied innings/scoreboard identity; never invent one for a payload without it.
CREX reference https://crex.com/cricket-live-score supports the desired hierarchy. UI visibility and actual data availability are separate requirements; layout remains our responsibility.

## Code defects fixed
1. The frontend discarded successful fallback delivery data whenever match_info.bbbEnabled was false. Available records now take precedence; a stale provider error cannot mask them.
2. Sportmonks BBB conversion dropped explicit inning/scoreboard and team identity. Preserve supplied IDs, including S1–S4 labels, so two innings can be grouped. Missing IDs remain missing.
3. Live world-match pages neither fetched BBB on entry nor periodically refreshed details. Fetch scorecard, BBB and match info on entry; check every minute while a live match is open and visible, prevent overlapping refresh, ignore responses for a closed/replaced match, preserve previous good delivery data on transient errors, and provide Refresh match details.
4. Add recent balls and available commentary to Live, not just a separate tab.
5. Graphs now include a separate cumulative recorded-run line per innings with wicket markers. Do not draw a cumulative line across missing overs/unknown deliveries. Preserve source credit. Partnerships/FOW stay in Scorecard; remove the later wrapper that prepended partnership timeline to Graphs.
6. Serve cached cricket detail responses before counting upstream-request throttles. Increase detail miss allowance to 300/hour per IP to accommodate the three-detail minute refresh. No change to OTP limits.

## Evidence
Local script syntax and three regression tests passed. Browser workflow delivery-flow.yml exercises the real renderer using synthetic provider/fallback fixtures at 320 and 412px: false BBB hint with real records, stale errors, two innings lines and wicket markers, partnerships in Scorecard, Live fetch/update and containment. Artifacts are clearly fixtures; no claim of real-provider BBB or OTP delivery.
The existing broader UI/multisport workflows also run for the app change.
No credentials were read/changed, no messages sent and no production match records created.

## Still needs production validation
Deploy latest code, compare /health commit and served HTML hash, then check an actually covered live fixture. A provider response without delivery records cannot produce truthful ball commentary or run progression. Actual pitch notes and officials require published match data. A Sportmonks adapter with mock tests is not proof that an account token or coverage is configured.
