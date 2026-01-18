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
                // Store auth data in game's localStorage via postMessage or URL params
                const userData = localStorage.getItem("user");
                const token = localStorage.getItem("token");
                
                if (userData && token) {
                  // Open game in new window and pass auth data
                  const gameWindow = window.open(game.url, "_blank");
                  
                  // Wait for game to load, then send auth data
                  // Send multiple times to ensure delivery
                  const sendAuthData = () => {
                    if (gameWindow && !gameWindow.closed) {
                      gameWindow.postMessage(
                        {
                          type: "AUTH_DATA",
                          user: userData,
                          token: token,
                        },
                        game.url
                      );
                    }
                  };
                  
                  // Send at intervals to ensure game receives it
                  setTimeout(sendAuthData, 500);
                  setTimeout(sendAuthData, 1000);
                  setTimeout(sendAuthData, 2000);
                }
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
