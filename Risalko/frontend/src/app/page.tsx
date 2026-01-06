"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="background min-h-screen flex flex-col">
      <main className="container mx-auto px-4 py-16 flex-1">
        <div className="text-center mb-16 animate-bounce-slow">
          <h1 className="text-7xl md:text-9xl font-black mb-6 gradient-text text-outline-dark">
            🎨 Risalko 🌈
          </h1>
          <p className="text-2xl md:text-3xl text-text max-w-3xl mx-auto leading-relaxed font-bold">
            Kjer zgodbe oživijo skozi otroško domišljijo in umetnost! ✨
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <div className="card bg-yellow-100 border-4 border-gray-500/60">
            <div className="text-6xl mb-4 animate-wiggle">📖</div>
            <h2 className="text-3xl font-black mb-3 text-orange-800">
              Preberi zgodbe
            </h2>
            <p className="text-lg text-orange-700 font-semibold">
              Učitelji delijo vznemirljive odlomke zgodb, ki vzbudijo
              ustvarjalnost in radovednost! 🌟
            </p>
          </div>

          <div className="card bg-pink-100 border-4 border-gray-500/60">
            <div className="text-6xl mb-4 animate-wiggle">🎨</div>
            <h2 className="text-3xl font-black mb-3 text-purple-800">
              Riši in ustvari
            </h2>
            <p className="text-lg text-purple-700 font-semibold">
              Učenci oživijo svojo domišljijo s pisanimi risbami in
              ilustracijami! 🖍️
            </p>
          </div>

          <div className="card bg-blue-100 border-4 border-gray-500/60">
            <div className="text-6xl mb-4 animate-wiggle">✨</div>
            <h2 className="text-3xl font-black mb-3 text-blue-800">
              Ustvarjajte skupaj
            </h2>
            <p className="text-lg text-blue-700 font-semibold">
              Sodelujte pri ustvarjanju novih zgodb, polnih umetnosti in
              domišljije! 🎪
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="section-dark max-w-3xl mx-auto rounded-3xl border-dashed border-yellow-200 p-10">
            <h3 className="text-4xl font-black gradient-text">
              🚀 Pripravljeni začeti svojo ustvarjalno pot?
            </h3>
            <p className="text-xl text-gray-200 mb-8 font-bold">
              Pridružite se Risalku in sprostite svojo domišljijo! 🎉
            </p>
            <div className="space-y-6">
              <button
                onClick={() => router.push("/register")}
                className="btn bg-yellow-100 text-text w-full"
              >
                🪄 Registriraj se 🌟
              </button>

              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                <button
                  onClick={() => router.push("/login-student")}
                  className="btn bg-sky-400 text-text flex-1"
                >
                  👦 Prijavi se kot učenec 🎒
                </button>
                <button
                  onClick={() => router.push("/login-teacher")}
                  className="btn bg-green-300 text-text flex-1"
                >
                  👨‍🏫 Prijavi se kot učitelj 📚
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-text font-bold text-lg">
        <p>🌈 © 2025 Risalko - Opolnomočimo mlade pripovedovalce in umetnike! 🎨</p>
      </footer>
    </div>
  );
}
