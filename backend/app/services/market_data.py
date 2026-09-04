import yfinance as yf

INDEX_SYMBOLS = {
    "NIFTY 50": "^NSEI",
    "SENSEX": "^BSESN",
    "NIFTY IT": "^CNXIT",
    "BANK NIFTY": "^NSEBANK",
}
SECTOR_INDEXES = {
    "IT": "^CNXIT",
    "BANK": "^NSEBANK",
}

STOCK_SECTORS = {
    "TCS": "IT",
    "INFY": "IT",
}
def get_stock_snapshot(symbol: str):
    symbol = symbol.strip().upper()

    # Indian stocks use .NS on Yahoo Finance
    ticker_symbol = f"{symbol}.NS"

    ticker = yf.Ticker(ticker_symbol)

    history = ticker.history(period="1d", interval="5m")

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


def get_historical_snapshots(symbol: str, period: str = "1mo"):
    symbol = symbol.strip().upper()
    ticker_symbol = f"{symbol}.NS"

    ticker = yf.Ticker(ticker_symbol)

    history = ticker.history(
        period=period,
        interval="1d",
    )

    if history.empty:
        raise ValueError(f"No historical market data found for {symbol}")

    snapshots = []

    for timestamp, row in history.iterrows():
        snapshots.append({
            "symbol": symbol,
            "price": float(row["Close"]),
            "open": float(row["Open"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "previous_close": None,
            "volume": int(row["Volume"]),
            "timestamp": timestamp.to_pydatetime(),
            "source": "yfinance",
        })

    return snapshots

def get_market_indices():
    results = []

    for name, ticker_symbol in INDEX_SYMBOLS.items():
        ticker = yf.Ticker(ticker_symbol)

        history = ticker.history(period="2d", interval="1d")

        if history.empty:
            continue

        latest = history.iloc[-1]

        previous_close = None

        if len(history) >= 2:
            previous_close = float(history.iloc[-2]["Close"])

        price = float(latest["Close"])

        change = 0.0

        if previous_close:
            change = (
                (price - previous_close)
                / previous_close
            ) * 100

        results.append({
            "name": name,
            "value": round(price, 2),
            "change": round(change, 2),
            "positive": change >= 0,
        })

    return results

def get_relative_market_data(symbol: str):
    symbol = symbol.strip().upper()

    stock_ticker = yf.Ticker(f"{symbol}.NS")

    stock_history = stock_ticker.history(
        period="2d",
        interval="1d",
    )

    if len(stock_history) < 2:
        return {
            "stock_change": 0.0,
            "nifty_change": 0.0,
            "sector_change": 0.0,
            "market_relative": 0.0,
            "sector_relative": 0.0,
        }

    stock_current = float(stock_history.iloc[-1]["Close"])
    stock_previous = float(stock_history.iloc[-2]["Close"])

    stock_change = (
        (stock_current - stock_previous)
        / stock_previous
    ) * 100

    # NIFTY 50
    nifty = yf.Ticker("^NSEI")
    nifty_history = nifty.history(
        period="2d",
        interval="1d",
    )

    nifty_change = 0.0

    if len(nifty_history) >= 2:
        nifty_current = float(
            nifty_history.iloc[-1]["Close"]
        )
        nifty_previous = float(
            nifty_history.iloc[-2]["Close"]
        )

        nifty_change = (
            (nifty_current - nifty_previous)
            / nifty_previous
        ) * 100

    # Sector
    sector_change = 0.0
    sector = STOCK_SECTORS.get(symbol)

    if sector:
        sector_ticker = yf.Ticker(
            SECTOR_INDEXES[sector]
        )

        sector_history = sector_ticker.history(
            period="2d",
            interval="1d",
        )

        if len(sector_history) >= 2:
            sector_current = float(
                sector_history.iloc[-1]["Close"]
            )
            sector_previous = float(
                sector_history.iloc[-2]["Close"]
            )

            sector_change = (
                (sector_current - sector_previous)
                / sector_previous
            ) * 100

    return {
        "stock_change": round(stock_change, 2),
        "nifty_change": round(nifty_change, 2),
        "sector_change": round(sector_change, 2),
        "market_relative": round(
            stock_change - nifty_change,
            2,
        ),
        "sector_relative": round(
            stock_change - sector_change,
            2,
        ),
    }