/** Scoring Heroes V5 integration: event scheduler and rig-adapter contract.
 * The clips are logical identifiers, NOT proof that FBX motions exist.
 */
import {OUT_SCENES, OUT_TYPES} from './out-animation-controller.mjs';
export {OUT_TYPES};
export const BATTING_STYLES = Object.freeze({ORTHODOX:'ORTHODOX',AGGRESSIVE:'AGGRESSIVE',UNORTHODOX:'UNORTHODOX'});
export const BOWLER_HAND_TYPES = Object.freeze({RIGHT_ARM:'RIGHT_ARM',LEFT_ARM:'LEFT_ARM'});
export const MASTER_SEQUENCES = Object.freeze(Object.fromEntries(Object.entries(OUT_SCENES).map(([k,v])=>[k,Object.freeze(v.map(c=>Object.freeze({...c,data:Object.freeze({...c.data})})))])));
const validTargets = new Set(['avatar','ball','wicket','camera','graphics']);
const validActions = {avatar:new Set(['play']),ball:new Set(['animate']),wicket:new Set(['animate']),camera:new Set(['shot']),graphics:new Set(['show'])};
export function validateSequences(sequences=MASTER_SEQUENCES){
  const errors=[];
  for(const [type,commands] of Object.entries(sequences)){
    if(!/^OUT-\d\d$/.test(type)||!Array.isArray(commands)||!commands.length) errors.push(`${type}: invalid scene`);
    let previous=-1;
    for(const [i,c] of (commands||[]).entries()){
      if(!Number.isFinite(c.at)||c.at<0||c.at<previous) errors.push(`${type}[${i}]: non-monotonic timestamp`);
      if(!validTargets.has(c.target)||!validActions[c.target]?.has(c.action)) errors.push(`${type}[${i}]: invalid adapter action`);
      if(c.target==='avatar'&&(!c.data?.actor||!c.data?.clip)) errors.push(`${type}[${i}]: missing actor/clip`);
      previous=c.at;
    }
  }
  for(const type of Object.values(OUT_TYPES)) if(!sequences[type]) errors.push(`${type}: missing scene`);
  return errors;
}
export class MasterCricketEngine {
  constructor(adapters={}, {clock={setTimeout:(fn,ms)=>setTimeout(fn,ms),clearTimeout:id=>clearTimeout(id)}, strict=false}={}){
    this.adapters=adapters; this.clock=clock; this.strict=strict; this.timers=[];this.generation=0;
  }
  stop(){this.generation++;for(const id of this.timers)this.clock.clearTimeout(id);this.timers=[];}
  dispatchCommand(cmd, options={}){
    const adapter=this.adapters[cmd.target];
    const method=cmd.action;
    if(typeof adapter?.[method]!=='function'){
      if(this.strict) throw new Error(`Missing ${cmd.target}.${method} adapter`);
      return false;
    }
    const context={...cmd.data,handPreference:options.handPreference??'right_hand',bowlerHand:options.bowlerHand??BOWLER_HAND_TYPES.RIGHT_ARM,battingStyle:options.battingStyle??BATTING_STYLES.ORTHODOX,facialExpression:cmd.data.expression??'neutral',equipmentLock:options.equipmentLock??{bat:'sh_english_willow',pads:'tournament_batting_pads',helmet:'sh_sports_pro_helmet',gloves:'pro_batting_gloves'}};
    if(method==='play') {
      // Apply pre-play pose/socket setup when a rig binder is exposed by the avatar adapter.
      // NOTE: the actual IK constraint must ALSO run each frame after AnimationMixer.update.
      const binder = typeof adapter.getRigBinder === 'function'
        ? adapter.getRigBinder(cmd.data.actor) : null;
      if (binder != null) {
        if (typeof binder.applyRigConstraints !== 'function') {
          if (this.strict) throw new TypeError('Rig binder has no applyRigConstraints method');
        } else {
          const result = binder.applyRigConstraints(cmd.data.actor, cmd.data.clip, context);
          if (result?.ok === false && this.strict) {
            throw new Error('Rig constraints unavailable: ' + (result.reason || 'unknown reason'));
          }
        }
      }
      adapter.play(cmd.data.actor,cmd.data.clip,context);
    }
    else if(method==='shot') adapter.shot(cmd.data.name,context);
    else if(method==='show') adapter.show(context);
    else adapter.animate(cmd.data.action,context);
    return true;
  }
  playSequence(type,options={}){
    const commands=MASTER_SEQUENCES[type];if(!commands)throw new Error(`Unknown scene ${type}`);
    if(!['right_hand','left_hand'].includes(options.handPreference??'right_hand'))throw new Error('Invalid batter hand');
    if(!Object.values(BOWLER_HAND_TYPES).includes(options.bowlerHand??BOWLER_HAND_TYPES.RIGHT_ARM))throw new Error('Invalid bowler hand');
    this.stop();const generation=this.generation;
    for(const cmd of commands){const id=this.clock.setTimeout(()=>{if(generation===this.generation)this.dispatchCommand(cmd,options);},cmd.at);this.timers.push(id);}
    return {type,commands:commands.length,durationMs:Math.max(...commands.map(c=>c.at)),visualPlaybackVerified:false};
  }
}
