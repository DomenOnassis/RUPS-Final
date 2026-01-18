import './style.css'
import Phaser from 'phaser';

import UIScene from './scenes/UIScene';
import PreloadScene from './scenes/preloadScene';
import MenuScene from './scenes/menuScene';
import LabScene from './scenes/labScene';
import TestScene from './scenes/testScene';
import LoginScene from './scenes/loginScene';
import ScoreboardScene from './scenes/scoreboardScene';
import WorkspaceScene from './scenes/workspaceScene';
import LogicWorkspaceScene from './scenes/logicWorkspaceScene';
import ChallengeSelectionScene from './scenes/challengeSelectionScene';

// Listen for authentication data from AppLauncher
window.addEventListener('message', (event) => {
  // Verify origin for security
  if (event.origin === 'http://localhost:3002') {
    if (event.data.type === 'AUTH_DATA') {
      console.log('Received auth data from AppLauncher');
      // Store auth data in this app's localStorage
      localStorage.setItem('user', event.data.user);
      localStorage.setItem('token', event.data.token);
      
      // Parse user to get username
      try {
        const user = JSON.parse(event.data.user);
        if (user.name) {
          localStorage.setItem('username', user.name);
        }
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
      
      // Set flag that auth was just received
      localStorage.setItem('auth_just_received', 'true');
      
      // Don't reload - the game will check this flag
      console.log('Auth data stored, game should proceed');
    }
  }
});

const config = {
  type: Phaser.WEBGL,
  backgroundColor: '#f4f6fa',
  parent: 'game-container',
  render: {
    antialias: true,
    roundPixels: true,
    pixelArt: false
  },
  scene: [
    MenuScene,
    LabScene,
    WorkspaceScene,
    LogicWorkspaceScene,
    ChallengeSelectionScene,
    PreloadScene,
    UIScene,
    TestScene,
    LoginScene,
    ScoreboardScene
  ],
  physics: {
    default: 'arcade',           
    arcade: {
      gravity: { y: 0 },         
      debug: false               
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);
export default game;