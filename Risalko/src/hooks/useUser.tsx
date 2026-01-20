"use client";
import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  type: string;
  code?: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for user (set by AppLauncher)
    const userStr = localStorage.getItem("user");
    
    if (!userStr) {
      // Redirect to AppLauncher if not authenticated
      window.location.href = "http://localhost:3002/login";
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setUserType(userData.type || null);
    } catch (err) {
      console.error("Failed to parse user data:", err);
      window.location.href = "http://localhost:3002/login";
    }
  }, []);

  return userType;
}

export function useUserData() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    
    if (!userStr) {
      window.location.href = "http://localhost:3002/login";
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (err) {
      console.error("Failed to parse user data:", err);
      window.location.href = "http://localhost:3002/login";
    }
  }, []);

  return user;
}
