import yfinance as yf


def get_stock_snapshot(symbol: str):
    symbol = symbol.strip().upper()

    # Indian stocks use .NS on Yahoo Finance
    ticker_symbol = f"{symbol}.NS"

    ticker = yf.Ticker(ticker_symbol)

    history = ticker.history(period="2d", interval="1d")

    if history.empty:
        raise ValueError(f"No market data found for {symbol}")

    latest = history.iloc[-1]

    previous_close = None

    if len(history) >= 2:
        previous_close = float(history.iloc[-2]["Close"])

    return {
        "symbol": symbol,
        "price": float(latest["Close"]),
        "open": float(latest["Open"]),
        "high": float(latest["High"]),
        "low": float(latest["Low"]),
        "previous_close": previous_close,
        "volume": int(latest["Volume"]),
        "timestamp": latest.name.to_pydatetime(),
        "source": "yfinance",
    }