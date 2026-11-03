import {CricketIKSolver} from './cricket-ik-solver.mjs';
/** Construct once when a bat and rig are loaded. Use update() AFTER mixer.update(dt). */
export function createBatGripFrameBridge({skeleton, batMesh, getHandPreference=()=> 'right_hand'}) {
  const solver = new CricketIKSolver(skeleton,batMesh);
  return {
    solver,
    update() { return solver.solveTwoHandGrip({handPreference:getHandPreference()}); }
  };
}
