"use client";

import { games } from "@/config/games";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <main className="risalko-centered">
        <div className="risalko-card risalko-content-medium">
          <div className="risalko-loading">
            <div className="risalko-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <main className="risalko-centered">
      <div className="risalko-card risalko-content-medium">
        <div className="risalko-card-header">
          <div className="risalko-user-info">
            <h2 className="risalko-user-name">Welcome, {user.name}!</h2>
            <p className="risalko-user-type">
              {user.type === "teacher" ? "Teacher Account" : "Student Account"}
            </p>
          </div>
          <button onClick={logout} className="risalko-btn-secondary">
            Logout
          </button>
        </div>

        <h1 className="risalko-card-title">Welcome to the Mi4 ecosystem</h1>
        <p className="risalko-card-subtitle">Select the software service to use</p>

        <div className="risalko-games-grid">
          {games.map((game) => (
            <button
              key={game.name}
              onClick={() => {
                // Copy auth to game's localStorage using URL encoding
                const user = localStorage.getItem("user");
                const token = localStorage.getItem("token");
                
                if (!user || !token) {
                  alert("Please login first");
                  return;
                }
                
                // Use encodeURIComponent for safe URL encoding (handles UTF-8)
                const authData = encodeURIComponent(JSON.stringify({ user, token }));
                window.location.href = `${game.url}?auth=${authData}`;
              }}
              className="risalko-game-btn"
              style={
                {
                  "--game-color": game.color,
                } as React.CSSProperties
              }
            >
              <div className="risalko-game-title">{game.title}</div>
              <div className="risalko-game-description">{game.description}</div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
