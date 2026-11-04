/**
 * SCORING HEROES - EA SPORTS STYLE COMMENTARY & AUDIO VISUAL ENGINE
 * Features: High-Energy Commentary, Dynamic Crowd Roars, 6s/4s Excitement & Wicket Celebrations.
 * Based on the supplied script. Changes: playNormalPlay added (the default case called a method that did not exist),
 * wicket lines follow the dismissal type (the original said "Bowled" for every wicket), safe data defaults,
 * no immediate line repeats, and line sets per language (en default, te = the supplied Telugu-English lines).
 */

export const COMMENTARY_STYLES = {
  EA_SPORTS_HYPE: "EA_SPORTS_HYPE",
  COMEDY_FUN: "COMEDY_FUN"
};

export const LINES = {
  en: {
    BOUNDARY_4: [
      "Shot! What a magnificent drive! Pure timing, that races to the rope!",
      "Classy placement! The fielder can only watch it cross the boundary!"
    ],
    MASSIVE_SIX: [
      "BOOM! THAT IS MASSIVE! Out of the stadium!",
      "Absolute carnage! Somebody go and find that ball, WHAT A HIT!",
      "Into the stands! The whole crowd is on its feet!"
    ],
    WICKET: {
      BOWLED: ["GOT HIM! Timber! The stumps are shattered!", "Unplayable delivery! The batter had no idea!"],
      CAUGHT: ["Taken! The catch is held and he has to go!", "In the air... and safely taken!"],
      LBW: ["Plumb in front! That is a big appeal and the finger goes up!"],
      RUN_OUT: ["Direct hit! Short of the crease and he is gone!"],
      STUMPED: ["Lightning hands behind the stumps! Stumped!"],
      DEFAULT: ["WICKET! A big moment in this match!"]
    },
    NORMAL: [
      "Good length delivery, nicely defended into the off-side.",
      "Tapped safely for a single, good running between the wickets.",
      "Well bowled, right on the spot. No run."
    ],
    DOT: "Bowler is building intense pressure here!"
  },
  te: {
    BOUNDARY_4: [
      "Shot! What a magnificent drive! Ball bullet laga boundary daatesindi!",
      "Classy placement! Fielders chusthundi appude ball boundary rope touch chesindi!"
    ],
    MASSIVE_SIX: [
      "BOOM! THAT IS MASSIVE! Stadium daatesi parking lot loki poyindi ball!",
      "Absolute Carnage! Inka ball ni vethakalante helicopter theeskovalsinde, WHAT A HIT!",
      "Keka shot! Idi kada kavalasindi! Crowd motham lechi nilabdi dance chestunnaru!"
    ],
    WICKET: {
      BOWLED: ["GOT HIM! Bowled em! Stumps air show chesthunnayi, bails egiripoyayi!",
               "Edhi matram unbelievable delivery! Batter ki asalu artham kaledu em jarigindo!"],
      CAUGHT: ["Catch pattesaru! Batter pavilion ki vellalsinde!"],
      LBW: ["Pad meeda direct ga! Umpire vrelu paiki, LBW!"],
      RUN_OUT: ["Direct hit! Crease ki dooram, run out!"],
      STUMPED: ["Keeper minnu laga stumping chesadu!"],
      DEFAULT: ["WICKET! Match lo pedda moment!"]
    },
    NORMAL: [
      "Good length delivery, nicely defended into the off-side.",
      "Tapped safely for a single, good running between the wickets.",
      "Well bowled, right on the spot. No run."
    ],
    DOT: "Bowler ikkada pressure penchutunnadu!"
  }
};

export class EAPerformanceCommentarySystem {
  constructor(soundAdapter, graphicsAdapter, { language = "en", style = COMMENTARY_STYLES.EA_SPORTS_HYPE, random = Math.random } = {}) {
    this.sound = soundAdapter;       // Handles audio clips (arupulu, kekalu, bat cracks)
    this.graphics = graphicsAdapter; // Handles on-screen text tickers and big banners
    this.language = LINES[language] ? language : "en";
    this.style = style;
    this.random = random;
    this.last = {};
  }

  pick(key, list) {
    if (!list || !list.length) return "";
    let i = Math.floor(this.random() * list.length);
    if (list.length > 1 && this.last[key] === i) i = (i + 1) % list.length; // never repeat the same line twice in a row
    this.last[key] = i;
    return list[i];
  }

  /** Triggers event-based dynamic commentary with crowd reactions and audio FX */
  triggerEvent(eventType, data = {}) {
    const d = { batsman: "The batter", dismissal: "DEFAULT", ...data };
    switch (eventType) {
      case "BOUNDARY_4": this.playFourCelebration(d); break;
      case "MASSIVE_SIX": this.playSixCelebration(d); break;
      case "WICKET_FALL": this.playWicketCelebration(d); break;
      case "DOT_BALL_PRESSURE": this.playPressureCommentary(d); break;
      default: this.playNormalPlay(d);
    }
  }

  playFourCelebration(data) {
    this.sound.playSFX("bat_crack_loud");
    this.sound.playCrowdRoar("medium_cheer");
    this.sound.speakVoiceover(this.pick("4", LINES[this.language].BOUNDARY_4), { pitch: 1.2, intensity: "high" });
    this.graphics.showTicker({ title: "FOUR RUNS!", subtitle: `${data.batsman} finds the gap with absolute elegance!`, color: "#ffeb3b" });
  }

  playSixCelebration(data) {
    this.sound.playSFX("heavy_bat_crack");
    this.sound.playCrowdRoar("deafening_roar_stadium_shake");
    this.sound.speakVoiceover(this.pick("6", LINES[this.language].MASSIVE_SIX), { pitch: 1.4, intensity: "maximum" });
    this.graphics.showBigBanner({ title: "MAMMOTH SIX!", detail: `${data.batsman} sends it into orbit!`, animation: "screen_shake_zoom" });
  }

  playWicketCelebration(data) {
    const W = LINES[this.language].WICKET;
    const kind = W[data.dismissal] ? data.dismissal : "DEFAULT";
    this.sound.playSFX(kind === "BOWLED" ? "stumps_flying_clatt" : "wicket_appeal_hit");
    this.sound.playCrowdRoar("gasp_then_roar");
    this.sound.speakVoiceover(this.pick("W" + kind, W[kind]), { pitch: 1.3, intensity: "aggressive" });
    this.graphics.showBigBanner({ title: "WICKET DOWN!", detail: `${data.batsman} departs! Pressure mounting on batting side.`, color: "#f44336" });
  }

  playPressureCommentary() {
    this.sound.playAmbientCrowd("murmur_tension");
    this.graphics.showTicker({ title: "DOT BALL", subtitle: LINES[this.language].DOT, color: "#ffffff" });
  }

  /** NORMAL_PLAY / any other event (v5.1 supplied version): light crowd, tap SFX, a calm line; ticker only on request. */
  playNormalPlay(data = {}) {
    const line = this.pick("N", LINES[this.language].NORMAL);
    this.sound.playSFX("bat_tap_pitch");
    this.sound.playAmbientCrowd("murmur_light");
    this.sound.speakVoiceover(line, { pitch: 1.0, intensity: "normal" });
    if (data.showTicker) this.graphics.showTicker({ title: "DOT BALL / SINGLE", subtitle: line, color: "#cccccc" });
  }
}
