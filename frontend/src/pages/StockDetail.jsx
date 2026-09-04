import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  getStockSnapshot,
  getStockHistory,
} from "../services/market";

import {
  getLatestEvent,
  getStockEvents,
} from "../services/events";

export default function StockDetail({ symbol, onBack }) {
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [signal, setSignal] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStock() {
      try {
        const [
            snapshot,
            stockHistory,
            latestSignal,
            stockEvents,
            ] = await Promise.all([
            getStockSnapshot(symbol),
            getStockHistory(symbol),
            getLatestEvent(symbol),
            getStockEvents(symbol),
            ]);

        setStock(snapshot);
        setHistory(stockHistory || []);
        setSignal(latestSignal);
        setEvents(stockEvents || []);
      } catch (error) {
        console.error("Failed to load stock:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStock();
  }, [symbol]);

  const chartData = useMemo(() => {
    return history.map((point) => ({
      date: new Date(point.timestamp).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
        }
      ),
      price: Number(point.price),
      volume: Number(point.volume || 0),
    }));
  }, [history]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="mt-8 h-10 w-40 rounded bg-gray-200" />
          <div className="mt-3 h-8 w-48 rounded bg-gray-200" />
          <div className="mt-8 h-96 rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <p className="text-red-500">
          Unable to load stock data.
        </p>
      </div>
    );
  }

  const price = Number(stock.price || 0);
  const previousClose = Number(stock.previous_close || 0);

  const change =
    previousClose > 0
      ? ((price - previousClose) / previousClose) * 100
      : 0;

  const positive = change >= 0;

  const high = Number(stock.high || 0);
  const low = Number(stock.low || 0);
  const open = Number(stock.open || 0);
  const volume = Number(stock.volume || 0);

  const severity = signal?.severity || "normal";

  const reasons = (() => {
    try {
      if (!signal?.reasons) return [];

      if (Array.isArray(signal.reasons)) {
        return signal.reasons;
      }

      return JSON.parse(signal.reasons);
    } catch {
      return [];
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Back */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>

        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

            <div>
              <p className="text-sm font-medium text-gray-400">
                NSE Equity
              </p>

              <div className="mt-2 flex items-center gap-4">
                <h1 className="text-4xl font-bold tracking-tight">
                  {symbol}
                </h1>

                <div
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
                    positive
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {positive ? (
                    <TrendingUp size={15} />
                  ) : (
                    <TrendingDown size={15} />
                  )}

                  {positive ? "+" : ""}
                  {change.toFixed(2)}%
                </div>
              </div>

              <p className="mt-3 text-4xl font-semibold tracking-tight">
                ₹
                {price.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* Signal badge */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 md:min-w-[210px]">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                MarketLens Signal
              </p>

              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`text-lg font-semibold ${
                    severity === "significant"
                      ? "text-red-600"
                      : severity === "notable"
                        ? "text-orange-600"
                        : severity === "minor"
                          ? "text-yellow-600"
                          : "text-gray-700"
                  }`}
                >
                  {severity.charAt(0).toUpperCase() +
                    severity.slice(1)}
                </span>

                <span className="text-sm font-medium text-gray-500">
                  {signal?.score ?? 0}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">

          <StatCard
            label="Open"
            value={`₹${open.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          />

          <StatCard
            label="Day High"
            value={`₹${high.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          />

          <StatCard
            label="Day Low"
            value={`₹${low.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          />

          <StatCard
            label="Volume"
            value={volume.toLocaleString("en-IN")}
          />

        </div>

        {/* Main content */}
        <div className="mt-5 grid gap-5 lg:grid-cols-3">

          {/* Chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Price History
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Recent market movement
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                <Activity size={14} />
                1M
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="flex h-80 items-center justify-center text-sm text-gray-400">
                No historical data available
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>

                    <defs>
                      <linearGradient
                        id="priceGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#22c55e"
                          stopOpacity={0.25}
                        />

                        <stop
                          offset="100%"
                          stopColor="#22c55e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f1f1"
                    />

                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 11,
                        fill: "#9ca3af",
                      }}
                    />

                    <YAxis
                      domain={["auto", "auto"]}
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 11,
                        fill: "#9ca3af",
                      }}
                      tickFormatter={(value) =>
                        `₹${Number(value).toLocaleString(
                          "en-IN"
                        )}`
                      }
                      width={70}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        boxShadow:
                          "0 8px 25px rgba(0,0,0,0.08)",
                      }}
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                          }
                        )}`,
                        "Price",
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#16a34a"
                      strokeWidth={2.5}
                      fill="url(#priceGradient)"
                      dot={false}
                      activeDot={{
                        r: 5,
                        strokeWidth: 2,
                      }}
                    />

                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Why it matters */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-50 p-2 text-green-600">
                <BarChart3 size={17} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Why it matters
                </h2>

                <p className="text-xs text-gray-400">
                  MarketLens analysis
                </p>
              </div>
            </div>

            <div className="mt-6">

              {reasons.length > 0 ? (
                <div className="space-y-3">
                  {reasons.map((reason, index) => (
                    <div
                      key={index}
                      className="rounded-lg bg-gray-50 p-3 text-sm leading-5 text-gray-600"
                    >
                      {reason}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm leading-6 text-gray-600">
                    No significant change detected
                    compared with this stock's normal
                    market behavior.
                  </p>
                </div>
              )}

            </div>

            {/* Score */}
            <div className="mt-7 border-t border-gray-100 pt-6">

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Change score
                </span>

                <span className="text-sm font-semibold">
                  {signal?.score ?? 0}/100
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{
                    width: `${Math.min(
                      signal?.score ?? 0,
                      100
                    )}%`,
                  }}
                />
              </div>

            </div>
          </div>
        </div>

        {/* Event Timeline */}
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div>
                <h2 className="text-lg font-semibold">
                Recent Market Activity
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                How MarketLens has been tracking this stock
                </p>
            </div>

            {events.length === 0 ? (
                <div className="mt-6 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
                No market events recorded yet.
                </div>
            ) : (
                <div className="relative mt-7">

                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

                <div className="space-y-7">

                    {events.map((event) => {

                    const eventReasons = (() => {
                        try {
                        if (!event.reasons) return [];

                        if (Array.isArray(event.reasons)) {
                            return event.reasons;
                        }

                        return JSON.parse(event.reasons);
                        } catch {
                        return [];
                        }
                    })();

                    const eventColor =
                        event.severity === "significant"
                        ? "bg-red-500"
                        : event.severity === "notable"
                            ? "bg-orange-500"
                            : event.severity === "minor"
                            ? "bg-yellow-500"
                            : "bg-gray-300";

                    return (
                        <div
                        key={event.id}
                        className="relative flex gap-5"
                        >

                        <div
                            className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white ${eventColor}`}
                        />

                        <div className="min-w-0 flex-1">

                            <div className="flex flex-col justify-between gap-2 sm:flex-row">

                            <div>
                                <p className="font-semibold">
                                {event.severity
                                    .charAt(0)
                                    .toUpperCase() +
                                    event.severity.slice(1)}{" "}
                                change detected
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                {new Date(
                                    event.timestamp
                                ).toLocaleString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "numeric",
                                    minute: "2-digit",
                                })}
                                </p>
                            </div>

                            <span className="h-fit rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
                                Score {event.score}/100
                            </span>

                            </div>

                            {eventReasons.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {eventReasons.map(
                                (reason, index) => (
                                    <p
                                    key={index}
                                    className="text-sm text-gray-600"
                                    >
                                    {reason}
                                    </p>
                                )
                                )}
                            </div>
                            )}

                        </div>
                        </div>
                    );
                    })}

                </div>
                </div>
            )}
            </div>

        {/* Bottom insight */}
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-gray-50 p-3">
              <Activity
                size={20}
                className="text-gray-500"
              />
            </div>

            <div>
              <h3 className="font-semibold">
                MarketLens insight
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                MarketLens compares price movement,
                trading volume and volatility against
                the stock's normal behavior instead of
                relying only on fixed price thresholds.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}