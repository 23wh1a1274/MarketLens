# MarketLens Architecture

## 1. Overview

MarketLens is a full-stack web application designed to help users identify
meaningful changes in the stocks they are monitoring.

The application follows a **modular monolith architecture**.

The frontend, backend, database, market data service and background worker
have clearly separated responsibilities while remaining part of one
application.

---

## 2. High-Level Architecture

```text
                         User
                          |
                          v
                  React Frontend
                          |
                          | HTTP / JSON
                          v
                    FastAPI API
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
     Authentication   Watchlists       Portfolio
          |               |               |
          +---------------+---------------+
                          |
                          v
                  Market Data Service
                          |
                          v
                     yfinance
                          |
                          v
                   Market Snapshots
                          |
                          v
                 Change Detection Engine
                          |
                          v
                   Market Events
                          |
                          v
                    PostgreSQL
```

Redis is used as a supporting service for caching and can be extended for
future background processing.

APScheduler is currently used to periodically trigger the market data worker.

---

## 3. Application Components

### Frontend

The frontend is built using React and JavaScript.

Main responsibilities:

- Display market information
- Display watchlists
- Display change events
- Display the Attention Queue
- Display Watchlist Health
- Display stock charts
- Display portfolio information
- Handle user interaction
- Communicate with the backend API

Main frontend technologies:

```text
React
JavaScript
Vite
Tailwind CSS
TanStack Query
Recharts
Lucide React
```

---

## 4. Backend

The backend is built using FastAPI and Python.

It exposes REST APIs used by the React frontend.

Main responsibilities:

- Authentication
- User authorization
- Watchlist management
- Portfolio management
- Market data access
- Change detection
- Market event generation
- Historical data access

Backend technologies:

```text
Python
FastAPI
SQLAlchemy
Pydantic
JWT
```

---

## 5. Backend Module Structure

```text
backend/
└── app/
    ├── api/
    │   └── routes/
    │       ├── auth.py
    │       ├── watchlists.py
    │       ├── market.py
    │       ├── events.py
    │       └── portfolio.py
    │
    ├── core/
    │   ├── config.py
    │   └── security.py
    │
    ├── models/
    │   ├── user.py
    │   ├── watchlist.py
    │   ├── watchlist_item.py
    │   ├── market_snapshot.py
    │   ├── market_event.py
    │   ├── user_event.py
    │   └── portfolio_holding.py
    │
    ├── schemas/
    │
    ├── services/
    │   ├── market_data.py
    │   ├── market_analysis.py
    │   ├── change_detection.py
    │   ├── event_detector.py
    │   └── event_service.py
    │
    ├── workers/
    │   └── market_worker.py
    │
    ├── db/
    │   └── database.py
    │
    └── main.py
```

---

## 6. API Layer

The API layer acts as the interface between the frontend and backend
services.

Main API groups:

```text
/api/auth
/api/watchlists
/api/market
/api/events
/api/portfolio
```

The API uses JSON for request and response data.

FastAPI also provides automatic interactive API documentation through Swagger.

---

## 7. Authentication Flow

MarketLens uses JWT-based authentication.

```text
User
 |
 | Register / Login
 v
FastAPI
 |
 | Validate credentials
 v
Password Hash
 |
 | Valid
 v
JWT Access Token
 |
 v
Frontend
 |
 | Authorization: Bearer <token>
 v
Protected API
```

Passwords are stored as hashes rather than plain text.

Protected endpoints identify the current user from the JWT token.

---

## 8. Authorization

Authentication determines who the user is.

Authorization determines whether the user is allowed to access a resource.

For user-specific resources, MarketLens checks ownership.

For example:

```text
User
 |
 +---- Watchlist
 |
 +---- Portfolio Holdings
 |
 +---- User Events
```

A user should only be able to modify their own watchlists and portfolio
holdings.

---

## 9. Watchlist Flow

```text
User
 |
 v
Create Watchlist
 |
 v
Add Stock Symbol
 |
 v
Validate Symbol
 |
 v
Watchlist Item
 |
 v
Market Data Worker
```

Stock symbols are normalized to uppercase before being stored.

The backend also validates that market data exists for a stock before adding it
to the watchlist.

---

## 10. Market Data Flow

Market data is currently retrieved using yfinance.

```text
Market Data Provider
        |
        v
Market Data Service
        |
        v
Normalize Data
        |
        v
Market Snapshot
        |
        v
PostgreSQL
```

A snapshot contains information such as:

- Symbol
- Price
- Open
- High
- Low
- Previous close
- Volume
- Timestamp
- Data source

The market data service is separated from the rest of the application so that
the provider can be replaced in the future.

---

## 11. Background Worker

APScheduler periodically triggers the market data synchronization worker.

```text
APScheduler
     |
     | Every 15 minutes
     v
Market Worker
     |
     v
Get watched stocks
     |
     v
Fetch market data
     |
     v
Store snapshot
     |
     v
Analyze changes
     |
     v
Create market event
```

The current implementation uses a simple scheduler because the project is an
MVP.

A distributed job queue can be introduced later if the workload requires it.

---

## 12. Change Detection

The change detection engine is the main intelligence component of MarketLens.

It analyzes:

```text
Price Movement
Volume Anomaly
Volatility
Relative Performance
```

These signals are converted into severity values and combined into a score
between 0 and 100.

