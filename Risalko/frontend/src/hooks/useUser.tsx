"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export function useUser() {
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const type = Cookies.get("userType");
    setUserType(type || null);
  }, []);

  return userType;
}
