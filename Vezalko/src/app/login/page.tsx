'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { APP_LAUNCHER_URL } from '@/config/api';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, isAuthenticated, loadFromStorage } = useAuthStore();

  useEffect(() => {
    // Check for auth in URL params (from AppLauncher redirect)
    const authParam = searchParams.get('auth');
    
    if (authParam) {
      try {
        const authData = JSON.parse(decodeURIComponent(authParam));
        console.log('Auth data received:', authData);
        
        if (authData.user && authData.token) {
          // AppLauncher sends user as string, parse it
          let userData = authData.user;
          if (typeof userData === 'string') {
            userData = JSON.parse(userData);
          }
          
          console.log('Parsed user:', userData);
          setAuth(userData, authData.token);
          
          // Clear URL and redirect
          window.history.replaceState({}, '', '/login');
          router.push('/menu');
          return;
        }
      } catch (e) {
        console.error('Failed to parse auth parameter:', e);
      }
    }

    // Load existing auth from storage
    loadFromStorage();
  }, [searchParams, setAuth, loadFromStorage, router]);

  useEffect(() => {
    // If already authenticated, go to menu
    if (isAuthenticated) {
      router.push('/menu');
    }
  }, [isAuthenticated, router]);

  // Listen for messages from AppLauncher
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === APP_LAUNCHER_URL) {
        if (event.data.type === 'AUTH_DATA') {
          try {
            const userData = typeof event.data.user === 'string'
              ? JSON.parse(event.data.user)
              : event.data.user;
            setAuth(userData, event.data.token);
            router.push('/menu');
          } catch (e) {
            console.error('Failed to parse auth message:', e);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setAuth, router]);

  // Redirect to AppLauncher login
  const handleLogin = () => {
    window.location.href = `${APP_LAUNCHER_URL}/login`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAFAFA',
    }}>
      <div className="card" style={{ 
        maxWidth: '400px', 
        width: '100%',
        textAlign: 'center',
        padding: '3rem 2rem',
      }}>

        
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 700, 
          marginBottom: '0.5rem',
          color: '#171717',
        }}>
          Vezalko
        </h1>
        
        <p style={{ 
          color: '#737373', 
          marginBottom: '2rem',
          fontSize: '1.1rem',
        }}>
          Circuit Simulator
        </p>

        <div style={{
          padding: '1.5rem',
          background: '#FAFAFA',
          borderRadius: '0.75rem',
          marginBottom: '2rem',
        }}>
          <p style={{ color: '#737373', marginBottom: '1rem' }}>
            Please login through the App Launcher to continue.
          </p>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleLogin}
          style={{ width: '100%' }}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      }}>
        <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
