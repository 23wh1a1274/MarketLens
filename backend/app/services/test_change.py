from decimal import Decimal

from app.services.change_detection import detect_price_change


result = detect_price_change(
    Decimal("105"),
    Decimal("100"),
)

print(result)
