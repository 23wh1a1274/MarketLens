## Groww Code Challenge

**Candidate:** Tanishqa Kalidindi

**Project:** MarketLens

MarketLens was developed as part of the Groww Code Challenge.

The project focuses on building a practical full-stack market monitoring
application that helps users understand meaningful changes in their
watchlist instead of only displaying raw market data.

The application combines:

- React frontend
- FastAPI backend
- PostgreSQL database
- Market data integration
- Authentication
- Watchlists
- Portfolio tracking
- Change detection
- Market event generation
- Attention Queue
- Historical data
- Background processing

---

## Problem Statement

Most stock watchlists mainly show the current price, percentage change,
volume, and other raw market data.

The problem is that users still have to manually check every stock to figure
out:

- Which stock actually changed?
- Is the change significant?
- Is the stock moving differently from the market?
- Is the volume unusually high?
- Which stocks need attention?

MarketLens solves this by analyzing multiple market signals and converting
them into meaningful events and an attention queue.

---

## Features

### Authentication
- User registration
- User login
- JWT-based authentication
- Protected API endpoints

### Watchlist
- Create watchlists
- Add stocks to a watchlist
- Remove stocks
- Validate stock symbols
- View watchlist health

### Market Data
- Current stock prices
- Open, high and low prices
- Previous close
- Trading volume
- Historical market data
- NIFTY 50 and other market indices

### Change Detection
MarketLens detects meaningful changes using:

- Price movement
- Volume anomaly
- Volatility
- Relative performance against NIFTY
- Relative performance against the stock's sector

### MarketLens Intelligence
- Meaningful Change Score from 0-100
- Event severity
- Explanation of why a stock changed
- "Since Last Checked" events
- Attention Queue
- Watchlist Health

### Portfolio
- Add holdings
- Track quantity
- Track average buy price
- Calculate current portfolio value
- Calculate invested value
- Calculate profit/loss
- Calculate return percentage

### Stock Details
- Historical price chart
- Current price and change
- Trading statistics
- Change score
- Reasons behind the signal
- Event timeline

---

## Tech Stack

### Frontend

- React
- JavaScript
- Vite
- Tailwind CSS
- TanStack Query
- Recharts
- Lucide React

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT Authentication

### Database and Services

- PostgreSQL
- Redis
- APScheduler
- yfinance

---

## System Architecture

```text
                    Market Data
                        |
                        v
              Market Data Service
                        |
                        v
                  PostgreSQL
                        |
                        v
             Change Detection Engine
                        |
                        v
                  Market Events
                        |
                        v
                    FastAPI
                        |
                        v
                React Frontend
```

The application is designed as a **modular monolith**.

The backend is divided into separate modules for:

- Authentication
- Watchlists
- Market data
- Change detection
- Market events
- Portfolio

This keeps the project simple to develop and deploy while keeping the
different responsibilities separated.

---

## Data Flow

```text
1. User creates a watchlist
            |
            v
2. User adds stocks
            |
            v
3. Market data is collected
            |
            v
4. Market snapshots are stored
            |
            v
5. Change detection analyzes the data
            |
            v
6. Meaningful events are created
            |
            v
7. FastAPI exposes the results
            |
            v
8. React displays the important changes
```

---

## Meaningful Change Detection

The main feature of MarketLens is the change detection system.

Instead of using only a fixed price percentage, the system considers multiple
signals.

### Change Score

| Signal | Weight |
|---|---:|
| Price Movement | 40% |
| Volume Anomaly | 25% |
| Volatility | 15% |
| Relative Performance | 20% |

The final score is between **0 and 100**.

### Severity Levels

```text
0 - 24     Normal
25 - 49    Minor
50 - 79    Notable
80 - 100   Significant
```

The score is used to decide which stocks deserve attention.

The system also stores the reasons contributing to an event so that the user
can understand why the stock was highlighted.

---

## Relative Market Performance

A stock's movement is not always meaningful by itself.

For example, if a stock falls 2% while the entire market falls 4%, the stock
may actually be performing relatively well.

MarketLens therefore compares stock performance with:

- NIFTY 50
- Relevant sector index

This helps distinguish a general market movement from a stock-specific
movement.

---

## "Since Last Checked"

MarketLens keeps track of when a user last checked their market information.

When the user returns, the application can show events that happened after
their previous check.

This allows the dashboard to answer:

> **What changed since I was last here?**

instead of forcing the user to manually compare old and new values.

---

## Attention Queue

The Attention Queue highlights events with a higher change score.

Instead of showing every market movement, the dashboard prioritizes events
that are more likely to deserve the user's attention.

Each event contains:

- Stock symbol
- Severity
- Change score
- Timestamp
- Reason for the change
- Market/sector comparison when available

---

## Watchlist Health

The Watchlist Health section gives a quick summary of the user's watchlist.

It currently categorizes stocks into:

- Total stocks
- Need attention
- Minor changes
- Normal

This provides a quick overview without requiring the user to open every stock.

---

## Database Design

The main database entities are:

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

### Main Tables

#### Users
Stores user authentication information and last checked time.

#### Watchlists
Stores user-created watchlists.

#### Watchlist Items
Stores the stocks belonging to each watchlist.

#### Market Snapshots
Stores historical market values such as price, volume and timestamp.

#### Market Events
Stores detected meaningful changes and their scores/reasons.

#### User Events
Tracks which market events have been seen or dismissed by a user.

#### Portfolio Holdings
Stores the user's stock holdings, quantity and average buy price.

---

## Project Structure

