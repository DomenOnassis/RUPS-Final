'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGameModeStore } from '@/store/authStore';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic import for Phaser (no SSR)
const PhaserGame = dynamic(
  () => import('../../../components/PhaserGame'),
  { ssr: false }
);

function ElectricWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { mode, currentChallengeTitle } = useGameModeStore();

  const challengeId = searchParams.get('challenge');
  const isEmbedded = searchParams.get('embedded') === 'true';
  const isChallenge = mode === 'challenge' && challengeId;

  useEffect(() => {
    // Skip auth check when embedded (auth passed via URL params)
    if (!isLoading && !isAuthenticated && !isEmbedded) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, isEmbedded]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  const handleBack = () => {
    if (isChallenge) {
      router.push('/challenges?type=electric');
    } else {
      router.push('/lab');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <PhaserGame
        scene="workspace"
        mode={isChallenge ? 'challenge' : 'sandbox'}
        challengeId={challengeId || undefined}
        challengeTitle={currentChallengeTitle || undefined}
        onBack={handleBack}
      />
    </div>
  );
}

export default function ElectricWorkspacePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
      }}>
        <div className="spinner" />
      </div>
    }>
      <ElectricWorkspaceContent />
    </Suspense>
  );
}
