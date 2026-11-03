# Cricket two-hand IK — integration and limitations

`cricket-ik-solver.mjs` replaces the unsafe `handBone.position.lerp(socket.position)` placeholder with a per-frame CCD rotation solver for both upper-arm and forearm bones. Socket positions are read in world space. The hands are never translated and there is no negative bone scaling. RHB maps left to top grip, LHB maps right to top grip, as requested in the supplied binder.

```js
import {createBatGripFrameBridge} from './ik-frame-bridge.mjs';
const grip = createBatGripFrameBridge({skeleton, batMesh, getHandPreference:()=>handPreference});
function animate(dt) {
  mixer.update(dt); // first, base motion
  const result = grip.update(); // second, arm constraints
  renderer.render(scene,camera); // third, render
}
```

The bat must contain actual `socket_top_grip` and `socket_bottom_grip` Object3D nodes, and skeleton must contain Mixamo Arm, ForeArm and Hand bones. A socket cannot be replaced with a plain `{position:...}` object. Attach the bat to a stable control/prop transform; don't parent it to a hand if also using two-hand IK, to avoid cyclic constraints.

This is an iterative CCD solver, **not** a production-quality constrained anatomical two-bone solver: it has no elbow pole-vector, shoulder/clavicle solving, finger curl, wrist orientation locking, collision avoidance, bat-contact physics, or rigorous reachability handling. Both arms are solved separately. It can miss targets if bat placement is unreachable. It requires real-browser testing on the actual FBX avatar before visual acceptance.

Tests: `node test-ik-structure.mjs` validates missing bones/sockets, hand mapping and input rejection. `node test-rig-dispatch.mjs` verifies controller order. No Three.js runtime/visual test is claimed.
