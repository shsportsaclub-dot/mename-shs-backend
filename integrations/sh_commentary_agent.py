"""Original SH Commentary from licensed structured ball events, not source prose."""
import hashlib
import json

def build_commentary(ball: dict, language: str = "en") -> dict:
    """Generate factual, independent text from structured match events.

    Expected: match_id, innings, over, ball, batter, bowler, runs_bat,
    extras, wicket, dismissal, score. Provider commentary text is ignored.
    """
    match_id = str(ball.get("match_id", "")).strip()
    over = ball.get("over")
    delivery = ball.get("ball")
    if not match_id or over is None or delivery is None:
        raise ValueError("match_id, over and ball are required")
    batter = str(ball.get("batter") or "Batter")
    bowler = str(ball.get("bowler") or "Bowler")
    runs = int(ball.get("runs_bat", 0))
    extras = ball.get("extras") or {}
    if not isinstance(extras, dict):
        extras = {}
    extra_runs = sum(int(v or 0) for v in extras.values() if isinstance(v, (int, float)))
    wicket = bool(ball.get("wicket"))
    dismissal = str(ball.get("dismissal") or "").strip()
    label = f"{over}.{delivery}"
    if language == "te":
        if wicket:
            sentence = f"{label} — వికెట్! {batter} అవుట్."
            if dismissal:
                sentence += f" అవుట్ విధానం: {dismissal}."
        elif extras.get("wide"):
            sentence = f"{label} — వైడ్ బాల్. అదనపు పరుగులు {extra_runs}."
        elif extras.get("noball"):
            sentence = f"{label} — నో బాల్. అదనపు పరుగులు {extra_runs}."
        elif runs == 6:
            sentence = f"{label} — సిక్స్! {batter} బ్యాట్ నుంచి ఆరు పరుగులు."
        elif runs == 4:
            sentence = f"{label} — ఫోర్! {batter}కు నాలుగు పరుగులు."
        elif runs == 0:
            sentence = f"{label} — డాట్ బాల్. {bowler} బౌలింగ్‌లో పరుగు లేదు."
        else:
            sentence = f"{label} — {batter} {runs} పరుగులు సాధించాడు."
    else:
        if wicket:
            sentence = f"{label} — WICKET! {batter} is out."
            if dismissal:
                sentence += f" Dismissal: {dismissal}."
        elif extras.get("wide"):
            sentence = f"{label} — Wide delivery; {extra_runs} extra run(s)."
        elif extras.get("noball"):
            sentence = f"{label} — No-ball; {extra_runs} extra run(s)."
        elif runs == 6:
            sentence = f"{label} — SIX! {batter} adds six with one stroke."
        elif runs == 4:
            sentence = f"{label} — FOUR! Four runs to {batter}."
        elif runs == 0:
            sentence = f"{label} — Dot ball from {bowler}. No run."
        else:
            sentence = f"{label} — {batter} collects {runs} run(s)."
    # Stable key: retries must not create repeated lines.
    key_parts = [match_id, ball.get("innings"), over, delivery, ball.get("event_id")]
    key = hashlib.sha256(json.dumps(key_parts, default=str).encode()).hexdigest()
    return {"event_id": key, "match_id": match_id, "language": language,
            "text": sentence, "source": "SH original structured-event commentary",
            "verified": bool(ball.get("verified", False))}

# Integration: call build_commentary only for licensed structured ball events.
# Publish results to the SH Prediction commentary WebSocket topic and persist.
# Never feed another publisher's prose into this function or falsely invent
# field placement, shot direction, crowd response, speed, or player intent.
