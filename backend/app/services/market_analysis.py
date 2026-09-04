import statistics
from sqlalchemy.orm import Session
from app.models.market_snapshot import MarketSnapshot


def get_average_volume(
    db: Session,
    symbol: str,
    limit: int = 20,
) -> float:
    snapshots = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.symbol == symbol)
        .order_by(MarketSnapshot.timestamp.desc())
        .offset(1)
        .limit(limit)
        .all()
    )

    if not snapshots:
        return 0.0

    volumes = [
        snapshot.volume
        for snapshot in snapshots
        if snapshot.volume is not None
    ]

    if not volumes:
        return 0.0

    return sum(volumes) / len(volumes)


def get_historical_prices(
    db: Session,
    symbol: str,
    limit: int = 20,
) -> list[float]:
    snapshots = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.symbol == symbol)
        .order_by(MarketSnapshot.timestamp.desc())
        .limit(limit)
        .all()
    )

    return [
        float(snapshot.price)
        for snapshot in reversed(snapshots)
    ]


def calculate_historical_volatility(
    prices: list[float],
) -> float:
    if len(prices) < 3:
        return 0.0

    returns = []

    for i in range(1, len(prices)):
        previous = prices[i - 1]

        if previous == 0:
            continue

        returns.append(
            ((prices[i] - previous) / previous) * 100
        )

    if len(returns) < 2:
        return 0.0

    return statistics.stdev(returns)