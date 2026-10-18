# Match Centre correction: 18 October 2026

Authority reviewed: Scoring Heroes Authoritative Executable Spider Bible V2 (1 October) and Pin-to-Pin Development Bible V1 (23 September), especially SH-MATCH-004/005/007/009/010, SH-AI-003, SH-DATA-003/008/010 and V2 event-spine/freshness/persistence gates. Existing provider data and earlier APK/UI are partial implementation, not completion of these gates.

## Requirements and changes

| Requirement | Implementation | Acceptance / remaining limit |
|---|---|---|
| Saved commentary, independent of browser | Server journal, provider-response ingestion, active match watcher, archive and replay API | Serialization/restart and actual HTTP server background collection tests. A configured working DATABASE_URL is required to survive free-host filesystem replacement. Local disk alone survives process restart, not all redeploys. |
| 20-second checks | Background watcher continues for a 30-minute renewed viewing lease, up to 8 concurrently watched matches | Scorecard every 20s; missing BBB retried every 60s; successful delivery feed every 20s; info 60s, squads 5m. Provider update speed remains external. |
| Ball/over ledger | Provider delivery records and separately labelled single-delivery tracker inferences merged and retained | Total score differences alone do not establish a ball. The existing tracker may derive a labelled delivery only when batter, bowler, legal-ball and extra counters support exactly one delivery; larger gaps stay notes. Score observations are never inserted as balls. |
| Correct freshness | Request time and score-change time displayed separately; unchanged score warning after 3m; older endpoint response cannot roll back a later over/innings | Cannot distinguish a real stoppage from a delayed source without a source reason. No false “fresh” claim. |
| Squads | Larger published registration list with source/date and bench status | PAK and SL series squads sourced below; not treated as match XI. Other matches use provider/curated context when available. |
| Playing XI | Separate tab; only explicit lineup flags confirm membership; scorecard participants are separately labelled | Batting/bowling participation alone never fills missing starting-XI slots. |
| SH Sports 11 | Combined selection from both teams; editable 11 with C/VC and saved selection; excludes unavailable players | SH contribution index: runs + 20*wickets. Live contributions and pre-match form are separate modes, not official fantasy points or a future-performance guarantee. Auto-selection requires enough measured players, both sides, a known WK, max 7 from one team. |
| Last ten | Exact-name/team/format completed archive records, up to ten, before match date | Displays n/10. Does not invent ten or silently merge genders/identities. Existing recent archive is a coverage limit. |
| Pitch / officials | Info separates sourced pitch report, stadium facts and officials; missing-source text corrected | No verified pitch report or official assignment has been added for this match. Those remain a coverage gap. |

## Reference map

- Cricbuzz: dense match consumption, Info / Live / Scorecard / Commentary separation. Pattern reference only; no proprietary feed copied.
- CREX official site https://crex.com/ and official app listing https://apps.apple.com/in/app/crex-just-cricket/id1370408703: ball-by-ball / over progression, scorecard, match context and player-stat navigation. Pattern reference only.
- Dream11 official explanation https://login.dream11.com/games/fantasy-cricket/how-to-play and developer app listing: combined-player selection and C/VC interaction. SH uses its own disclosed index, no borrowed proprietary scoring/feed, no paid contest implementation.
- PCB https://www.pcb.com.pk/press-release-detail/pakistan-squads-announced-for-sri-lanka-t20is-and-odi-tri-series.html: Pakistan's 16-member ODI series squad, captain and named keepers.
- ICC https://www.icc-cricket.com/news/sri-lanka-unveil-odi-squad-for-tri-series-in-pakistan: Sri Lanka's 16-member ODI series squad and Nissanka's conditional travel. Registration status, not confirmed match XI.
- CricketData official API documentation https://cricketdata.org/how-to-use-fantasy-cricket-api.aspx: provider scorecard / squad / ball endpoints.
- Cricsheet https://cricsheet.org/: attributed completed-match records for archive form and actual historical deliveries; not a live substitute.

## Evidence scope

Tests use synthetic provider responses and the real server/renderer. They prove collection, replay, correction boundaries, UI separation and selection constraints. They do not prove this account receives international live BBB or that its external database is configured. Production on 18 October returned current PAK-SL headline/scorecard values but `bbbEnabled:false`, a BBB error and an empty squad response. Previous successful deploy screenshots therefore do not establish complete live-match acceptance.

History is bounded to 6000 saved updates and 6000 supplied deliveries per match. The latest 12 matches are in active memory; per-match archives remain replayable. No claims are made that missing earlier balls or older phone-only entries have been recovered.
