/**
 * The only place in the app that talks to the network.
 *
 * Calls go to relative '/api/...' paths — Vite's dev proxy forwards them to
 * Express on port 4000, so no CORS and no hardcoded ports anywhere in React.
 */

const TOKEN_KEY = 'procureflow.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();

  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // The backend writes its 4xx messages for a farmer to read, so show them.
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}
