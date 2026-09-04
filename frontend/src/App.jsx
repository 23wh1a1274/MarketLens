import {
  Activity,
  Bell,
  ChevronRight,
  Home,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";

import { useAttention } from "./hooks/useAttention";
import { useEffect, useState } from "react";
import Auth from "./pages/Auth";
import { getLatestEvent } from "./services/events";

import {
  getStockSnapshot,
  getMarketIndices,
  getStockHistory,
} from "./services/market";

import {
  getWatchlists,
  createWatchlist,
  getWatchlistStocks,
  addStock,
  removeStock,
} from "./services/watchlists";

function App() {

  const today = new Date();

const formattedDate = today.toLocaleDateString("en-IN", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const hour = today.getHours();

const greeting =
  hour < 12
    ? "Good morning"
    : hour < 18
      ? "Good afternoon"
      : "Good evening";

const [marketIndices, setMarketIndices] = useState([]);
const [indicesLoading, setIndicesLoading] = useState(true);
const [stockHistory, setStockHistory] = useState({});
const [stockSignals, setStockSignals] = useState({});

const [isAuthenticated, setIsAuthenticated] = useState(
      Boolean(localStorage.getItem("token"))
    );

    if (!isAuthenticated) {
      return (
        <Auth
          onLogin={() => setIsAuthenticated(true)}
        />
      );
    }
  const {
  data: attentionData,
  isLoading: attentionLoading,
  isError: attentionError,
} = useAttention();



const attentionEvents = attentionData?.events || [];

const [watchlistId, setWatchlistId] = useState(null);
const [stocks, setStocks] = useState([]);
const [stocksLoading, setStocksLoading] = useState(true);
const [stockError, setStockError] = useState("");
const [newSymbol, setNewSymbol] = useState("");
const [marketData, setMarketData] = useState({});


useEffect(() => {
  async function loadWatchlist() {
    try {
      setStocksLoading(true);
      setStockError("");

      let watchlists = await getWatchlists();

      // If user has no watchlist, create the default one
      if (!watchlists || watchlists.length === 0) {
        const newWatchlist = await createWatchlist("My Stocks");
        watchlists = [newWatchlist];
      }

      const firstWatchlist = watchlists[0];

      setWatchlistId(firstWatchlist.id);

      const data = await getWatchlistStocks(firstWatchlist.id);

      setStocks(data || []);
    } catch (error) {
      console.error("Watchlist error:", error);
      setStockError(error.message || "Unable to load watchlist");
    } finally {
      setStocksLoading(false);
    }
  }

  loadWatchlist();
}, []);

useEffect(() => {
  async function loadMarketData() {
    if (stocks.length === 0) return;

    const results = {};
    const historyResults = {};
    const signalResults = {};

    await Promise.all(
      stocks.map(async (stock) => {
        try {
          const [data, history] = await Promise.all([
            getStockSnapshot(stock.symbol),
            getStockHistory(stock.symbol),
            getLatestEvent(stock.symbol),
          ]);

          results[stock.symbol] = data;
          historyResults[stock.symbol] = history;
          signalResults[stock.symbol] = signal;
        } catch (error) {
          console.error(
            `Failed to load ${stock.symbol}:`,
            error.message
          );
        }
      })
    );

    setMarketData(results);
    setStockHistory(historyResults);
    setStockSignals(signalResults);
    }

  loadMarketData();
}, [stocks]);

useEffect(() => {
  async function loadMarketIndices() {
    try {
      setIndicesLoading(true);

      const data = await getMarketIndices();

      setMarketIndices(data || []);
    } catch (error) {
      console.error("Failed to load market indices:", error);
    } finally {
      setIndicesLoading(false);
    }
  }

  loadMarketIndices();
}, []);

async function handleAddStock() {
  const symbol = newSymbol.trim().toUpperCase();

  if (!symbol) {
    setStockError("Please enter a stock symbol.");
    return;
  }

  if (!watchlistId) {
    setStockError("Watchlist is still loading. Please try again.");
    return;
  }

  try {
    setStockError("");

    const stock = await addStock(watchlistId, symbol);

    setStocks((current) => [...current, stock]);
    setNewSymbol("");
  } catch (error) {
    console.error("Add stock error:", error);

    setStockError(
      error.message || `Unable to add ${symbol}`
    );
  }
}

async function handleRemoveStock(symbol) {
  if (!watchlistId) return;

  try {
    setStockError("");

    await removeStock(watchlistId, symbol);

    setStocks((current) =>
      current.filter((stock) => stock.symbol !== symbol)
    );
  } catch (error) {
    setStockError(error.message || "Unable to remove stock");
  }
}

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1f2937]">

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="flex h-16 items-center justify-between px-6 lg:px-10">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">
              <Activity size={19} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                MarketLens
              </h1>
            </div>
          </div>

          {/* Search */}
          <div className="hidden w-[420px] md:block">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
              <Search size={18} className="text-gray-400" />

              <input
                type="text"
                placeholder="Search stocks, ETFs, companies..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />

              <span className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-400">
                /
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-5">
            <button className="relative text-gray-500 hover:text-black">
              <Bell size={20} />

              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
              <User size={18} className="text-gray-600" />
            </div>

            <button
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.reload();
                }}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Logout
              </button>
          </div>


        </div>
      </header>

      <div className="flex">

        {/* Sidebar */}
        <aside className="hidden w-60 border-r border-gray-200 bg-white lg:block">
          <nav className="sticky top-16 p-4">

            <NavItem
              icon={<Home size={18} />}
              label="Overview"
              active
            />

            <NavItem
              icon={<Star size={18} />}
              label="My Watchlist"
            />

            <NavItem
              icon={<TrendingUp size={18} />}
              label="Markets"
            />

            <NavItem
              icon={<Wallet size={18} />}
              label="Portfolio"
            />

            <div className="my-6 border-t border-gray-100" />

            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Your Lists
            </p>

            <NavItem
              icon={<Star size={18} />}
              label="My Stocks"
            />

          </nav>
        </aside>

        {/* Main */}
        <main className="w-full">

          <div className="mx-auto max-w-7xl px-5 py-8 lg:px-10">

            {/* Greeting */}
            <section className="mb-8">
              <p className="mb-1 text-sm font-medium text-gray-500">
                {formattedDate}
              </p>

              <h2 className="text-3xl font-bold tracking-tight">
                {greeting}
              </h2>

              <p className="mt-2 text-gray-500">
                Here's what deserves your attention today.
              </p>
            </section>

            {/* Attention Card */}
            <section className="mb-10">

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Since you last checked
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Meaningful changes across your watchlist
                  </p>
                </div>

                <button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-black">
                  View all
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white">

                {/* Empty State */}
                {attentionLoading ? (
                  <div className="p-6">
                    <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
                    <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-100" />
                  </div>
                ) : attentionError ? (
                  <div className="p-6">
                    <p className="font-medium text-red-600">
                      Unable to load market signals
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Please check your connection and try again.
                    </p>
                  </div>
                ) : attentionEvents.length === 0 ? (
                  <div className="flex items-center justify-between p-6">

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                        <Bell size={19} className="text-gray-500" />
                      </div>

                      <div>
                        <p className="font-medium">
                          No major changes
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Nothing significant has changed since your last visit.
                        </p>
                      </div>

                    </div>

                    <span className="hidden rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 sm:block">
                      0 signals
                    </span>

                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">

                    {attentionEvents.slice(0, 5).map((event) => (
                      <AttentionEvent
                        key={event.id}
                        event={event}
                      />
                    ))}

                  </div>
                )}

              </div>

            </section>

            {/* Market Overview */}
            <section className="mb-10">

              <div className="mb-4">
                <h3 className="text-lg font-semibold">
                  Market overview
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  How the market is moving today
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {indicesLoading ? (
                <>
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white"
                    />
                  ))}
                </>
              ) : (
                marketIndices.map((index) => (
                  <MarketIndex
                    key={index.name}
                    name={index.name}
                    value={index.value.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    change={`${index.positive ? "+" : ""}${index.change.toFixed(2)}%`}
                    positive={index.positive}
                  />
                ))
              )}
              </div>

            </section>

            {/* Watchlist */}
            <section>

              <div className="mb-4 flex items-end justify-between">

                <div>
                  <h3 className="text-lg font-semibold">
                    My Watchlist
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Stocks you're keeping an eye on
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddStock();
                      }
                    }}
                    placeholder="Enter symbol"
                    className="border rounded-md px-3 py-2 text-sm"
                  />

                  <button
                    onClick={handleAddStock}
                    className="px-3 py-2 rounded-md text-sm font-medium"
                  >
                    + Add stock
                  </button>
                </div>

              </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                  {stocksLoading && (
                    <p className="text-sm text-gray-500">
                      Loading watchlist...
                    </p>
                  )}

                  {stockError && (
                    <p className="text-sm text-red-500">
                      {stockError}
                    </p>
                  )}

                  {stocks.map((stock) => (
                    <StockCard
                      key={stock.id}
                      stock={{
                        ...stock,
                        ...(marketData[stock.symbol] || {}),
                      }}
                      history={stockHistory[stock.symbol] || []}
                      signal={stockSignals[stock.symbol]}
                      onRemove={handleRemoveStock}
                    />
                  ))
                }

                </div>

            </section>

          </div>

        </main>

      </div>

    </div>
  );
}


