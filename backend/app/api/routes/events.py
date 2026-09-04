from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.market_event import MarketEvent
from app.models.user import User
from app.core.security import get_current_user
from app.models.watchlist import Watchlist
from app.models.watchlist_item import WatchlistItem

router = APIRouter(prefix="/api/events", tags=["Events"])


@router.get("/since-last-check")
def get_events_since_last_check(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return {"events": [], "last_seen_at": None}

    query = db.query(MarketEvent)

    if user.last_seen_at:
        query = query.filter(
            MarketEvent.timestamp > user.last_seen_at
        )

    events = (
        query
        .order_by(MarketEvent.timestamp.desc())
        .all()
    )

    return {
        "last_seen_at": user.last_seen_at,
        "events": [
            {
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
            for event in events
        ],
    }
@router.post("/mark-seen")
def mark_events_seen(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return {"message": "User not found"}

    user.last_seen_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Events marked as seen",
        "last_seen_at": user.last_seen_at,
    }


@router.get("/attention")
def get_attention_queue(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    # Get symbols from the user's watchlists
    watched_symbols = (
        db.query(WatchlistItem.symbol)
        .join(
            Watchlist,
            Watchlist.id == WatchlistItem.watchlist_id
        )
        .filter(
            Watchlist.user_id == user_id
        )
        .all()
    )

    symbols = [symbol[0] for symbol in watched_symbols]

    if not symbols:
        return {
            "events": [],
            "count": 0,
        }

    # Get only important events for watched stocks
    events = (
        db.query(MarketEvent)
        .filter(
            MarketEvent.symbol.in_(symbols),
            MarketEvent.score >= 50,
        )
        .order_by(
            MarketEvent.score.desc(),
            MarketEvent.timestamp.desc(),
        )
        .all()
    )

    return {
        "events": [
            {
                "id": event.id,
                "symbol": event.symbol,
                "event_type": event.event_type,
                "severity": event.severity,
                "score": float(event.score),
                "reasons": event.reasons,
                "timestamp": event.timestamp,
            }
            for event in events
        ],
        "count": len(events),
    }