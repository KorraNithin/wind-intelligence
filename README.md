# Wind Intelligence Dashboard

## Overview

Wind Intelligence is a dashboard built to analyze wind power generation forecasts against actual generation data. The main goal is to understand how accurate the forecasts were and how the differences can affect purchase decisions.

For this pilot, the analysis focuses on **January 2026**, using historical data from the Elexon BMRS API. Users can select a delivery date and a forecast publication cutoff to compare the forecast available at that time with the actual generation recorded later.

The application also calculates error metrics to make it easier to understand forecast performance.

## Features

- Fetches wind generation forecast and actual generation data from the Elexon BMRS API.
- Compares forecast values with actual generation values.
- Supports selecting a delivery date and publication cutoff.
- Calculates Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), bias, and maximum absolute error.
- Displays the results in a dashboard for easier analysis.
- Uses a React frontend and Python backend.
- Supports Docker Compose for running the application locally.
- Includes a fallback mode for development when live data is unavailable.

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Python
- FastAPI
- Pandas
- NumPy
- HTTPX

**Data Source**
- Elexon BMRS API

**Deployment and Development**
- Docker
- Docker Compose
- Vercel or Heroku, depending on the final deployment

## Project Structure

```text
wind-intelligence/
├── backend/
│   └── app/
│       ├── service.py
│       └── demo_data.py
├── frontend/
│   └── src/
│       └── App.jsx
├── docker-compose.yml
├── .env.example
└── README.md
```

The backend handles API requests, data processing, forecast and actual generation matching, and metric calculations. The frontend displays the results and lets users interact with the dashboard. `docker-compose.yml` defines the services used to run the application.

*Note: This is the main structure; additional files and directories may exist in the repository.*

## How to Run Locally

### Prerequisites

- Docker Desktop
- Git
- An internet connection to access the Elexon API

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_REPOSITORY_FOLDER>
```

### 2. Configure environment variables

Copy `.env.example` to `.env` if the project includes that example file.

Configure the required values:

```env
ELEXON_BASE_URL=https://data.elexon.co.uk/bmrs/api/v1
DEMO_FALLBACK=false
CORS_ORIGINS=http://localhost:5173
```

`DEMO_FALLBACK=false` disables the synthetic-data fallback, so API failures are reported instead of being replaced with illustrative values.

### 3. Start the application

Run the following command from the directory containing `docker-compose.yml`:

```bash
docker compose up --build -d
```

### 4. Open the application

- Frontend: http://localhost:5173
- Backend API documentation: http://localhost:8000/docs

To view backend logs:

```bash
docker compose logs --tail=50 backend
```

To stop the application:

```bash
docker compose down
```

## Data Source and Analysis

The application uses the Elexon BMRS API to retrieve wind generation data.

Forecasts are compared with actual generation for the selected delivery date. The publication cutoff is used to restrict the forecast to information available by the selected time, which is important when evaluating decisions made using historical information.

The dashboard reports the following metrics:

- **MAE:** Average absolute difference between forecast and actual generation.
- **RMSE:** Error metric that gives more weight to larger errors.
- **Bias:** Average signed difference between forecast and actual generation.
- **Maximum absolute error:** The largest absolute difference observed in the selected data.

The pilot is scoped to January 2026. Historical data availability and publication-time filtering should be verified for each date before using the results to support real purchasing decisions.

## AI Tools Used

I used ChatGPT to help with debugging, understanding API responses, troubleshooting the Docker setup, and improving the project documentation. The implementation and testing were carried out against the actual project and API responses.

## Deployment

**Live application:** `https://frontend-fawn-omega-41.vercel.app`

**Public GitHub repository:** `https://github.com/KorraNithin/wind-intelligence`

The deployed application should be tested to confirm that the frontend can reach the backend and retrieve data successfully.

## Limitations and Future Improvements

- Expand testing across all relevant dates in January 2026.
- Add automated tests for API responses, timestamp handling, and publication-cutoff filtering.
- Improve error handling when the external API is unavailable.
- Add clearer visualizations of forecast errors over time.
- Add automated deployment and monitoring.

## Conclusion

This project provides a simple way to explore wind generation forecast accuracy using historical Elexon data. It combines a React dashboard, a Python data-processing API, and Docker-based development to make the analysis easier to run, understand, and extend.
