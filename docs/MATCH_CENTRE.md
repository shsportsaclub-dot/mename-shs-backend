# Match Centre scene (full 16:9 live board)
OBS Browser Source: `<app>?scene=main#overlay` (transparent, for placing over video) or `<app>?scene=main&bg=1#overlay` (with animated stadium backdrop and big team emblems). Also Stream tab, "Match Centre scene" card (Preview / Copy OBS URL).

Layout (all values read from the live match): title banner (tournament or match name, match number, overs), SH brand + LIVE, HD LIVE, tournament crest, team emblems (team logo, Scorer-uploaded mascot image works), score band (batting team, score and overs, target or first-innings run rate, opposition), striker/non-striker rows, bowler row, THIS OVER beads, equation bar (CRR, RRR, need X off Y balls; first innings: CRR, projected, partnership; result text when done), section rail (Live, Commentary, Scorecard, Graph, H2H, Prediction, Pitch, Weather, Playing XI, Points).

Animations: banner drop with shimmer sweep, crest pop plus float with rotating dotted ring, emblems slide in and float with aura pulse, score band rises, score digits pop and glow gold when the score changes, target glow, striker row shine sweep, over beads pop one by one (last ball pulses), equation bar fills with progress, rail slides up with LIVE pulse and a gold highlight moving across sections, stadium beams, flares and crowd shimmer. No flash faster than 3 per second; reduced-motion supported.
Not shown because the app has no such data: weather temperature, player photos unless uploaded (avatar is used).
Test: tests/match-centre.cjs. Preview: docs/match-centre-preview.png.
