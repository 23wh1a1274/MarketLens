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
import StockDetail from "./pages/StockDetail";
import Portfolio from "./pages/Portfolio";
import {
  getLatestEvent,
  getWatchlistHealth,
  getAttentionQueue,
  getEventsSinceLastCheck,
  markEventsSeen,
} from "./services/events";

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
const [selectedStock, setSelectedStock] = useState(null);
const [watchlistHealth, setWatchlistHealth] = useState(null);
const [attentionQueue, setAttentionQueue] = useState(null);
const [sinceLastCheck, setSinceLastCheck] = useState(null);
const [showAllAttention, setShowAllAttention] = useState(false);
const [searchSymbol, setSearchSymbol] = useState("");
const [showPortfolio, setShowPortfolio] = useState(false);

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
  async function loadSinceLastCheck() {
    try {
      const data = await getEventsSinceLastCheck();
      setSinceLastCheck(data);
    } catch (error) {
      console.error(
        "Failed to load since-last-check events:",
        error
      );
    }
  }

  if (stocks.length > 0) {
    loadSinceLastCheck();
  }
}, [stocks]);


useEffect(() => {
  async function loadAttentionQueue() {
    try {
      const data = await getAttentionQueue();
      setAttentionQueue(data);
    } catch (error) {
      console.error("Failed to load attention queue:", error);
    }
  }

  if (stocks.length > 0) {
    loadAttentionQueue();
  }
}, [stocks]);

useEffect(() => {
  async function loadWatchlistHealth() {
    try {
      const data = await getWatchlistHealth();
      setWatchlistHealth(data);
    } catch (error) {
      console.error("Failed to load watchlist health:", error);
    }
  }

  if (stocks.length > 0) {
    loadWatchlistHealth();
  }
}, [stocks]);

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

if (selectedStock) {
  return (
    <StockDetail
      symbol={selectedStock}
      onBack={() => setSelectedStock(null)}
    />
  );
}

if (showPortfolio) {
  return (
    <Portfolio
      onBack={() => setShowPortfolio(false)}
    />
  );
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
                    placeholder="Search stocks..."
                    value={searchSymbol}
                    onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchSymbol.trim()) {
                        setSelectedStock(searchSymbol.trim());
                        setSearchSymbol("");
                      }
                    }}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />

              <span className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-400">
                /
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-5">
            <button
              onClick={() =>
                document
                  .getElementById("attention")
                  ?.scrollIntoView({ behavior: "smooth" })
                  
              }
              className="relative text-gray-500 hover:text-black"
            >
              <Bell size={20} />

              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <button
                onClick={() => setShowPortfolio(true)}
                title="Portfolio"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200"
              >
                <User size={18} className="text-gray-600" />
              </button>

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
              onClick={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
            />

            <NavItem
              icon={<Star size={18} />}
              label="My Watchlist"
              onClick={() =>
                document
                  .getElementById("watchlist")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            />

            <NavItem
              icon={<TrendingUp size={18} />}
              label="Markets"
              onClick={() =>
                document
                  .getElementById("markets")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            />

            <NavItem
              icon={<Wallet size={18} />}
              label="Portfolio"
              onClick={() => setShowPortfolio(true)}
            />

            <div className="my-6 border-t border-gray-100" />

            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Your Lists
            </p>

            <NavItem
              icon={<Star size={18} />}
              label="My Stocks"
              onClick={() =>
                document
                  .getElementById("watchlist")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
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

            {/* Since Last Check */}
            {sinceLastCheck &&
              sinceLastCheck.events?.length > 0 && (
                <section className="mb-8">
                  <div className="rounded-2xl border border-green-100 bg-green-50/50 p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-semibold text-green-700">
                          Since you last checked
                        </p>

                        <h3 className="mt-1 text-xl font-semibold text-gray-900">
                          {sinceLastCheck.events.length} meaningful{" "}
                          {sinceLastCheck.events.length === 1
                            ? "change"
                            : "changes"}{" "}
                          detected
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Here's what changed in your watchlist.
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          try {
                            await markEventsSeen();
                            setSinceLastCheck({
                              ...sinceLastCheck,
                              events: [],
                            });
                          } catch (error) {
                            console.error(
                              "Failed to mark events seen:",
                              error
                            );
                          }
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Mark as seen
                      </button>
                    </div>

                    <div className="mt-5 space-y-2">
                      {sinceLastCheck.events.slice(0, 5).map((event) => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedStock(event.symbol)}
                          className="flex cursor-pointer items-center justify-between rounded-xl bg-white p-4 transition hover:shadow-sm"
                        >
                          <div>
                            <p className="font-semibold">
                              {event.symbol}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {event.severity.charAt(0).toUpperCase() +
                                event.severity.slice(1)}{" "}
                              change detected
                            </p>
                          </div>

                          <span className="text-sm font-semibold text-gray-600">
                            {event.score}/100
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

            {/* Attention Card */}
            <section id="attention" className="mb-10">

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Since you last checked
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Meaningful changes across your watchlist
                  </p>
                </div>

                <button
                  onClick={() => setShowAllAttention((current) => !current)}
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-black"
                >
                  {showAllAttention ? "Show less" : "View all"}
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${
                      showAllAttention ? "rotate-90" : ""
                    }`}
                  />
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

                    {(showAllAttention
                      ? attentionEvents
                      : attentionEvents.slice(0, 5)
                    ).map((event) => (
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
            <section id="markets" className="mb-10">

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

            {/* Watchlist Health */}
            {watchlistHealth && (
              <section className="mb-8">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">
                    Watchlist Health
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    A quick view of what needs your attention
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      Total stocks
                    </p>
                    <p className="mt-2 text-3xl font-semibold">
                      {watchlistHealth.total}
                    </p>
                  </div>

                  <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      Need attention
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-red-600">
                      {watchlistHealth.attention}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Score 50+
                    </p>
                  </div>

                  <div className="rounded-xl border border-yellow-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                      Minor changes
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-yellow-600">
                      {watchlistHealth.minor}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Score 25–49
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Attention Queue */}
            {attentionQueue && attentionQueue.count > 0 && (
                <section className="mb-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">
                      Needs Your Attention
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      The most meaningful changes in your watchlist
                    </p>
                  </div>

                  <div className="space-y-3">
                    {attentionQueue.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedStock(event.symbol)}
                        className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">
                                {event.symbol}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  event.severity === "significant"
                                    ? "bg-red-50 text-red-600"
                                    : "bg-orange-50 text-orange-600"
                                }`}
                              >
                                {event.severity}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-gray-500">
                              {event.why_it_matters}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-xl font-semibold">
                              {event.score}
                            </p>
                            <p className="text-xs text-gray-400">
                              / 100
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {/* Watchlist */}
            <section id="watchlist">

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
                    onClick={setSelectedStock}
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

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-green-50 text-green-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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


function StockCard({ stock, history, signal, onRemove, onClick }) {
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
    
    <div 
    onClick={() => onClick?.(stock.symbol)}
    className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm">

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