import statistics
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
    normal_volatility: float = 0.0,
) -> dict:
    change_percent = calculate_price_change(
        current_price,
        previous_price,
    )

    absolute_change = abs(change_percent)

    # If we have historical volatility, use it as the baseline.
    if normal_volatility > 0:
        volatility_ratio = absolute_change / normal_volatility

        if volatility_ratio >= 3:
            severity = "significant"
        elif volatility_ratio >= 2:
            severity = "notable"
        elif volatility_ratio >= 1:
            severity = "minor"
        else:
            severity = "normal"

    else:
        # Fallback when historical volatility is unavailable.
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
def calculate_volatility(prices: list[float]) -> float:
    if len(prices) < 2:
        return 0.0

    returns = []

    for i in range(1, len(prices)):
        previous = prices[i - 1]

        if previous == 0:
            continue

        daily_return = ((prices[i] - previous) / previous) * 100
        returns.append(daily_return)

    if len(returns) < 2:
        return 0.0

    return statistics.stdev(returns)


def detect_volatility(
    current_volatility: float,
    normal_volatility: float,
) -> dict:
    if normal_volatility <= 0:
        return {
            "volatility_ratio": 0.0,
            "severity": "normal",
            "is_anomaly": False,
        }

    ratio = current_volatility / normal_volatility

    if ratio >= 3:
        severity = "significant"
    elif ratio >= 2:
        severity = "notable"
    elif ratio >= 1.5:
        severity = "minor"
    else:
        severity = "normal"

    return {
        "volatility_ratio": round(ratio, 2),
        "severity": severity,
        "is_anomaly": ratio >= 1.5,
    }

def calculate_change_score(
    price_severity: str,
    volume_severity: str,
    volatility_severity: str,
    relative_severity: str = "normal",
) -> float:

    severity_points = {
        "normal": 0,
        "minor": 25,
        "notable": 60,
        "significant": 100,
    }

    price_score = severity_points.get(
        price_severity,
        0,
    )

    volume_score = severity_points.get(
        volume_severity,
        0,
    )

    volatility_score = severity_points.get(
        volatility_severity,
        0,
    )

    relative_score = severity_points.get(
        relative_severity,
        0,
    )

    score = (
        price_score * 0.40
        + volume_score * 0.25
        + volatility_score * 0.15
        + relative_score * 0.20
    )

    return round(min(score, 100), 2)

def get_event_severity(score: float) -> str:
    if score >= 75:
        return "significant"
    elif score >= 50:
        return "notable"
    elif score >= 25:
        return "minor"
    else:
        return "normal"

def detect_relative_performance(
    market_relative: float,
    sector_relative: float,
) -> dict:

    market_abs = abs(market_relative)
    sector_abs = abs(sector_relative)

    if market_abs >= 3 or sector_abs >= 3:
        severity = "significant"
    elif market_abs >= 2 or sector_abs >= 2:
        severity = "notable"
    elif market_abs >= 1 or sector_abs >= 1:
        severity = "minor"
    else:
        severity = "normal"

    reasons = []

    if abs(market_relative) >= 1:
        direction = "outperformed" if market_relative > 0 else "underperformed"

        reasons.append(
            f"Stock {direction} NIFTY by "
            f"{abs(market_relative):.2f}%"
        )

    if abs(sector_relative) >= 1:
        direction = "outperformed" if sector_relative > 0 else "underperformed"

        reasons.append(
            f"Stock {direction} its sector by "
            f"{abs(sector_relative):.2f}%"
        )

    return {
        "severity": severity,
        "market_relative": round(market_relative, 2),
        "sector_relative": round(sector_relative, 2),
        "reasons": reasons,
    }