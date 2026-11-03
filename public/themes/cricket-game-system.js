/**
 * SCORING HEROES - ULTIMATE CRICKET GAME & LIVE STREAM SYSTEM
 * Architecture: Match State Manager, Animation Sequencer, EA-Style Commentary & Audio FX
 * Based on the supplied script. Changes: "duck" only when the batter really scored 0, safe data defaults,
 * dismissal-aware wicket handling (not only BOWLED), the unused CELEBRATION stage now used (endCelebration()
 * returns to IN_PLAY), a default branch that does something, and commentary lines per language (en / te).
 */

export const MATCH_STAGES = {
  PRACTICE: "PRACTICE_NETS",
  TOSS: "TOSS_TIME",
  WALKOUT: "PLAYERS_WALKOUT",
  IN_PLAY: "BALL_IN_PLAY",
  CELEBRATION: "MOMENT_CELEBRATION"
};

const T = {
  en: {
    toss: (w, c) => `The coin is up! ${w} win the toss and choose to ${c}!`,
    walkout: "The stadium is buzzing! The players make a grand entry, we are nearly ready for the first ball!",
    six: b => `BOOM! THAT IS MASSIVE! ${b} sends it out of the stadium!`,
    wicket: { BOWLED: "GOT HIM! Bowled! The stumps are flying, look at that celebration!",
              CAUGHT: "Taken! The catch is held and the batter has to walk!",
              LBW: "Plumb in front! The finger goes up, that is LBW!",
              RUN_OUT: "Direct hit! He is short of the crease, run out!",
              STUMPED: "Lightning hands from the keeper! Stumped!",
              DEFAULT: "WICKET! A huge moment in this match!" }
  },
  te: {
    toss: (w, c) => `Toss padipotundi! ${w} gelichi ${c} choose chesukunaru!`,
    walkout: "Stadium mottam hoorethipotundi! Players grand entry istunnaru, match start avvadaniki antha sitham!",
    six: b => `BOOM! THAT IS MASSIVE! ${b} daatesadu, stadium parking loki poyindi ball! Keka shot!`,
    wicket: { BOWLED: "GOT HIM! Bowled em! Stumps egiripoyayi, bowler celebration chudandi - pure passion!",
              CAUGHT: "Catch pattesaru! Batter pavilion ki vellalsinde!",
              LBW: "Pad meeda direct ga! Umpire vrelu paiki, LBW!",
              RUN_OUT: "Direct hit! Crease ki dooram, run out!",
              STUMPED: "Keeper minnu laga stumping chesadu!",
              DEFAULT: "WICKET! Match lo pedda moment!" }
  }
};

export class CricketGameSystem {
  constructor(rendererAdapter, soundAdapter, streamAdapter, { language = "en" } = {}) {
    this.renderer = rendererAdapter;   // Handles 3D Avatars, Batting, Bowling & Stadium
    this.sound = soundAdapter;         // Handles Crowd Roars, Bat Cracks & Commentary
    this.stream = streamAdapter;       // Handles Tickers, Banners & Live Stream Overlay
    this.lang = T[language] ? language : "en";
    this.currentStage = MATCH_STAGES.PRACTICE;
  }

  // 1. PRACTICE & PRE-MATCH BUILDUP
  startPracticeSession() {
    this.currentStage = MATCH_STAGES.PRACTICE;
    this.sound.playAmbientCrowd("net_practice_murmur");
    this.renderer.playAnimation("batter", "net_practice_strokes");
    this.stream.showTicker({ title: "PRACTICE SESSION", subtitle: "Batsmen hitting the ball fluently in the nets!" });
  }

  // 2. TOSS & CAPTAINS WALK
  executeToss(winnerTeam, choice) {
    this.currentStage = MATCH_STAGES.TOSS;
    this.renderer.setCameraShot("pitch_center_toss");
    this.renderer.playAnimation("captains", "toss_handshake");
    this.sound.playSFX("coin_flip_sound");
    this.sound.speakCommentary(T[this.lang].toss(winnerTeam, choice));
    this.stream.showBanner({ title: "TOSS RESULT", detail: `${winnerTeam} won the toss and elected to ${choice}.` });
  }

  // 3. PLAYERS ENTRY & INTRO
  playPlayersWalkout() {
    this.currentStage = MATCH_STAGES.WALKOUT;
    this.renderer.setCameraShot("tunnel_exit");
    this.renderer.playAnimation("team", "stadium_entry_pyro");
    this.sound.playBGM("stadium_rock_anthem");
    this.sound.playCrowdRoar("deafening_stadium_roar");
    this.sound.speakCommentary(T[this.lang].walkout);
  }

  // 4. LIVE MATCH ACTION (SHOTS, SIXES, WICKETS)
  triggerGameAction(actionType, data = {}) {
    const d = { batsman: "The batter", runs: null, dismissal: "BOWLED", ...data };
    switch (actionType) {
      case "MASSIVE_SIX":
        this.currentStage = MATCH_STAGES.CELEBRATION;
        this.renderer.playAnimation("batter", "loft_shot_helicopter", { expression: "effort" });
        this.renderer.animateBall("aerial_trajectory_six");
        this.renderer.setCameraShot("tracking_roof_hit");
        this.sound.playSFX("heavy_bat_crack");
        this.sound.playCrowdRoar("stadium_shake_roar");
        this.sound.speakCommentary(T[this.lang].six(d.batsman));
        this.stream.showBigBanner({ title: "MAMMOTH SIX!", detail: "Crowd is going absolutely wild in the stands!", color: "#ffeb3b" });
        break;

      case "WICKET_BOWLED":
      case "WICKET_FALL": {
        const kind = actionType === "WICKET_BOWLED" ? "BOWLED" : (T[this.lang].wicket[d.dismissal] ? d.dismissal : "DEFAULT");
        this.currentStage = MATCH_STAGES.CELEBRATION;
        this.renderer.playAnimation("bowler", "aggressive_celebration", { expression: "celebration" });
        if (kind === "BOWLED") this.renderer.animateWicket("middle_stump_shattered_bails_fly");
        this.renderer.playAnimation("batter", "shocked_disappointment", { expression: "disappointment" });
        this.renderer.setCameraShot(kind === "BOWLED" ? "stumps_closeup_slowmo" : "wicket_replay");
        this.sound.playSFX(kind === "BOWLED" ? "stumps_flying_clatt" : "wicket_appeal_hit");
        this.sound.playCrowdRoar("gasp_then_deafening_roar");
        this.sound.speakCommentary(T[this.lang].wicket[kind]);
        // "duck" only when the batter really scored nothing
        const detail = d.runs === 0 ? `${d.batsman} departs for a duck.` : d.runs > 0 ? `${d.batsman} departs for ${d.runs}.` : `${d.batsman} departs.`;
        this.stream.showBigBanner({ title: "WICKET DOWN!", detail, color: "#f44336" });
        break;
      }

      default:
        this.currentStage = MATCH_STAGES.IN_PLAY;
        this.sound.playAmbientCrowd("normal_play_murmur");
    }
  }

  /** Call when the celebration/replay is over: back to live play. */
  endCelebration() {
    if (this.currentStage === MATCH_STAGES.CELEBRATION) this.currentStage = MATCH_STAGES.IN_PLAY;
    return this.currentStage;
  }
}
