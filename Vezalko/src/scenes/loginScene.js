import Phaser from 'phaser';

const API_URL = 'http://localhost:8000';

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
    }

    create() {
        // Check if user is already logged in via AppLauncher
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                console.log("User already authenticated via AppLauncher:", user);
                
                // Store username for game scenes
                if (user.name) {
                    localStorage.setItem('username', user.name);
                }
                
                // Clear the flag if it exists
                localStorage.removeItem('auth_just_received');
                
                // Skip login and go directly to menu
                this.scene.start("MenuScene");
                return;
            } catch (e) {
                console.error("Failed to parse user data:", e);
            }
        }

        // Wait for postMessage from AppLauncher before redirecting
        console.log("No authentication found, waiting for AppLauncher message...");
        
        // Show loading message
        const { width, height } = this.scale;
        const loadingText = this.add.text(width / 2, height / 2, 'Loading authentication...', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#333'
        }).setOrigin(0.5);

        // Check for auth data periodically
        let checkCount = 0;
        const maxChecks = 10; // Check for 5 seconds (10 * 500ms)
        
        const authCheckInterval = setInterval(() => {
            checkCount++;
            const userCheck = localStorage.getItem("user");
            const authReceived = localStorage.getItem("auth_just_received");
            
            if (userCheck || authReceived) {
                console.log("Auth data detected, starting MenuScene...");
                clearInterval(authCheckInterval);
                
                // Store username if available
                try {
                    const user = JSON.parse(userCheck);
                    if (user.name) {
                        localStorage.setItem('username', user.name);
                    }
                } catch (e) {}
                
                // Clear flag
                localStorage.removeItem('auth_just_received');
                
                // Go to menu
                this.scene.start("MenuScene");
            } else if (checkCount >= maxChecks) {
                console.log("Timeout waiting for auth data, redirecting to AppLauncher...");
                clearInterval(authCheckInterval);
                window.location.href = "http://localhost:3002/login";
            } else {
                console.log(`Waiting for auth... (${checkCount}/${maxChecks})`);
            }
        }, 500);
    }
}
