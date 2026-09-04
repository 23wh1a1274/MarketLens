import json

from sqlalchemy.orm import Session

from app.models.market_event import MarketEvent
from app.services.event_detector import detect_market_event


def create_market_event(
    db: Session,
    symbol: str,
    current_price: float,
    previous_price: float,
    current_volume: int,
    average_volume: float,
    current_volatility: float,
    normal_volatility: float,
    market_relative: float = 0.0,
    sector_relative: float = 0.0,
):
    event_data = detect_market_event(
        symbol=symbol,
        current_price=current_price,
        previous_price=previous_price,
        current_volume=current_volume,
        average_volume=average_volume,
        current_volatility=current_volatility,
        normal_volatility=normal_volatility,
        market_relative=market_relative,
        sector_relative=sector_relative,
    )

    event = MarketEvent(
        symbol=event_data["symbol"],
        event_type=event_data["event_type"],
        severity=event_data["severity"],
        score=event_data["score"],
        old_value=event_data["old_value"],
        new_value=event_data["new_value"],
        reasons=json.dumps(event_data["reasons"]),
        timestamp=event_data["timestamp"],
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event