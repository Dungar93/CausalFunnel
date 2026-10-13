/**
 * API Service for CausalFunnel Analytics Dashboard
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function handleResponse(res) {
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const data = await res.json();
      errorDetail = data.message || data.error || errorDetail;
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    const err = new Error(errorDetail);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return handleResponse(res);
}

export async function fetchStatsSummary() {
  const res = await fetch(`${BASE_URL}/stats/summary`);
  return handleResponse(res);
}

export async function fetchSessions({ page = 1, limit = 10, search = '' } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  if (search) params.set('search', search);

  const res = await fetch(`${BASE_URL}/sessions?${params.toString()}`);
  return handleResponse(res);
}

export async function fetchSessionEvents(sessionId) {
  if (!sessionId) throw new Error('sessionId is required');
  const res = await fetch(`${BASE_URL}/sessions/${encodeURIComponent(sessionId)}/events`);
  return handleResponse(res);
}

export async function fetchHeatmap(url) {
  if (!url) throw new Error('url query parameter is required');
  const res = await fetch(`${BASE_URL}/heatmap?url=${encodeURIComponent(url)}`);
  return handleResponse(res);
}

export async function fetchTrackedPages() {
  const res = await fetch(`${BASE_URL}/heatmap/pages`);
  return handleResponse(res);
}

export async function fetchFunnelMetrics() {
  const res = await fetch(`${BASE_URL}/funnel`);
  return handleResponse(res);
}

export async function fetchRecentEvents(limit = 25) {
  const res = await fetch(`${BASE_URL}/events/recent?limit=${limit}`);
  return handleResponse(res);
}

export async function simulateTraffic(count = 3) {
  const res = await fetch(`${BASE_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count }),
  });
  return handleResponse(res);
}

export function getExportCsvUrl() {
  return `${BASE_URL}/sessions/export/csv`;
}

export async function sendEvent(eventData) {
  const res = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  return handleResponse(res);
}
