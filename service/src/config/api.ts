/**
 * API Configuration
 * Update this when your backend URL changes
 */

export const API_BASE_URL = "http://127.0.0.1:8000";

export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/login`,
  register: `${API_BASE_URL}/api/register`,
  verifyToken: `${API_BASE_URL}/api/verify-token`,
};
