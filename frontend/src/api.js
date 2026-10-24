const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function fetchDashboard(deliveryDate, cutoff) {
  const params = new URLSearchParams({ delivery_date: deliveryDate, cutoff });
  const response = await fetch(`${API_BASE}/api/dashboard?${params.toString()}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || `API request failed (${response.status})`);
  }
  return body;
}
