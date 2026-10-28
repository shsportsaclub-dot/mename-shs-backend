# Scoring Heroes — Cross-Country Broadcast Router Demo

## Purpose
Proof of concept for selecting a **different-country** broadcast source when it is licensed for playback in the viewer's territory. Never bypass DRM, geoblocks, tokens, or geographic rights.

## Demo flow
1. Select viewer country (manual override; production may use consent-aware server geolocation).
2. Select match.
3. Filter catalog for source.country !== viewerCountry AND viewerCountry in source.allowedTerritories AND source.hasPlaybackRights.
4. Sort by language, latency, and availability.
5. Select source; on failure retry only another eligible source.
6. If none exists, show the live score and an official broadcaster link instead of unlicensed video.

## Test catalog (SIMULATED — no real streams)
| Source | Origin | Demo-eligible viewer territories |
|---|---|---|
| demo-au | Australia | IN, GB, US, AE |
| demo-gb | UK | IN, AU, US, AE |
| demo-in | India | AU, GB, US, AE |
| demo-us | USA | IN, AU, GB, AE |

## Integration contract
```json
{
  "matchId": "demo-cricket",
  "viewerCountry": "IN",
  "source": {
    "id": "demo-au",
    "originCountry": "AU",
    "allowedTerritories": ["IN"],
    "playbackType": "authorized-embed",
    "licenseVerified": false,
    "url": null
  },
  "mode": "simulated",
  "fallback": "score-only"
}
```

### Production gates
- A source is not playable until its distribution rights for viewer territory and match are verified.
- Video rights, scoreboard rights, and commentary rights are separate.
- Never forward third-party signed URLs or provider credentials to clients.
- Record source selection and fallback events without storing raw IP addresses.
- Match and player data must come from a verified feed, never fabricated.

The full runnable standalone demo is supplied as a separate HTML artifact in the chat. This repository document is a safe integration checkpoint, not a production stream deployment.
