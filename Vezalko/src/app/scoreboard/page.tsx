'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { API_ENDPOINTS, apiGet } from '@/config/api';

interface LeaderboardEntry {
  rank: number;
  username: string;
  challenges_completed: number;
  total_points: number;
}

export default function ScoreboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await apiGet<LeaderboardEntry[]>(API_ENDPOINTS.leaderboard, false);
        setLeaderboard(data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        // Mock data
        setLeaderboard([
          { rank: 1, username: 'CircuitMaster', challenges_completed: 25, total_points: 750 },
          { rank: 2, username: 'LogicWizard', challenges_completed: 22, total_points: 680 },
          { rank: 3, username: 'VoltageKing', challenges_completed: 20, total_points: 620 },
          { rank: 4, username: 'WireNinja', challenges_completed: 18, total_points: 540 },
          { rank: 5, username: 'BulbBrain', challenges_completed: 15, total_points: 450 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchLeaderboard();
    }
  }, [isAuthenticated]);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white' };
      case 2:
        return { background: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)', color: 'white' };
      case 3:
        return { background: 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)', color: 'white' };
      default:
        return { background: '#F3F4F6', color: '#374151' };
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
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
          Leaderboard
        </h1>
        
        <div style={{ width: '100px' }} />
      </header>

      {/* Main content */}
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 150px 120px',
              padding: '1rem 1.5rem',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: 'white',
              fontWeight: 600,
            }}>
              <span>Rank</span>
              <span>Player</span>
              <span style={{ textAlign: 'center' }}>Challenges</span>
              <span style={{ textAlign: 'right' }}>Points</span>
            </div>

            {/* Table rows */}
            {leaderboard.map((entry, index) => (
              <div
                key={entry.rank}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 150px 120px',
                  padding: '1rem 1.5rem',
                  alignItems: 'center',
                  borderBottom: index < leaderboard.length - 1 ? '1px solid #E5E5E5' : 'none',
                  background: entry.rank <= 3 ? 'rgba(99, 102, 241, 0.05)' : 'white',
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  ...getRankStyle(entry.rank),
                }}>
                  #{entry.rank}
                </span>
                
                <span style={{ 
                  fontWeight: 600, 
                  color: '#171717',
                  fontSize: '1rem',
                }}>
                  {entry.username}
                </span>
                
                <span style={{ 
                  textAlign: 'center',
                  color: '#737373',
                }}>
                  {entry.challenges_completed} completed
                </span>
                
                <span style={{ 
                  textAlign: 'right',
                  fontWeight: 700,
                  color: '#F59E0B',
                  fontSize: '1.125rem',
                }}>
                  {entry.total_points} pts
                </span>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <div style={{ 
                padding: '3rem', 
                textAlign: 'center', 
                color: '#737373',
              }}>
                No scores yet. Be the first to complete challenges!
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
