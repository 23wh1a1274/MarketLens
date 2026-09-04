import { useEffect, useState } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "../services/api";

export default function Portfolio({ onBack }) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  async function loadPortfolio() {
    try {
      setLoading(true);
      const data = await apiFetch("/api/portfolio");
      setPortfolio(data);
    } catch (error) {
      console.error("Failed to load portfolio:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortfolio();
  }, []);

  async function handleAddHolding(e) {
    e.preventDefault();

    try {
      await apiFetch("/api/portfolio", {
        method: "POST",
        body: JSON.stringify({
          symbol: symbol.trim().toUpperCase(),
          quantity: Number(quantity),
          average_buy_price: Number(price),
        }),
      });

      setSymbol("");
      setQuantity("");
      setPrice("");

      await loadPortfolio();
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`/api/portfolio/${id}`, {
        method: "DELETE",
      });

      await loadPortfolio();
    } catch (error) {
      alert(error.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-40 rounded bg-gray-200" />
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 rounded-xl bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const summary = portfolio?.summary || {};
  const holdings = portfolio?.holdings || [];

  const pnlPositive = Number(summary.total_pnl || 0) >= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Portfolio
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Track your holdings and portfolio performance.
          </p>
        </div>

        {/* Summary */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            label="Portfolio Value"
            value={`₹${Number(
              summary.total_current || 0
            ).toLocaleString("en-IN")}`}
          />

          <SummaryCard
            label="Invested"
            value={`₹${Number(
              summary.total_invested || 0
            ).toLocaleString("en-IN")}`}
          />

          <SummaryCard
            label="Total P&L"
            value={`₹${Number(
              summary.total_pnl || 0
            ).toLocaleString("en-IN")}`}
            positive={pnlPositive}
          />

          <SummaryCard
            label="Return"
            value={`${
              pnlPositive ? "+" : ""
            }${Number(
              summary.total_pnl_percent || 0
            ).toFixed(2)}%`}
            positive={pnlPositive}
          />

        </div>

        {/* Add Holding */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-5">
            <h2 className="font-semibold">
              Add Holding
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Add a stock you currently own.
            </p>
          </div>

          <form
            onSubmit={handleAddHolding}
            className="grid gap-3 md:grid-cols-4"
          >
            <input
              value={symbol}
              onChange={(e) =>
                setSymbol(e.target.value.toUpperCase())
              }
              placeholder="Symbol e.g. TCS"
              required
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500"
            />

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
              placeholder="Quantity"
              required
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
              placeholder="Average buy price"
              required
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500"
            />

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Plus size={16} />
              Add Holding
            </button>
          </form>

        </div>

        {/* Holdings */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6">
            <h2 className="font-semibold">
              Your Holdings
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Current performance of your investments.
            </p>
          </div>

          {holdings.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              No holdings yet. Add your first stock above.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">

              {holdings.map((holding) => {
                const positive =
                  Number(holding.pnl) >= 0;

                return (
                  <div
                    key={holding.id}
                    className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
                  >

                    <div>
                      <p className="font-semibold">
                        {holding.symbol}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        {holding.quantity} shares · Avg ₹
                        {Number(
                          holding.average_buy_price
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-4">

                      <div>
                        <p className="text-xs text-gray-400">
                          Current Price
                        </p>
                        <p className="mt-1 font-medium">
                          ₹{Number(
                            holding.current_price
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">
                          Current Value
                        </p>
                        <p className="mt-1 font-medium">
                          ₹{Number(
                            holding.current_value
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">
                          P&L
                        </p>

                        <p
                          className={`mt-1 flex items-center gap-1 font-semibold ${
                            positive
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {positive ? (
                            <TrendingUp size={14} />
                          ) : (
                            <TrendingDown size={14} />
                          )}

                          {positive ? "+" : ""}₹
                          {Math.abs(
                            Number(holding.pnl)
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">
                          Return
                        </p>

                        <p
                          className={`mt-1 font-semibold ${
                            positive
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {positive ? "+" : ""}
                          {Number(
                            holding.pnl_percent
                          ).toFixed(2)}%
                        </p>
                      </div>

                    </div>

                    <button
                      onClick={() =>
                        handleDelete(holding.id)
                      }
                      className="self-end rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 md:self-auto"
                      title="Remove holding"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  positive,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-semibold ${
          positive === true
            ? "text-green-600"
            : positive === false
              ? "text-red-600"
              : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}