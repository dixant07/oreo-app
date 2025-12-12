/**
 * Table Tennis Specific Configuration
 * 
 * Game-specific settings that are only relevant to table tennis.
 * Other games would have their own configuration files.
 */
const TableTennisConfig = {
    // Asset keys used in Phaser
    ASSETS: {
        BALL: 'ball',
        BAT_A: 'bat_a',
        BAT_B: 'bat_b',
        TABLE: 'table',
        BAT_HIT: 'bat_hit',
        TABLE_BOUNCE: 'table_bounce',
    },

    // Game title
    TITLE: 'Table Tennis Web',

    // Scene keys
    SCENES: {
        BOOT: 'BootScene',
        MENU: 'MenuScene',
        GAME: 'GameScene',
    }
};

export default TableTennisConfig;
