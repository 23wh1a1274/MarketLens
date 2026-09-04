from decimal import Decimal


def calculate_price_change(
    current_price: Decimal,
    previous_price: Decimal,
) -> float:
    if previous_price == 0:
        return 0.0

    return float(
        ((current_price - previous_price) / previous_price) * 100
    )


def detect_price_change(
    current_price: Decimal,
    previous_price: Decimal,
) -> dict:
    change_percent = calculate_price_change(
        current_price,
        previous_price,
    )

    absolute_change = abs(change_percent)

    if absolute_change >= 5:
        severity = "significant"
    elif absolute_change >= 3:
        severity = "notable"
    elif absolute_change >= 1:
        severity = "minor"
    else:
        severity = "normal"

    if change_percent > 0:
        direction = "up"
    elif change_percent < 0:
        direction = "down"
    else:
        direction = "unchanged"

    return {
        "change_percent": round(change_percent, 2),
        "direction": direction,
        "severity": severity,
    }

def calculate_volume_ratio(
    current_volume: int,
    average_volume: float,
) -> float:
    if average_volume <= 0:
        return 0.0

    return current_volume / average_volume


def detect_volume_anomaly(
    current_volume: int,
    average_volume: float,
) -> dict:
    volume_ratio = calculate_volume_ratio(
        current_volume,
        average_volume,
    )

    if volume_ratio >= 3:
        severity = "significant"
    elif volume_ratio >= 2:
        severity = "notable"
    elif volume_ratio >= 1.5:
        severity = "minor"
    else:
        severity = "normal"

    return {
        "volume_ratio": round(volume_ratio, 2),
        "severity": severity,
        "is_anomaly": volume_ratio >= 1.5,
    }