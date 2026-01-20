'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGameModeStore } from '@/store/authStore';
import { API_ENDPOINTS, apiGet } from '@/config/api';

interface Challenge {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  type: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
};

function ChallengesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { setCurrentChallenge, workspaceType, setWorkspaceType } = useGameModeStore();
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'electric' || type === 'logic') {
      setWorkspaceType(type);
    }
  }, [searchParams, setWorkspaceType]);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoadingChallenges(true);
        const data = await apiGet<Challenge[]>(
          API_ENDPOINTS.challengesByWorkspace(workspaceType),
          true
        );
        setChallenges(data);
      } catch (err) {
        console.error('Failed to fetch challenges:', err);
        setError('Failed to load challenges');
        // Use mock data for demo
        setChallenges(getMockChallenges(workspaceType));
      } finally {
        setLoadingChallenges(false);
      }
    };

    if (isAuthenticated) {
      fetchChallenges();
    }
  }, [isAuthenticated, workspaceType]);

  const getMockChallenges = (type: string): Challenge[] => {
    if (type === 'electric') {
      return [
        { id: 1, title: 'Simple Circuit', description: 'Connect a battery to a bulb', difficulty: 'easy', points: 10, type: 'electric' },
        { id: 2, title: 'Open Circuit', description: 'Build an open circuit with switch OFF', difficulty: 'easy', points: 10, type: 'electric' },
        { id: 3, title: 'Closed Circuit', description: 'Build a closed circuit with switch ON', difficulty: 'easy', points: 15, type: 'electric' },
        { id: 4, title: 'Switch Control', description: 'Add a controllable switch', difficulty: 'medium', points: 20, type: 'electric' },
        { id: 5, title: 'Series Bulbs', description: 'Connect two bulbs in series', difficulty: 'medium', points: 25, type: 'electric' },
        { id: 6, title: 'Parallel Bulbs', description: 'Connect two bulbs in parallel', difficulty: 'hard', points: 30, type: 'electric' },
      ];
    } else {
      return [
        { id: 11, title: 'AND Gate', description: 'Output 1 using AND gate', difficulty: 'easy', points: 10, type: 'logic' },
        { id: 12, title: 'OR Gate', description: 'Output 0 using OR gate', difficulty: 'easy', points: 10, type: 'logic' },
        { id: 13, title: 'NOT Gate', description: 'Output 0 using NOT gate', difficulty: 'easy', points: 10, type: 'logic' },
        { id: 14, title: 'NAND Gate', description: 'Output 1 using NAND gate', difficulty: 'medium', points: 15, type: 'logic' },
        { id: 15, title: 'XOR Gate', description: 'Output 1 using XOR gate', difficulty: 'medium', points: 20, type: 'logic' },
        { id: 16, title: 'Half Adder', description: 'Implement sum and carry', difficulty: 'hard', points: 30, type: 'logic' },
      ];
    }
  };

  const handleSelectChallenge = (challenge: Challenge) => {
    setCurrentChallenge(challenge.id, challenge.title);
    router.push(`/workspace/${workspaceType}?challenge=${challenge.id}`);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAFAFA',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}>
        <button
          onClick={() => router.push('/lab')}
          className="btn btn-outline"
        >
          ← Back to Lab
        </button>
        
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700,
          color: '#171717',
        }}>
          {workspaceType === 'electric' ? '⚡ Electric' : '🔣 Logic'} Challenges
        </h1>
        
        <div style={{ width: '100px' }} /> {/* Spacer */}
      </header>

      {/* Main content */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {loadingChallenges ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#EF4444' }}>{error}</p>
            <p style={{ color: '#737373', marginTop: '0.5rem' }}>Using demo challenges</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {challenges.map(challenge => (
              <div
                key={challenge.id}
                className="card card-hover"
                style={{
                  cursor: 'pointer',
                  borderLeft: `4px solid ${DIFFICULTY_COLORS[challenge.difficulty] || '#6366F1'}`,
                }}
                onClick={() => handleSelectChallenge(challenge)}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                }}>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 700,
                    color: '#171717',
                  }}>
                    {challenge.title}
                  </h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: DIFFICULTY_COLORS[challenge.difficulty] || '#6366F1',
                    color: 'white',
                  }}>
                    {challenge.difficulty}
                  </span>
                </div>
                
                <p style={{ 
                  color: '#737373', 
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}>
                  {challenge.description}
                </p>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                }}>
                  <span style={{ 
                    color: '#F59E0B', 
                    fontWeight: 700,
                    fontSize: '1.125rem',
                  }}>
                    {challenge.points} pts
                  </span>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    Start →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ChallengesPage() {
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
      <ChallengesContent />
    </Suspense>
  );
}
