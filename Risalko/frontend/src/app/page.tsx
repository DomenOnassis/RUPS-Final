"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Check if user is authenticated
    const userStr = localStorage.getItem("user");
    
    if (userStr) {
      // User is authenticated, redirect to classes
      window.location.href = "/classes";
    } else {
      // User is not authenticated, redirect to AppLauncher
      window.location.href = "http://localhost:3002/login";
    }
  }, []);

  return (
    <div className="background min-h-screen flex flex-col items-center justify-center">
      <main className="container mx-auto px-4 py-16 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-center mb-8">
            <h1 className="text-7xl md:text-9xl font-black mb-6 gradient-text text-outline-dark">
              🎨 Risalko 🌈
            </h1>
            <p className="text-2xl md:text-3xl text-text max-w-3xl mx-auto leading-relaxed font-bold">
              Kjer zgodbe oživijo skozi otroško domišljijo in umetnost! ✨
            </p>
          </div>

          <div className="section-dark max-w-3xl mx-auto rounded-3xl p-10">
            <h3 className="text-3xl font-black gradient-text mb-6">
              🔄 Preusmeritev...
            </h3>
            <p className="text-xl text-gray-200 mb-8 font-bold">
              Risalko zdaj uporablja centralizirano prijavo.
            </p>
            <p className="text-lg text-gray-300 mb-6">
              Če niste bili avtomatsko preusmerjeni, kliknite spodaj:
            </p>
            <a
              href="http://localhost:3002"
              className="btn bg-yellow-100 text-text inline-block"
            >
              Pojdi na App Launcher
            </a>
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-text font-bold text-lg">
        <p>🌈 © 2025 Risalko - Opolnomočimo mlade pripovedovalce in umetnike! 🎨</p>
      </footer>
    </div>
  );
}
