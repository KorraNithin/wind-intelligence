from datetime import date, datetime, timezone
from app.service import summarize, parse_datetime

def test_summary_metrics():
    rows = [
        {"error": 100},
        {"error": -100},
        {"error": 0},
    ]
    result = summarize(rows)
    assert result["periods"] == 3
    assert result["mae"] == 66.67
    assert result["rmse"] == 81.65
    assert result["bias"] == 0
    assert result["maxAbsoluteError"] == 100

def test_naive_timestamp_is_treated_as_utc():
    dt = parse_datetime("2026-01-01T00:00:00")
    assert dt.tzinfo == timezone.utc

def test_z_timestamp_is_utc():
    dt = parse_datetime("2026-01-01T00:00:00Z")
    assert dt == datetime(2026, 1, 1, tzinfo=timezone.utc)
