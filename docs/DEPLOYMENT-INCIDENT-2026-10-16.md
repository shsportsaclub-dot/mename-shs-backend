# Deployment incident — 16 October 2026 IST

Phone screenshots show the old four-tab world match page. Direct read-only requests confirmed this at 00:24–00:26 IST:
- GET / returns the old app; its SHA256 is be84c9a8955049695ec73975856ee1fac64d8e6b4d2a78b6fcd14d00192c7766.
- The live HTML exactly matches the earlier base app after trailing whitespace is ignored.
- GET /health returns only {"ok":true}; the newer server version field is absent.
- GitHub main before this fix was 26a925af8bd9686491f887d6e3d65c3d2762f3d2 and contains newer skins and graphs.
- This proves an old live deployment, independently of a phone cache. It does not establish why Render did not deploy (auto-deploy, branch selection or a failed deploy).

Patch: upcoming world matches show a pre-match scorecard state; raw provider scorecard errors use a readable failure state. Health reports full Render commit and app SHA256; HTML has no-store and a commit response header. New verification compares exact served HTML and server hash to the checkout, and fails when they differ. No OTP messages or provider calls were made for these deployment checks.

Required hosting step: Render > scoring-heroes-api > Manual Deploy > Deploy latest commit. Confirm the service tracks shsportsaclub-dot/mename-shs-backend, branch main. Check deploy logs if the latest deploy fails. No Render dashboard session or deploy hook was available in this task, so deployment itself was not performed.

After deployment, run the "Verify deployed build" GitHub workflow for the deployed commit. A green local build alone is insufficient. The version shown on Home must agree with the deployed commit. The two skins are controls on the scoring/world-match page, not an APK change; a new APK is not required for this web update.

Tests run: server syntax, all inline script compilation and upcoming-match rendering passed locally. The read-only production verifier failed as expected against the old deployment; evidence is runtime-evidence/deployment-verification.json. Real phone visual checks, provider commentary/scorecards and OTP delivery remain unverified.
