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