```text
MarketLens/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── workers/
│   │   ├── db/
│   │   └── main.py
│   │
│   ├── tests/
│   └── requirements.txt
│
├── docs/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## API Endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Watchlists

```text
POST   /api/watchlists
GET    /api/watchlists
DELETE /api/watchlists/{watchlist_id}

POST   /api/watchlists/{watchlist_id}/stocks
GET    /api/watchlists/{watchlist_id}/stocks
DELETE /api/watchlists/{watchlist_id}/stocks/{symbol}
```

### Market Data

```text
GET /api/market/snapshot/{symbol}
GET /api/market/history/{symbol}
GET /api/market/indices
```

### Market Events

```text
GET  /api/events/latest/{symbol}
GET  /api/events/stock/{symbol}
GET  /api/events/attention
GET  /api/events/since-last-check
GET  /api/events/watchlist-health
POST /api/events/mark-seen
```

### Portfolio

```text
POST   /api/portfolio
GET    /api/portfolio
PUT    /api/portfolio/{holding_id}
DELETE /api/portfolio/{holding_id}
```

---

## Running Locally

### Requirements

Before running MarketLens, install:

- Python 3.10+
- Node.js 18+
- PostgreSQL
- Redis
- Git

Docker can also be used for PostgreSQL and Redis.

---

## Backend Setup

Open a terminal:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

### Windows

```powershell
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketlens
REDIS_URL=redis://localhost:6379
JWT_SECRET=development-secret
MARKET_DATA_API_KEY=
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

Swagger API documentation:

```text
http://localhost:8000/docs
```

---

## Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## Docker

PostgreSQL and Redis can be started using:

```bash
docker compose up -d
```

The project uses:

```text
PostgreSQL → Port 5432
Redis      → Port 6379
```

---

## Market Data

MarketLens currently uses **yfinance** for development market data.

The market data layer is separated from the rest of the application so that
the provider can be replaced later without changing the entire application.

For a production deployment, a dedicated market data provider would be
preferred because of reliability, rate limits and data availability
requirements.

---

## Background Processing

APScheduler is used to periodically run the market data worker.

The worker:

```text
Fetch market data
       ↓
Store snapshot
       ↓
Compare with previous data
       ↓
Calculate signals
       ↓
Calculate change score
       ↓
Create meaningful event
```

Redis is included in the architecture for caching and future background
processing improvements.

---

## Design Decisions

### Why React?

React provides a simple component-based structure for building the dashboard,
watchlist and stock detail pages.

### Why JavaScript instead of TypeScript?

JavaScript keeps the frontend simple for this project while still allowing
React components and services to be organized cleanly.

### Why FastAPI?

FastAPI provides a lightweight Python backend with automatic API
documentation and Pydantic validation.

### Why PostgreSQL?

PostgreSQL is used because MarketLens needs to store users, watchlists,
historical snapshots, market events and portfolio data.

### Why a Modular Monolith?

A modular monolith keeps deployment and development simpler than
microservices while still separating the application's major responsibilities.

For the current project size, introducing multiple services would add
operational complexity without providing enough benefit.

### Why Store Historical Snapshots?

Only storing the latest price would make it difficult to determine what
changed.

Historical snapshots allow MarketLens to compare current values with previous
values and generate meaningful events.

---

## Data Handling

Market data may be delayed or unavailable depending on the data provider.

MarketLens therefore stores:

- Timestamp
- Data source
- Market snapshot
- Historical values

The system also avoids creating meaningful events when there is not enough
historical data to make a useful comparison.

---

## Security

The backend uses:

- JWT authentication
- Password hashing
- Protected API routes
- User-specific watchlists
- User-specific portfolio data
- Environment variables for secrets

Secrets such as JWT keys and API keys are not stored directly in the source
code.

---

## Current Limitations

This is currently a development/MVP implementation.

Some limitations include:

- yfinance is being used instead of a dedicated production market data API
- Sector mappings are currently limited
- News and sentiment analysis are not yet implemented
- Real-time market updates are not implemented
- Background processing is currently handled with APScheduler
- Automated test coverage is still being expanded
- Portfolio transactions are currently represented using holdings rather than
  a full transaction ledger

---

## Future Improvements

- News and sentiment integration
- Better market data provider
- More complete sector mapping
- Improved Redis caching
- Real-time market updates
- More automated tests
- Advanced portfolio analytics
- Transaction history
- Production deployment
- Better event deduplication
- More personalized relevance scoring

---

## Challenge / Evaluation Context

MarketLens was developed as an implementation project for a
**Groww Code-style software engineering evaluation**.

The project focuses on building a complete full-stack application rather than
only implementing a frontend or backend feature.

The implementation covers:

- Product design
- Frontend development
- Backend API development
- Database design
- Authentication
- Market data integration
- Change detection
- Event generation
- Portfolio functionality
- API integration
- Background processing
- Documentation

The main design goal was to build a practical application around the idea of
reducing information overload for users monitoring multiple stocks.

---

## Project Goal

The goal of MarketLens is not simply to show more market data.

It is to answer three questions:

```text
What changed?
     ↓
How significant is the change?
     ↓
Why should I care?
```

> **MarketLens — Show the user what changed and why it matters.**

---

## Status

The current MVP includes:

- [x] Authentication
- [x] Watchlists
- [x] Stock validation
- [x] Market data
- [x] Historical data
- [x] Change detection
- [x] Change scoring
- [x] Market events
- [x] Since Last Checked
- [x] Attention Queue
- [x] Watchlist Health
- [x] Portfolio tracking
- [x] Stock detail page
- [x] Charts
- [x] API documentation
- [x] Background market data worker

---

## License

This project was created by Tanishqa Kalidindi 
