'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface PhaserGameProps {
  scene: 'workspace' | 'logic' | 'lab';
  mode?: 'sandbox' | 'challenge';
  challengeId?: string;
  challengeTitle?: string;
  onBack?: () => void;
}

export default function PhaserGame({ 
  scene, 
  mode = 'sandbox',
  challengeId,
  challengeTitle,
  onBack 
}: PhaserGameProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Store mode and challenge info in localStorage for Phaser scenes
    localStorage.setItem('mode', mode);
    if (challengeId) localStorage.setItem('selectedChallengeId', challengeId);
    if (challengeTitle) localStorage.setItem('selectedChallengeTitle', challengeTitle);

    // Override the back navigation to use React Router
    (window as any).__vezalkoGoBack = () => {
      if (onBack) {
        onBack();
      } else {
        router.push('/lab');
      }
    };
    
    (window as any).__vezalkoGoMenu = () => {
      router.push('/menu');
    };
    
    (window as any).__vezalkoGoLab = () => {
      router.push('/lab');
    };

    (window as any).__vezalkoGoChallengeSelection = (workspaceType: string) => {
      router.push(`/challenges/${workspaceType}`);
    };

    // Dynamic import of Phaser to avoid SSR issues
    const initPhaser = async () => {
      if (typeof window === 'undefined') return;
      if (phaserGameRef.current) return;

      const Phaser = await import('phaser');
      
      // Import scenes based on which one we need
      let SceneClass;
      if (scene === 'workspace') {
        const mod = await import('@/phaser/scenes/workspaceScene');
        SceneClass = mod.default;
      } else if (scene === 'logic') {
        const mod = await import('@/phaser/scenes/logicWorkspaceScene');
        SceneClass = mod.default;
      } else {
        const mod = await import('@/phaser/scenes/labScene');
        SceneClass = mod.default;
      }

      // We also need the scoreboard scene for challenge mode
      const ScoreboardScene = (await import('@/phaser/scenes/scoreboardScene')).default;
      const ChallengeSelectionScene = (await import('@/phaser/scenes/challengeSelectionScene')).default;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.WEBGL,
        backgroundColor: '#f4f6fa',
        parent: gameRef.current!,
        render: {
          antialias: true,
          roundPixels: true,
          pixelArt: false
        },
        scene: [SceneClass, ScoreboardScene, ChallengeSelectionScene],
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
          }
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: '100%',
          height: '100%',
        }
      };

      phaserGameRef.current = new Phaser.Game(config);
    };

    initPhaser();

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
      // Cleanup global functions
      delete (window as any).__vezalkoGoBack;
      delete (window as any).__vezalkoGoMenu;
      delete (window as any).__vezalkoGoLab;
      delete (window as any).__vezalkoGoChallengeSelection;
    };
  }, [scene, mode, challengeId, challengeTitle, router, onBack]);

  return (
    <div 
      ref={gameRef} 
      style={{ 
        width: '100%', 
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
      }} 
    />
  );
}
