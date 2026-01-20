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
  const { mode, currentChallengeId, currentChallengeTitle } = useGameModeStore();

  const challengeId = searchParams.get('challenge');
  const isChallenge = mode === 'challenge' && challengeId;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

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

  return (
    <PhaserGame
      scene="workspace"
      mode={isChallenge ? 'challenge' : 'sandbox'}
      challengeId={challengeId || undefined}
      challengeTitle={currentChallengeTitle || undefined}
      onBack={() => {
        if (isChallenge) {
          router.push('/challenges?type=electric');
        } else {
          router.push('/lab');
        }
      }}
    />
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
