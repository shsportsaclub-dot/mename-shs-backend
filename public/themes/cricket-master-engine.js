/**
 * SCORING HEROES - COMPLETE CRICKET ANIMATION & EVENT CONTROLLER
 * Version: 5.0 - Master Production-Ready Script
 * Features: 13 Dismissals, Batting Styles, Bowler Hand Variations & Equipment/Facial Sync
 */

export const BATTING_STYLES = {
  ORTHODOX: "ORTHODOX",
  AGGRESSIVE: "AGGRESSIVE",
  UNORTHODOX: "UNORTHODOX"
};

export const BOWLER_HAND_TYPES = {
  RIGHT_ARM: "RIGHT_ARM",
  LEFT_ARM: "LEFT_ARM"
};

export const OUT_TYPES = {
  BOWLED: "OUT-01",
  CAUGHT: "OUT-02",
  CAUGHT_BOWLED: "OUT-03",
  CAUGHT_BEHIND: "OUT-04",
  RUN_OUT: "OUT-05",
  DIRECT_HIT: "OUT-06",
  STUMPED: "OUT-07",
  LBW: "OUT-08",
  HIT_WICKET: "OUT-09",
  RETIRED_OUT: "OUT-10",
  OBSTRUCTING_FIELD: "OUT-11",
  HIT_BALL_TWICE: "OUT-12",
  TIMED_OUT: "OUT-13"
};

const syncStep = (at, target, action, data = {}) => ({
  at,      // Milliseconds timestamp
  target,  // 'avatar', 'ball', 'wicket', 'camera', 'graphics'
  action,  // 'play', 'animate', 'shot', 'show'
  data
});

