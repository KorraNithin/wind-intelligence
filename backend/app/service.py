from __future__ import annotations
from datetime import date, datetime, time, timedelta, timezone
import os
from typing import Any
import httpx
import numpy as np
import pandas as pd
from .demo_data import make_demo_day

BASE_URL = os.getenv("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1").rstrip("/")
DEMO_FALLBACK = os.getenv("DEMO_FALLBACK", "true").lower() in {"1", "true", "yes"}

class DataUnavailable(RuntimeError):
    pass

def parse_datetime(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        dt = value
    else:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def _records(payload: Any) -> list[dict]:
    if isinstance(payload, list):
        return [x for x in payload if isinstance(x, dict)]
    if isinstance(payload, dict):
        for key in ("data", "results", "items"):
            if isinstance(payload.get(key), list):
                return [x for x in payload[key] if isinstance(x, dict)]
    return []

async def _get_records(client: httpx.AsyncClient, path: str, params: dict) -> list[dict]:
    response = await client.get(f"{BASE_URL}/{path.lstrip('/')}", params=params)
    response.raise_for_status()
    return _records(response.json())

async def fetch_live_day(day: date, cutoff: datetime) -> list[dict]:
    day_start = datetime.combine(day, time.min, tzinfo=timezone.utc)
    day_end = day_start + timedelta(days=1)
    # Forecasts need to have been published by the cutoff, and must target the delivery day.
    publish_from = day_start - timedelta(days=3)
    publish_to = cutoff
    actual_params = {
        "settlementDateFrom": day.isoformat(),
        "settlementDateTo": day.isoformat(),
    }
    forecast_params = {
        "publishTimeFrom": publish_from.isoformat().replace("+00:00", "Z"),
        "publishTimeTo": publish_to.isoformat().replace("+00:00", "Z"),
        "startTimeFrom": day_start.isoformat().replace("+00:00", "Z"),
        "startTimeTo": day_end.isoformat().replace("+00:00", "Z"),
    }
    async with httpx.AsyncClient(timeout=25.0, headers={"Accept": "application/json"}) as client:
        # The endpoint documentation has evolved; this code uses the stream endpoints
        # specified by the assignment and accepts either a list or {data:[...]} payload.
        actual_raw = await _get_records(client, "datasets/FUELHH/stream", actual_params)
        forecast_raw = await _get_records(
    client,
    "forecast/generation/wind/history",
    {
        "publishTime": cutoff.isoformat().replace("+00:00", "Z"),
        "format": "json",
    },
)

    actual_rows = []
    for item in actual_raw:
        if str(item.get("fuelType", "")).upper() != "WIND":
            continue
        stamp = item.get("startTime")
        generation = item.get("generation")
        if stamp is None or generation is None:
            continue
        try:
            ts = parse_datetime(stamp)
            if day_start <= ts < day_end:
                actual_rows.append({"startTime": ts, "actual": float(generation)})
        except (ValueError, TypeError):
            continue

    forecast_rows = []
    for item in forecast_raw:
        stamp, published, generation = item.get("startTime"), item.get("publishTime"), item.get("generation")
        if stamp is None or published is None or generation is None:
            continue
        try:
            ts, pub = parse_datetime(stamp), parse_datetime(published)
            if day_start <= ts < day_end and pub <= cutoff:
                forecast_rows.append({"startTime": ts, "publishTime": pub, "forecast": float(generation)})
        except (ValueError, TypeError):
            continue

    if not actual_rows or not forecast_rows:
        raise DataUnavailable(
            "Elexon returned no matching actual or forecast records for this delivery date/cutoff. "
            "Check API filters, availability and the selected cutoff."
        )
    actual_df = pd.DataFrame(actual_rows).groupby("startTime", as_index=False).last()
    forecast_df = pd.DataFrame(forecast_rows).sort_values("publishTime").groupby("startTime", as_index=False).last()
    merged = forecast_df.merge(actual_df, on="startTime", how="inner").sort_values("startTime")
    if merged.empty:
        raise DataUnavailable("Forecast and actual records could not be matched on startTime.")
    merged["error"] = merged["forecast"] - merged["actual"]
    merged["absoluteError"] = merged["error"].abs()
    return [{
        "startTime": r.startTime.isoformat().replace("+00:00", "Z"),
        "publishTime": r.publishTime.isoformat().replace("+00:00", "Z"),
        "forecast": round(float(r.forecast), 2),
        "actual": round(float(r.actual), 2),
        "error": round(float(r.error), 2),
        "absoluteError": round(float(r.absoluteError), 2),
    } for r in merged.itertuples()]

def summarize(rows: list[dict]) -> dict:
    if not rows:
        return {"periods": 0, "mae": None, "rmse": None, "bias": None, "maxAbsoluteError": None}
    errors = np.array([float(row["error"]) for row in rows], dtype=float)
    return {
        "periods": int(len(errors)),
        "mae": round(float(np.mean(np.abs(errors))), 2),
        "rmse": round(float(np.sqrt(np.mean(errors ** 2))), 2),
        "bias": round(float(np.mean(errors)), 2),
        "maxAbsoluteError": round(float(np.max(np.abs(errors))), 2),
    }

async def get_day(day: date, cutoff: datetime) -> dict:
    if day.year != 2026 or day.month != 1:
        raise ValueError("This pilot is scoped to January 2026 delivery dates.")
    try:
        rows = await fetch_live_day(day, cutoff)
        return {"rows": rows, "summary": summarize(rows), "source": "Elexon API", "isDemo": False,
                "note": "Live records retrieved from Elexon. Verify query coverage before operational use."}
    except (httpx.HTTPError, ValueError, DataUnavailable) as exc:
        if not DEMO_FALLBACK:
            raise DataUnavailable(str(exc)) from exc
        rows = make_demo_day(day, cutoff)
        return {"rows": rows, "summary": summarize(rows), "source": "Illustrative synthetic data", "isDemo": True,
                "note": f"Demo fallback is active; values are synthetic and must not be interpreted as market data. Live retrieval issue: {str(exc)[:240]}"}
