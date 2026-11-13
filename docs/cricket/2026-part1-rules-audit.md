# Scoring Heroes Cricket — PART 1 Official Rules Audit (2026-11-13)

Status: RESEARCH IN PROGRESS. Existing scorer must be inspected before any migration. Do not overwrite live cricket scorer.

## Authoritative editions (verified source indexes)

| Authority | Document | Edition/effective date | Official URL |
|---|---|---|---|
| MCC | Laws of Cricket, 2017 Code, 4th Edition | 1 Oct 2026 | https://www.lords.org/mcc/about-the-laws-of-cricket |
| MCC | Explanation of 2026 changes (73 material changes) | 2026 | https://www.lords.org/lords/news-stories/mcc-announces-new-edition-of-laws-from-1-october-2026 |
| ICC | Men's Test, ODI, T20I Playing Conditions | Oct 2026 | https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions |
| ICC | Women's Test, ODI, T20I Playing Conditions | Oct 2026 | https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions |
| ICC | New Playing Conditions summary | 1 Oct 2026; new series starting from this date | https://www.icc-cricket.com/news/new-icc-playing-conditions-bring-key-changes-across-formats |
| BCCI | Domestic Playing Conditions | 2026–27 | https://www.bcci.tv/playing-conditions |

## Confirmed changes requiring scorer audit

- MCC 2026: laminated bats allowed in open-age cricket subject to applicable regulations; updated cricket ball specifications; clearer overthrow/misfield distinctions; multi-day final over should continue after wicket if conditions allow. Source: https://www.lords.org/lords/news-stories/mcc-announces-new-edition-of-laws-from-1-october-2026
- ICC 2026: batter time-wasting measures; revised women's cricket ball specifications; daytime pink-ball Test trial; ODI/T20I leg-side wide trial made permanent; T20I innings interval now fixed at 15 minutes, reducible to minimum 10 when time is lost. Source: https://www.icc-cricket.com/media-releases/new-icc-playing-conditions-bring-key-changes-across-formats
- ICC 2022: new batter takes striker's end after caught dismissal; permanent saliva prohibition; incoming batter timing adjustments. Source: https://www.icc-cricket.com/news/icc-announces-changes-to-playing-conditions

## Implementation safety gates

1. Audit actual existing scoring source and ball-event schema; DO NOT replace scorer with generic prototype.
2. Select law profile by match start date, jurisdiction, format, gender, age, competition and special conditions. Existing series may remain on previous ICC conditions.
3. Model bat runs, byes, leg-byes, wides, no-balls, penalties and overthrows separately; legality and batter/bowler attribution must be tested against current rules.
4. Preserve full immutable event history, corrections, reversals and audit provenance.
5. Implement DRS only as referee/third-umpire-entered official outcomes; never invent tracking, snicko, thermal evidence, DLS targets or review entitlements.
6. Do not assume 6-ball overs for The Hundred, Super Six or school variants; use competition profiles.
7. Test boundaries, catches, dismissals, free hits, end of over, super overs, weather, interruptions, DLS, innings transitions and player replacement rules per profile.
8. Verify separate IPL, The Hundred, BBL, blind/para and youth editions before enabling their special rules.

## Pending / unverified

- Exact clause-by-clause 2026 changes and all rule section references.
- Exact effective date for each BCCI 2026–27 competition.
- Comparison of each governing body's last two editions.
- Official 2026/27 IPL, The Hundred, BBL and junior competition amendments.
- Existing repository scorer code and regression suite; no compatibility audit completed.
- 25+ executed regression tests; not yet implemented.

This file is a source-grounded audit starter, NOT a completed PART 1 or production rules certification.
