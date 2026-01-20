"use client";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/config/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [isStudentLogin, setIsStudentLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      // User is already logged in, redirect to home
      router.push("/");
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload = isStudentLogin
        ? { code: studentCode }
        : { email, password, code: null };

      const res = await fetch(API_ENDPOINTS.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Login failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Store user data and token
      if (data.data) {
        localStorage.setItem("user", JSON.stringify(data.data));
      }
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }

      // Redirect to home
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Connection error. Please try again.");
      setIsLoading(false);
    }
  }

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <main className="risalko-centered">
        <div className="risalko-card risalko-content-narrow">
          <div className="risalko-loading">
            <div className="risalko-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="risalko-centered">
      <div className="risalko-card risalko-content-narrow">
        <h1 className="risalko-card-title risalko-mb-6">Welcome Back</h1>
        <p className="risalko-card-subtitle">Sign in to continue</p>

        {error && <div className="risalko-alert-error">{error}</div>}

        <div className="risalko-toggle-group">
          <button
            type="button"
            className={`risalko-toggle-btn ${!isStudentLogin ? "active" : ""}`}
            onClick={() => setIsStudentLogin(false)}
          >
            Teacher
          </button>
          <button
            type="button"
            className={`risalko-toggle-btn ${isStudentLogin ? "active" : ""}`}
            onClick={() => setIsStudentLogin(true)}
          >
            Student
          </button>
        </div>

        <form onSubmit={handleSubmit} className="risalko-form">
          {isStudentLogin ? (
            <div className="risalko-form-group">
              <label htmlFor="code" className="risalko-label">
                Student Code
              </label>
              <input
                id="code"
                type="text"
                placeholder="Enter your student code"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                className="risalko-input"
                required
              />
            </div>
          ) : (
            <>
              <div className="risalko-form-group">
                <label htmlFor="email" className="risalko-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="risalko-input"
                  required
                />
              </div>

              <div className="risalko-form-group">
                <label htmlFor="password" className="risalko-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="risalko-input"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="risalko-btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {!isStudentLogin && (
          <p className="risalko-text-center risalko-text-muted risalko-mt-4">
            Don&apos;t have an account?{" "}
            <a href="/register" className="risalko-link">
              Register here
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
