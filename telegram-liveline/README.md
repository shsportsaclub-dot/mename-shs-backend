# SH Sports Live Line (Telegram bot)

Standalone Telegram live-line bot, separate from the Scoring Heroes app. Bot: t.me/Shlivelinebot

- `/live` live matches (Men's / Women's), tap to follow; one live card edits itself every ball
- Alerts for 4, 6, wicket, 50/100, innings break, result
- CRR, RRR, need X from Y, win % (model, labelled), projected score, batters, bowler, partnership, last balls, over summary
- `/upcoming`, `/stop`, `/language` (English, हिन्दी, తెలుగు), scorecard button
- `/claim` (first user becomes owner), `/status`, `/speed` (owner: times CricketData updates for 2 min), `/diag` (owner): real CricketData self-test marking each check [PROVIDER] or [CODE]

Env: `TELEGRAM_BOT_TOKEN`, `CRIC_API_KEY`, `TG_WEBHOOK_SECRET`, optional `TG_CHANNEL`, `POLL_MS`.
Tests: `npm test` (fake Telegram + fake CricketData). Real-provider check: `/diag` or `GET /diag?s=<TG_WEBHOOK_SECRET>`.
