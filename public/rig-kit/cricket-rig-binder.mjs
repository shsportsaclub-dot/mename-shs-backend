/** Scoring Heroes: safe rig socket binding. Requires a configured two-hand IK solver. */
const BONE_ALIASES = {
  hips: ['mixamorigHips','mixamorig:Hips','Hips'],
  leftHand: ['mixamorigLeftHand','mixamorig:LeftHand','LeftHand'],
  rightHand: ['mixamorigRightHand','mixamorig:RightHand','RightHand'],
};
function lookup(root, names) {
  for (const name of names) {
    const node = root?.getObjectByName?.(name) ?? root?.skeleton?.getBoneByName?.(name);
    if (node) return node;
  }
  return null;
}
function worldTransform(node) {
  node.updateWorldMatrix?.(true, false);
  const position = node.getWorldPosition?.(node.position.clone());
  const quaternion = node.getWorldQuaternion?.(node.quaternion.clone());
  if (!position || !quaternion) throw new Error(`Socket ${node.name} lacks world transform support`);
  return { position, quaternion };
}
export class CricketRigBinder {
  /** @param {object} avatar Three.js Object3D; @param {object} options {solveTwoHandIK, setHandednessPose, setBowlingPose} */
  constructor(avatar, options = {}) {
    if (!avatar?.getObjectByName) throw new TypeError('Expected a Three.js Object3D avatar');
    this.avatar = avatar;
    this.options = options;
  }
  validate() {
    const missing = [];
    for (const [key, names] of Object.entries(BONE_ALIASES)) if (!lookup(this.avatar, names)) missing.push(key);
    for (const name of ['bat_grip_socket', 'top_grip', 'bottom_grip']) if (!lookup(this.avatar, [name])) missing.push(name);
    return { ok: missing.length === 0, missing };
  }
  /** Must be called AFTER AnimationMixer.update, BEFORE render, every frame. */
  applyRigConstraints(actorType, clipName, options = {}) {
    if (actorType === 'batter') {
      const check = this.validate();
      if (!check.ok) throw new Error('Missing rig nodes: ' + check.missing.join(', '));
      const left = options.handPreference === 'left_hand';
      if (!['left_hand','right_hand',undefined].includes(options.handPreference)) throw new Error('Invalid batting hand');
      // Never set hips.scale.x=-1: negative scaling in a skinned hierarchy can break normals, winding and animation.
      // Handedness must be retargeted in local joint space with authored poses or a retargeting solver.
      this.options.setHandednessPose?.({ left, clipName, avatar: this.avatar });
      const topHand = lookup(this.avatar, BONE_ALIASES[left ? 'rightHand' : 'leftHand']);
      const bottomHand = lookup(this.avatar, BONE_ALIASES[left ? 'leftHand' : 'rightHand']);
      const topTarget = worldTransform(lookup(this.avatar, ['top_grip']));
      const bottomTarget = worldTransform(lookup(this.avatar, ['bottom_grip']));
      if (typeof this.options.solveTwoHandIK !== 'function') {
        return { ok: false, reason: 'Two-hand IK solver not configured; no unsafe bone teleport performed', left, targets: { topTarget, bottomTarget } };
      }
      this.options.solveTwoHandIK({ avatar: this.avatar, topHand, bottomHand, topTarget, bottomTarget, handedness: left ? 'left' : 'right' });
      return { ok: true, left };
    }
    if (actorType === 'bowler') {
      const left = options.bowlerHand === 'LEFT_ARM';
      if (!['LEFT_ARM','RIGHT_ARM',undefined].includes(options.bowlerHand)) throw new Error('Invalid bowler hand');
      // Do not negate spine.rotation.y on each frame: it oscillates and destroys authored motion.
      this.options.setBowlingPose?.({ left, clipName, avatar: this.avatar });
      return { ok: true, left };
    }
    return { ok: false, reason: 'Unknown actor type' };
  }
}
