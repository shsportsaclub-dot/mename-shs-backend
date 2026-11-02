# Scoring Heroes – Graphics architecture

Event bus -> rules -> templates + themes -> queue -> overlay.

1. **Event bus (Crickslab-style, automatic).** `watch()` diffs the live match each tick and emits events: four, six, bowled/caught/lbw/stumped/runout/hitwkt, fifty, hundred, hattrick, DRS, new batter/bowler, bowler 3/5-fors, partnership 50/100/150, match result.
2. **Rules (streamer control).** `EVT` table + `S.stream.gfx.rules[event] = {on, mode: auto|manual, kind, style}`. Defaults are free-tier CSS kinds; premium packs upgrade rules on "Use pack".
3. **Templates + themes (Flowics-style, data-linked).** Each kind (`KINDS`, `G3` 3D titles, `SEQ` PNG packs) is filled by `dataFor(kind, match, ctx)` so every graphic is bound to live data. Themes = `PACKS` palettes; score bar themes via `?bug=<id>`.
4. **Queue/overlay.** `enqueue -> pump -> play`; max 5 queued; each kind has its own locked motion (`KSIG`, 47 unique, enforced by `tests/fx-unique.cjs`).
5. **Operator + API.** Rundown "Take" buttons push through `S.stream.fxq`; external systems use `POST|GET /api/gfx/take` and `GET /api/gfx/poll` with the stream's API key.
6. **Packs.** Library cards (`LIB`) preview/apply packs. Drop-in PNG sequences: `public/packs/<dir>/manifest.json` + `<PACK>/frame_NNN.png`, served by `/packs/`.
7. **3D avatar hook (not yet wired).** Avatars should subscribe to the same event bus (`fire(ev, m, ctx)`), mapping event -> clip name.

Known limits: premium unlock is client-side; leaderboards/intro/toss are manual; score bar themes not applied to the ccast 3D scene.
