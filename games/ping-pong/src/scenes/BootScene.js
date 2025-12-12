import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';
import TableTennisConfig from '../config/TableTennisConfig.js';

/**
 * BootScene - Loads all table tennis assets
 */
export default class BootScene extends Phaser.Scene {
    constructor() {
        super(TableTennisConfig.SCENES.BOOT);
    }

    preload() {
        // Load table tennis assets
        this.load.image(
            TableTennisConfig.ASSETS.BALL,
            GameConfig.ASSETS.BALL_SPRITE
        );
        this.load.image(
            TableTennisConfig.ASSETS.BAT_A,
            GameConfig.ASSETS.BAT_A_SPRITE
        );
        this.load.image(
            TableTennisConfig.ASSETS.BAT_B,
            GameConfig.ASSETS.BAT_B_SPRITE
        );
        this.load.image(
            TableTennisConfig.ASSETS.TABLE,
            GameConfig.ASSETS.TABLE_SPRITE
        );

        // Load audio
        this.load.audio(
            TableTennisConfig.ASSETS.BAT_HIT,
            GameConfig.ASSETS.BAT_HIT_AUDIO
        );
        this.load.audio(
            TableTennisConfig.ASSETS.TABLE_BOUNCE,
            GameConfig.ASSETS.TABLE_BOUNCE_AUDIO
        );
    }

    create() {
        // Move to menu scene after assets are loaded
        this.scene.start(TableTennisConfig.SCENES.MENU);
    }
}
