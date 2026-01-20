"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
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
          code: key,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Student login error.");
        setSuccess(null);
        return;
      }

      if (data.data) {
        localStorage.setItem('user', JSON.stringify(data.data));
      }

      setSuccess("Successfully logged in!");
      setError(null);
      setKey("");

      router.push("/classes");
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
          <h1 className="risalko-header-title">Student Login</h1>
        </div>
      </header>

      <main className="risalko-content-narrow">
        <div className="risalko-card">
          <div className="risalko-card-header">
            <h2 className="risalko-card-title">Welcome!</h2>
            <p className="risalko-card-subtitle">Enter your access code to continue</p>
          </div>

          {error && <div className="risalko-alert-error">{error}</div>}
          {success && <div className="risalko-alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="risalko-form-section">
            <div>
              <label htmlFor="key" className="risalko-label">Access Code</label>
              <input
                id="key"
                name="key"
                type="text"
                placeholder="Enter your code"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="risalko-input"
                required
              />
            </div>

            <button type="submit" className="risalko-btn risalko-btn-primary w-full">
              Continue
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
