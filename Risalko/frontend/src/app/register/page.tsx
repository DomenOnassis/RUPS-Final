"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirm) {
      setError("Passwords do not match!");
      return;
    }

    try {
      // CHANGED: Updated endpoint to /api/register instead of /api/users
      const res = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          surname,
          email,
          password,
          type: "teacher",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // CHANGED: Backend now returns 'detail' instead of 'error'
        setError(data.detail || "Registration failed.");
        setSuccess(null);
        return;
      }

      // CHANGED: Save to cookies instead of localStorage
      if (data) {
        console.log('User data from register:', data);
        Cookies.set('user', JSON.stringify(data));
        Cookies.set('userType', data.type);
        if (data.id) {
          Cookies.set('userId', data.id.toString());
        }
      }

      setSuccess("Account created successfully!");
      setError(null);
      setName("");
      setSurname("");
      setEmail("");
      setPassword("");
      setConfirm("");

      // Redirect to classes after a short delay to show success message
      setTimeout(() => {
        router.push("/classes");
      }, 500);
    } catch (err) {
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
          <h1 className="risalko-header-title">Create Account</h1>
        </div>
      </header>

      <main className="risalko-content-narrow">
        <div className="risalko-card">
          <div className="risalko-card-header">
            <h2 className="risalko-card-title">Get Started</h2>
            <p className="risalko-card-subtitle">Create your teacher account to begin</p>
          </div>

          {error && <div className="risalko-alert-error">{error}</div>}
          {success && <div className="risalko-alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="risalko-form-section">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="risalko-label">First Name</label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="risalko-input"
                  required
                />
              </div>

              <div>
                <label className="risalko-label">Last Name</label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="risalko-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="risalko-label">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="risalko-input"
                required
              />
            </div>

            <div>
              <label className="risalko-label">Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="risalko-input"
                required
              />
            </div>

            <div>
              <label className="risalko-label">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="risalko-input"
                required
              />
            </div>

            <button type="submit" className="risalko-btn risalko-btn-primary w-full">
              Create Account
            </button>
          </form>

          <p className="text-center text-neutral-500 mt-6 text-sm">
            Already have an account?{" "}
            <a href="/login-teacher" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Sign in
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}