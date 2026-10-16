# SA Silks API

This directory contains the FastAPI service that will support backend operations alongside the existing React and Supabase application.

## Setup

From the repository root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

## Run locally

```powershell
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`.

## Endpoints

- `GET /health` - Returns the API service status and current UTC timestamp.
- `GET /docs` - Opens the interactive Swagger API documentation.
