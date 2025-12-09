import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene.js';
import { CONFIG } from './config.js';

// Get user ID from URL parameters or generate logical default for testing
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');

// Store in global config for scenes to access
console.log('[Main] URL Params:', window.location.search);
console.log('[Main] Extracted userId:', userId);

if (!userId) {
    console.error('[Main] CRITICAL: No userId found in URL parameters!');
}

CONFIG.USER_ID = userId;
CONFIG.MATCH_DATA = {
    roomId: urlParams.get('roomId'),
    role: urlParams.get('role'),
    opponentId: urlParams.get('opponentId'),
    opponentUid: urlParams.get('opponentUid'),
    isInitiator: urlParams.get('isInitiator') === 'true',
    mode: urlParams.get('mode')
};

console.log('[Main] Match Data:', CONFIG.MATCH_DATA);

const config = {
    type: Phaser.AUTO,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: CONFIG.COLORS.BACKGROUND,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

// Remove loading spinner
const loading = document.getElementById('loading');
if (loading) loading.style.display = 'none';

// Start game
new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
    // Phaser handles resize automatically with Scale Manager
});
