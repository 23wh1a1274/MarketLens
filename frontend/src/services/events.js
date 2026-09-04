import { apiFetch } from "./api";

export async function getAttentionEvents() {
  return apiFetch("/api/events/attention");
}

export async function getEventsSinceLastCheck() {
  return apiFetch("/api/events/since-last-check");
}

export async function markEventsSeen() {
  return apiFetch("/api/events/mark-seen", {
    method: "POST",
  });
}

export async function getLatestEvent(symbol) {
  return apiFetch(`/api/events/latest/${symbol}`);
}

export async function getStockEvents(symbol) {
  return apiFetch(`/api/events/stock/${symbol}`);
}

export async function getWatchlistHealth() {
  return apiFetch("/api/events/watchlist-health");
}

export async function getAttentionQueue() {
  return apiFetch("/api/events/attention");
}
