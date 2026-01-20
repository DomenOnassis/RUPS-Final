"use client";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/config/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState<"student" | "teacher">("teacher");
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

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          surname,
          email,
          password,
          type: userType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Auto-login after successful registration
      const loginRes = await fetch(API_ENDPOINTS.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code: null }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok) {
        if (loginData.data) {
          localStorage.setItem("user", JSON.stringify(loginData.data));
        }
        if (loginData.access_token) {
          localStorage.setItem("token", loginData.access_token);
        }
      }

      // Redirect to home
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Registration error:", err);
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
        <h1 className="risalko-card-title risalko-mb-6">Create Account</h1>
        <p className="risalko-card-subtitle">Join us today</p>

        {error && <div className="risalko-alert-error">{error}</div>}

        <div className="risalko-toggle-group">
          <button
            type="button"
            className={`risalko-toggle-btn ${userType === "teacher" ? "active" : ""}`}
            onClick={() => setUserType("teacher")}
          >
            Teacher
          </button>
          <button
            type="button"
            className={`risalko-toggle-btn ${userType === "student" ? "active" : ""}`}
            onClick={() => setUserType("student")}
          >
            Student
          </button>
        </div>

        <form onSubmit={handleSubmit} className="risalko-form">
          <div className="risalko-form-row">
            <div className="risalko-form-group">
              <label htmlFor="name" className="risalko-label">
                First Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter your first name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="risalko-input"
                required
              />
            </div>

            <div className="risalko-form-group">
              <label htmlFor="surname" className="risalko-label">
                Last Name
              </label>
              <input
                id="surname"
                type="text"
                placeholder="Enter your last name"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="risalko-input"
                required
              />
            </div>
          </div>

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
              placeholder="Create a password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="risalko-input"
              required
              minLength={6}
            />
          </div>

          <div className="risalko-form-group">
            <label htmlFor="confirmPassword" className="risalko-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="risalko-input"
              required
            />
          </div>

          <button
            type="submit"
            className="risalko-btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="risalko-text-center risalko-text-muted risalko-mt-4">
          Already have an account?{" "}
          <a href="/login" className="risalko-link">
            Sign in here
          </a>
        </p>
      </div>
    </main>
  );
}
