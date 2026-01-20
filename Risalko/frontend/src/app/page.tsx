"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Check for auth data in URL (from AppLauncher)
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    
    if (authParam) {
      try {
        // Decode URI component (handles UTF-8)
        const { user, token } = JSON.parse(decodeURIComponent(authParam));
        localStorage.setItem("user", user);
        localStorage.setItem("token", token);
        // Remove auth from URL and redirect
        window.history.replaceState({}, '', '/');
        window.location.href = "/classes";
        return;
      } catch (e) {
        console.error("Failed to parse auth:", e);
      }
    }

    // Check if already authenticated
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (user && token) {
      window.location.href = "/classes";
    } else {
      // Not authenticated, redirect to AppLauncher
      window.location.href = "http://localhost:3002/login";
    }
  }, []);

  return (
    <div className="risalko-app">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          {/* Logo/Brand */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-neutral-800 mb-4">
              Risalko
            </h1>
            <p className="text-xl text-neutral-500 leading-relaxed">
              Create visual stories and bring narratives to life through illustration
            </p>
          </div>

          {/* Loading Card */}
          <div className="risalko-card">
            <div className="flex flex-col items-center py-8">
              <div className="risalko-spinner mb-6"></div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                Redirecting...
              </h3>
              <p className="text-neutral-500 mb-6">
                Setting up your creative workspace
              </p>
              <a href="http://localhost:3002" className="risalko-btn risalko-btn-secondary">
                Back to App Launcher
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-neutral-400 text-sm border-t border-neutral-200">
        <p>Risalko © 2025 — Where stories come to life</p>
      </footer>
    </div>
  );
}
