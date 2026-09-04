from app.db.database import SessionLocal
from app.models.watchlist_item import WatchlistItem
from app.models.market_snapshot import MarketSnapshot
from app.services.market_data import (
    get_stock_snapshot,
    get_relative_market_data,
)
from app.services.market_analysis import (
    get_average_volume,
    get_historical_prices,
    calculate_historical_volatility,
)
from app.services.event_service import create_market_event


def sync_market_data():
    db = SessionLocal()

    try:
        symbols = (
            db.query(WatchlistItem.symbol)
            .distinct()
            .all()
        )

        for (symbol,) in symbols:
            try:
                # 1. Fetch current market data
                data = get_stock_snapshot(symbol)

                # 2. Save snapshot
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

                # 3. Get previous trading-day snapshot
                previous = (
                    db.query(MarketSnapshot)
                    .filter(
                        MarketSnapshot.symbol == symbol,
                        MarketSnapshot.timestamp < snapshot.timestamp,
                    )
                    .order_by(MarketSnapshot.timestamp.desc())
                    .first()
                )

                if not previous:
                    print(f"{symbol}: no previous data")
                    continue

                # 4. Calculate normal volume
                average_volume = get_average_volume(
                    db,
                    symbol,
                    limit=20,
                )

                # 5. Get historical prices
                prices = get_historical_prices(
                    db,
                    symbol,
                    limit=20,
                )

                if len(prices) < 6:
                    print(f"{symbol}: not enough historical data")
                    continue

                # 6. Calculate volatility
                current_volatility = calculate_historical_volatility(
                    prices[-5:]
                )

                normal_volatility = calculate_historical_volatility(
                    prices
                )

                relative_data = get_relative_market_data(symbol)

                # 7. Generate MarketLens event
                event = create_market_event(
                    db=db,
                    symbol=symbol,
                    current_price=float(snapshot.price),
                    previous_price=float(previous.price),
                    current_volume=snapshot.volume or 0,
                    average_volume=average_volume,
                    current_volatility=current_volatility,
                    normal_volatility=normal_volatility,
                    market_relative=relative_data["market_relative"],
                    sector_relative=relative_data["sector_relative"],
                )

                print(
                    f"{symbol}: "
                    f"{event.severity} "
                    f"(score={float(event.score)})"
                )

            except Exception as error:
                db.rollback()
                print(f"Failed to process {symbol}: {error}")

    finally:
        db.close()