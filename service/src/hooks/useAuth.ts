import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  type: string;
  code?: string;
}

export function useAuth(redirectIfNotAuth = true) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    
    if (!userStr) {
      if (redirectIfNotAuth) {
        router.push("/login");
      }
      setIsLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (err) {
      console.error("Failed to parse user data:", err);
      if (redirectIfNotAuth) {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, redirectIfNotAuth]);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return { user, isLoading, logout };
}
