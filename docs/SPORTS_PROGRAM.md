# Sports program (user requirements, 13 Nov 2026)
Goal: every sport gets the same depth as cricket, built sport by sport, rules researched globally first.

Per sport deliverables
1. Rules and study page (laws, officials/signals, scoring, formats, positions, glossary, quiz) summarised in own words from the governing body, with official link. Framework: SPORT_LEARN + XV.slearn (football done, build 567c31e).
2. Game dashboard (sport home): live, upcoming, results, leaders, teams, series, Heroes 11, shortcuts.
3. Match Center tabs: Info, Live, Commentary, Scorecard, Graphs, Series Stats, Heroes 11 (Info done for cricket, build 3919172).
4. Scorer that follows the official rules (warnings, undo, officials), verified against the rulebook.
5. Layout fitted to the sport (not a cricket copy): football = pitch + event timeline + cards; tennis/badminton/TT/pickleball/volleyball = set grid + serve indicator; basketball = quarters + fouls/timeouts; kabaddi = raid/tackle board + do-or-die + super tackle; hockey = quarters + cards/penalty corners; racing = grid/lap/result table; etc.
6. Tickers/score bars/graphics per sport, each with its own distinct look and motion (no reskinned copies), original design, free assets only.
7. Audience effects: animations, sounds, commentary lines, overlay scenes (?scene=sgame).

Rules for building
- Study reference apps and official rules before building; summarise, never copy rulebook text; link the official source.
- Free options only. No money/chips/wallet; points only; shop-credit redemption stays OFF until legal check.
- Test, verify, fix, retest; bulk push per sport; give Render link + build sha after every push.
Order: Football, Hockey, Handball, American football, Kho-Kho, Netball; audit Basketball, Volleyball, Badminton, Tennis, TT, Pickleball, Rugby, Kabaddi, Golf, Chess, Carrom; Boxing, Wrestling, Archery; racing sports (Swimming, Athletics, Cycling, Motorcycle, Horse, F1).
