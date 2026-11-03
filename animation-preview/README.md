# Scoring Heroes FBX motion integration
This is a safe, isolated integration adapter for the Scoring Heroes streaming system.
Available source movements in the user's earlier local preview package: idle_twist, walk, run.
The adapter listens for `sh:match-event` and resolves an available clip.
Example:
```js
import { bindMatchMotion } from './match-motion-bridge.mjs';
bindMatchMotion(name => viewer.play(name));
window.dispatchEvent(new CustomEvent('sh:match-event',{detail:{eventType:'RUN'}}));
```
**Not yet included in this repository:** FBX binaries, a working hosted viewer, a skinned player avatar, face retargeting, cricket-specific clips, and a public preview endpoint. This commit does not claim a working animation preview.
