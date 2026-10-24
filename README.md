# Wind Intelligence — UK wind forecast analysis

A pilot full-stack application for reviewing Elexon national wind generation forecasts and comparing them with actual wind generation for January 2026.

## Important data note

The application distinguishes **live Elexon data** from **illustrative demo data**. If the upstream API is unavailable or its response cannot be parsed, the UI can fall back to clearly labelled illustrative data so the demo remains navigable. Never present demo figures as real market observations. For a formal analysis, set `DEMO_FALLBACK=false`, verify the upstream response, and confirm that every forecast was published by the selected decision cutoff.

This is an engineering prototype, not a procurement recommendation. Demand, other generation sources, prices, interconnectors, balancing actions and commercial constraints are outside the requested scope.

## Features

- January 2026 delivery-date selector.
- Forecast decision cutoff selector.
- Forecast vs actual half-hourly wind generation chart.
- MAE, RMSE and signed forecast bias.
- Forecast publication time and half-hourly table.
- FastAPI endpoints and API health check.
- Elexon API client with explicit data provenance.
- Demo mode/fallback, validation, tests, Dockerfiles and Docker Compose.

## Stack

- Frontend: React, Vite, Recharts
- Backend: Python, FastAPI, Pandas, NumPy, HTTPX
- Tests: Pytest
- Containers: Docker and Docker Compose

AI tools were used to assist with generating and organizing parts of this codebase. All data logic and output should be reviewed and tested before production use.

## Directory guide

```text
frontend/
  src/
    App.jsx          Dashboard and controls
    api.js           API client
    main.jsx         React entry point
    styles.css       Responsive dashboard styles
  index.html
  package.json
  Dockerfile
backend/
  app/
    main.py          FastAPI application and endpoints
    service.py       Elexon retrieval, normalization, joining and metrics
    demo_data.py     Clearly-labelled synthetic fallback dataset
  tests/
    test_service.py  Metric and cutoff tests
  requirements.txt
  Dockerfile
docker-compose.yml
.env.example
```

## Run locally with Docker

Requirements: Docker Desktop / Docker Engine and Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

Then open:
- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/api/health
- API docs: http://localhost:8000/docs

The frontend's development server proxies `/api` requests to the backend.

## Run without Docker

Backend (Python 3.11+ recommended):

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (Node.js 20+ recommended), in another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Environment variables

See `.env.example`.

- `ELEXON_BASE_URL`: defaults to `https://data.elexon.co.uk/bmrs/api/v1`
- `DEMO_FALLBACK`: defaults to `true` for an accessible demo if the upstream API is temporarily unavailable. Set to `false` for strict live-data behavior.
- `CORS_ORIGINS`: comma-separated origins permitted to call the backend.

## API

- `GET /api/health` — service status
- `GET /api/dashboard?delivery_date=2026-01-15&cutoff=2026-01-14T10:00:00Z` — aligned forecast and actual periods plus summary metrics
- `GET /api/dates` — supported January 2026 dates

## Metric definitions

Error is `forecast - actual`.
- MAE = mean absolute error
- RMSE = square root of mean squared error
- Bias = mean signed error; positive means over-forecasting, negative means under-forecasting

The service selects, for each delivery period, the latest forecast whose `publishTime` is at or before the requested cutoff. Actual values are joined on normalized UTC `startTime`. Periods without both a forecast and an actual are not included in the accuracy metrics.

## Elexon source endpoints

- Actual generation: `GET /datasets/FUELHH/stream`, filtered to `fuelType=WIND` and the January 2026 settlement dates.
- Forecast generation: `GET /datasets/WINDFOR/stream`, filtered by publication-time range; `startTime`, `publishTime`, and `generation` are used.

Elexon API schemas and query parameter behavior can evolve. The client includes several compatible query parameter variants, but you should verify the exact response and filters against the current Elexon documentation before relying on the live analysis. The backend reports source/provenance metadata and raises a clear error when live mode is strict.

## Deployment notes

This repository is prepared for deployment, but deployment is not completed by generating these files. Publish the repository to GitHub, deploy the backend as a Docker web service (for example on Render), and deploy the frontend to Vercel. Set the frontend `VITE_API_BASE_URL` to the deployed backend URL (including no trailing slash), and set backend `CORS_ORIGINS` to the deployed Vercel origin.

For Render, the backend can be deployed using `backend/Dockerfile` with root directory `backend`, or deploy from the repo root using the provided `Dockerfile` path if the platform supports it. For Vercel, set the frontend root directory to `frontend` and configure `VITE_API_BASE_URL`. The actual deployment URLs must be added here after successful deployment.

## Known limitations / review checklist

- Verify live January 2026 API records and the exact query parameters against Elexon.
- A cutoff is applied to `publishTime`; the selected cutoff should represent the time at which a day-ahead purchase decision was actually made.
- January 2026 is historical. A “latest forecast today” view is not a substitute for historical forecast vintages.
- Synthetic demo data is never evidence of real Elexon performance.
- No storage/cache layer is included in this time-boxed MVP.
- No demand or other generation sources are included, so the app does not calculate total procurement requirements.
