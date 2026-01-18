import { API_ENDPOINTS } from "@/config/api";

export interface LoginResponse {
  data: {
    id: number;
    name: string;
    surname: string;
    email: string;
    type: string;
    code?: string;
    is_active: boolean;
  };
  access_token: string;
  token_type: string;
}

export interface RegisterData {
  name: string;
  surname: string;
  email: string;
  password: string;
  type: "student" | "teacher";
}

export interface LoginData {
  email?: string;
  password?: string;
  code?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public detail?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function login(data: LoginData): Promise<LoginResponse> {
  const response = await fetch(API_ENDPOINTS.login, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new ApiError(
      responseData.detail || "Login failed",
      response.status,
      responseData.detail
    );
  }

  return responseData;
}

export async function register(data: RegisterData): Promise<LoginResponse["data"]> {
  const response = await fetch(API_ENDPOINTS.register, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new ApiError(
      responseData.detail || "Registration failed",
      response.status,
      responseData.detail
    );
  }

  return responseData;
}

export function saveAuthData(data: LoginResponse) {
  if (data.data) {
    localStorage.setItem("user", JSON.stringify(data.data));
  }
  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
  }
}

export function clearAuthData() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

export function getStoredUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function getStoredToken() {
  return localStorage.getItem("token");
}
