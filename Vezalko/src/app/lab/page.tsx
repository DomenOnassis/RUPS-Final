'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGameModeStore } from '@/store/authStore';
import Modal from '@/components/Modal';

export default function LabPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { setMode, setWorkspaceType } = useGameModeStore();
  
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<'electric' | 'logic' | null>(null);

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
        background: '#FAFAFA',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  const handleWorkspaceSelect = (type: 'electric' | 'logic') => {
    setSelectedWorkspace(type);
    setWorkspaceType(type);
    setShowModeModal(true);
  };

  const handleModeSelect = (mode: 'sandbox' | 'challenge') => {
    setMode(mode);
    setShowModeModal(false);
    
    if (mode === 'challenge') {
      router.push(`/challenges?type=${selectedWorkspace}`);
    } else {
      router.push(`/workspace/${selectedWorkspace}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}>
        <button
          onClick={() => window.location.href = 'http://localhost:3002/'}
          className="btn btn-outline"
        >
          ← Back
        </button>
        
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700,
          color: '#171717',
        }}>
          Vezalko
        </h1>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/scoreboard')}
            className="btn btn-secondary"
          >
            Scoreboard
          </button>
          <button onClick={logout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        {/* Welcome card */}
        <div className="card" style={{
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
          marginBottom: '3rem',
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            margin: '0 auto 1.5rem',
          }}
          />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Welcome, {user?.name}!
          </h2>
          <p style={{ color: '#737373' }}>
            Choose a workspace to start building
          </p>
        </div>

        {/* Workspace Selection Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          maxWidth: '600px',
          width: '100%',
          marginBottom: '2rem',
        }}>
          {/* Electric Circuits */}
          <button
            onClick={() => handleWorkspaceSelect('electric')}
            className="card card-hover"
            style={{
              border: '2px solid transparent',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '2rem',
              transition: 'all 0.2s ease',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', color: '#6366F1' }}>
              Electric Circuits
            </h3>
            <p style={{ color: '#737373', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Build circuits with batteries, bulbs, switches, and resistors
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              Start →
            </button>
          </button>

          {/* Logic Gates */}
          <button
            onClick={() => handleWorkspaceSelect('logic')}
            className="card card-hover"
            style={{
              border: '2px solid transparent',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '2rem',
              transition: 'all 0.2s ease',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', color: '#F59E0B' }}>
              Logic Gates
            </h3>
            <p style={{ color: '#737373', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Build logic circuits with AND, OR, NOT, XOR, and more
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              Start →
            </button>
          </button>
        </div>
      </main>

      {/* Mode Selection Modal */}
      <Modal
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
        title="Choose Mode"
        maxWidth="500px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Sandbox Mode */}
          <button
            onClick={() => handleModeSelect('sandbox')}
            className="card card-hover"
            style={{
              border: '2px solid transparent',
              cursor: 'pointer',
              textAlign: 'left',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <span style={{ 
              fontSize: '2.5rem', 
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              borderRadius: '0.75rem',
              padding: '0.75rem',
            }}>
              🎨
            </span>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22C55E', marginBottom: '0.25rem' }}>
                Sandbox Mode
              </h3>
              <p style={{ color: '#737373', fontSize: '0.9rem' }}>
                Free exploration - build anything you want!
              </p>
            </div>
          </button>

          {/* Challenge Mode */}
          <button
            onClick={() => handleModeSelect('challenge')}
            className="card card-hover"
            style={{
              border: '2px solid transparent',
              cursor: 'pointer',
              textAlign: 'left',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <span style={{ 
              fontSize: '2.5rem', 
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              borderRadius: '0.75rem',
              padding: '0.75rem',
            }}>
              🎯
            </span>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#EF4444', marginBottom: '0.25rem' }}>
                Challenge Mode
              </h3>
              <p style={{ color: '#737373', fontSize: '0.9rem' }}>
                Complete challenges to earn points!
              </p>
            </div>
          </button>
        </div>
      </Modal>
    </div>
  );
}
