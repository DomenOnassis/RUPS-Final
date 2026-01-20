import * as Phaser from 'phaser';

export default class ScoreboardScene extends Phaser.Scene {
    constructor() {
        super('ScoreboardScene');
    }

    init(data) {
        this.cameFromMenu = data.cameFromMenu || false;
        this.leaderboard = [];
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(0, 0, width, height, 0xFAFAFA)
            .setOrigin(0)
            .setDepth(0);

        // Title
        this.add.text(width / 2, 40, 'Leaderboard', {
            fontSize: '42px',
            color: '#171717',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, 85, 'Top 10 Players', {
            fontSize: '20px',
            color: '#737373'
        }).setOrigin(0.5);

        // Back button
        const backBtn = this.add.text(30, 40, '← Back', {
            fontSize: '18px',
            color: '#6366F1',
            fontStyle: 'bold'
        }).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setStyle({ color: '#4F46E5' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ color: '#6366F1' }));
        backBtn.on('pointerdown', () => {
            if (window.__vezalkoGoBack) {
                window.__vezalkoGoBack();
            } else {
                this.scene.start('MenuScene');
            }
        });

        // Loading indicator
        const loadingText = this.add.text(width / 2, height / 2, 'Loading leaderboard...', {
            fontSize: '20px',
            color: '#737373'
        }).setOrigin(0.5);

        // Fetch leaderboard
        this.loadLeaderboard(loadingText);
    }

    loadLeaderboard(loadingText) {
        fetch('http://localhost:8000/challenges/leaderboard/top')
            .then(res => res.json())
            .then(data => {
                this.leaderboard = data;
                loadingText.destroy();
                this.displayLeaderboard();
            })
            .catch(error => {
                console.error('Failed to load leaderboard:', error);
                loadingText.setText('Failed to load leaderboard');
            });
    }

    displayLeaderboard() {
        const { width, height } = this.scale;
        
        if (this.leaderboard.length === 0) {
            this.add.text(width / 2, height / 2, 'No players yet!', {
                fontSize: '24px',
                color: '#171717'
            }).setOrigin(0.5);
            return;
        }

        const startY = 140;
        const entryHeight = 60;
        const entryWidth = Math.min(600, width - 100);
        const startX = (width - entryWidth) / 2;

        this.leaderboard.forEach((entry, index) => {
            const y = startY + index * (entryHeight + 10);
            
            // Determine rank colors
            let rankColor = 0x525252;
            let rankBg = 0xFFFFFF;
            if (index === 0) {
                rankColor = 0xF59E0B; // Gold/Amber
                rankBg = 0xFEF3C7;
            } else if (index === 1) {
                rankColor = 0x9CA3AF; // Silver
                rankBg = 0xF3F4F6;
            } else if (index === 2) {
                rankColor = 0xB45309; // Bronze
                rankBg = 0xFED7AA;
            }

            // Entry background
            const entryBg = this.add.rectangle(startX, y, entryWidth, entryHeight, rankBg)
                .setOrigin(0)
                .setStrokeStyle(2, rankColor, 0.5);

            // Rank number
            const rankText = this.add.text(startX + 30, y + entryHeight / 2, `#${index + 1}`, {
                fontSize: '28px',
                color: `#${rankColor.toString(16).padStart(6, '0')}`,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Username
            const username = this.add.text(startX + 90, y + entryHeight / 2 - 8, entry.username, {
                fontSize: '22px',
                color: '#171717',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            // Challenges completed
            const challenges = this.add.text(startX + 90, y + entryHeight / 2 + 12, `${entry.challenges_completed} challenges`, {
                fontSize: '14px',
                color: '#737373'
            }).setOrigin(0, 0.5);

            // Points
            const points = this.add.text(startX + entryWidth - 30, y + entryHeight / 2, `⭐ ${entry.total_points}`, {
                fontSize: '20px',
                color: '#ffd700',
                fontStyle: 'bold'
            }).setOrigin(1, 0.5);

            // Trophy icon for top 3
            if (index < 3) {
                const trophyIcon = index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉';
                this.add.text(startX + 10, y + entryHeight / 2, trophyIcon, {
                    fontSize: '24px'
                }).setOrigin(0.5);
            }
        });
    }
}
