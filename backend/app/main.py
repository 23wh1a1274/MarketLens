from fastapi import FastAPI

app = FastAPI(
    title="MarketLens API",
    description="Smart market watchlist and change detection API",
    version="1.0.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "marketlens-api",
    }