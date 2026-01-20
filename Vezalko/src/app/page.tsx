'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Suspense } from 'react';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loadFromStorage, setAuth } = useAuthStore();

  useEffect(() => {
    // Check for auth in URL params (from AppLauncher redirect)
    const authParam = searchParams.get('auth');
    
    if (authParam) {
      try {
        const authData = JSON.parse(decodeURIComponent(authParam));
        console.log('Home: Auth data received:', authData);
        
        if (authData.user && authData.token) {
          // AppLauncher sends user as string, parse it
          let userData = authData.user;
          if (typeof userData === 'string') {
            userData = JSON.parse(userData);
          }
          
          console.log('Home: Parsed user:', userData);
          setAuth(userData, authData.token);
          
          // Clear URL and redirect
          window.history.replaceState({}, '', '/');
          router.push('/menu');
          return;
        }
      } catch (e) {
        console.error('Failed to parse auth parameter:', e);
      }
    }
    
    loadFromStorage();
  }, [searchParams, loadFromStorage, setAuth, router]);

  useEffect(() => {
    // Redirect based on auth status (only if no auth param being processed)
    const authParam = searchParams.get('auth');
    if (!authParam) {
      if (isAuthenticated) {
        router.push('/menu');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, router, searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAFAFA',
    }}>
      <div style={{ textAlign: 'center', color: '#171717' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Vezalko
        </h1>
        <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
          Loading...
        </p>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAFAFA',
      }}>
        <div className="spinner" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
