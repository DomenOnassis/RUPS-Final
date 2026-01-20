import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        // Also store in localStorage for compatibility with AppLauncher
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('username', user.name);
        
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        localStorage.removeItem('gameMode');
        localStorage.removeItem('currentChallengeId');
        localStorage.removeItem('currentChallengeTitle');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        
        // Force redirect to Service home (which will redirect to login if no user)
        setTimeout(() => {
          window.location.href = 'http://localhost:3002/';
        }, 100);
      },

      loadFromStorage: () => {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (userStr && token) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              isAuthenticated: true,
            });
          } catch {
            // Invalid JSON, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      },
    }),
    {
      name: 'vezalko-auth',
    }
  )
);

// Game mode store
interface GameModeState {
  mode: 'sandbox' | 'challenge';
  workspaceType: 'electric' | 'logic';
  currentChallengeId: number | null;
  currentChallengeTitle: string | null;
  
  setMode: (mode: 'sandbox' | 'challenge') => void;
  setWorkspaceType: (type: 'electric' | 'logic') => void;
  setCurrentChallenge: (id: number, title: string) => void;
  clearChallenge: () => void;
}

export const useGameModeStore = create<GameModeState>()(
  persist(
    (set) => ({
      mode: 'sandbox',
      workspaceType: 'electric',
      currentChallengeId: null,
      currentChallengeTitle: null,

      setMode: (mode) => {
        localStorage.setItem('gameMode', mode);
        set({ mode });
      },

      setWorkspaceType: (workspaceType) => set({ workspaceType }),

      setCurrentChallenge: (id, title) => {
        localStorage.setItem('currentChallengeId', id.toString());
        localStorage.setItem('currentChallengeTitle', title);
        set({
          currentChallengeId: id,
          currentChallengeTitle: title,
        });
      },

      clearChallenge: () => {
        localStorage.removeItem('currentChallengeId');
        localStorage.removeItem('currentChallengeTitle');
        set({
          currentChallengeId: null,
          currentChallengeTitle: null,
        });
      },
    }),
    {
      name: 'vezalko-game-mode',
    }
  )
);
