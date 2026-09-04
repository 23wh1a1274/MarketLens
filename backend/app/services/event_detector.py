from datetime import datetime

from app.services.change_detection import (
    detect_price_change,
    detect_volume_anomaly,
    detect_volatility,
    calculate_change_score,
    get_event_severity,
)


def detect_market_event(
    symbol: str,
    current_price: float,
    previous_price: float,
    current_volume: int,
    average_volume: float,
    current_volatility: float,
    normal_volatility: float,
):
    price = detect_price_change(
        current_price,
        previous_price,
    )

    volume = detect_volume_anomaly(
        current_volume,
        average_volume,
    )

    volatility = detect_volatility(
        current_volatility,
        normal_volatility,
    )

    score = calculate_change_score(
        price["severity"],
        volume["severity"],
        volatility["severity"],
    )

    severity = get_event_severity(score)

    reasons = []

    if price["severity"] != "normal":
        reasons.append(
            f"Price moved {price['change_percent']}% {price['direction']}"
        )

    if volume["is_anomaly"]:
        reasons.append(
            f"Volume is {volume['volume_ratio']}x the normal level"
        )

    if volatility["is_anomaly"]:
        reasons.append(
            f"Volatility is {volatility['volatility_ratio']}x normal"
        )

    return {
        "symbol": symbol,
        "event_type": "meaningful_change",
        "severity": severity,
        "score": score,
        "old_value": str(previous_price),
        "new_value": str(current_price),
        "reasons": reasons,
        "timestamp": datetime.utcnow(),
    }