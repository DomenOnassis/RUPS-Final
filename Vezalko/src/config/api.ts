// API Configuration - Uses same backend as original Vezalko
export const API_BASE_URL = "http://127.0.0.1:8000";
export const APP_LAUNCHER_URL = "http://localhost:3002";

export const API_ENDPOINTS = {
  // Auth
  login: `${API_BASE_URL}/api/login`,
  register: `${API_BASE_URL}/api/register`,
  
  // Users
  users: `${API_BASE_URL}/api/users`,
  userStats: (userId: number) => `${API_BASE_URL}/api/users/${userId}/stats`,
  userChallengeComplete: (userId: number) => `${API_BASE_URL}/api/users/${userId}/challenge-complete`,
  
  // Challenges - correct endpoints
  challenges: `${API_BASE_URL}/challenges`,
  challengesByWorkspace: (workspaceType: string) => `${API_BASE_URL}/challenges/by-workspace/${workspaceType}`,
  challenge: (challengeId: number) => `${API_BASE_URL}/challenges/${challengeId}`,
  challengeStats: `${API_BASE_URL}/challenges/stats`,
  challengeComplete: (challengeId: number) => `${API_BASE_URL}/challenges/complete/${challengeId}`,
  leaderboard: `${API_BASE_URL}/challenges/leaderboard/top`,
  
  // Circuits
  circuits: `${API_BASE_URL}/api/circuits`,
  circuit: (circuitId: number) => `${API_BASE_URL}/api/circuits/${circuitId}`,
  userCircuits: (userId: number) => `${API_BASE_URL}/api/users/${userId}/circuits`,
};

// Helper to get auth headers
export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

// API helper functions
export async function apiGet<T>(url: string, requireAuth = true): Promise<T> {
  const headers = requireAuth ? getAuthHeaders() : { 'Content-Type': 'application/json' };
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

export async function apiPost<T>(url: string, data: unknown, requireAuth = true): Promise<T> {
  const headers = requireAuth ? getAuthHeaders() : { 'Content-Type': 'application/json' };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

export async function apiPut<T>(url: string, data: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

export async function apiDelete(url: string): Promise<void> {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
}
