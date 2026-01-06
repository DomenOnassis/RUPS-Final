"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
      setError("Gesli se ne ujemata!");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/api/users", {
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
        setError(data.error || "Pri registraciji je prišlo do napake.");
        setSuccess(null);
        return;
      }

      if (data.data) {
        localStorage.setItem('user', JSON.stringify(data.data));
      }

      setSuccess("Uporabnik uspešno ustvarjen!");
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
      setError("Napaka pri povezavi s strežnikom.");
    }
  }

  return (
    <div className="background min-h-screen flex items-center justify-center p-4">
      <div className="section-dark max-w-xl w-full">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-yellow-100 hover:text-yellow-200 transition-colors font-medium text-2xl"
          >
            ←
          </button>
        </div>
        <h1 className="text-3xl font-bold text-center mb-6 gradient-text">
          Ustvari račun
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
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Ime
            </label>
            <input
              type="text"
              placeholder="vnesi ime"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Priimek
            </label>
            <input
              type="text"
              placeholder="vnesi priimek"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="input-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              E-pošta
            </label>
            <input
              type="email"
              placeholder="vnesi e-poštni naslov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Geslo
            </label>
            <input
              type="password"
              placeholder="vnesi geslo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Potrdi geslo
            </label>
            <input
              type="password"
              placeholder="ponovno vnesi geslo"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-text"
            />
          </div>

          <button
            type="submit"
            className="btn bg-yellow-100 text-text w-full"
          >
            Registracija
          </button>
        </form>

        <p className="text-center text-gray-200 mt-6 text-sm">
          Že imaš račun?{" "}
          <a href="/login-teacher" className="text-yellow-100 hover:underline font-semibold">
            Prijavi se
          </a>
        </p>
      </div>
    </div>
  );
}
