from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.market_snapshot import MarketSnapshot
from app.services.market_data import get_stock_snapshot
from app.services.market_analysis import get_average_volume
from app.services.event_service import create_market_event

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

@router.post("/{symbol}/analyze")
def analyze_stock(
    symbol: str,
    db: Session = Depends(get_db),
):
    symbol = symbol.strip().upper()

    snapshots = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.symbol == symbol)
        .order_by(MarketSnapshot.timestamp.desc())
        .limit(21)
        .all()
    )

    if len(snapshots) < 2:
        raise HTTPException(
            status_code=400,
            detail="Not enough snapshots to analyze this stock",
        )

    current = snapshots[0]
    previous = snapshots[1]

    average_volume = get_average_volume(
        db,
        symbol,
        limit=20,
    )

    # Temporary volatility values.
    # We'll replace these with calculated historical volatility next.
    current_volatility = 0.0
    normal_volatility = 0.0

    event = create_market_event(
        db=db,
        symbol=symbol,
        current_price=float(current.price),
        previous_price=float(previous.price),
        current_volume=current.volume or 0,
        average_volume=average_volume,
        current_volatility=current_volatility,
        normal_volatility=normal_volatility,
    )

    return {
        "id": event.id,
        "symbol": event.symbol,
        "event_type": event.event_type,
        "severity": event.severity,
        "score": float(event.score),
        "old_value": event.old_value,
        "new_value": event.new_value,
        "reasons": event.reasons,
        "timestamp": event.timestamp,
    }