"use client";

import { games } from "@/config/games";
import styles from "./page.module.css";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <main className={styles.container}>
        <div className={styles.card}>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <h2>Welcome, {user.name}!</h2>
            <p className={styles.userType}>
              {user.type === "teacher" ? "Teacher Account" : "Student Account"}
            </p>
          </div>
          <button onClick={logout} className={styles.logoutButton}>
            Logout
          </button>
        </div>

        <h1>Choose Your Game</h1>
        <p>Select which game you want to play</p>

        <div className={styles.buttonContainer}>
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
              className={styles.gameButton}
              style={
                {
                  "--button-color": game.color,
                } as React.CSSProperties
              }
            >
              <div className={styles.gameTitle}>{game.title}</div>
              <div className={styles.gameDescription}>{game.description}</div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
