'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function MenuPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      // Skip intro screen and go directly to lab
      router.push('/lab');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while redirecting
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #FAFAFA 0%, #E5E7EB 100%)',
    }}>
      <div className="spinner" />
    </div>
  );

}
