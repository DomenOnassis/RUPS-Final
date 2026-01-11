"use client";

import { games } from "@/config/games";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1>Choose Your Game</h1>
        <p>Select which game you want to play</p>

        <div className={styles.buttonContainer}>
          {games.map((game) => (
            <a
              key={game.name}
              href={game.url}
              className={styles.gameButton}
              style={
                {
                  "--button-color": game.color,
                } as React.CSSProperties
              }
            >
              <div className={styles.gameTitle}>{game.title}</div>
              <div className={styles.gameDescription}>{game.description}</div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
