/**
 * SCORING HEROES
 * CRICKET 13 OUT ANIMATIONS CONTROLLER SCRIPT
 * Version: 2.0 - Complete implementation for all 13 Dismissals
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

const step = (at, target, action, data = {}) => ({
  at,
  target,
  action,
  data
});

export const OUT_SCENES = {
  // OUT-01: Bowled - Ball Stumpsni kotti Bails Egaradam
  "OUT-01": [
    step(0, "camera", "shot", { name: "bowler_front" }),
    step(0, "avatar", "play", { actor: "bowler", clip: "bowler_delivery" }),
    step(700, "ball", "animate", { action: "delivery_to_stumps" }),
    step(1100, "avatar", "play", { actor: "batter", clip: "batter_defend" }),
    step(1400, "wicket", "animate", { action: "ball_hits_stumps" }), // Bails fly off
    step(1500, "camera", "shot", { name: "stumps_closeup" }),
    step(1800, "avatar", "play", { actor: "bowler", clip: "bowler_appeal" })
  ],

  // OUT-02: Caught - Fielder Catch Pattadam
  "OUT-02": [
    step(0, "avatar", "play", { actor: "batter", clip: "batter_attack" }),
    step(400, "ball", "animate", { action: "lofted_shot" }),
    step(600, "camera", "shot", { name: "follow_ball" }),
    step(700, "avatar", "play", { actor: "fielder", clip: "fielder_run" }),
    step(1500, "avatar", "play", { actor: "fielder", clip: "fielder_standing_catch" }),
    step(1800, "ball", "animate", { action: "attach_to_fielder_hands" })
  ],

  // OUT-03: Caught & Bowled - Bowler Follow-throughlo Catch
  "OUT-03": [
    step(0, "avatar", "play", { actor: "bowler", clip: "bowler_delivery" }),
    step(600, "avatar", "play", { actor: "batter", clip: "batter_drive" }),
    step(850, "ball", "animate", { action: "return_to_bowler" }),
    step(1100, "avatar", "play", { actor: "bowler", clip: "bowler_return_catch" }),
    step(1350, "ball", "animate", { action: "attach_to_bowler_hands" })
  ],

  // OUT-04: Caught Behind - Bat Edge -> Wicketkeeper Catch
  "OUT-04": [
    step(0, "avatar", "play", { actor: "bowler", clip: "bowler_delivery" }),
    step(700, "avatar", "play", { actor: "batter", clip: "batter_edge" }),
    step(850, "ball", "animate", { action: "edge_to_keeper" }),
    step(1000, "camera", "shot", { name: "keeper_closeup" }),
    step(1200, "avatar", "play", { actor: "keeper", clip: "keeper_catch" }),
    step(1450, "ball", "animate", { action: "attach_to_keeper_gloves" })
  ],

  // OUT-05: Run Out - Runner Dive -> Throw -> Wicket Broken
  "OUT-05": [
    step(0, "camera", "shot", { name: "wide_running" }),
    step(0, "avatar", "play", { actor: "batter", clip: "batter_run" }),
    step(300, "avatar", "play", { actor: "fielder", clip: "fielder_throw" }),
    step(650, "ball", "animate", { action: "throw_to_keeper" }),
    step(900, "avatar", "play", { actor: "batter", clip: "batter_crease_dive" }),
    step(1000, "avatar", "play", { actor: "keeper", clip: "keeper_break_wicket" }),
    step(1100, "wicket", "animate", { action: "keeper_removes_bails" }),
    step(1250, "camera", "shot", { name: "crease_replay" })
  ],

  // OUT-06: Direct Hit Run Out - Fielder Direct Throw -> Stumps
  "OUT-06": [
    step(0, "avatar", "play", { actor: "fielder", clip: "fielder_run" }),
    step(450, "avatar", "play", { actor: "fielder", clip: "fielder_direct_hit" }),
    step(650, "ball", "animate", { action: "direct_throw_to_stumps" }),
    step(900, "avatar", "play", { actor: "batter", clip: "batter_crease_dive" }),
    step(1000, "wicket", "animate", { action: "direct_hit_bails" }),
    step(1150, "camera", "shot", { name: "crease_closeup" })
  ],

  // OUT-07: Stumped - Batter Crease Bayata -> Keeper Bails Tholaginchadam
  "OUT-07": [
    step(0, "avatar", "play", { actor: "bowler", clip: "bowler_delivery" }),
    step(500, "avatar", "play", { actor: "batter", clip: "batter_step_out" }),
    step(750, "ball", "animate", { action: "pass_batter_to_keeper" }),
    step(900, "avatar", "play", { actor: "keeper", clip: "keeper_collect" }),
    step(1050, "avatar", "play", { actor: "keeper", clip: "keeper_stumping" }),
    step(1150, "wicket", "animate", { action: "keeper_removes_bails" })
  ],

  // OUT-08: LBW - Ball -> Pad Impact -> Umpire/DRS
  "OUT-08": [
    step(0, "avatar", "play", { actor: "bowler", clip: "bowler_delivery" }),
    step(650, "ball", "animate", { action: "delivery_to_pad" }),
    step(850, "avatar", "play", { actor: "batter", clip: "batter_pad_impact" }),
    step(1000, "avatar", "play", { actor: "bowler", clip: "bowler_appeal" }),
    step(1450, "avatar", "play", { actor: "umpire", clip: "umpire_out_signal" }),
    step(1750, "camera", "shot", { name: "ball_tracking_replay" })
  ],

  // OUT-09: Hit Wicket - Batter Bat/Body Valla Wicket Broken
  "OUT-09": [
    step(0, "avatar", "play", { actor: "batter", clip: "batter_hit_wicket" }),
    step(700, "wicket", "animate", { action: "batter_breaks_wicket" }),
    step(950, "camera", "shot", { name: "rear_stumps_closeup" })
  ],

  // OUT-10: Retired Out - Batter Field Nunchi Bayataku Velladam
  "OUT-10": [
    step(0, "camera", "shot", { name: "batter_medium" }),
    step(200, "avatar", "play", { actor: "batter", clip: "batter_walk_out" }),
    step(1500, "camera", "shot", { name: "pavilion_exit" })
  ],

  // OUT-11: Obstructing the Field - Batter Fieldingni Addukovadam
  "OUT-11": [
    step(0, "camera", "shot", { name: "running_wide" }),
    step(200, "avatar", "play", { actor: "batter", clip: "batter_run" }),
    step(550, "ball", "animate", { action: "fielder_throw" }),
    step(750, "avatar", "play", { actor: "batter", clip: "batter_obstruct" }),
    step(1050, "camera", "shot", { name: "obstruction_replay" })
  ],

  // OUT-12: Hit the Ball Twice - Batter Rendosari Ballni Kottadam
  "OUT-12": [
    step(0, "avatar", "play", { actor: "batter", clip: "batter_defend" }),
    step(500, "ball", "animate", { action: "ball_near_batter" }),
    step(750, "avatar", "play", { actor: "batter", clip: "batter_second_hit" }),
    step(1050, "camera", "shot", { name: "second_contact_replay" })
  ],

  // OUT-13: Timed Out - New Batter Nirdheesta Samayamlo Ready Kakapovadam
  "OUT-13": [
    step(0, "camera", "shot", { name: "empty_striker_crease" }),
    step(400, "graphics", "show", { title: "TIMED OUT", detail: "Incoming batter not ready" }),
    step(1100, "camera", "shot", { name: "umpire_medium" }),
    step(1300, "avatar", "play", { actor: "umpire", clip: "umpire_out_signal" })
  ]
};

export const OUT_VARIANTS = {
  "OUT-02": {
    standing: "fielder_standing_catch",
    running: "fielder_running_catch",
    diving: "fielder_dive_catch",
    sliding: "fielder_slide_catch",
    jumping: "fielder_jump_catch",
    boundary: "fielder_boundary_catch"
  },
  "OUT-05": {
    normal: "keeper_break_wicket",
    direct_hit: "fielder_direct_hit",
    batter_dive: "batter_crease_dive",
    relay: "fielder_relay_throw"
  },
  "OUT-07": {
    normal: "keeper_stumping",
    leg_side: "keeper_leg_side_stumping",
    standing_up: "keeper_standing_up_stumping"
  }
};

export class ScoringHeroesOutEngine {
  constructor(adapters) {
    this.adapters = adapters;
    this.activeTimers = [];
    this.currentEvent = null;
  }

  clear() {
    for (const timer of this.activeTimers) {
      clearTimeout(timer);
    }
    this.activeTimers = [];
  }

  dispatch(command, event) {
    const adapter = this.adapters[command.target];
    if (!adapter) {
      console.warn("Missing adapter:", command.target);
      return;
    }

    if (command.action === "play") {
      adapter.play?.(command.data.actor, command.data.clip, { ...command.data, event });
    } else if (command.action === "shot") {
      adapter.shot?.(command.data.name, { ...command.data, event });
    } else if (command.action === "animate") {
      adapter.animate?.(command.data.action, { ...command.data, event });
    } else if (command.action === "show") {
      adapter.show?.({ ...command.data, event });
    }
  }

  play(event) {
    this.clear();
    this.currentEvent = event;

    const scene = OUT_SCENES[event.type];
    if (!scene) {
      throw new Error("Unknown OUT type: " + event.type);
    }

    const commands = scene.map(command => ({
      ...command,
      data: { ...command.data }
    }));

    // Variant handling
    const variants = OUT_VARIANTS[event.type];
    if (variants && event.variant) {
      const clip = variants[event.variant];
      if (clip) {
        const target = event.type === "OUT-02" ? "fielder" : event.type === "OUT-07" ? "keeper" : "fielder";
        const motion = commands.find(c =>
          c.target === "avatar" &&
          c.data.actor === target &&
          (c.data.clip.includes("catch") || c.data.clip.includes("stump") || c.data.clip.includes("hit"))
        );
        if (motion) {
          motion.data.clip = clip;
        }
      }
    }

    for (const command of commands) {
      const timer = setTimeout(() => {
        this.dispatch(command, event);
      }, command.at);
      this.activeTimers.push(timer);
    }

    const finalTime = Math.max(...commands.map(c => c.at));
    const tickerTimer = setTimeout(() => {
      this.adapters.graphics?.show?.({
        title: event.type + " EVENT",
        player: event.player?.name || "",
        team: event.fieldingTeam?.name || "",
        teamLogo: event.fieldingTeam?.logoUrl || "",
        primaryColor: event.fieldingTeam?.primary || "#1455aa",
        tournament: event.tournament?.name || "SCORING HEROES",
        event
      });
    }, finalTime + 350);

    this.activeTimers.push(tickerTimer);

    return {
      type: event.type,
      variant: event.variant || "default",
      durationMs: finalTime + 350
    };
  }
}

export function createOutEngine(adapters) {
  return new ScoringHeroesOutEngine(adapters);
}