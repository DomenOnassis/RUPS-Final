'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { APP_LAUNCHER_URL } from '@/config/api';

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, setAuth, logout, loadFromStorage } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check URL for auth parameter (from AppLauncher)
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    
    if (authParam) {
      try {
        const authData = JSON.parse(decodeURIComponent(authParam));
        if (authData.user && authData.token) {
          const userData = typeof authData.user === 'string' 
            ? JSON.parse(authData.user) 
            : authData.user;
          setAuth(userData, authData.token);
          
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (e) {
        console.error('Failed to parse auth parameter:', e);
      }
    }
    
    // Listen for messages from AppLauncher (iframe communication)
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === APP_LAUNCHER_URL) {
        if (event.data.type === 'AUTH_DATA') {
          try {
            const userData = typeof event.data.user === 'string'
              ? JSON.parse(event.data.user)
              : event.data.user;
            setAuth(userData, event.data.token);
          } catch (e) {
            console.error('Failed to parse auth message:', e);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Load existing auth from storage
    loadFromStorage();
    setIsLoading(false);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setAuth, loadFromStorage]);

  const handleLogout = () => {
    logout();
    router.push(`${APP_LAUNCHER_URL}/login`);
  };

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      router.push(`${APP_LAUNCHER_URL}/login`);
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    logout: handleLogout,
    requireAuth,
  };
}
