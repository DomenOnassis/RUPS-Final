/**
 * Game Configuration
 * Update this file whenever you change your deployment structure
 * Examples:
 * - Separate ports: "http://localhost:3000"
 * - Same port with subpaths: "http://localhost:3000/risalko"
 * - Production: "https://yoursite.com/risalko"
 */

export interface GameConfig {
  name: string;
  title: string;
  description: string;
  url: string;
  color: string;
}

export const games: GameConfig[] = [
  {
    name: "risalko",
    title: "Risalko",
    description: "Story Drawing & Visualization Game",
    url: "http://localhost:3000",
    color: "#667eea",
  },
  {
    name: "vezalko",
    title: "Vezalko",
    description: "Circuit Building Educational Game",
    url: "http://localhost:3001",
    color: "#764ba2",
  },
];

export const getGameUrl = (gameName: string): string | null => {
  const game = games.find((g) => g.name === gameName);
  return game?.url || null;
};
