from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
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
        return {
            "events": [],
            "last_seen_at": None,
        }

    watched_symbols = (
        db.query(WatchlistItem.symbol)
        .join(
            Watchlist,
            Watchlist.id == WatchlistItem.watchlist_id,
        )
        .filter(
            Watchlist.user_id == user.id
        )
        .all()
    )

    symbols = [symbol[0] for symbol in watched_symbols]

    if not symbols:
        return {
            "last_seen_at": user.last_seen_at,
            "events": [],
        }

    query = db.query(MarketEvent).filter(
        MarketEvent.symbol.in_(symbols)
    )

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
        return {
            "message": "User not found"
        }

    user.last_seen_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Events marked as seen",
        "last_seen_at": user.last_seen_at,
    }


def build_why_it_matters(event: MarketEvent) -> str:
    if event.severity == "significant":
        return (
            "This stock has experienced a significant market "
            "change and deserves immediate attention."
        )

    if event.severity == "notable":
        return (
            "This stock has experienced a notable change "
            "compared with its normal market behavior."
        )

    return "This stock has shown a market change worth monitoring."


@router.get("/attention")
def get_attention_queue(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    watched_symbols = (
        db.query(WatchlistItem.symbol)
        .join(
            Watchlist,
            Watchlist.id == WatchlistItem.watchlist_id,
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
                "why_it_matters": build_why_it_matters(event),
                "timestamp": event.timestamp,
            }
            for event in events
        ],
        "count": len(events),
    }


@router.get("/latest/{symbol}")
def get_latest_event(
    symbol: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    symbol = symbol.strip().upper()

    event = (
        db.query(MarketEvent)
        .filter(MarketEvent.symbol == symbol)
        .order_by(MarketEvent.timestamp.desc())
        .first()
    )

    if not event:
        return {
            "symbol": symbol,
            "severity": "normal",
            "score": 0,
            "reasons": [],
        }

    return {
        "id": event.id,
        "symbol": event.symbol,
        "severity": event.severity,
        "score": float(event.score),
        "reasons": event.reasons,
        "timestamp": event.timestamp,
    }


@router.get("/stock/{symbol}")
def get_stock_events(
    symbol: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    symbol = symbol.strip().upper()

    watched = (
        db.query(WatchlistItem)
        .join(
            Watchlist,
            Watchlist.id == WatchlistItem.watchlist_id,
        )
        .filter(
            Watchlist.user_id == user_id,
            WatchlistItem.symbol == symbol,
        )
        .first()
    )

    if not watched:
        raise HTTPException(
            status_code=404,
            detail="Stock not found in your watchlist",
        )

    events = (
        db.query(MarketEvent)
        .filter(
            MarketEvent.symbol == symbol
        )
        .order_by(
            MarketEvent.timestamp.desc()
        )
        .all()
    )

    return [
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
    ]


@router.get("/watchlist-health")
def get_watchlist_health(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    watched_symbols = (
        db.query(WatchlistItem.symbol)
        .join(
            Watchlist,
            Watchlist.id == WatchlistItem.watchlist_id,
        )
        .filter(
            Watchlist.user_id == user_id
        )
        .all()
    )

    symbols = [symbol[0] for symbol in watched_symbols]

    if not symbols:
        return {
            "total": 0,
            "attention": 0,
            "minor": 0,
            "normal": 0,
        }

    attention = 0
    minor = 0
    normal = 0

    for symbol in symbols:
        event = (
            db.query(MarketEvent)
            .filter(
                MarketEvent.symbol == symbol
            )
            .order_by(
                MarketEvent.timestamp.desc()
            )
            .first()
        )

        if not event:
            normal += 1
        elif float(event.score) >= 50:
            attention += 1
        elif float(event.score) >= 25:
            minor += 1
        else:
            normal += 1

    return {
        "total": len(symbols),
        "attention": attention,
        "minor": minor,
        "normal": normal,
    }