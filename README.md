# MarketLens

MarketLens is a smart stock watchlist application that helps users understand
what has meaningfully changed in their watchlist instead of just showing stock
prices.

## Features

- User registration and login with JWT authentication
- Create and manage stock watchlists
- Add and remove stocks
- Live market data using yfinance
- Historical stock data and charts
- Meaningful change detection
- Change score based on price, volume, volatility and market performance
- "Since Last Checked" events
- Attention Queue for important changes
- Watchlist health summary
- Portfolio tracking with P&L
- Stock detail page with charts and event history

## Tech Stack

### Frontend
- React
- JavaScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT

### Database & Services
- PostgreSQL
- Redis
- APScheduler
- yfinance

## Architecture

```text
Market Data
     ↓
Market Data Service
     ↓
PostgreSQL
     ↓
Change Detection
     ↓
Market Events
     ↓
FastAPI
     ↓
React Frontend

The backend is designed as a modular monolith with separate modules for
authentication, watchlists, market data, events and portfolio.

Change Detection

MarketLens uses multiple signals to identify meaningful changes:

Price movement - 40%
Volume anomaly - 25%
Volatility - 15%
Relative performance - 20%

The signals are combined into a score from 0 to 100.

The purpose is to help users focus on stocks that actually deserve attention
instead of checking every stock manually.

## Project Structure
MarketLens/
├── frontend/
├── backend/
├── docs/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
Running Locally
Backend
cd backend
python -m venv venv

Windows:

.\venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Create a .env file and add:

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketlens
REDIS_URL=redis://localhost:6379
JWT_SECRET=development-secret
MARKET_DATA_API_KEY=

Run the backend:

uvicorn app.main:app --reload

Backend:

http://localhost:8000

Swagger:

http://localhost:8000/docs
Frontend
cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173
Future Improvements
News and sentiment integration
Better market data provider
Improved caching
More automated tests
Real-time updates
Advanced portfolio analytics
Production deployment
Project Goal

The main goal of MarketLens is simple:

Show the user what changed and why it matters.