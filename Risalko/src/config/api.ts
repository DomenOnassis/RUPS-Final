/**
 * API Configuration for Risalko
 * Update these URLs when deploying to production
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
export const APP_LAUNCHER_URL = process.env.NEXT_PUBLIC_APP_LAUNCHER_URL || "http://localhost:3002";

export const API_ENDPOINTS = {
  classes: `${API_BASE_URL}/api/classes`,
  stories: `${API_BASE_URL}/api/stories`,
  paragraphs: `${API_BASE_URL}/api/paragraphs`,
  users: `${API_BASE_URL}/api/users`,
  login: `${API_BASE_URL}/api/login`,
  register: `${API_BASE_URL}/api/register`,
};