export const MASTER_SEQUENCES = {
  // OUT-01: BOWLED
  "OUT-01": [
    syncStep(0, "camera", "shot", { name: "bowler_run_up_cam", transition: "cut" }),
    syncStep(0, "avatar", "play", { actor: "bowler", clip: "bowler_run_stride" }),
    syncStep(400, "avatar", "play", { actor: "batter", clip: "batter_stance_settle", expression: "focused" }),
    syncStep(700, "avatar", "play", { actor: "bowler", clip: "bowler_action_delivery_stride" }),
    syncStep(1100, "ball", "animate", { action: "pitch_and_seam_movement", speed: "142kmph" }),
    syncStep(1350, "avatar", "play", { actor: "batter", clip: "batter_defensive_push_late", expression: "tension" }),
    syncStep(1600, "wicket", "animate", { action: "ball_impact_middle_stump", bailsForce: "high" }),
    syncStep(1650, "camera", "shot", { name: "bails_flying_closeup" }),
    syncStep(1900, "avatar", "play", { actor: "bowler", clip: "bowler_aggressive_appeal", expression: "celebration" }),
    syncStep(1900, "avatar", "play", { actor: "batter", clip: "batter_shocked_pose", expression: "disappointment" })
  ],

  // OUT-02: CAUGHT
  "OUT-02": [
    syncStep(0, "avatar", "play", { actor: "bowler", clip: "bowler_delivery_standard" }),
    syncStep(500, "avatar", "play", { actor: "batter", clip: "batter_lofted_drive_shot", expression: "effort" }),
    syncStep(700, "ball", "animate", { action: "aerial_lofted_trajectory" }),
    syncStep(900, "camera", "shot", { name: "ball_tracking_sky" }),
    syncStep(1100, "avatar", "play", { actor: "fielder", clip: "fielder_sprint_track_ball" }),
    syncStep(1700, "avatar", "play", { actor: "fielder", clip: "fielder_diving_catch_secure" }),
    syncStep(1800, "ball", "animate", { action: "snap_to_gloves_secure" }),
    syncStep(2000, "camera", "shot", { name: "fielder_celebration_cam" })
  ],

  // OUT-03: CAUGHT & BOWLED
  "OUT-03": [
    syncStep(0, "avatar", "play", { actor: "bowler", clip: "bowler_delivery_standard" }),
    syncStep(600, "avatar", "play", { actor: "batter", clip: "batter_straight_drive" }),
    syncStep(850, "ball", "animate", { action: "return_straight_to_bowler" }),
    syncStep(1100, "avatar", "play", { actor: "bowler", clip: "bowler_return_catch_secure" }),
    syncStep(1350, "ball", "animate", { action: "attach_to_bowler_hands" })
  ],

  // OUT-04: CAUGHT BEHIND
  "OUT-04": [
    syncStep(0, "avatar", "play", { actor: "bowler", clip: "bowler_delivery_standard" }),
    syncStep(700, "avatar", "play", { actor: "batter", clip: "batter_edge_defend" }),
    syncStep(850, "ball", "animate", { action: "edge_deflection_to_keeper" }),
    syncStep(1000, "camera", "shot", { name: "keeper_closeup" }),
    syncStep(1200, "avatar", "play", { actor: "keeper", clip: "keeper_catch_gloves" }),
    syncStep(1450, "ball", "animate", { action: "attach_to_keeper_gloves" })
  ],

  // OUT-05: RUN OUT
  "OUT-05": [
    syncStep(0, "camera", "shot", { name: "wide_running_action" }),
    syncStep(0, "avatar", "play", { actor: "batter", clip: "batter_sprint_between_wickets" }),
    syncStep(350, "avatar", "play", { actor: "fielder", clip: "fielder_quick_pick_and_throw" }),
    syncStep(700, "ball", "animate", { action: "throw_missile_to_stumps" }),
    syncStep(1100, "avatar", "play", { actor: "batter", clip: "batter_crease_slide_dive" }),
    syncStep(1250, "avatar", "play", { actor: "keeper", clip: "keeper_collect_break_wicket" }),
    syncStep(1350, "wicket", "animate", { action: "keeper_removes_bails" }),
    syncStep(1500, "camera", "shot", { name: "crease_ultra_slo_mo" })
  ],

  // OUT-06: DIRECT HIT RUN OUT
  "OUT-06": [
    syncStep(0, "avatar", "play", { actor: "fielder", clip: "fielder_sprint_ball" }),
    syncStep(450, "avatar", "play", { actor: "fielder", clip: "fielder_direct_hit_throw" }),
    syncStep(650, "ball", "animate", { action: "direct_throw_to_stumps" }),
    syncStep(900, "avatar", "play", { actor: "batter", clip: "batter_crease_slide_dive" }),
    syncStep(1000, "wicket", "animate", { action: "direct_hit_bails_fly" }),
    syncStep(1150, "camera", "shot", { name: "crease_closeup" })
  ],

  // OUT-07: STUMPED
  "OUT-07": [
    syncStep(0, "avatar", "play", { actor: "bowler", clip: "bowler_spin_delivery" }),
    syncStep(500, "avatar", "play", { actor: "batter", clip: "batter_charge_down_track", expression: "aggressive" }),
    syncStep(800, "ball", "animate", { action: "turn_past_batter_edge" }),
    syncStep(950, "avatar", "play", { actor: "keeper", clip: "keeper_swift_collect" }),
    syncStep(1100, "avatar", "play", { actor: "keeper", clip: "keeper_stumping_sweep" }),
    syncStep(1200, "wicket", "animate", { action: "stumps_bails_off" })
  ],

  // OUT-08: LBW
  "OUT-08": [
    syncStep(0, "avatar", "play", { actor: "bowler", clip: "bowler_inswing_delivery" }),
    syncStep(700, "ball", "animate", { action: "trajectory_hit_pad" }),
    syncStep(900, "avatar", "play", { actor: "batter", clip: "batter_pad_impact_reaction" }),
    syncStep(1100, "avatar", "play", { actor: "bowler", clip: "bowler_intense_appeal" }),
    syncStep(1600, "avatar", "play", { actor: "umpire", clip: "umpire_slow_finger_raise" }),
    syncStep(1900, "camera", "shot", { name: "drs_ball_tracking_replay" })
  ],

  // OUT-09: HIT WICKET
  "OUT-09": [
    syncStep(0, "avatar", "play", { actor: "batter", clip: "batter_deep_backfoot_swish", expression: "loss_of_balance" }),
    syncStep(600, "avatar", "play", { actor: "batter", clip: "batter_bat_hits_stumps" }),
    syncStep(750, "wicket", "animate", { action: "bat_knock_stumps_bails_fall" }),
    syncStep(1000, "camera", "shot", { name: "stumps_rear_angle" })
  ],

  // OUT-10: RETIRED OUT
  "OUT-10": [
    syncStep(0, "camera", "shot", { name: "batter_medium" }),
    syncStep(200, "avatar", "play", { actor: "batter", clip: "batter_walk_out_pavilion" }),
    syncStep(1500, "camera", "shot", { name: "pavilion_gate_exit" })
  ],

  // OUT-11: OBSTRUCTING THE FIELD
  "OUT-11": [
    syncStep(0, "camera", "shot", { name: "running_wide" }),
    syncStep(200, "avatar", "play", { actor: "batter", clip: "batter_sprint_between_wickets" }),
    syncStep(550, "ball", "animate", { action: "fielder_throw_toward_stumps" }),
    syncStep(750, "avatar", "play", { actor: "batter", clip: "batter_block_ball_intentionally" }),
    syncStep(1050, "camera", "shot", { name: "obstruction_replay" })
  ],

  // OUT-12: HIT THE BALL TWICE
  "OUT-12": [
    syncStep(0, "avatar", "play", { actor: "batter", clip: "batter_defensive_push" }),
    syncStep(500, "ball", "animate", { action: "ball_rolling_near_crease" }),
    syncStep(750, "avatar", "play", { actor: "batter", clip: "batter_second_hit_sweep" }),
    syncStep(1050, "camera", "shot", { name: "second_contact_replay" })
  ],

  // OUT-13: TIMED OUT
  "OUT-13": [
    syncStep(0, "camera", "shot", { name: "empty_striker_crease_wide" }),
    syncStep(400, "graphics", "show", { title: "TIMED OUT", detail: "Batsman failed to enter within 3 minutes" }),
    syncStep(1100, "camera", "shot", { name: "umpire_consultation" }),
    syncStep(1300, "avatar", "play", { actor: "umpire", clip: "umpire_out_signal_timed" })
  ]
};

