const API_BASE_URL = "https://marketlens-b9rw.onrender.com/";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

if (!response.ok) {
  const error = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/";
    throw new Error("Your session has expired. Please sign in again.");
  }

  throw new Error(
    error.detail || `Request failed: ${response.status}`
  );
}

  return response.json();
}