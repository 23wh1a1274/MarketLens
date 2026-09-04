from decimal import Decimal

from app.services.change_detection import (
    detect_price_change,
    detect_volume_anomaly,
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