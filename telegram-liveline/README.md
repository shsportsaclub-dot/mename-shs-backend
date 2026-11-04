# SH Sports Live Line (Telegram bot)

Standalone Telegram live-line bot, separate from the Scoring Heroes app. Bot: t.me/Shlivelinebot

- `/live` live matches (Men's / Women's), tap to follow; one live card edits itself every ball
- Alerts for 4, 6, wicket, 50/100, innings break, result
- CRR, RRR, need X from Y, win % (model, labelled), projected score, batters, bowler, partnership, last balls, over summary
- `/upcoming`, `/stop`, `/language` (English, हिन्दी, తెలుగు), scorecard button
- `/claim` (first user becomes owner), `/status`, `/speed` (owner: times CricketData updates for 2 min), `/diag`, `/demo` (owner: sends all 8 event animations): real CricketData self-test marking each check [PROVIDER] or [CODE]

Env: `TELEGRAM_BOT_TOKEN`, `CRIC_API_KEY`, `TG_WEBHOOK_SECRET`, optional `TG_CHANNEL`, `POLL_MS`.
Storage: set `DATABASE_URL` (Neon) and owner/users/followers survive deploys (table `tg_liveline_state`; `/diag` shows a [STORAGE] line).
Tests: `npm test` (fake Telegram + fake CricketData). Real-provider check: `/diag` or `GET /diag?s=<TG_WEBHOOK_SECRET>`.

## Event animations (assets/*.mp4, made by tools/make_animations.py)
Each has its own look and motion: FOUR (Boundary Rush), SIX (Sky Launch), WICKET (Stumps Shatter), WIDE (Arms Spread),
NO BALL → FREE HIT (Crease Alarm), DRS REVIEW (DRS Box), FIFTY (Silver Odometer), HUNDRED (Century Blaze).
Wide vs no-ball comes from the bowlers' wd/nb counters; free hit follows ICC playing conditions (after every no-ball in
ODI/T20, carried over through a wide or no-ball, ended by the next legal ball). DRS: CricketData has no review field, so
the animation fires when the match status mentions a review. A stale (backwards) provider reading is ignored unless repeated.
