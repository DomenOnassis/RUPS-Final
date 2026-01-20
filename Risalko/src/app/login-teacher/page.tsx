"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    console.log("FORM SUBMITTED!");
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          code: null
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Login failed.");
        setSuccess(null);
        return;
      }

      // FIXED: Use localStorage instead of Cookies to match Classes page
      if (data.data) {
        console.log('User data from login:', data.data);
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.data));
        
        console.log('Stored in localStorage:', localStorage.getItem('user'));
      }

      // Store the access token
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
      }

      setSuccess("User logged in successfully!");
      setError(null);
      setEmail("");
      setPassword("");

      // Small delay to ensure localStorage is written
      setTimeout(() => {
        router.push("/classes");
      }, 100);
      
    } catch (err) {
      console.error('Login error:', err);
      setError("Connection error.");
    }
  }

  return (
    <div className="risalko-app">
      <header className="risalko-header">
        <div className="risalko-header-content">
          <button onClick={() => router.back()} className="risalko-back-btn">
            ← Back
          </button>
          <h1 className="risalko-header-title">Teacher Login</h1>
        </div>
      </header>

      <main className="risalko-content-narrow">
        <div className="risalko-card">
          <div className="risalko-card-header">
            <h2 className="risalko-card-title">Welcome Back</h2>
            <p className="risalko-card-subtitle">Sign in to manage your classes and stories</p>
          </div>

          {error && <div className="risalko-alert-error">{error}</div>}
          {success && <div className="risalko-alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="risalko-form-section">
            <div>
              <label htmlFor="email" className="risalko-label">Email</label>
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

            <div>
              <label htmlFor="password" className="risalko-label">Password</label>
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

            <button type="submit" className="risalko-btn risalko-btn-primary w-full">
              Sign In
            </button>
          </form>

          <p className="text-center text-neutral-500 mt-6 text-sm">
            Don't have an account?{" "}
            <a href="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Create account
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
