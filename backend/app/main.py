from fastapi import FastAPI

from app.db.database import Base, engine
from app import models
from app.api.routes.auth import router as auth_router
from app.api.routes.watchlists import router as watchlist_router
from app.api.routes.market import router as market_router
from app.api.routes.events import router as events_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MarketLens API",
    description="Smart market watchlist and change detection API",
    version="1.0.0",
)

app.include_router(auth_router)
app.include_router(watchlist_router)
app.include_router(market_router)
app.include_router(events_router)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "marketlens-api",
    }