"""SH Prediction live match bridge: licensed-feed adapter and event normalization.
Provider credentials and licensed endpoints are configured externally.
No Cricbuzz scraping or unlicensed commentary redistribution.
"""
import asyncio
import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Any, Callable

MATCH_FIELDS = ("match_id", "status", "home", "away", "toss", "innings", "score", "winner", "result", "commentary")

def normalize_match(payload: dict[str, Any]) -> dict[str, Any]:
    """Normalize authorized provider payload; preserve original prediction history."""
    match_id = str(payload.get("match_id") or payload.get("id") or "").strip()
    if not match_id:
        raise ValueError("match_id required")
    return {
        "match_id": match_id,
        "status": payload.get("status", "unknown"),
        "home": payload.get("home"),
        "away": payload.get("away"),
        "toss": payload.get("toss"),
        "innings": payload.get("innings", []),
        "score": payload.get("score"),
        "winner": payload.get("winner"),
        "result": payload.get("result"),
        "commentary": payload.get("commentary", []),
        "source_updated_at": payload.get("updated_at"),
        "received_at": datetime.now(timezone.utc).isoformat(),
    }

def event_key(event: dict[str, Any]) -> str:
    stable = {k: v for k, v in event.items() if k != "received_at"}
    return hashlib.sha256(json.dumps(stable, sort_keys=True, default=str).encode()).hexdigest()

class MatchBridge:
    """Publish only changed match states; do not overwrite pre-match picks."""
    def __init__(self, publish: Callable[[dict[str, Any]], Any]):
        self.publish = publish
        self.seen: dict[str, str] = {}

    async def ingest(self, raw: dict[str, Any]) -> bool:
        event = normalize_match(raw)
        key = event_key(event)
        if self.seen.get(event["match_id"]) == key:
            return False
        result = self.publish(event)
        if asyncio.iscoroutine(result):
            await result
        self.seen[event["match_id"]] = key
        return True

# Production integration:
# 1. Subscribe to an authorized feed's webhook/WebSocket or permitted polling endpoint.
# 2. Map provider match IDs to SH Prediction and sheet rows.
# 3. Publish to SH Prediction WebSocket; batch Google Sheets writes on actual changes.
# 4. Store dedupe cursor and event history in persistent DB (not in-memory).
# 5. Respect feed rights, API quotas, reconnect/backoff and delay alerts.
# This module does not start a feed or deploy a service on its own.
