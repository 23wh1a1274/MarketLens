# MarketLens Architecture

## 1. Overview

MarketLens is designed as a modular monolith with a React frontend and a
Python/FastAPI backend.

The main purpose of the backend is to collect market data, store snapshots,
detect meaningful changes and expose the results through APIs.

The frontend consumes these APIs and presents the information in a dashboard.

The high-level architecture is:

```text
                 +-------------------+
                 |   Market Data     |
                 |    yfinance       |
                 +---------+---------+
                           |
                           v
                 +-------------------+
                 | Market Data Layer |
                 +---------+---------+
                           |
                +----------+----------+
                |                     |
                v                     v
       +----------------+     +----------------+
       |   PostgreSQL   |     |     Redis      |
       |    Snapshots   |     |    Caching     |
       +-------+--------+     +----------------+
               |
               v
       +----------------------+
       | Change Detection     |
       | & Scoring Engine     |
       +----------+-----------+
                  |
                  v
       +----------------------+
       |    Market Events     |
       +----------+-----------+
                  |
                  v
       +----------------------+
       |      FastAPI         |
       |       APIs           |
       +----------+-----------+
                  |
                  v
       +----------------------+
       |    React Frontend    |
       +----------------------+

# 
## 2.FRONTEND ARCHITECTURE

frontend/
└── src/
    ├── components/
    ├── pages/
    ├── hooks/
    ├── services/
    ├── utils/
    ├── App.jsx
    └── main.jsx

Pages

Some important pages are:

Dashboard
Authentication
Stock Detail
Portfolio

The Dashboard combines watchlist information, market indices, attention events
and watchlist health.

The Stock Detail page provides more detailed information about a selected
stock.

The Portfolio page handles the user's holdings.

Services

API calls are kept inside the services folder instead of writing fetch calls
directly throughout the UI.

For example:

services/
├── api.js
├── watchlists.js
├── market.js
└── events.js

This makes it easier to change API behavior later.

3. Backend Architecture

The backend follows a layered structure.

backend/app/
│
├── api/
├── core/
├── models/
├── schemas/
├── services/
├── repositories/
├── workers/
├── db/
└── main.py
API Layer

The API layer contains FastAPI routes.

It handles:

Request validation
Authentication dependencies
Calling services
Returning responses

Examples:

api/routes/auth.py
api/routes/watchlists.py
api/routes/market.py
api/routes/events.py
api/routes/portfolio.py
Models

SQLAlchemy models represent database tables.

Important models include:

User
Watchlist
WatchlistItem
MarketSnapshot
MarketEvent
UserEvent
PortfolioHolding
Schemas

Pydantic schemas are used for validating incoming requests and structuring
API responses.

Services

Business logic is kept in services rather than putting everything inside the
API routes.

For example:

market_data.py
market_analysis.py
event_detector.py
event_service.py


4. Database Design

The main relationships are:

User
 |
 +---- Watchlist
 |       |
 |       +---- WatchlistItem
 |
 +---- PortfolioHolding
 |
 +---- UserEvent
           |
           +---- MarketEvent
                    |
                    +---- MarketSnapshot
Users

Stores authentication information and the user's last checked time.

Watchlists

Stores watchlists created by users.

Watchlist Items

Connects stocks to a watchlist.

Market Snapshots

Stores historical market observations.

Instead of only storing the latest price, snapshots are stored so that the
application can compare different points in time.

Market Events

Stores detected changes.

An event contains information such as:

Symbol
Event type
Severity
Score
Old value
New value
Reasons
Timestamp

The reasons are important because they allow the frontend to explain why an
event received a particular score.

Portfolio Holdings

Stores the user's holdings and average buying price.

5. Market Data Flow

The market worker periodically checks stocks that are present in user
watchlists.

The basic flow is:

Watchlist Stocks
      |
      v
Fetch Market Data
      |
      v
Store Snapshot
      |
      v
Compare With Previous Data
      |
      v
Calculate Indicators
      |
      v
Calculate Change Score
      |
      v
Create Market Event

The current worker runs periodically using APScheduler.

6. Change Detection

The change detection system uses multiple signals.

Price Change

The percentage change from the previous price is calculated.

Volume Anomaly

Current trading volume is compared with historical average volume.

For example, if the current volume is several times higher than the normal
volume, it can contribute to a higher score.

Volatility

Historical price returns are used to estimate volatility.

The current short-term volatility is compared with historical volatility.

Relative Performance

The stock is also compared with:

NIFTY 50
Sector index when available

This helps distinguish between:

Entire market is falling

and:

One stock is falling much more than the market
7. Meaningful Change Score

The current score is calculated using:

Price Change       40%
Volume Anomaly     25%
Volatility         15%
Relative Performance 20%

Conceptually:

Score =
    Price Score      × 0.40
  + Volume Score     × 0.25
  + Volatility Score × 0.15
  + Relative Score   × 0.20

The final score is limited to 100.

The score is then used to classify an event.

0 - 24     Normal
25 - 49    Minor
50 - 79    Notable
80 - 100   Significant

The exact thresholds may be adjusted as the system gets more historical data.

8. Since Last Checked

One of the main product ideas is to show changes since the user's previous
visit.

The user model stores:

last_seen_at

When the user requests events since their last check, the backend compares the
event timestamp with this value.

After the user marks the events as seen:

last_seen_at = current time

This means the next request only needs to look for newer events.

9. Attention Queue

The Attention Queue is basically a filtered and sorted list of important
events.

Currently, events with a score of 50 or higher are considered important enough
for the queue.

They are sorted using:

Score DESC
Timestamp DESC

This gives the user a simple list of stocks that probably deserve more
attention.

10. Portfolio Flow

Portfolio data follows a separate flow:

User
 |
 v
Add Holding
 |
 v
Validate Stock
 |
 v
Store Quantity + Average Price
 |
 v
Fetch Current Price
 |
 v
Calculate Current Value
 |
 v
Calculate P&L

The backend calculates current portfolio values using the latest market data.

11. Authentication

The application uses JWT authentication.

The basic flow is:

Register
   |
   v
Hash Password
   |
   v
Store User

For login:

Email + Password
       |
       v
Verify Password
       |
       v
Create JWT
       |
       v
Frontend stores token

The token is then sent with API requests using:

Authorization: Bearer <token>
12. Background Processing

APScheduler is currently used to periodically execute market synchronization.

The current approach is intentionally simple.

FastAPI Application
       |
       +---- APScheduler
               |
               v
        Market Worker
               |
               v
        Market Data Sync

For a larger production system, this could later be moved into a separate
worker process or queue system.