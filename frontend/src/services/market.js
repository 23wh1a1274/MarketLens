import { apiFetch } from "./api";

export async function getStockSnapshot(symbol) {
  return apiFetch(`/api/market/snapshot/${symbol}`);
}

export async function getMarketIndices() {
  return apiFetch("/api/market/indices");
}

export async function getStockHistory(symbol) {
  return apiFetch(`/api/market/history/${symbol}`);
}