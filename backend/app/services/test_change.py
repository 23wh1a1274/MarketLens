from app.services.event_detector import detect_market_event


event = detect_market_event(
    symbol="TCS",
    current_price=105,
    previous_price=100,
    current_volume=3_000_000,
    average_volume=1_000_000,
    current_volatility=6.0,
    normal_volatility=2.0,
)

print(event)