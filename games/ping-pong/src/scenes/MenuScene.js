import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';
import TableTennisConfig from '../config/TableTennisConfig.js';
import { NetworkManager } from '../network/NetworkManager.js';

/**
 * MenuScene - Matchmaking and connection UI
 */
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super(TableTennisConfig.SCENES.MENU);
    }

    create() {
        const centerX = GameConfig.DISPLAY.WIDTH / 2;

        // Game title
        this.add.text(
            centerX,
            GameConfig.UI.MENU_TITLE_Y,
            TableTennisConfig.TITLE,
            {
                fontSize: GameConfig.UI.MENU_TITLE_FONT_SIZE,
                fill: GameConfig.UI.MENU_TITLE_COLOR
            }
        ).setOrigin(0.5);

        // Status text
        const statusText = this.add.text(
            centerX,
            GameConfig.UI.MENU_STATUS_Y,
            'Connecting to server...',
            {
                fontSize: GameConfig.UI.MENU_STATUS_FONT_SIZE,
                fill: GameConfig.UI.MENU_STATUS_COLOR
            }
        ).setOrigin(0.5);

        // Find match button
        const findMatchBtn = this.add.text(
            centerX,
            GameConfig.UI.MENU_BUTTON_Y,
            'Find Match',
            {
                fontSize: GameConfig.UI.MENU_BUTTON_FONT_SIZE,
                fill: GameConfig.UI.MENU_BUTTON_COLOR,
                backgroundColor: GameConfig.UI.MENU_BUTTON_BG_COLOR,
                padding: GameConfig.UI.MENU_BUTTON_PADDING
            }
        )
            .setOrigin(0.5)
            .setAlpha(0.5);

        // Connect to network
        // Pass 'this' (the scene) so NetworkManager can emit events on it
        this.network = new NetworkManager(this);
        this.network.connect()
            .then(() => {
                // Connection successful
                statusText.setText('Connected! Press Find Match');
                findMatchBtn.setInteractive({ useHandCursor: true });
                findMatchBtn.setAlpha(1);
            })
            .catch((err) => {
                // Connection failed
                console.error('Connection failed:', err);
                statusText.setText('Connection failed. Please refresh.');
            });

        // Events
        this.events.on('queued', () => {
            statusText.setText('Searching for opponent...');
        });

        this.events.on('match_found', (msg) => {
            statusText.setText('Match Found! Connecting...');

            // Start connecting to game (WebRTC) immediately
            this.network.connectToGame();

            this.time.delayedCall(GameConfig.UI.MATCH_START_DELAY, () => {
                this.scene.start(TableTennisConfig.SCENES.GAME, {
                    network: this.network,
                    matchData: msg
                });
            });
        });

        // Note: Disconnected/Error events are handled by promise rejection or not emitted in strict port

        // Find match button handler
        findMatchBtn.on('pointerdown', () => {
            this.network.findMatch();
            findMatchBtn.disableInteractive();
            findMatchBtn.setAlpha(0.5);
        });
    }
}
