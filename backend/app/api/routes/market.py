from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.market_snapshot import MarketSnapshot
from app.services.market_data import (
    get_stock_snapshot,
    get_historical_snapshots,
    get_market_indices,
)
from app.services.market_analysis import (
    get_average_volume,
    get_historical_prices,
    calculate_historical_volatility,
)
from app.services.event_service import create_market_event

router = APIRouter(
    prefix="/api/market",
    tags=["Market Data"],
)

@router.get("/indices")
def get_market_indices_data():
    try:
        return get_market_indices()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch market indices: {str(e)}",
        )

@router.get("/snapshot/{symbol}")
@router.get("/snapshot/{symbol}")
def get_snapshot(symbol: str):
    symbol = symbol.strip().upper()

    try:
        return get_stock_snapshot(symbol)

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Market data is temporarily unavailable",
        )


@router.get("/history/{symbol}")
def get_stock_history(
    symbol: str,
    db: Session = Depends(get_db),
):
    symbol = symbol.strip().upper()

    snapshots = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.symbol == symbol)
        .order_by(MarketSnapshot.timestamp.asc())
        .limit(30)
        .all()
    )

    return [
        {
            "timestamp": snapshot.timestamp,
            "price": float(snapshot.price),
            "volume": snapshot.volume,
        }
        for snapshot in snapshots
    ]


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

    if len(snapshots) < 6:
        raise HTTPException(
            status_code=400,
            detail="Not enough historical data for analysis",
        )

    current = snapshots[0]

    # Find the most recent snapshot with a different timestamp/day
    previous = None

    for snapshot in snapshots[1:]:
        if snapshot.timestamp.date() != current.timestamp.date():
            previous = snapshot
            break

    if previous is None:
        raise HTTPException(
            status_code=400,
            detail="Not enough previous trading-day data",
        )

    average_volume = get_average_volume(
        db,
        symbol,
        limit=20,
    )

    # Temporary volatility values.
    # We'll replace these with calculated historical volatility next.
    prices = get_historical_prices(db, symbol, limit=20)

    if len(prices) < 6:
        raise HTTPException(
            status_code=400,
            detail="Not enough historical data for volatility analysis",
        )

    recent_prices = prices[-5:]
    historical_prices = prices

    current_volatility = calculate_historical_volatility(recent_prices)
    normal_volatility = calculate_historical_volatility(historical_prices)

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

@router.post("/{symbol}/sync")

def sync_historical_data(
    symbol: str,
    db: Session = Depends(get_db),
):
    try:
        snapshots = get_historical_snapshots(symbol)

        inserted = 0

        for data in snapshots:
            existing = (
                db.query(MarketSnapshot)
                .filter(
                    MarketSnapshot.symbol == data["symbol"],
                    MarketSnapshot.timestamp == data["timestamp"],
                )
                .first()
            )

            if existing:
                continue

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
            inserted += 1

        db.commit()

        return {
            "symbol": symbol.upper(),
            "inserted": inserted,
            "message": "Historical data synced successfully",
        }

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync historical data: {str(e)}",
        )





