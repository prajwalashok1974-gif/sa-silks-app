from datetime import datetime, timezone

from fastapi import FastAPI
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime


app = FastAPI(
    title="SA Silks API",
    description="Backend API for the SA Silks business management application.",
    version="0.1.0",
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="sa-silks-api",
        timestamp=datetime.now(timezone.utc),
    )
