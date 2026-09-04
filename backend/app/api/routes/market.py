from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.market_snapshot import MarketSnapshot
from app.services.market_data import get_stock_snapshot

router = APIRouter(
    prefix="/api/market",
    tags=["Market Data"],
)


@router.get("/{symbol}")
def get_market_data(
    symbol: str,
    db: Session = Depends(get_db),
):
    try:
        data = get_stock_snapshot(symbol)

        snapshot = MarketSnapshot(
            symbol=data["symbol"],
            price=data["price"],
            open=data["open"],
            high=data["high"],
            low=data["low"],
            previous_close=data["previous_close"],
            volume=data["volume"],
            timestamp=data["timestamp"],
            source=data["source"],
        )

        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

        return data

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch market data: {str(e)}",
        )