/**
 * SCORING HEROES - BOWLER STYLES & ACTIONS CONTROLLER
 * Supports Right-arm and Left-arm bowling variations with precise mechanics.
 * Supplied reference had FAST + one spin style per arm; the table below is completed
 * to all 4 styles x 2 arms (clip names follow the same naming pattern).
 */

export const BOWLER_HAND_TYPES = {
  RIGHT_ARM: "RIGHT_ARM",
  LEFT_ARM: "LEFT_ARM"
};

export const BOWLER_SKILL_STYLES = {
  FAST: "FAST",               // Fast / Pace bowling
  MEDIUM: "MEDIUM",           // Medium pace
  OFF_SPIN: "OFF_SPIN",       // Right-arm off break / Left-arm orthodox
  LEG_SPIN: "LEG_SPIN"        // Leg break / Chinaman
};

const ARM_PREFIX = { RIGHT_ARM: "right_arm", LEFT_ARM: "left_arm" };
// delivery clip names per arm: the supplied names are kept (offspin right, chinaman left)
const DELIVERY = {
  RIGHT_ARM: { FAST: "fast_delivery", MEDIUM: "medium_delivery", OFF_SPIN: "offspin_delivery", LEG_SPIN: "legspin_delivery" },
  LEFT_ARM: { FAST: "fast_delivery", MEDIUM: "medium_delivery", OFF_SPIN: "orthodox_delivery", LEG_SPIN: "chinaman_delivery" }
};
const FAMILY = { FAST: "fast", MEDIUM: "medium", OFF_SPIN: "spin", LEG_SPIN: "spin" };
const APPEAL = { fast: "aggressive_appeal", medium: "aggressive_appeal", spin: "spin_appeal" };

function buildDB() {
  const db = {};
  for (const hand of Object.keys(ARM_PREFIX)) {
    db[hand] = {};
    for (const style of Object.keys(DELIVERY[hand])) {
      const p = ARM_PREFIX[hand], f = FAMILY[style];
      db[hand][style] = {
        runUp: `${p}_${f}_runup`,
        delivery: `${p}_${DELIVERY[hand][style]}`,
        followThrough: `${p}_${f}_follow_through`,
        appeal: `${p}_${APPEAL[f]}`
      };
    }
  }
  return db;
}

export class BowlerStyleManager {
  constructor() {
    this.animationsDB = buildDB();
  }

  /** Get the correct animation clip name based on bowler hand and skill type */
  getBowlerClip(handType, skillStyle, phase) {
    const handGroup = this.animationsDB[handType];
    if (!handGroup) {
      console.warn(`Unknown hand type: ${handType}, defaulting to RIGHT_ARM`);
      return this.animationsDB[BOWLER_HAND_TYPES.RIGHT_ARM][BOWLER_SKILL_STYLES.FAST][phase];
    }
    const styleGroup = handGroup[skillStyle] || handGroup[BOWLER_SKILL_STYLES.FAST];
    return styleGroup[phase] || "default_bowler_action";
  }

  /** Generates execution commands for the rendering engine adapter */
  setupBowlerAction(atTime, handType, skillStyle) {
    return [
      {
        at: atTime,
        target: "avatar",
        action: "play",
        data: {
          actor: "bowler",
          clip: this.getBowlerClip(handType, skillStyle, "runUp"),
          mirror: handType === BOWLER_HAND_TYPES.LEFT_ARM // Mirror rigging if assets are optimized for right-hand only
        }
      },
      {
        at: atTime + 600,
        target: "avatar",
        action: "play",
        data: {
          actor: "bowler",
          clip: this.getBowlerClip(handType, skillStyle, "delivery"),
          mirror: handType === BOWLER_HAND_TYPES.LEFT_ARM
        }
      }
    ];
  }
}
