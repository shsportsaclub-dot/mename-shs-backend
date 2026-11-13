# Ticker batch 1 (14 situation tickers)

Fire automatically on the OBS overlay page when a new ball is scored. Preview: Stream screen, "Test situation tickers".

| id | situation | look | motion |
|---|---|---|---|
| tk1 | Dot ball | rain-glass pill, raindrop, 6-dot over strip | drops in with blur, ripple rings |
| tk2 | 3+ dots in a row | copper gauge card with red zone, needle | steps in, needle swings |
| tk3 | 1, 2, 3 runs | departure-board flap tiles | tiles flip one by one |
| tk4 | FOUR | green rope strip, ball rolls to boundary board | ball roll, text slides in |
| tk5 | 2nd four in the over | two skewed streaks (lime, amber) | cross-slide from opposite sides |
| tk6 | SIX (+ back to back / 3 in over) | night-sky band, comet arc, gold ticket stub | arc draws, stub slides in |
| tk7 | Wide | purple pill with sweeping chevrons, +runs chip | iris-open, chevrons swing |
| tk8 | No-ball (+ free hit) | barber-stripe siren block, green shield | scale-up, slow 2x pulse |
| tk9 | Bowled | cream-framed lantern card, stumps | middle stump snaps off, bail flies |
| tk10 | Caught | teal capsule, ball arc into glove ring | circle reveal, ring pulse |
| tk11 | LBW | navy strip, pad and red laser to stumps | slide-in, laser draws |
| tk12 | Run out | purple crease strip, dashed sprint line | stepped wipe, dashes run |
| tk13 | Golden duck | gold egg badge with 0 | spin-in, wobble |
| tk14 | Hat-trick | ember card with three flames | flames ignite one by one |

Rules enforced by `tests/tickers-b1.cjs`: unique keyframe names, unique root class, palettes differ (Jaccard < 0.5), no shared SVG paths, all classes namespaced, correct ticker per context, wicket replaces a boundary ticker, auto-removal, reduced-motion support.
Matrix rows covered so far: see docs/ticker-matrix.csv (groups A and B, base contexts). Remaining contexts are built in later batches.
