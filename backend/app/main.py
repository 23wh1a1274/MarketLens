from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app import models
from app.api.routes.auth import router as auth_router
from app.api.routes.watchlists import router as watchlist_router
from app.api.routes.market import router as market_router
from app.api.routes.events import router as events_router
from apscheduler.schedulers.background import BackgroundScheduler
from app.workers.market_worker import sync_market_data
from app.api.routes.portfolio import router as portfolio_router

Base.metadata.create_all(bind=engine)

scheduler = BackgroundScheduler()
scheduler.add_job(
    sync_market_data,
    "interval",
    minutes=15,
)
scheduler.start()

app = FastAPI(
    title="MarketLens API",
    description="Smart market watchlist and change detection API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://marketlens-amber.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(watchlist_router)
app.include_router(market_router)
app.include_router(events_router)
app.include_router(portfolio_router)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "marketlens-api",
    }

