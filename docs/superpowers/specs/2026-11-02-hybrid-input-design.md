# Hybrid source video and commentary

User-approved direction: combine original video movement with commentary and confirmed scorer events in the original avatar viewer. Preserve original assets, no paid packs/APK, and do not claim photorealism or tracking of unseen action.

Implementation: add an opt-in source studio on the existing viewer. File/direct-media URL/camera/screen-share video provides source audio and a master media clock. Optional, explicitly loaded free MediaPipe Pose Landmarker estimates one visible person's limbs. Operator maps that subject to current striker or bowler. Original code retargets reliable limb directions to fixed avatar bone lengths; no player identity, calibrated field positions, bat tracking, ball tracking or facial capture is inferred. Low confidence, source stop/seek/change, role change and stale samples clear tracking and return to labeled illustrative scorer animation.

Commentary inputs: typed live captions, optional browser microphone speech recognition and timestamped WebVTT captions for the selected video. Captions and camera hints can influence presentation but never create score/dismissal events. Native source audio stays with the source video clock; stop/mute are explicit. Browser speech recognition availability/network use varies. Arbitrary broadcast-audio automatic transcription is not included.

Approaches considered: commentary-only loses visible motion; full multi-player/ball reconstruction needs calibrated cricket-specific tracking unavailable here. Selected incremental hybrid is a real, bounded body-motion integration, not a completed reconstruction system. A free vision dependency is distinct from a purchased avatar pack, loaded only on request and with clear failure status.

No automatic video download, rebroadcast, upload or deployment. Direct browser-readable media only; a YouTube webpage is not a direct media URL. Tracking analysis stays in this browser; optional speech recognition may use the browser vendor's service.
