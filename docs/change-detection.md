# MarketLens Change Detection

## Overview

The main purpose of MarketLens is to identify stocks that have meaningfully
changed instead of simply displaying every market movement.

The change detection system analyzes multiple market signals and combines them
into a single score between 0 and 100.

The system currently considers:

1. Price movement
2. Volume anomaly
3. Volatility
4. Relative performance

The final score is used to determine whether a stock should receive attention.

---

## Why Multiple Signals?

A price change by itself does not always mean that something important
happened.

For example:

- A stock may move 2% during a highly volatile period.
- A stock may move 2% while the overall market moves 4%.
- A stock may move only 1% but have unusually high trading volume.

Therefore, MarketLens combines multiple signals instead of relying on a single
fixed percentage threshold.

---

## Change Detection Pipeline

```text
Market Snapshot
      |
      v
Price Analysis
      |
      +------> Volume Analysis
      |
      +------> Volatility Analysis
      |
      +------> Relative Performance
      |
      v
Combine Signals
      |
      v
Change Score (0-100)
      |
      v
Severity
      |
      v
Market Event
```

---

## 1. Price Movement

The percentage price change is calculated using the current and previous
prices.

```text
Price Change % =
((Current Price - Previous Price) / Previous Price) × 100
```

The absolute percentage change is then used to determine the severity.

Current thresholds:

```text
< 1%       Normal
1% - <3%   Minor
3% - <5%   Notable
>= 5%      Significant
```

When historical volatility is available, the system can also compare the
movement against the stock's normal volatility.

This helps make the detection more relative to the stock rather than relying
only on a fixed threshold.

---

## 2. Volume Anomaly

Trading volume is compared with the stock's historical average volume.

```text
Volume Ratio =
Current Volume / Average Historical Volume
```

Current interpretation:

```text
< 1.5x     Normal
1.5x - <2x Minor
2x - <3x   Notable
>= 3x      Significant
```

A large increase in volume can indicate that the price movement deserves
additional attention.

---

## 3. Volatility

MarketLens calculates historical volatility using daily percentage returns.

```text
Daily Return % =
((Current Price - Previous Price) / Previous Price) × 100
```

The standard deviation of these returns is used as the volatility measure.

The current volatility is compared with the stock's normal historical
volatility.

```text
Volatility Ratio =
Current Volatility / Normal Volatility
```

Current interpretation:

```text
< 1.5x     Normal
1.5x - <2x Minor
2x - <3x   Notable
>= 3x      Significant
```

This helps identify periods where a stock is behaving more unusually than
normal.

---

## 4. Relative Performance

MarketLens also considers how the stock performed compared with the broader
market and its sector.

The system currently compares:

- Stock vs NIFTY 50
- Stock vs relevant sector index

For example:

```text
Stock change     = -2%
NIFTY change     = -4%

Relative performance = +2%
```

Although the stock fell, it outperformed the broader market.

This provides additional context instead of treating every price movement as
an isolated event.

---

## Change Score

The individual signals are converted into severity scores:

```text
Normal       = 0
Minor        = 25
Notable      = 60
Significant  = 100
```

The final score uses the following weights:

| Signal | Weight |
|---|---:|
| Price Movement | 40% |
| Volume Anomaly | 25% |
| Volatility | 15% |
| Relative Performance | 20% |

The calculation is:

```text
Change Score =
    Price Score × 0.40
  + Volume Score × 0.25
  + Volatility Score × 0.15
  + Relative Score × 0.20
```

The final value is limited to a maximum of 100.

---

## Example

Consider a stock with:

```text
Price movement       = Significant (100)
Volume anomaly       = Notable (60)
Volatility           = Minor (25)
Relative performance = Notable (60)
```

The score becomes:

```text
100 × 0.40 = 40
 60 × 0.25 = 15
 25 × 0.15 = 3.75
 60 × 0.20 = 12

Total = 70.75
```

The stock therefore receives a high change score and can appear in the
Attention Queue.

---

## Severity

The application uses the change score to identify the importance of an event.

```text
0 - 24      Normal
25 - 49     Minor
50 - 79     Notable
80 - 100    Significant
```

Only meaningful events are intended to be surfaced prominently to users.

The Attention Queue currently prioritizes events with a score of 50 or higher.

---

## Event Reasons

The system does not store only the final score.

It also keeps information about the signals that contributed to the event.

Examples include:

```text
Stock outperformed NIFTY by 2.4%
Stock outperformed its sector by 1.8%
Trading volume was 2.5x the average
Price movement was significantly higher than normal
```

This makes the signal explainable to the user.

---

## Historical Context

MarketLens stores market snapshots in PostgreSQL.

Each snapshot contains information such as:

- Symbol
- Price
- Open
- High
- Low
- Previous close
- Volume
- Timestamp
- Data source

Historical snapshots allow the change detection engine to compare the current
market state with previous observations.

Without historical data, the application would only know the current state and
would not be able to determine what meaningfully changed.

---

## Since Last Checked

MarketLens also uses the user's last checked time.

```text
User's Last Check
       |
       v
Market Events After That Time
       |
       v
Since Last Checked
```

This allows the application to answer:

> What changed since I last checked?

rather than showing the user the same information repeatedly.

---

## Noise Reduction

The system is designed to avoid highlighting every small market movement.

Events with a score below the meaningful-change threshold are not surfaced as
important events.

This follows the main product principle:

> **Signal > Noise**

The goal is not to generate the maximum number of events.

The goal is to surface the events that are more likely to deserve attention.

---

## Current Limitations

The current implementation is an MVP.

Some areas can be improved in future versions:

- More advanced volatility normalization
- More complete sector mapping
- Longer historical baselines
- News and event signals
- Sentiment analysis
- Personalized relevance scoring
- More sophisticated anomaly detection
- Improved event deduplication

These improvements can be added without changing the overall architecture of
the application.

---

## Design Principle

The change detection engine follows three main ideas:

```text
What changed?
      ↓
How unusual is it?
      ↓
Why does it matter?
```

This is the core intelligence behind MarketLens.