export class MasterCricketEngine {
  constructor(adapters) {
    this.adapters = adapters;
    this.timers = [];
  }

  playSequence(outType, options = {}) {
    // Clear old timers
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];

    const sequence = MASTER_SEQUENCES[outType];
    if (!sequence) {
      console.warn("Invalid or unmapped out type:", outType);
      return;
    }

    sequence.forEach(cmd => {
      const timer = setTimeout(() => {
        this.dispatchCommand(cmd, options);
      }, cmd.at);
      this.timers.push(timer);
    });
  }

  dispatchCommand(cmd, options) {
    const adapter = this.adapters[cmd.target];
    if (!adapter) return;

    switch (cmd.action) {
      case "play":
        adapter.play(cmd.data.actor, cmd.data.clip, {
          facialExpression: cmd.data.expression || "neutral",
          handPreference: options.handPreference || "right_hand", // Right or Left Handed support
          bowlerHand: options.bowlerHand || BOWLER_HAND_TYPES.RIGHT_ARM,
          equipmentLock: {
            bat: "sh_english_willow",
            pads: "tournament_batting_pads",
            helmet: "sh_sports_pro_helmet",
            gloves: "pro_batting_gloves"
          },
          ...cmd.data,
          // left-arm bowler: mirror the right-arm-authored clips (added to supplied v5.0)
          ...(cmd.data.actor === "bowler" && (options.bowlerHand === BOWLER_HAND_TYPES.LEFT_ARM) ? { mirror: true } : {})
        });
        break;
      case "shot":
        adapter.shot(cmd.data.name, cmd.data);
        break;
      case "animate":
        adapter.animate(cmd.data.action, cmd.data);
        break;
      case "show":
        adapter.show(cmd.data);
        break;
    }
  }
}