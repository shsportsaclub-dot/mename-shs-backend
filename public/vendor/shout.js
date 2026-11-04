/**
 * SCORING HEROES - ADVANCED CRICKET ANIMATION ENGINE
 * Version: 3.0 (Fixed Timing, Equipment Grip & Facial Expressions)
 * Scenes OUT-01 and OUT-02 are the supplied reference; OUT-03..OUT-13 follow the same step format.
 */

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

const detailedStep = (at, target, action, data = {}) => ({ at, target, action, data });
const S = detailedStep;

export const DETAILED_OUT_SCENES = {
  // OUT-01: Bowled (Strict Bat-Pad gap tracking & Bails physics)
  "OUT-01": [
    S(0, "camera", "shot", { name: "bowler_run_up", transition: "cut" }),
    S(0, "avatar", "play", { actor: "bowler", clip: "bowler_delivery_stride" }),
    S(400, "avatar", "play", { actor: "batter", clip: "batter_stance_settle", facial: "focused" }),
    S(750, "ball", "animate", { action: "pitch_and_seam_deviation", speed: "145kmph" }),
    S(1050, "avatar", "play", { actor: "batter", clip: "batter_defend_miss_gap", facial: "tension" }),
    S(1300, "wicket", "animate", { action: "ball_impact_middle_stump", bailsForce: "high" }),
    S(1350, "camera", "shot", { name: "stumps_bails_fly_closeup" }),
    S(1600, "avatar", "play", { actor: "bowler", clip: "bowler_aggressive_appeal", facial: "celebration" }),
    S(1600, "avatar", "play", { actor: "batter", clip: "batter_shocked_stare", facial: "disappointment" })
  ],

  // OUT-02: Caught (Fielder sliding/diving with proper hand-ball alignment)
  "OUT-02": [
    S(0, "avatar", "play", { actor: "batter", clip: "batter_loft_shot_aggressive", facial: "effort" }),
    S(300, "ball", "animate", { action: "high_trajectory_lofted", hangTimeMs: 1200 }),
    S(500, "avatar", "play", { actor: "fielder", clip: "fielder_sprint_boundary" }),
    S(1200, "camera", "shot", { name: "fielder_tracking_ball" }),
    S(1450, "avatar", "play", { actor: "fielder", clip: "fielder_diving_catch_secure", facial: "extreme_focus" }),
    S(1550, "ball", "animate", { action: "snap_to_gloves_contact" })
  ],

  // OUT-03: Caught & Bowled
  "OUT-03": [
    S(0, "avatar", "play", { actor: "bowler", clip: "bowler_delivery_stride" }),
    S(700, "avatar", "play", { actor: "batter", clip: "batter_drive_mistimed", facial: "effort" }),
    S(850, "ball", "animate", { action: "return_catch_arc", hangTimeMs: 450 }),
    S(900, "avatar", "play", { actor: "bowler", clip: "bowler_return_catch_dive", facial: "extreme_focus" }),
    S(1250, "ball", "animate", { action: "snap_to_gloves_contact" }),
    S(1400, "avatar", "play", { actor: "bowler", clip: "bowler_aggressive_appeal", facial: "celebration" }),
    S(1400, "avatar", "play", { actor: "batter", clip: "batter_shocked_stare", facial: "disappointment" })
  ],

  // OUT-04: Caught Behind
  "OUT-04": [
    S(0, "camera", "shot", { name: "keeper_behind_stumps", transition: "cut" }),
    S(300, "ball", "animate", { action: "outside_edge_deflection" }),
    S(450, "avatar", "play", { actor: "batter", clip: "batter_defend_edge", facial: "tension" }),
    S(600, "avatar", "play", { actor: "keeper", clip: "keeper_take_edge_catch", facial: "extreme_focus" }),
    S(800, "avatar", "play", { actor: "keeper", clip: "keeper_appeal_raised_glove", facial: "celebration" }),
    S(1000, "avatar", "play", { actor: "batter", clip: "batter_shocked_stare", facial: "disappointment" })
  ],

  // OUT-05: Run Out
  "OUT-05": [
    S(0, "avatar", "play", { actor: "batter", clip: "batter_sprint_run", facial: "effort" }),
    S(300, "avatar", "play", { actor: "fielder", clip: "fielder_pickup_and_throw" }),
    S(700, "ball", "animate", { action: "flat_throw_to_stumps" }),
    S(900, "avatar", "play", { actor: "batter", clip: "batter_dive_for_crease", facial: "tension" }),
    S(1050, "wicket", "animate", { action: "bails_off_before_bat_grounded", bailsForce: "medium" }),
    S(1150, "camera", "shot", { name: "stumps_bails_fly_closeup" }),
    S(1500, "avatar", "play", { actor: "batter", clip: "batter_shocked_stare", facial: "disappointment" })
  ],

  // OUT-06: Direct Hit
  "OUT-06": [
    S(0, "avatar", "play", { actor: "batter", clip: "batter_sprint_run", facial: "effort" }),
    S(200, "avatar", "play", { actor: "fielder", clip: "fielder_run_in_direct_hit" }),
    S(600, "ball", "animate", { action: "direct_hit_flat_throw", speed: "120kmph" }),
    S(800, "wicket", "animate", { action: "ball_impact_middle_stump", bailsForce: "high" }),
    S(850, "camera", "shot", { name: "stumps_bails_fly_closeup" }),
    S(1300, "avatar", "play", { actor: "fielder", clip: "fielder_celebration_point", facial: "celebration" }),
    S(1300, "avatar", "play", { actor: "batter", clip: "batter_shocked_stare", facial: "disappointment" })
  ],

  // OUT-07: Stumped
  "OUT-07": [
    S(0, "avatar", "play", { actor: "batter", clip: "batter_step_out_drive_miss", facial: "effort" }),
    S(250, "ball", "animate", { action: "ball_passes_bat_to_keeper" }),
    S(400, "avatar", "play", { actor: "keeper", clip: "keeper_gather_and_stump", facial: "extreme_focus" }),
    S(550, "wicket", "animate", { action: "bails_off_keeper_hand", bailsForce: "low" }),
    S(600, "camera", "shot", { name: "crease_line_closeup" }),
    S(1000, "avatar", "play", { actor: "keeper", clip: "keeper_appeal_raised_glove", facial: "celebration" }),
    S(1000, "avatar", "play", { actor: "batter", clip: "batter_shocked_stare", facial: "disappointment" })
  ],

  // OUT-08: LBW
  "OUT-08": [
    S(0, "avatar", "play", { actor: "bowler", clip: "bowler_delivery_stride" }),
    S(750, "ball", "animate", { action: "pitch_and_seam_deviation", speed: "140kmph" }),
    S(1000, "avatar", "play", { actor: "batter", clip: "batter_front_foot_pad_defence", facial: "tension" }),
    S(1100, "ball", "animate", { action: "pad_impact_in_line" }),
    S(1200, "avatar", "play", { actor: "bowler", clip: "bowler_aggressive_appeal", facial: "celebration" }),
    S(1500, "camera", "shot", { name: "ball_tracking_to_stumps" }),
    S(2200, "avatar", "play", { actor: "batter", clip: "batter_shocked_stare", facial: "disappointment" })
  ],

  // OUT-09: Hit Wicket
  "OUT-09": [
    S(0, "avatar", "play", { actor: "batter", clip: "batter_back_foot_cut", facial: "effort" }),
    S(250, "avatar", "play", { actor: "batter", clip: "batter_bat_or_foot_clips_stumps", facial: "tension" }),
    S(300, "wicket", "animate", { action: "bails_dislodged_by_batter", bailsForce: "low" }),
    S(350, "camera", "shot", { name: "stumps_bails_fly_closeup" }),
    S(900, "avatar", "play", { actor: "batter", clip: "batter_shocked_stare", facial: "disappointment" })
  ],

  // OUT-10: Retired Out
  "OUT-10": [
    S(0, "avatar", "play", { actor: "batter", clip: "batter_walk_off_slow", facial: "neutral" }),
    S(600, "camera", "shot", { name: "pavilion_walk_wide" }),
    S(1500, "avatar", "play", { actor: "batter", clip: "batter_raise_bat_to_crowd", facial: "neutral" })
  ],

  // OUT-11: Obstructing the Field
  "OUT-11": [
    S(0, "avatar", "play", { actor: "batter", clip: "batter_run_blocks_fielder", facial: "tension" }),
    S(300, "avatar", "play", { actor: "fielder", clip: "fielder_blocked_stumble" }),
    S(600, "avatar", "play", { actor: "fielder", clip: "fielder_appeal_raised_arm", facial: "celebration" }),
    S(1200, "avatar", "play", { actor: "batter", clip: "batter_shocked_stare", facial: "disappointment" })
  ],

  // OUT-12: Hit the Ball Twice
  "OUT-12": [
    S(0, "avatar", "play", { actor: "batter", clip: "batter_defend_forward", facial: "focused" }),
    S(200, "ball", "animate", { action: "ball_rolls_toward_stumps_slow" }),
    S(450, "avatar", "play", { actor: "batter", clip: "batter_second_hit_defend", facial: "tension" }),
    S(700, "avatar", "play", { actor: "bowler", clip: "bowler_aggressive_appeal", facial: "celebration" }),
    S(1200, "avatar", "play", { actor: "batter", clip: "batter_shocked_stare", facial: "disappointment" })
  ],

  // OUT-13: Timed Out
  "OUT-13": [
    S(0, "camera", "shot", { name: "pavilion_steps_wide", transition: "cut" }),
    S(300, "avatar", "play", { actor: "batter", clip: "batter_late_walk_in", facial: "tension" }),
    S(1000, "avatar", "play", { actor: "bowler", clip: "bowler_appeal_timeout", facial: "celebration" }),
    S(1500, "avatar", "play", { actor: "batter", clip: "batter_shocked_stare", facial: "disappointment" })
  ]
};

