/**
 * API Configuration for Vezalko
 * Update these URLs when deploying to production
 */

export const API_BASE_URL = "http://127.0.0.1:8000";
export const APP_LAUNCHER_URL = "http://localhost:3002";

export const API_ENDPOINTS = {
  circuits: `${API_BASE_URL}/api/circuits`,
  challenges: `${API_BASE_URL}/api/challenges`,
  users: `${API_BASE_URL}/api/users`,
  login: `${API_BASE_URL}/api/login`,
  register: `${API_BASE_URL}/api/register`,
};
