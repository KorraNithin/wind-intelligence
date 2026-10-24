# Demo video script (maximum 10 minutes)

Record one continuous screen capture with a clear microphone. Use the deployed application if available. Do not read synthetic demo values as real market outcomes.

## Part 1 — Customer pitch (target 4:30)

**0:00–0:35 — Context**
“Day-ahead procurement decisions depend on how much wind generation is expected for each half-hour period. This pilot brings forecast values, publication timing and realized generation into one place, so a trader can inspect forecast confidence rather than relying on a single number.”

**0:35–1:20 — Controls**
“Here I select a January 2026 delivery date and a forecast information cutoff. The cutoff is important: a forecast can only inform a decision if it was published before that decision was made.”

**1:20–2:20 — Forecast comparison**
“The main chart compares the selected forecast vintage with actual wind generation for matched half-hourly periods. The chart uses UTC timestamps to avoid ambiguity around time zones and daylight-saving transitions.”

**2:20–3:20 — Accuracy metrics**
“MAE measures typical absolute error, RMSE penalizes large misses more heavily, and signed bias indicates whether forecasts tend to be high or low. These are decision-support indicators, not a direct procurement instruction.”

**3:20–4:10 — Detail and export**
“The detailed table exposes publication timestamps, forecast, actual, and error for each period. The CSV export supports further review.”

**4:10–4:30 — Scope and caveat**
“This pilot is limited to national wind actuals and forecasts from Elexon. It does not include demand, other generation, prices or commercial constraints, so it does not calculate a complete procurement position.”

## Part 2 — Technical review (target 4:45)

**5:00–5:45 — Architecture**
“The frontend is React with Vite and Recharts. The backend is FastAPI. The frontend calls a small API contract, and the backend owns source retrieval, timestamp normalization, joining and metric calculation.”

**5:45–6:45 — Ingestion and matching**
“The service requests FUELHH actuals and WINDFOR forecasts for the delivery date. It filters actuals to WIND, normalizes timestamps to UTC, and joins on startTime. Missing or unmatched periods are excluded from accuracy calculations.”

**6:45–7:40 — Forecast vintage**
“For each delivery period, the intended rule is to select the latest forecast whose publishTime is no later than the chosen cutoff. This avoids look-ahead bias. I would verify exact Elexon query filters and record counts against the live schema before using the metrics operationally.”

**7:40–8:25 — Metrics and tests**
“Error is forecast minus actual. The backend calculates MAE, RMSE, bias and maximum absolute error. Unit tests cover the formulas and UTC parsing.”

**8:25–9:10 — Resilience and deployment**
“The API has a health endpoint, explicit error handling, CORS configuration and a clearly labelled synthetic fallback for demo resilience. Strict mode can disable fallback. Docker Compose starts both services consistently.”

**9:10–9:45 — Limitations and next steps**
“The time-boxed version does not persist data or implement caching. Before production I would add ingestion observability, a verified historical data cache, contract tests against live API payloads, and more extensive validation of publication-time semantics.”

**9:45–10:00 — Close**
“The code and setup steps are documented in the repository. The main design principle is that a forecast must be evaluated using only the information available at the decision time.”