export class AdvancedCricketEngine {
  constructor(adapters) {
    this.adapters = adapters;
    this.activeTimers = [];
  }

  playEvent(eventData) {
    // Clear previous scheduled ticks
    this.activeTimers.forEach(t => clearTimeout(t));
    this.activeTimers = [];

    const sequence = DETAILED_OUT_SCENES[eventData.type];
    if (!sequence) {
      console.warn("Animation sequence not mapped for:", eventData.type);
      return;
    }

    sequence.forEach(cmd => {
      const timer = setTimeout(() => {
        this.executeCommand(cmd, eventData);
      }, cmd.at);
      this.activeTimers.push(timer);
    });
  }

  executeCommand(cmd, context) {
    const adapter = this.adapters[cmd.target];
    if (!adapter) return;

    if (cmd.action === "play") {
      adapter.play(cmd.data.actor, cmd.data.clip, {
        facialExpression: cmd.data.facial || "neutral",
        equipmentLock: {
          bat: "SH_Sports_English_Willow",
          pads: "tournament_batting_pads",
          helmet: "sh_sports_pro_helmet",
          gloves: "wicket_keeping_or_batting_gloves"
        },
        context
      });
    } else if (cmd.action === "shot") {
      adapter.shot(cmd.data.name, cmd.data);
    } else if (cmd.action === "animate") {
      adapter.animate(cmd.data.action, cmd.data);
    }
  }
}
