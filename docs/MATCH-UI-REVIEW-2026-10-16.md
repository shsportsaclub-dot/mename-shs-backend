# Match Centre review — 16 October 2026
User request: recap and research before implementation; repair team names and flags, alignment and graphs; original SH skin names; match pitch report and stadium details.

## Reference and gap review
- Locked requirements: both team identities and scores, separate innings, batting/bowling, ball/over graphs, pitch and venue context; mobile layout must fit.
- Cricket Australia official Match Centre separates scorecard, commentary, graphs and match info (toss, officials, venue, viewer date): https://www.cricket.com.au/matches/CA:19853/australia-men-india-men-australia-v-india-tests-men . This informs hierarchy, not product branding or copied assets.
- CricketData official fantasy documentation includes innings batting/bowling, extras and totals: https://cricketdata.org/how-to-use-fantasy-cricket-api.aspx . Public search exposed sample JSON; the rendered documentation is dynamic. Actual match_bbb schema/coverage remains unverified.
- ICC pitch/outfield ratings describe assessed match surfaces: https://www.icc-cricket.com/about/cricket/rules-and-regulations/pitch-ratings?appview=true . Historical venue averages and a match-day pitch report are different information.

## Confirmed code defects and changes
- Flag fallback previously depended on img being absent; provider placeholder images prevented fallback. Use existing country mapping regardless of provider placeholders. No external flag download is required for country emoji; England/Scotland use inline vector flags. Clubs retain supplied emblems or labelled initials, never a random country flag.
- Replace truncated 12-character world-score names with two named score rows. Preserve team identity when score data is absent.
- Flexible grid columns and contained tracks replace bars sized against an entire row; zero-run bars remain zero. Show innings comparison and full batter names.
- Group provider deliveries by explicit innings plus over. Do not combine two innings or invent missing identifiers. Runs scored on wicket deliveries remain counted. Incomplete schemas are excluded and explained. Delivery coverage is not claimed complete.
- Public skin names: SH Classic and SH Stadium. Existing stored skin IDs remain compatible.
- Render supplied structured stadium fields and match-specific pitch notes with their source. Keep available history records separate. TBC is confirmation pending. Do not claim that missing fields can never exist in the provider; do not create capacity, boundaries, weather or pitch notes without data.

## Validation and limits
Unit checks: script compilation, flag placeholders and country suffixes, full score names, separate innings, wicket runs, zero bars, incomplete delivery exclusion and supplied/missing venue and pitch details.
Browser checks use the actual app renderer with clearly synthetic fixtures at 320, 412 and 1280 pixels, both skins; assert two teams/two flags, no chart overflow and venue/pitch rendering; screenshots and JSON are workflow artifacts. These checks do not verify real provider delivery coverage or live hosting.
No OTP sent, account created, external provider changed or production record written.
Render deployment and real phone review remain separate from code push.

## Screenshot-specific live provider check
Read-only GETs for match c28bfd05-81dd-46d6-9873-b094df319ef3 on 16 October 2026: match_info ok with bbbEnabled=false, hasSquad=false; match_scorecard ok (11 and 4 batters; 7 and 6 bowlers); match_squad ok with empty list; match_bbb returned ERR: Not able to get BBB. No official/pitch fields in match_info. This is match-specific evidence, not a conclusion about the user's entire paid plan. Playing XI cannot be inferred from observed batting/bowling participants. Add separate officials and lineup sections, render explicitly supplied partnerships in Scorecard and remove raw BBB error details from the public commentary card.
