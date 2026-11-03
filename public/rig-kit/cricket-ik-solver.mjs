/** Scoring Heroes two-arm CCD IK, for Three.js-compatible Object3D bones.
 * Call after AnimationMixer.update() every frame. Bat sockets must be real Object3D nodes.
 * Does not translate animated hand bones or negatively scale the skeleton.
 */
const ALIASES = side => [
  [`mixamorig:${side}Arm`, `mixamorig${side}Arm`, `${side}Arm`],
  [`mixamorig:${side}ForeArm`, `mixamorig${side}ForeArm`, `${side}ForeArm`],
  [`mixamorig:${side}Hand`, `mixamorig${side}Hand`, `${side}Hand`]
];
const findBone = (skeleton, names) => names.map(n => skeleton?.getBoneByName?.(n)).find(Boolean) || null;
const finite = v => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
export class CricketIKSolver {
  constructor(skeleton, batMesh, {iterations = 14, tolerance = 0.012, maxStep = 0.30} = {}) {
    if (!skeleton?.getBoneByName || !batMesh?.getObjectByName) throw new TypeError('Skeleton and bat Object3D required');
    this.skeleton = skeleton; this.batMesh = batMesh;
    this.iterations = iterations; this.tolerance = tolerance; this.maxStep = maxStep;
    this.sockets = {
      top: batMesh.getObjectByName('socket_top_grip') || batMesh.getObjectByName('top_grip'),
      bottom: batMesh.getObjectByName('socket_bottom_grip') || batMesh.getObjectByName('bottom_grip')
    };
  }
  chain(side) { return ALIASES(side).map(names => findBone(this.skeleton, names)); }
  /** @returns {{ok:boolean, errors:object, missing?:string[]}} */
  solveTwoHandGrip({handPreference='right_hand', weight=1} = {}) {
    if (!['right_hand','left_hand'].includes(handPreference)) throw new Error('Unsupported handPreference');
    if (!(weight >= 0 && weight <= 1)) throw new RangeError('weight must be 0..1');
    const topSide = handPreference === 'left_hand' ? 'Right' : 'Left';
    const bottomSide = handPreference === 'left_hand' ? 'Left' : 'Right';
    const pairs = [{side:topSide, socket:this.sockets.top, grip:'top'}, {side:bottomSide, socket:this.sockets.bottom, grip:'bottom'}];
    const missing = [];
    for (const p of pairs) {
      p.bones = this.chain(p.side);
      if (!p.socket) missing.push(`${p.grip} socket`);
      if (p.bones.some(b=>!b)) missing.push(`${p.side} arm/forearm/hand`);
    }
    if (missing.length) return {ok:false, errors:{}, missing};
    const errors = {};
    for (const p of pairs) {
      p.socket.updateWorldMatrix?.(true,false);
      const target = p.socket.getWorldPosition(p.socket.position.clone());
      if (!finite(target)) throw new Error('Invalid socket world position');
      errors[p.grip] = this.solveChain(p.bones, target, weight);
    }
    return {ok:Object.values(errors).every(e=>e<=this.tolerance), errors};
  }
  solveChain([upper, forearm, hand], target, weight) {
    if (weight === 0) return hand.getWorldPosition(hand.position.clone()).distanceTo(target);
    // CCD: rotate each joint in its PARENT space; never copy world positions into bone.position.
    for (let i=0;i<this.iterations;i++) {
      for (const joint of [forearm, upper]) {
        joint.updateWorldMatrix?.(true,true);
        const jointWorld = joint.getWorldPosition(joint.position.clone());
        const tip = hand.getWorldPosition(hand.position.clone());
        const toTip = tip.sub(jointWorld).normalize();
        const toGoal = target.clone().sub(jointWorld).normalize();
        if (!finite(toTip) || !finite(toGoal) || toTip.lengthSq()<1e-9 || toGoal.lengthSq()<1e-9) continue;
        const deltaWorld = joint.quaternion.clone().setFromUnitVectors(toTip,toGoal);
        const angle = 2*Math.acos(Math.min(1,Math.abs(deltaWorld.w)));
        if (angle < 1e-7) continue;
        const scale = Math.min(1,this.maxStep/angle)*weight;
        const delta = joint.quaternion.clone().identity().slerp(deltaWorld,scale);
        const parentWorld = joint.quaternion.clone();
        joint.parent?.getWorldQuaternion?.(parentWorld);
        const localDelta = parentWorld.clone().invert().multiply(delta).multiply(parentWorld);
        joint.quaternion.premultiply(localDelta).normalize();
        joint.updateWorldMatrix?.(true,true);
      }
      const error = hand.getWorldPosition(hand.position.clone()).distanceTo(target);
      if (error <= this.tolerance) return error;
    }
    return hand.getWorldPosition(hand.position.clone()).distanceTo(target);
  }
}
