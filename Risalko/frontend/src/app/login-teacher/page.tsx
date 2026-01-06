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
      const res = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Pri prijavi je prišlo do napake.");
        setSuccess(null);
        return;
      }

      if (data.data) {
        localStorage.setItem('user', JSON.stringify(data.data));
      }

      setSuccess("Uporabnik uspešno prijavljen!");
      setError(null);
      setEmail("");
      setPassword("");

      router.push("/classes");
    } catch (err) {
      setError("Napaka pri povezavi s strežnikom.");
    }
  };

  return (
    <div className="background min-h-screen flex items-center justify-center p-4">
      <div className="section-dark max-w-md w-full">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-yellow-100 hover:text-yellow-200 transition-colors font-medium text-2xl"
          >
            ←
          </button>
        </div>
        <h1 className="text-3xl font-bold text-center mb-6 gradient-text">
          Prijavi se kot učitelj
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm text-center mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm text-center mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
              E-pošta
            </label>
            <input
              id="email"
              type="email"
              placeholder="vnesi e-poštni naslov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-text"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
              Geslo
            </label>
            <input
              id="password"
              type="password"
              placeholder="vnesi geslo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-text"
              required
            />
          </div>

          <button
            type="submit"
            className="btn bg-yellow-100 text-text w-full"
          >
            Prijava
          </button>
        </form>
      </div>
    </div>
  );
}