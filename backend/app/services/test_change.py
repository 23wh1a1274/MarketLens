from decimal import Decimal

from app.services.change_detection import (
    detect_price_change,
    detect_volume_anomaly,
    detect_volatility,
)


price_result = detect_price_change(
    Decimal("105"),
    Decimal("100"),
)

print("Price:", price_result)


volume_result = detect_volume_anomaly(
    current_volume=3_000_000,
    average_volume=1_000_000,
)

print("Volume:", volume_result)

volatility_result = detect_volatility(
    current_volatility=6.0,
    normal_volatility=2.0,
)

print("Volatility:", volatility_result)