```text
Market Snapshot
       |
       v
Change Detection
       |
       +---- Price
       |
       +---- Volume
       |
       +---- Volatility
       |
       +---- Relative Performance
       |
       v
Change Score
       |
       v
Market Event
```

For the detailed algorithm, see:

```text
docs/change-detection.md
```

---

## 13. Market Events

A market event represents a meaningful change detected for a stock.

An event contains information such as:

```text
Symbol
Event Type
Severity
Score
Old Value
New Value
Reasons
Timestamp
```

Example:

```text
Symbol: TCS
Severity: Notable
Score: 70.75

Reasons:
- Stock outperformed NIFTY
- Trading volume was unusually high
- Price movement was significant
```

The event is stored in PostgreSQL so it can be displayed later.

---

## 14. Attention Queue

The Attention Queue provides a prioritized view of important events.

```text
Market Events
      |
      v
Filter meaningful scores
      |
      v
Sort by score
      |
      v
Attention Queue
```

The current implementation prioritizes events with a score of 50 or higher.

This reduces the amount of information that the user needs to manually inspect.

---

## 15. Since Last Checked

MarketLens stores the user's `last_seen_at` timestamp.

```text
User opens application
        |
        v
Read last_seen_at
        |
        v
Find events after that timestamp
        |
        v
Since Last Checked
```

When the user marks events as seen, the timestamp is updated.

This allows the dashboard to focus on changes that happened since the user's
previous check.

---

## 16. Portfolio Flow

Portfolio holdings are associated with the authenticated user.

```text
User
 |
 v
Add Holding
 |
 +---- Symbol
 +---- Quantity
 +---- Average Buy Price
 |
 v
Portfolio Holding
 |
 v
Current Market Price
 |
 v
Calculate
 |
 +---- Invested Value
 +---- Current Value
 +---- Profit/Loss
 +---- Return %
```

Portfolio values are calculated using the current market price.

---

## 17. Database Architecture

PostgreSQL stores persistent application data.

Main relationships:

```text
Users
 |
 +---- Watchlists
 |       |
 |       +---- Watchlist Items
 |
 +---- Portfolio Holdings
 |
 +---- User Events

Market Snapshots
 |
 +---- Market Events
```

Historical market snapshots are stored separately from market events.

This allows the system to retain both:

```text
What the market value was
```

and:

```text
What the system considered meaningful
```

---

## 18. Redis

Redis is included as a supporting service.

Potential uses include:

- Caching frequently accessed market data
- Reducing repeated market API requests
- Storing short-lived data
- Supporting future background processing

The current MVP does not depend on Redis for core database persistence.

---

## 19. Error Handling

The application handles common failure cases such as:

- Invalid stock symbols
- Missing market data
- Invalid authentication tokens
- Unauthorized resource access
- Invalid request data
- Temporary market data provider failures

The API uses appropriate HTTP status codes where possible.

For example:

```text
400 → Invalid request
401 → Authentication required
404 → Resource not found
409 → Duplicate resource
503 → Market data temporarily unavailable
```

---

## 20. Security

Security measures currently include:

- JWT authentication
- Password hashing
- Protected API routes
- User ownership checks
- Environment variables for secrets
- No hard-coded production credentials

Sensitive configuration is stored in `.env`.

The `.env` file should never be committed to the repository.

Only `.env.example` should be included in the source repository.

---

## 21. Why Modular Monolith?

MarketLens uses a modular monolith instead of microservices.

The main reason is simplicity.

The application has several logical components, but they currently do not need
independent deployment or independent scaling.

A modular monolith provides:

- Easier development
- Easier debugging
- Simpler deployment
- Lower operational complexity
- Clear separation of responsibilities

If the application grows significantly, individual modules can later be
separated into independent services.

---

## 22. Scalability Considerations

The current architecture can be extended in several ways.

### Market Data

A dedicated production market data provider can replace yfinance.

### Caching

Redis can cache frequently requested market information.

### Background Processing

APScheduler can later be replaced or supplemented with a distributed task
queue if the number of tracked stocks increases significantly.

### Database

PostgreSQL can be optimized with:

- Indexes
- Query optimization
- Snapshot retention policies
- Historical data partitioning

### API

The FastAPI backend can be deployed with multiple workers when required.

---

## 23. Current Architecture Limitations

The current system is designed as an MVP, so some production-level features
are intentionally simplified.

Current limitations include:

- Development market data provider
- Limited sector mapping
- Simple background scheduler
- No real-time WebSocket updates
- Limited caching
- No distributed task queue
- Basic event deduplication
- Portfolio represented as holdings rather than a full transaction ledger

These choices keep the implementation manageable while leaving room for future
improvements.

---

## 24. Deployment Architecture

The intended production deployment can use separate services for the
frontend, backend, database and Redis.

```text
                    Users
                      |
                      v
                React / Vercel
                      |
                      v
               FastAPI Backend
                      |
             +--------+--------+
             |                 |
             v                 v
        PostgreSQL           Redis
             |
             v
       Market Snapshots
             |
             v
      Change Detection
             |
             v
       Market Events
```

The exact hosting provider can be changed without changing the application
architecture.

---

## 25. Core Design Principle

The architecture is designed around one product principle:

```text
Raw Market Data
       |
       v
Meaningful Analysis
       |
       v
Prioritized Events
       |
       v
Useful User Action
```

MarketLens is therefore designed not just to display market data, but to
reduce the amount of manual analysis required from the user.

> **What changed? How significant is it? Why should I care?**