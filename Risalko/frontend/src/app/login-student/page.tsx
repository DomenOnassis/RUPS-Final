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
      const res = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: key,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Napaka pri prijavi študenta.");
        setSuccess(null);
        return;
      }

      if (data.data) {
        localStorage.setItem('user', JSON.stringify(data.data));
      }

      setSuccess("Uspešno prijavljen!");
      setError(null);
      setKey("");

      router.push("/classes");
    } catch (err) {
      setError("Napaka pri povezavi s strežnikom.");
    }
  }

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
          Prijavi se kot učenec
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm text-center">
              {success}
            </div>
          )}

          <div>
            <label
              htmlFor="key"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Ključ
            </label>
            <input
              id="key"
              name="key"
              type="text"
              placeholder="vnesi ključ"
              value={key}
              onChange={(e) => setKey(e.target.value)}
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
