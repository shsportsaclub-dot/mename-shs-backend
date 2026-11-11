# SH Media Studio v1 — Telugu Auto Publishing (integration guide)

## Implemented module
`media-studio/media-engine.mjs` exports:
- `prepareMedia(match,{language:'te',photo:null})`: checks final status, two teams, verified innings; builds Telugu factual report, social caption, SVG portrait poster and ePaper text.
- `publishDecision(prepared,existingIds,{autoEnabled})`: prevents unverified, disabled and duplicate posts.
- `renderPoster(...)`: dependency-free 1080x1350 SVG. This is an original generic result graphic, **not** the locked football advertising master.

This commit **does not activate auto publishing**, change production routes, create an APK, generate videos, or post to Instagram/YouTube.

## Backend integration in existing server.js
1. Add at top:
```js
import {prepareMedia,publishDecision} from './media-studio/media-engine.mjs';
```
2. Within `newsroomRun(live)`, **after** the existing news item is added/updated, for ended matches only:
```js
if (ended && E.MEDIA_STUDIO_AUTO === '1') {
  const media = prepareMedia(m,{language:'te'});
  const known = new Set((P.media||[]).map(x=>x.id));
  const decision = publishDecision(media,known,{autoEnabled:true});
  if (decision.publish) {
    P.media ||= [];
    P.media.push({
      id:media.id,mid:media.matchId,kind:'result-media',
      h:media.headline,sub:media.summary,body:media.paragraphs,
      posterSvg:media.posterSvg,epaper:media.epaper,
      social:media.social,photo:media.photo,at:Date.now()
    });
    saveDb();
  }
}
```
3. Expose media items in the existing `GET /api/paper` response by adding `media:P.media||[]`. For recent days, use a dedicated paginated endpoint with bounded response sizes.
4. Frontend must render `posterSvg` safely as a server-produced image (e.g. SVG response with correct content-type and CSP); do not interpolate untrusted markup into the DOM. Show article body and licensed photo attribution.
5. After unit tests and staging checks, set Render `MEDIA_STUDIO_AUTO=1`; default must remain disabled.
6. Keep `P.news` preview articles separate from `P.media` final result posts. Ensure `saveDb` persists `P.media` to Neon/database or durable storage; in-memory only is not enough for redeploys.
7. For production idempotency across concurrent instances, add a unique database key on `media.id` (not just in-memory Set).

## Deployment
- Render service: `scoring-heroes-api` (branch `main`).
- Deploy latest commit **after** server.js integration and tests; this module by itself is inert.
- Health check `/health`, then check `/api/paper` and one finished match.
- Confirm no poster for in-progress/stumps matches; exactly one final result item per match.
- Roll back by setting `MEDIA_STUDIO_AUTO=0`, then redeploy/restart if necessary.

## External media rights and APIs
- Licensed player photos only, with attribution; never scrape Google Images or assume YouTube videos are reusable.
- Instagram publishing needs an authorized Meta account and official publishing API; YouTube requires authorized upload permissions.
- Reels require owned/licensed clips and music, or original score animations; video rendering pipeline is **not implemented** in this v1 module.
- Auto publish only internally after match is verified; external channels remain off until explicit account setup.

## Limitations
- Telugu report is factual template text, not full editorial narrative. Verified partnerships, wickets, milestones and photo metadata must be added as structured data before writing richer analysis.
- A status string containing 'abandoned' or 'no result' can be considered final; product may choose to publish a no-result article rather than a victory headline.
- Social 4:5 SVG is a generic match result card. ePaper A4 article layout/export and Android APK are separate work items.