/* -------------------------------- */
/* Components */
/* -------------------------------- */

function NavItem({ icon, label, active = false }) {
  return (
    <button
      className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-gray-100 text-black"
          : "text-gray-500 hover:bg-gray-50 hover:text-black"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}


function MarketIndex({
  name,
  value,
  change,
  positive,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          {name}
        </p>

        {positive ? (
          <TrendingUp
            size={17}
            className="text-green-600"
          />
        ) : (
          <TrendingDown
            size={17}
            className="text-red-500"
          />
        )}
      </div>

      <p className="mt-3 text-xl font-semibold">
        {value}
      </p>

      <p
        className={`mt-1 text-sm font-medium ${
          positive
            ? "text-green-600"
            : "text-red-500"
        }`}
      >
        {change} today
      </p>

    </div>
  );
}


function StockCard({ stock, history, signal, onRemove }) {
  const price = Number(stock.price || 0);
  const previousClose = Number(stock.previous_close || 0);

  const change =
    previousClose > 0
      ? ((price - previousClose) / previousClose) * 100
      : 0;

  const positive = change >= 0;

  const formattedPrice = `₹${price.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedChange = `${positive ? "+" : ""}${change.toFixed(2)}%`;

  return (
    <div className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm">

      <div className="flex items-start justify-between">

        <div>
          <p className="font-semibold">
            {stock.symbol}
          </p>

          <p className="mt-1 max-w-[200px] truncate text-xs text-gray-400">
            {stock.name || "Indian Equity"}
          </p>
        </div>

        <div className="flex items-center gap-3">

          <Star
            size={17}
            className="text-gray-300 transition group-hover:text-gray-500"
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.(stock.symbol);
            }}
            className="text-xs text-gray-400 hover:text-red-500"
          >
            Remove
          </button>

        </div>

      </div>

      <div className="mt-6 flex items-end justify-between">

        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {formattedPrice}
          </p>

          <p
            className={`mt-1 text-sm font-medium ${
              positive
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {formattedChange} today
          </p>
        </div>

        {/* Mini chart */}
        <div className="flex h-10 w-24 items-end gap-1">
            {history.length > 0 ? (
              history.slice(-8).map((point, index, values) => {
                const prices = values.map((item) => item.price);

                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);

                const range = maxPrice - minPrice;

                const height =
                  range === 0
                    ? 50
                    : 20 + ((point.price - minPrice) / range) * 60;

                return (
                  <div
                    key={index}
                    className={`w-2 rounded-sm ${
                      positive
                        ? "bg-green-200"
                        : "bg-red-200"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                );
              })
            ) : (
              <span className="text-xs text-gray-400">
                No history
              </span>
            )}
          </div>

      </div>

      <div className="mt-5 border-t border-gray-100 pt-3">

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            MarketLens signal
          </span>

          <span
            className={`font-medium ${
              signal?.severity === "significant"
                ? "text-red-600"
                : signal?.severity === "notable"
                  ? "text-orange-600"
                  : signal?.severity === "minor"
                    ? "text-yellow-600"
                    : "text-gray-600"
            }`}
>
  {signal?.severity
    ? signal.severity.charAt(0).toUpperCase() +
      signal.severity.slice(1)
    : "Normal"}
</span>
        </div>

      </div>

    </div>
  );
}

function AttentionEvent({ event }) {
  const isPositive =
    Number(event.new_value) >= Number(event.old_value);

  const severityStyles = {
    significant: "bg-red-50 text-red-600",
    notable: "bg-orange-50 text-orange-600",
    minor: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="flex items-center justify-between p-5 transition hover:bg-gray-50">

      <div className="flex items-center gap-4">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isPositive ? "bg-green-50" : "bg-red-50"
          }`}
        >
          {isPositive ? (
            <TrendingUp
              size={18}
              className="text-green-600"
            />
          ) : (
            <TrendingDown
              size={18}
              className="text-red-500"
            />
          )}
        </div>

        <div>

          <div className="flex items-center gap-2">

            <p className="font-semibold">
              {event.symbol}
            </p>

            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                severityStyles[event.severity] ||
                "bg-gray-100 text-gray-600"
              }`}
            >
              {event.severity}
            </span>

          </div>

          <p className="mt-1 text-sm text-gray-500">
            {event.why_it_matters}
          </p>

        </div>

      </div>

      <div className="text-right">

        <p className="text-lg font-semibold">
          {event.score}
        </p>

        <p className="text-xs text-gray-400">
          signal score
        </p>

      </div>

    </div>
  );
}

export default App;