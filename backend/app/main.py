from datetime import date, datetime, timezone
import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .service import DataUnavailable, get_day

app = FastAPI(
    title="Wind Intelligence API",
    description="January 2026 UK wind forecast and actual generation analysis.",
    version="1.0.0",
)
origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "wind-intelligence-api"}

@app.get("/api/dates")
async def dates():
    return {"dates": [date(2026, 1, d).isoformat() for d in range(1, 32)]}

@app.get("/api/dashboard")
async def dashboard(
    delivery_date: date = Query(default=date(2026, 1, 15)),
    cutoff: str = Query(default="2026-01-14T10:00:00Z"),
):
    try:
        cutoff_dt = datetime.fromisoformat(cutoff.replace("Z", "+00:00"))
        if cutoff_dt.tzinfo is None:
            cutoff_dt = cutoff_dt.replace(tzinfo=timezone.utc)
        if delivery_date.year != 2026 or delivery_date.month != 1:
            raise HTTPException(status_code=400, detail="Only January 2026 delivery dates are supported.")
        result = await get_day(delivery_date, cutoff_dt.astimezone(timezone.utc))
        result["deliveryDate"] = delivery_date.isoformat()
        result["cutoff"] = cutoff_dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        return result
    except HTTPException:
        raise
    except DataUnavailable as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
