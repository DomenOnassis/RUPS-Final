import Phaser from 'phaser';

const API_URL = 'http://localhost:8000';

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
    }

    create() {
        // Check for auth data in URL (from AppLauncher)
        const params = new URLSearchParams(window.location.search);
        const authParam = params.get('auth');
        
        if (authParam) {
            try {
                // Decode URI component (handles UTF-8)
                const { user, token } = JSON.parse(decodeURIComponent(authParam));
                localStorage.setItem("user", user);
                localStorage.setItem("token", token);
                
                const userData = JSON.parse(user);
                if (userData.name) {
                    localStorage.setItem('username', userData.name);
                }
                
                // Remove auth from URL
                window.history.replaceState({}, '', '/');
                
                console.log("Auth received from URL, starting menu...");
                this.scene.start("MenuScene");
                return;
            } catch (e) {
                console.error("Failed to parse auth:", e);
            }
        }

        // Check if already authenticated
        const user = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        
        if (user && token) {
            try {
                const userData = JSON.parse(user);
                console.log("Already authenticated:", userData.name);
                
                if (userData.name) {
                    localStorage.setItem('username', userData.name);
                }
                
                this.scene.start("MenuScene");
                return;
            } catch (e) {
                console.error("Failed to parse user:", e);
                localStorage.clear();
            }
        }

        // Not authenticated, redirect to AppLauncher
        console.log("Not authenticated, redirecting to AppLauncher...");
        window.location.href = "http://localhost:3002/login";
    }
}
