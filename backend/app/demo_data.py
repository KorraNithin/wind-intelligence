"""Synthetic data for UI demonstration only. Never represents real Elexon observations."""
from datetime import date, datetime, time, timedelta, timezone
import math
import random

def make_demo_day(day: date, cutoff: datetime):
    rng = random.Random(day.isoformat())
    rows = []
    start = datetime.combine(day, time(0, 0), tzinfo=timezone.utc)
    for i in range(48):
        stamp = start + timedelta(minutes=30 * i)
        # Smooth, intentionally synthetic daily profile in MW.
        actual = max(0.0, 8500 + 4200 * math.sin((i / 48) * math.tau - 0.9) + rng.uniform(-700, 700))
        forecast = max(0.0, actual + rng.uniform(-1500, 1500))
        rows.append({
            "startTime": stamp.isoformat().replace("+00:00", "Z"),
            "publishTime": (cutoff - timedelta(hours=1)).isoformat().replace("+00:00", "Z"),
            "forecast": round(forecast, 1),
            "actual": round(actual, 1),
            "error": round(forecast - actual, 1),
            "absoluteError": round(abs(forecast - actual), 1),
        })
    return rows
