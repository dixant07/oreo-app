import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { NetworkManager } from '../network/NetworkManager.js';
import { KnifeThrowConnection } from '../network/KnifeThrowConnection.js';
import { Target } from '../objects/Target.js';
import { Knife, ThrowingKnife } from '../objects/Knife.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        // Game state
        this.target = null;
        this.stuckKnives = []; // Array of Knife objects
        this.throwingKnife = null;
        this.readyKnife = null;
        this.dummyKnives = [];
        this.opponentThrowingKnife = null; // For opponent animations
        this.opponentReadyKnife = null; // Opponent's ready knife sprite

        // Player state
        this.playerRole = null; // 'A' or 'B'
        this.playerScore = 0;
        this.opponentScore = 0;
        this.knivesRemaining = CONFIG.KNIFE.KNIVES_PER_ROUND;
        this.opponentKnivesRemaining = CONFIG.KNIFE.KNIVES_PER_ROUND;
        this.currentRound = 1;

        // UI elements
        this.scoreText = null;
        this.knivesText = null;
        this.statusText = null;
        this.roundText = null;
        this.connectButton = null;

        // Network - Generic network manager
        this.network = new NetworkManager(this);

        // Game-specific connection (will be initialized after match found)
        this.gameConnection = null;

        // Game state flags
        this.canThrow = false;
        this.gameStarted = false;
        this.gameOver = false;
        this.isRoundSetup = false;
        this.roundSetupTimeout = null; // Timeout for waiting on round setup

        // Rotation control
        this.rotationTimer = 0;
        this.nextRotationChange = 2000;
    }

    preload() {
        // Load assets
        this.load.image('target', CONFIG.ASSETS.TARGET);
        this.load.image('blue_knife', CONFIG.ASSETS.BLUE_KNIFE);
        this.load.image('red_knife', CONFIG.ASSETS.RED_KNIFE);
        this.load.image('dummy_knife', CONFIG.ASSETS.DUMMY_KNIFE);

        // Load audio
        this.load.audio('hit', CONFIG.AUDIO.HIT);
        this.load.audio('fail', CONFIG.AUDIO.FAIL);
        this.load.audio('throw', CONFIG.AUDIO.THROW);
    }

    create() {
        // Hide loading screen
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }

        // Set background
        this.cameras.main.setBackgroundColor(CONFIG.COLORS.BACKGROUND);

        // Create target
        this.target = new Target(this);

        // Create UI
        this.createUI();

        // Setup network event listeners
        this.setupNetworkEvents();

        // Connect to server
        this.connectToServer();

        // Setup input
        this.input.on('pointerdown', this.handleThrow, this);
    }

    createUI() {
        const padding = 20;
        const fontSize = '24px';
        const style = {
            fontSize: fontSize,
            fill: CONFIG.COLORS.UI_TEXT,
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 4
        };

        // Round text
        this.roundText = this.add.text(padding, padding, 'Round: 1', style);
        this.roundText.setDepth(100);

        // Score text
        this.scoreText = this.add.text(
            CONFIG.WIDTH - padding,
            padding,
            'You: 0 | Opponent: 0',
            style
        );
        this.scoreText.setOrigin(1, 0);
        this.scoreText.setDepth(100);

        // Knives remaining
        this.knivesText = this.add.text(
            CONFIG.WIDTH / 2,
            padding,
            'Knives: 6',
            style
        );
        this.knivesText.setOrigin(0.5, 0);
        this.knivesText.setDepth(100);

        // Status text
        this.statusText = this.add.text(
            CONFIG.WIDTH / 2,
            CONFIG.HEIGHT - padding,
            'Connecting to server...',
            {
                fontSize: '20px',
                fill: '#ffff00',
                fontFamily: 'Arial, sans-serif',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        this.statusText.setOrigin(0.5, 1);
        this.statusText.setDepth(100);

        // Connect Button
        this.connectButton = this.add.text(
            CONFIG.WIDTH / 2,
            CONFIG.HEIGHT / 2 + 50,
            'CONNECT TO GAME',
            {
                fontSize: '32px',
                fill: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
                fontFamily: 'Arial, sans-serif',
                stroke: '#ffffff',
                strokeThickness: 2
            }
        );
        this.connectButton.setOrigin(0.5);
        this.connectButton.setDepth(101);
        this.connectButton.setInteractive({ useHandCursor: true });
        this.connectButton.setVisible(false);

        this.connectButton.on('pointerdown', () => {
            this.connectButton.setVisible(false);
            this.statusText.setText('Establishing connection...');
            this.network.connectToGame();
        });
    }

    async connectToServer() {
        try {
            await this.network.connect();

            if (CONFIG.MATCH_DATA && CONFIG.MATCH_DATA.roomId && CONFIG.MATCH_DATA.mode === 'embedded') {
                console.log('Using embedded match data:', CONFIG.MATCH_DATA);
                this.statusText.setText('Joining match...');

                // Wait 500ms to ensure ICE servers are received first
                // The ice_servers_config event fires shortly after connect
                await new Promise(resolve => setTimeout(resolve, 500));

                this.network.handleMatchFound(CONFIG.MATCH_DATA);
            } else {
                this.statusText.setText('Finding opponent...');
                this.network.findMatch();
            }
        } catch (error) {
            console.error('Failed to connect:', error);
            this.statusText.setText('Connection failed. Retrying...');
        }
    }

    setupNetworkEvents() {
        this.events.on('queued', () => {
            this.statusText.setText('Waiting for opponent...');
        });

        this.events.on('match_found', (msg) => {
            this.playerRole = msg.role;
            this.statusText.setText('Match found! Connecting to game...');
            this.network.connectToGame();
        });

        // Game connection established
        this.events.on('game_datachannel_open', () => {
            this.statusText.setText('Connected! Starting game...');

            // Initialize game-specific connection
            this.gameConnection = new KnifeThrowConnection(
                this.network.gameConnection,
                this
            );
            this.gameConnection.startHeartbeat();

            setTimeout(() => {
                this.startNewRound();
            }, 1000);
        });

        this.events.on('round_setup', (msg) => {
            this.handleRoundSetup(msg.dummyKnives);
        });

        this.events.on('rotation_update', (msg) => {
            if (this.target) {
                this.target.setRotationSpeed(msg.speed);
                this.target.setRotationDirection(msg.direction);
            }
        });

        this.events.on('opponent_action', (msg) => {
            this.handleOpponentAction(msg);
        });

        this.events.on('connection_failed', () => {
            this.statusText.setText('Connection lost. Please refresh.');
        });

        this.events.on('webrtc_disconnected', () => {
            this.statusText.setText('Opponent disconnected. Reconnecting...');
        });
    }

    startNewRound() {
        // Clear previous knives
        this.stuckKnives.forEach(knife => knife.destroy());
        this.stuckKnives = [];
        this.dummyKnives = [];

        // Reset knives
        this.knivesRemaining = CONFIG.KNIFE.KNIVES_PER_ROUND;
        this.opponentKnivesRemaining = CONFIG.KNIFE.KNIVES_PER_ROUND;
        this.isRoundSetup = false;

        // Update UI
        this.updateUI();

        // Show opponent's ready knife if they have knives
        this.updateOpponentReadyKnife();

        // Randomize target direction
        this.target.randomizeDirection();

        if (this.network.isInitiator) {
            // Initiator generates dummy knives and sends to peer
            const dummyKnivesConfig = this.generateDummyKnivesConfig();
            this.createDummyKnives(dummyKnivesConfig);

            // Small delay to ensure DataChannel is ready
            setTimeout(() => {
                this.gameConnection.sendRoundSetup(dummyKnivesConfig);
                console.log('Round setup sent:', dummyKnivesConfig);
            }, 100);

            this.isRoundSetup = true;
            this.startGameplay();
        } else {
            // Peer waits for round setup
            this.statusText.setText('Waiting for round setup...');

            // Timeout fallback: if no round setup received in 5 seconds, start anyway
            this.roundSetupTimeout = setTimeout(() => {
                if (!this.isRoundSetup) {
                    console.warn('Round setup timeout - starting with empty dummy knives');
                    this.handleRoundSetup([]);
                }
            }, 5000);
        }
    }

    generateDummyKnivesConfig() {
        const possibleCounts = CONFIG.DUMMY_KNIVES.POSSIBLE_COUNTS;
        const count = possibleCounts[Math.floor(Math.random() * possibleCounts.length)];

        if (count === 0) return [];

        const angleStep = 360 / count;
        const startAngle = Math.random() * 360;
        const config = [];

        for (let i = 0; i < count; i++) {
            config.push(startAngle + (i * angleStep));
        }
        return config;
    }

    handleRoundSetup(dummyKnivesConfig) {
        // Clear timeout if it exists
        if (this.roundSetupTimeout) {
            clearTimeout(this.roundSetupTimeout);
            this.roundSetupTimeout = null;
        }

        console.log('Round setup received:', dummyKnivesConfig);
        this.createDummyKnives(dummyKnivesConfig);
        this.isRoundSetup = true;
        this.startGameplay();
    }

    createDummyKnives(config) {
        config.forEach(angle => {
            const knife = new Knife(this, angle, 'dummy', true);
            this.dummyKnives.push(knife);
            this.stuckKnives.push(knife);
        });
    }

    startGameplay() {
        this.gameStarted = true;
        this.canThrow = true;
        this.updateStatusText();
        this.showReadyKnife();
    }

    showReadyKnife() {
        if (this.readyKnife) {
            this.readyKnife.destroy();
            this.readyKnife = null;
        }

        if (this.knivesRemaining > 0) {
            // Show my knife (Player A = Blue/playerA, Player B = Red/playerB)
            const knifeType = this.playerRole === 'A' ? 'playerA' : 'playerB';
            this.readyKnife = new ThrowingKnife(this, knifeType, 0, false); // false = player (bottom)
            this.readyKnife.isFlying = false; // Static
        }
    }

    updateOpponentReadyKnife() {
        if (this.opponentReadyKnife) {
            this.opponentReadyKnife.destroy();
            this.opponentReadyKnife = null;
        }

        if (this.opponentKnivesRemaining > 0) {
            // Opponent knife (Player A sees B's knife, Player B sees A's knife)
            const knifeType = this.playerRole === 'A' ? 'playerB' : 'playerA';
            // Create ThrowingKnife at top (opponent position)
            this.opponentReadyKnife = new ThrowingKnife(this, knifeType, 0, true); // true = opponent (top)
            this.opponentReadyKnife.isFlying = false; // Static until they throw
        }
    }

    handleThrow(pointer) {
        if (!this.canThrow || this.throwingKnife || this.gameOver || !this.isRoundSetup) return;

        // Strict check: cannot throw if no knives remaining
        if (this.knivesRemaining <= 0) return;

        // Play throw sound
        this.sound.play('throw');

        // Send throw start to opponent
        this.gameConnection.sendThrowStart();

        // Get current angle where knife should stick
        const currentAngle = this.target.getRotation();

        // Convert ready knife to throwing knife
        if (this.readyKnife) {
            this.throwingKnife = this.readyKnife;
            this.readyKnife = null;
            this.throwingKnife.isFlying = true;
            this.throwingKnife.targetAngle = currentAngle;
        } else {
            // Fallback
            const knifeType = this.playerRole === 'A' ? 'playerA' : 'playerB';
            this.throwingKnife = new ThrowingKnife(this, knifeType, currentAngle);
        }
    }

    update(time, delta) {
        // Update target rotation
        if (this.target) {
            this.target.update(delta);

            // Initiator controls random rotation changes
            if (this.network.isInitiator && this.gameStarted && !this.gameOver) {
                this.rotationTimer += delta;
                if (this.rotationTimer >= this.nextRotationChange) {
                    this.rotationTimer = 0;
                    this.nextRotationChange = Phaser.Math.Between(1000, 3000);

                    const newSpeed = Phaser.Math.FloatBetween(2, 6); // Random speed
                    const newDirection = Math.random() < 0.5 ? 1 : -1; // Random direction

                    this.target.setRotationSpeed(newSpeed);
                    this.target.setRotationDirection(newDirection);

                    this.gameConnection.sendRotationUpdate(newSpeed, newDirection);
                }
            }
        }

        // Update stuck knives positions
        const discRotation = this.target ? this.target.getRotation() : 0;
        this.stuckKnives.forEach(knife => {
            knife.updatePosition(discRotation);
        });

        // Update throwing knife
        if (this.throwingKnife) {
            const reached = this.throwingKnife.update(delta);

            if (reached) {
                this.handleKnifeImpact();
            }
        }

        // Update opponent throwing knife (with physics simulation)
        if (this.opponentThrowingKnife) {
            const reached = this.opponentThrowingKnife.update(delta);

            // When opponent's knife reaches target, we wait for the network message
            // But we can still show the vibration effect
            if (reached) {
                // The actual result (hit/miss) will come via network message
                // For now, just mark that it reached (the message handler will clean it up)
                this.opponentThrowingKnife.isFlying = false;
            }
        }
    }

    handleKnifeImpact() {
        // Calculate angle at impact (bottom of disc is 90 degrees)
        const targetAngle = (90 - this.target.getRotation() + 360) % 360;
        const discRotation = this.target.getRotation();

        // Check collision with existing knives
        let collision = false;
        for (let knife of this.stuckKnives) {
            if (knife.checkCollision(targetAngle, discRotation)) {
                collision = true;
                break;
            }
        }

        if (collision) {
            // Failed throw
            this.sound.play('fail');
            this.handleFailedThrow();
        } else {
            // Successful throw
            this.sound.play('hit');
            this.handleSuccessfulThrow(targetAngle);
        }

        // Clean up throwing knife
        if (this.throwingKnife) {
            this.throwingKnife.destroy();
            this.throwingKnife = null;
        }

        // Decrease knives remaining
        this.knivesRemaining--;
        this.updateUI();

        // Send action to opponent
        this.gameConnection.sendKnifeThrow(targetAngle, !collision);

        // Check if round is over
        this.checkRoundEnd();

        // Prepare next knife if any
        if (this.knivesRemaining > 0) {
            this.showReadyKnife();
        }
    }

    handleSuccessfulThrow(angle) {
        // Add score
        this.playerScore += CONFIG.SCORE.SUCCESSFUL_THROW;

        // Create stuck knife
        const knifeType = this.playerRole === 'A' ? 'playerA' : 'playerB';
        const knife = new Knife(this, angle, knifeType, true);
        this.stuckKnives.push(knife);

        // Check win condition
        this.checkWinCondition();

        // Vibrate effect
        this.cameras.main.shake(100, 0.005);
    }

    handleFailedThrow() {
        // No score, knife bounces off
        if (this.throwingKnife && this.throwingKnife.sprite) {
            this.animateBounce(this.throwingKnife.sprite);
            // Prevent immediate destruction in handleKnifeImpact
            this.throwingKnife = null;
        }
    }

    animateBounce(sprite) {
        // Random bounce direction
        const bounceX = Phaser.Math.Between(-100, 100);
        const bounceY = 200;
        const rotation = Phaser.Math.Between(-180, 180);

        this.tweens.add({
            targets: sprite,
            x: sprite.x + bounceX,
            y: sprite.y + bounceY,
            angle: rotation,
            alpha: 0,
            duration: 500,
            ease: 'Quad.easeOut',
            onComplete: () => {
                sprite.destroy();
            }
        });
    }

    handleOpponentAction(msg) {
        if (msg.action === 'throw_start') {
            // Opponent started throwing - convert ready knife to throwing
            if (this.opponentReadyKnife) {
                this.opponentThrowingKnife = this.opponentReadyKnife;
                this.opponentReadyKnife = null;
                this.opponentThrowingKnife.isFlying = true; // Start physics simulation
                this.opponentThrowingKnife.targetAngle = this.target.getRotation(); // Current disc angle

                this.sound.play('throw');
            }
        } else if (msg.action === 'throw_knife') {
            this.opponentKnivesRemaining--;

            if (msg.success) {
                this.opponentScore += CONFIG.SCORE.SUCCESSFUL_THROW;

                // Create opponent's stuck knife
                const knifeType = this.playerRole === 'A' ? 'playerB' : 'playerA';
                const knife = new Knife(this, msg.angle, knifeType, true);
                this.stuckKnives.push(knife);

                // Play hit sound
                this.sound.play('hit');

                // Vibrate effect (same as player's successful throw)
                this.cameras.main.shake(100, 0.005);
            } else {
                // Play fail sound
                this.sound.play('fail');

                // Animate bounce for opponent knife failure
                if (this.opponentThrowingKnife && this.opponentThrowingKnife.sprite) {
                    this.animateBounce(this.opponentThrowingKnife.sprite);
                    this.opponentThrowingKnife = null; // Detach so it doesn't get destroyed immediately
                }
            }

            // Cleanup opponent throwing knife if it wasn't bounced
            if (this.opponentThrowingKnife) {
                this.opponentThrowingKnife.destroy();
                this.opponentThrowingKnife = null;
            }

            this.updateUI();
            this.checkWinCondition();

            // Check if round is over
            this.checkRoundEnd();

            // Show next opponent knife
            if (this.opponentKnivesRemaining > 0) {
                this.updateOpponentReadyKnife();
            }
        }
    }


    checkRoundEnd() {
        if (this.knivesRemaining <= 0 && this.opponentKnivesRemaining <= 0) {
            this.endRound();
        }
    }

    checkWinCondition() {
        const scoreDiff = Math.abs(this.playerScore - this.opponentScore);

        if (scoreDiff >= CONFIG.SCORE.WIN_DIFFERENCE) {
            this.gameOver = true;
            this.canThrow = false;

            if (this.playerScore > this.opponentScore) {
                this.statusText.setText('🎉 YOU WIN! 🎉');
                this.statusText.setFill('#00ff00');
            } else {
                this.statusText.setText('😔 YOU LOSE 😔');
                this.statusText.setFill('#ff0000');
            }

            this.target.stopRotation();
        }
    }

    endRound() {
        if (this.gameOver) return;

        this.currentRound++;

        setTimeout(() => {
            this.startNewRound();
        }, 2000);
    }

    updateUI() {
        this.scoreText.setText(`You: ${this.playerScore} | Opponent: ${this.opponentScore}`);
        this.knivesText.setText(`Knives: ${this.knivesRemaining}`);
        this.roundText.setText(`Round: ${this.currentRound}`);
    }

    updateStatusText() {
        if (this.gameOver) return;
        this.statusText.setText('Throw!');
        this.statusText.setFill('#ffffff');
    }
}
