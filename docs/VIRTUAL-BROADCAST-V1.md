# Scoring Heroes — Virtual Broadcast Contract (V1)

Status: integration specification; NOT a deployed avatar renderer or YouTube broadcast.

## Live pipeline
Authorized match events → validated canonical timeline (event id, revision, event timestamp) → text commentary, sport-specific avatar animations, multilingual AI speech and crowd audio. Never invent missing ball trajectory, DRS outcomes or players. Indicate illustrative animations and AI-generated commentary. Deduplicate events; retain ordering and corrections.

## Language
Prefer saved user commentary language. Otherwise offer popular languages based on approximate IP country; never infer a person's language from IP. Search all supported languages; persist explicit choice. If TTS unsupported, fall back to text or user-approved language. Do not block text commentary while voice synthesizes.

## Viewer
Separate live text timeline from video playback position. Match audio to video presentation timestamp, not newest score event; avoid spoiling a delayed video. Embedded YouTube player uses its required controls and attribution. If commentary is separately rendered, mute overlapping default video audio where supported and require user gesture for playback. Provide mini-player, fullscreen, mute, captions, and language switching; do not promise background playback or browser-autoplay.

## Access and subscriptions
YouTube Private streams are not generally embeddable for arbitrary app registrants. Unlisted is link-accessible, not exclusive. Exclusive access requires authenticated first-party streaming with short-lived signed playback authorization. YouTube subscriptions require an explicit user action and authorized Google OAuth; registration cannot silently subscribe users. No fabricated views, subscribers or engagement.

## Avatar rights and safety
Registration photos require clear consent for avatar generation, public likeness and broadcast; guardian consent for minors. Store provenance, revocation and deletion handling. For external players use authorized likeness or neutral characters. Streaming and match data require appropriate licenses/permissions.

## YouTube distribution
Use a properly authorized channel and YouTube API to schedule streams, ingest original video and publish permitted replays/highlights. Public replay and monetization are conditional on rights, originality and YouTube eligibility. One stream normally has a default audio track; per-user multilingual voice in app requires separate synchronized audio delivery.

## Next build gates
1. Unit-test provider sync and match event contract.
2. Implement text commentary + event timestamps + replayable event bus.
3. Integrate sport-specific avatar renderer and consent-controlled asset storage.
4. Implement language selection, TTS queue, synchronized audio mixer and crowd sound.
5. Integrate app player and authorized streaming/YouTube channel configuration.
6. Test end-to-end with an authorized SH Sports demo match before production release.
