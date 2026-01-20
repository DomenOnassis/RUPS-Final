import * as Phaser from "phaser";

export default class ChallengeSelectionScene extends Phaser.Scene {
  constructor() {
    super("ChallengeSelectionScene");
  }

  init(data) {
    this.workspaceType = data.workspaceType || 'electric';
    this.challenges = [];
    this.userStats = null;
  }

  create() {
    const { width, height } = this.cameras.main;

    this.add.rectangle(0, 0, width, height, 0xFAFAFA)
      .setOrigin(0)
      .setDepth(0);

    this.add.text(width / 2, 40, `${this.workspaceType === 'electric' ? 'Electric' : 'Logic'} Circuit Challenges`, {
      fontSize: '36px',
      color: '#171717',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const backBtn = this.add.text(30, 40, '← Back', {
      fontSize: '18px',
      color: '#6366F1',
      fontStyle: 'bold'
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setStyle({ color: '#4F46E5' }));
    backBtn.on('pointerout', () => backBtn.setStyle({ color: '#6366F1' }));
    backBtn.on('pointerdown', () => {
      if (window.__vezalkoGoLab) {
        window.__vezalkoGoLab();
      } else {
        this.scene.start('LabScene');
      }
    });

    // Load user stats first, then challenges
    this.loadUserStats();
  }

  loadUserStats() {
    const token = localStorage.getItem('token');

    fetch('http://localhost:8000/challenges/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(stats => {
        this.userStats = stats;
        this.displayTotalPoints();
        this.loadChallenges();
      })
      .catch(error => {
        console.error('Failed to load user stats:', error);
        this.userStats = { total_points: 0, challenges_completed: 0, challenge_stats: {} };
        this.displayTotalPoints();
        this.loadChallenges();
      });
  }

  displayTotalPoints() {
    const { width } = this.cameras.main;
    
    // Display total points in top right
    const totalPoints = this.userStats?.total_points || 0;
    this.add.text(width - 30, 40, `⭐ ${totalPoints} pts`, {
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);
  }

  loadChallenges() {
    const token = localStorage.getItem('token');
    const { width, height } = this.cameras.main;

    fetch(`http://localhost:8000/challenges/by-workspace/${this.workspaceType}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(challenges => {
        this.challenges = challenges;
        this.displayChallenges();
      })
      .catch(error => {
        console.error('Failed to load challenges:', error);
        this.displayPlaceholderChallenges();
      });
  }

  displayChallenges() {
    if (this.challenges.length === 0) {
      this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'No challenges available', {
        fontSize: '24px',
        color: '#171717'
      }).setOrigin(0.5);
    } else {
      this.renderChallengeGrid(this.challenges);
    }
  }

  renderChallengeGrid(challenges) {
    const { width, height } = this.cameras.main;
    const cardWidth = 180;
    const cardHeight = 220;
    const padding = 20;
    const cols = Math.floor((width - 60) / (cardWidth + padding));
    const startX = (width - (cols * cardWidth + (cols - 1) * padding)) / 2;
    const startY = 120;

    challenges.forEach((challenge, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + padding);
      const y = startY + row * (cardHeight + padding);

      this.createChallengeCard(challenge, x, y, cardWidth, cardHeight);
    });
  }

  createChallengeCard(challenge, x, y, width, height) {
    const card = this.add.rectangle(x, y, width, height, 0xFFFFFF)
      .setOrigin(0)
      .setStrokeStyle(2, 0x6366F1);

    const difficultyColor = this.getDifficultyColor(challenge.difficulty);
    const diffBg = this.add.rectangle(x + width - 30, y + 10, 25, 25, difficultyColor)
      .setOrigin(0.5);

    this.add.text(x + width - 30, y + 10, challenge.difficulty, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const title = this.add.text(x + 10, y + 15, challenge.title, {
      fontSize: '16px',
      color: '#171717',
      fontStyle: 'bold',
      wordWrap: { width: width - 50 }
    });

    const desc = this.add.text(x + 10, y + 50, challenge.description, {
      fontSize: '12px',
      color: '#525252',
      wordWrap: { width: width - 20 }
    });

    // Get completion stats for this challenge
    const stats = this.userStats?.challenge_stats?.[challenge.id];
    const completionCount = stats?.completion_count || 0;
    const pointsEarned = stats?.points_earned || 0;
    const pointsPerCompletion = challenge.difficulty * 50;

    // Display completion count and points
    if (completionCount > 0) {
      // Show completion badge
      this.add.rectangle(x + 10, y + height - 70, width - 20, 25, 0x22C55E, 0.8)
        .setOrigin(0);
      
      this.add.text(x + width / 2, y + height - 57, `✓ ${completionCount}x completed`, {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    } else {
      // Show points available
      this.add.text(x + width / 2, y + height - 57, `+${pointsPerCompletion} pts`, {
        fontSize: '11px',
        color: '#ffd700'
      }).setOrigin(0.5);
    }

    const selectBtnBg = this.add.rectangle(x, y + height - 40, width, 40, 0x6366F1)
      .setOrigin(0);

    const selectBtn = this.add.text(x + width / 2, y + height - 20, 'Select', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    card.setInteractive();
    
    card.on('pointerover', () => {
      card.setStrokeStyle(2, 0x4F46E5);
      selectBtnBg.setFillStyle(0x4F46E5);
    });

    card.on('pointerout', () => {
      card.setStrokeStyle(2, 0x6366F1);
      selectBtnBg.setFillStyle(0x6366F1);
    });

    selectBtn.on('pointerover', () => {
      selectBtnBg.setFillStyle(0x4F46E5);
    });

    selectBtn.on('pointerout', () => {
      selectBtnBg.setFillStyle(0x6366F1);
    });

    selectBtn.on('pointerdown', () => {
      this.startChallenge(challenge);
    });

    card.on('pointerdown', () => {
      this.startChallenge(challenge);
    });
  }

  getDifficultyColor(difficulty) {
    if (difficulty <= 2) return 0x22C55E; // Green
    if (difficulty <= 4) return 0x6366F1; // Indigo
    if (difficulty <= 6) return 0xF59E0B; // Amber
    if (difficulty <= 8) return 0xEF4444; // Red
    return 0x8B5CF6; // Purple
  }

  startChallenge(challenge) {
    localStorage.setItem('selectedChallengeId', challenge.id);
    localStorage.setItem('selectedChallengeTitle', challenge.title);
    
    const sceneKey = this.workspaceType === 'electric' ? 'WorkspaceScene' : 'LogicWorkspaceScene';
    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start(sceneKey);
    });
  }
}
