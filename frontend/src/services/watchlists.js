import { apiFetch } from "./api";

// Get all watchlists
export async function getWatchlists() {
  return apiFetch("/api/watchlists");
}

// Create a watchlist
export async function createWatchlist(name) {
  return apiFetch("/api/watchlists", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

// Delete a watchlist
export async function deleteWatchlist(watchlistId) {
  return apiFetch(`/api/watchlists/${watchlistId}`, {
    method: "DELETE",
  });
}

// Get stocks in a watchlist
export async function getWatchlistStocks(watchlistId) {
  return apiFetch(`/api/watchlists/${watchlistId}/stocks`);
}

// Add stock to watchlist
export async function addStock(watchlistId, symbol) {
  return apiFetch(`/api/watchlists/${watchlistId}/stocks`, {
    method: "POST",
    body: JSON.stringify({
      symbol: symbol.trim().toUpperCase(),
    }),
  });
}

// Remove stock from watchlist
export async function removeStock(watchlistId, symbol) {
  return apiFetch(
    `/api/watchlists/${watchlistId}/stocks/${symbol.trim().toUpperCase()}`,
    {
      method: "DELETE",
    }
  );
}