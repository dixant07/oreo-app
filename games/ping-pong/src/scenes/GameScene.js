import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';
import TableTennisConfig from '../config/TableTennisConfig.js';
import PhysicsUtils from '../utils/PhysicsUtils.js';
import ViewTransform from '../utils/ViewTransform.js';
import { NetworkManager } from '../network/NetworkManager.js';
import { PingPongConnection } from '../network/PingPongConnection.js';

/**
 * GameScene - Main table tennis gameplay
 */
export default class GameScene extends Phaser.Scene {
    constructor() {
        super(TableTennisConfig.SCENES.GAME);
    }

    init() {
        // Game state
        this.role = null; // 'A' or 'B'
        this.network = new NetworkManager(this);
        this.pingPongConnection = null;
        // Game state
        this.role = null; // 'A' or 'B'
        this.network = new NetworkManager(this);
        this.pingPongConnection = null;
        this.gameStarted = false;
        this.gameOver = false; // New flag for win state

        // UI elements
        this.statusText = null;
        this.connectButton = null;
        this.scoreGroup = null; // Container for scoreboard elements
        this.scoreTextA = null;
        this.scoreTextB = null;
        this.nameTextA = null;
        this.nameTextB = null;
        this.bgA = null;
        this.bgB = null;
        this.infoText = null;

        // Logical State (World Coordinates)
        this.ballState = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, spin: 0 };
        this.batAState = { x: 0, y: 200, vx: 0, vy: 0, prevX: 0, prevY: 200 };
        this.batBState = { x: 0, y: -200, vx: 0, vy: 0, prevX: 0, prevY: -200 };

        // Collision cooldown tracking
        this.lastHitTime = 0;
        this.COLLISION_COOLDOWN = 150;

        // Game State
        this.isServing = true;
        this.currentServer = GameConfig.GAME.INITIAL_SERVER;

        // Score
        this.scoreA = 0;
        this.scoreB = 0;
    }

    preload() {
        // Load table tennis assets (moved from BootScene)
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
        this.centerX = GameConfig.DISPLAY.WIDTH / 2;
        this.centerY = GameConfig.DISPLAY.HEIGHT / 2;

        // Initialize view transform utility
        this.viewTransform = new ViewTransform(this.centerX, this.centerY);

        // Set background
        this.cameras.main.setBackgroundColor(GameConfig.DISPLAY.BACKGROUND_COLOR);

        // Add Table
        this.table = this.add.image(
            this.centerX,
            this.centerY,
            TableTennisConfig.ASSETS.TABLE
        ).setScale(GameConfig.ASSETS.TABLE_SCALE);

        // Add Bats
        this.batA = this.add.image(
            this.centerX,
            this.centerY,
            TableTennisConfig.ASSETS.BAT_A
        ).setScale(GameConfig.ASSETS.BAT_SCALE);

        this.batB = this.add.image(
            this.centerX,
            this.centerY,
            TableTennisConfig.ASSETS.BAT_B
        ).setScale(GameConfig.ASSETS.BAT_SCALE);

        // Add Ball
        this.ball = this.add.image(
            this.centerX,
            this.centerY,
            TableTennisConfig.ASSETS.BALL
        ).setScale(GameConfig.ASSETS.BALL_BASE_SCALE);

        // Create UI
        this.createUI();

        // Setup resize listener
        this.scale.on('resize', this.handleResize, this);

        // Initial resize to set correct scaling
        this.handleResize({ width: this.scale.width, height: this.scale.height });

        // Setup network event listeners
        this.setupNetworkEvents();

        // Connect to server
        this.connectToServer();

        // Input
        this.input.on('pointermove', (pointer) => {
            // Adjust pointer for resize if necessary, though pointer coordinates usually scale automatically in RESIZE mode
            if (this.gameStarted) {
                this.handlePointerMove(pointer);
            }
        });

        // Start Game Loop logic
        this.resetBall();

        // Cleanup on scene shutdown
        this.events.on('shutdown', () => {
            console.log('[GameScene] Shutting down, disconnecting network...');
            if (this.network) {
                this.network.disconnect();
            }
            this.scale.removeListener('resize', this.handleResize, this);
        });
    }

    handleResize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;

        this.centerX = width / 2;
        this.centerY = height / 2;

        this.cameras.main.setViewport(0, 0, width, height);

        // Calculate global scale to fit the target aspect ratio
        // We want to fit the game area (TARGET_WIDTH x TARGET_HEIGHT) into the window
        const scaleX = width / GameConfig.DISPLAY.TARGET_WIDTH;
        const scaleY = height / GameConfig.DISPLAY.TARGET_HEIGHT;

        // Use the smaller scale to ensure everything fits
        const globalScale = Math.min(scaleX, scaleY);

        // Update ViewTransform
        this.viewTransform.update(this.centerX, this.centerY, globalScale);

        // Resize and Reposition Table
        this.table.setPosition(this.centerX, this.centerY);
        this.table.setScale(GameConfig.ASSETS.TABLE_SCALE * globalScale);

        // Reposition Bats & Ball (rendering loop will handle positions, but we need to update scales)
        this.batA.setScale(GameConfig.ASSETS.BAT_SCALE * globalScale);
        this.batB.setScale(GameConfig.ASSETS.BAT_SCALE * globalScale);
        // Ball scale is dynamic in render(), but base scale depends on global scale now (handled in ViewTransform)

        // UI Repositioning
        if (this.statusText) {
            this.statusText.setPosition(this.centerX, height - 20);
        }
        if (this.connectButton) {
            this.connectButton.setPosition(this.centerX, this.centerY + 50);
        }
        if (this.infoText) {
            this.infoText.setPosition(this.centerX, GameConfig.UI.INFO_Y);
        }

        // Reposition Scoreboard
        this.updateScoreBoardPositions(width, height);
    }

    createUI() {
        // Create Score scoreboard elements
        this.createScoreBoard();

        // Info/Status text (serving, etc.)
        this.infoText = this.add.text(
            this.centerX,
            GameConfig.UI.INFO_Y,
            '',
            {
                fontSize: GameConfig.UI.INFO_FONT_SIZE,
                fill: GameConfig.UI.INFO_COLOR
            }
        ).setOrigin(0.5);

        // Network Status text
        // Create Status Graphic Background First
        this.statusBg = this.add.graphics();
        this.statusBg.setDepth(100);

        this.statusText = this.add.text(
            this.centerX,
            GameConfig.DISPLAY.HEIGHT - 40,
            'Connecting...',
            {
                fontSize: '20px',
                fill: '#ffffff', // White text
                fontFamily: 'Arial, sans-serif'
            }
        );
        this.statusText.setOrigin(0.5, 0.5);
        this.statusText.setDepth(101); // Above BG

        // Initial Background Draw
        this.updateStatusDisplay('Connecting...');

        // Connect Button
        this.connectButton = this.add.text(
            this.centerX,
            this.centerY + 50,
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
            this.updateStatusDisplay('Connecting...');
            this.network.connectToGame();
        });
    }

    updateStatusDisplay(text) {
        if (!this.statusText) return;

        this.statusText.setText(text);
        this.statusText.setVisible(true);

        // Update Background
        const padding = 20;
        const width = this.statusText.width + padding * 2;
        const height = this.statusText.height + padding;
        const radius = 15;

        this.statusBg.clear();
        this.statusBg.setVisible(true);
        this.statusBg.fillStyle(0x000000, 1); // Black background
        this.statusBg.fillRoundedRect(
            this.statusText.x - width / 2,
            this.statusText.y - height / 2,
            width,
            height,
            radius
        );
    }

    createScoreBoard() {
        const sb = GameConfig.UI.SCORE_BOARD;

        // Backgrounds (Rounded Rects) - Graphics objects
        this.bgA = this.add.graphics();
        this.bgB = this.add.graphics();

        // Text Styles
        const nameStyle = { fontSize: sb.FONT_SIZE_NAME, fill: sb.TEXT_COLOR, fontFamily: 'Arial' };
        const scoreStyle = { fontSize: sb.FONT_SIZE_SCORE, fill: sb.TEXT_COLOR, fontFamily: 'Arial', fontStyle: 'bold' };

        // Player A Elements (Left side usually, but depends on role)
        // We initialize them, positions will be set in updateScoreBoardPositions
        this.nameTextA = this.add.text(0, 0, 'Player A', nameStyle).setOrigin(0.5);
        this.scoreTextA = this.add.text(0, 0, '0', scoreStyle).setOrigin(0.5);

        // Player B Elements
        this.nameTextB = this.add.text(0, 0, 'Player B', nameStyle).setOrigin(0.5);
        this.scoreTextB = this.add.text(0, 0, '0', scoreStyle).setOrigin(0.5);

        // Set Depths to be on top
        this.bgA.setDepth(90);
        this.bgB.setDepth(90);
        this.nameTextA.setDepth(91);
        this.scoreTextA.setDepth(91);
        this.nameTextB.setDepth(91);
        this.scoreTextB.setDepth(91);
    }

    updateScoreBoardPositions(width, height) {
        if (!this.nameTextA) return;

        const sb = GameConfig.UI.SCORE_BOARD;
        const topY = sb.MARGIN_Y;
        const leftX = sb.MARGIN_X + (sb.WIDTH / 2);
        const rightX = width - sb.MARGIN_X - (sb.WIDTH / 2); // Mirror on right

        // For now, let's put A on Left and B on Right by default
        // When role is assigned, we might swap them so "You" is always on one side, but
        // requested requirement: Top Left = "You", Top Right = "Opponent"

        // We will handle "You" vs "Opponent" text updates in updateScoreBoard() logic
        // But physically, let's define Block 1 (Left) and Block 2 (Right) positions

        // Left Block (Block 1)
        this._pos1 = { x: leftX, y: topY };

        // Right Block (Block 2)
        this._pos2 = { x: rightX, y: topY };

        // We will decide WHICH player goes to WHICH block in redrawScoreBoard()
        this.redrawScoreBoard();
    }

    redrawScoreBoard() {
        // If role is not known yet, we can still render the board with defaults
        const sb = GameConfig.UI.SCORE_BOARD;

        let leftName = "You";
        let rightName = "Opponent";
        let leftScoreVal = this.scoreA;
        let rightScoreVal = this.scoreB;

        // Default colors if role unknown
        let leftColor = 0xff0000; // Red for A
        let rightColor = 0x0000ff; // Blue for B

        if (this.role) {
            // Role known - customize "You" vs "Opponent"
            if (this.role === 'A') {
                // I am A (Red) -> Left is Me (You)
                leftName = "You";
                leftColor = 0xff0000;
                leftScoreVal = this.scoreA;

                rightName = "Opponent";
                rightColor = 0x0000ff;
                rightScoreVal = this.scoreB;
            } else {
                // I am B (Blue) -> Left is Me (You)
                leftName = "You";
                leftColor = 0x0000ff; // My Color
                leftScoreVal = this.scoreB; // My Score

                rightName = "Opponent";
                rightColor = 0xff0000; // Opponent Color
                rightScoreVal = this.scoreA; // Opponent Score
            }
        }

        // Use calculated positions or defaults
        const posLeft = this._pos1 || { x: sb.MARGIN_X + sb.WIDTH / 2, y: sb.MARGIN_Y };
        const posRight = this._pos2 || { x: GameConfig.DISPLAY.WIDTH - sb.MARGIN_X - sb.WIDTH / 2, y: sb.MARGIN_Y };

        // Draw Backgrounds
        this.bgA.clear();
        this.bgB.clear();

        // Left Background
        this.bgA.fillStyle(leftColor, sb.BG_ALPHA);
        this.bgA.fillRoundedRect(
            posLeft.x - sb.WIDTH / 2,
            posLeft.y,
            sb.WIDTH,
            sb.HEIGHT,
            sb.RADIUS
        );

        // Right Background
        this.bgB.fillStyle(rightColor, sb.BG_ALPHA);
        this.bgB.fillRoundedRect(
            posRight.x - sb.WIDTH / 2,
            posRight.y,
            sb.WIDTH,
            sb.HEIGHT,
            sb.RADIUS
        );

        // Update Texts
        // Left Side
        this.nameTextA.setText(leftName);
        this.nameTextA.setPosition(posLeft.x, posLeft.y + 15);

        this.scoreTextA.setText(leftScoreVal);
        this.scoreTextA.setPosition(posLeft.x, posLeft.y + 40);

        // Right Side
        this.nameTextB.setText(rightName);
        this.nameTextB.setPosition(posRight.x, posRight.y + 15);

        this.scoreTextB.setText(rightScoreVal);
        this.scoreTextB.setPosition(posRight.x, posRight.y + 40);
    }

    async connectToServer() {
        try {
            await this.network.connect();

            if (GameConfig.MATCH_DATA && GameConfig.MATCH_DATA.roomId && GameConfig.MATCH_DATA.mode === 'embedded') {
                console.log('Using embedded match data:', GameConfig.MATCH_DATA);
                this.updateStatusDisplay('Joining...');

                // Wait 500ms to ensure ICE servers are received first
                await new Promise(resolve => setTimeout(resolve, 500));

                this.network.handleMatchFound(GameConfig.MATCH_DATA);
            } else {
                this.updateStatusDisplay('Finding opponent...');
                this.network.findMatch();
            }
        } catch (error) {
            console.error('Failed to connect:', error);
            this.updateStatusDisplay('Connection failed. Retrying...');
            this.connectButton.setText('RETRY CONNECTION');
            this.connectButton.setVisible(true);

            // Retry handler
            this.connectButton.removeAllListeners('pointerdown');
            this.connectButton.on('pointerdown', () => {
                this.connectButton.setVisible(false);
                this.connectToServer();
            });
        }
    }

    setupNetworkEvents() {
        // NetworkManager events
        this.events.on('queued', () => {
            this.updateStatusDisplay('Waiting...');
        });

        this.events.on('match_found', (msg) => {
            this.role = msg.role; // Set local role
            this.isInitiator = msg.isInitiator;
            this.updateStatusDisplay('Waiting...');

            // Now that we have a role, we can properly label "You" and "Opponent"
            this.redrawScoreBoard();

            this.network.connectToGame();
        });

        // Game connection established (WebRTC DataChannel open)
        this.events.on('game_datachannel_open', () => {
            console.log('Game Data Channel Open - Starting Sync');
            this.updateStatusDisplay('Start');

            // Hide status text after a moment
            this.time.delayedCall(1000, () => {
                this.statusText.setVisible(false);
                this.statusBg.setVisible(false);
            });

            // Initialize game-specific connection
            if (this.network.gameConnection) {
                this.pingPongConnection = new PingPongConnection(
                    this.network.gameConnection,
                    this
                );
                this.pingPongConnection.startHeartbeat();
            }

            this.startGameplay();
        });

        this.events.on('connection_failed', () => {
            this.statusText.setText('Connection lost. Please refresh.');
            this.statusText.setVisible(true);
            this.gameStarted = false;
        });

        this.events.on('webrtc_disconnected', () => {
            this.statusText.setText('Opponent disconnected.');
            this.statusText.setVisible(true);
            this.gameStarted = false;
        });

        // Game specific events
        this.events.on('remote_bat_update', (msg) => this.handleRemoteBat(msg));
        this.events.on('remote_hit_event', (msg) => this.handleRemoteHit(msg));
        this.events.on('remote_score_update', (msg) => this.handleRemoteScore(msg));
    }

    startGameplay() {
        this.gameStarted = true;
        this.resetBall();
        this.updateInfoText();
    }

    update(time, delta) {
        if (!this.gameStarted) return;

        const dt = delta / 1000;

        // BOTH players simulate physics locally
        this.updatePhysics(dt);

        this.render();
        this.updateInfoText();
    }

    handlePointerMove(pointer) {
        // Calculate World Coordinates based on Role
        let worldX, worldY;

        if (this.role === 'A') {
            // A sees normal view
            worldX = pointer.x - this.centerX;
            worldY = pointer.y - this.centerY;

            // Clamp A to Bottom Side (Positive Y)
            worldY = Phaser.Math.Clamp(
                worldY,
                GameConfig.GAME.BAT_A_Y_MIN,
                GameConfig.GAME.BAT_A_Y_MAX
            );

            // Store previous position for velocity calculation
            this.batAState.prevX = this.batAState.x;
            this.batAState.prevY = this.batAState.y;

            this.batAState.x = worldX;
            this.batAState.y = worldY;
        } else {
            // B sees inverted view
            worldX = this.centerX - pointer.x;
            worldY = this.centerY - pointer.y;

            // Clamp B to Top Side (Negative Y)
            worldY = Phaser.Math.Clamp(
                worldY,
                GameConfig.GAME.BAT_B_Y_MIN,
                GameConfig.GAME.BAT_B_Y_MAX
            );

            // Store previous position for velocity calculation
            this.batBState.prevX = this.batBState.x;
            this.batBState.prevY = this.batBState.y;

            this.batBState.x = worldX;
            this.batBState.y = worldY;
        }

        this.sendBatUpdate();
    }

    updateInfoText() {
        if (this.isServing) {
            this.infoText.setText(''); // Removed "Serving - Hit ball to start" as requested
        } else {
            this.infoText.setText('');
        }
    }

    updatePhysics(dt) {
        const b = this.ballState;

        // Update bat velocities (smoothed)
        this.updateBatVelocities(dt);

        // Store previous ball position for continuous collision detection
        const prevBallX = b.x - b.vx * dt;
        const prevBallY = b.y - b.vy * dt;

        // Apply gravity with spin modifier
        let gravityMultiplier = 1.0;
        if (GameConfig.PHYSICS.SPIN_ENABLED && b.spin !== 0) {
            if (b.spin > 0) {
                // Topspin - more gravity
                gravityMultiplier = GameConfig.PHYSICS.TOPSPIN_GRAVITY_MULTIPLIER;
            } else {
                // Backspin - less gravity
                gravityMultiplier = GameConfig.PHYSICS.BACKSPIN_GRAVITY_MULTIPLIER;
            }
        }
        b.vz -= (GameConfig.PHYSICS.GRAVITY * gravityMultiplier * dt);

        // Apply spin decay
        if (b.spin !== 0) {
            b.spin *= Math.pow(GameConfig.PHYSICS.SPIN_DECAY, dt);
            if (Math.abs(b.spin) < 0.01) b.spin = 0;
        }

        // Move ball
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.z += b.vz * dt;

        // Ground/Table Bounce
        if (b.z <= 0) {
            b.z = 0;
            if (b.vz < 0) {
                // Play bounce sound if velocity is significant
                if (Math.abs(b.vz) > 10) {
                    this.sound.play(TableTennisConfig.ASSETS.TABLE_BOUNCE);
                }

                b.vz = PhysicsUtils.bounce(b.vz);
                b.vx = PhysicsUtils.applyFriction(b.vx);
                b.vy = PhysicsUtils.applyFriction(b.vy);

                if (this.isServing) {
                    if (b.vz < GameConfig.PHYSICS.SERVE_BOUNCE_IMPULSE) {
                        b.vz = GameConfig.PHYSICS.SERVE_BOUNCE_IMPULSE;
                    }
                } else {
                    if (Math.abs(b.vz) < GameConfig.PHYSICS.MIN_BOUNCE_VELOCITY) {
                        b.vz = 0;
                    }
                }
            }
        }

        // Check for stuck ball (only current server checks to avoid conflict)
        if (
            this.role === this.currentServer &&
            !this.isServing &&
            b.z === 0 &&
            PhysicsUtils.isStuck(b.vx, b.vy, b.vz)
        ) {
            this.handleScoreChange(this.currentServer);
        }

        // Bat Collisions - Check MY bat collision locally with continuous detection
        if (this.role === 'A') {
            this.checkBatCollision(this.batAState, 1, prevBallX, prevBallY, dt);
        } else {
            this.checkBatCollision(this.batBState, -1, prevBallX, prevBallY, dt);
        }

        // Bounds/Score - Only Role A (Host) acts as referee
        if (this.role === 'A') {
            if (Math.abs(b.y) > GameConfig.GAME.COURT_Y_BOUNDARY) {
                if (b.y > 0) {
                    this.handleScoreChange('B');
                } else {
                    this.handleScoreChange('A');
                }
            }
        }
    }

    updateBatVelocities(dt) {
        // Update bat A velocity
        const smoothing = GameConfig.PHYSICS.BAT_VELOCITY_SMOOTHING;
        this.batAState.vx = Phaser.Math.Linear(
            this.batAState.vx,
            (this.batAState.x - this.batAState.prevX) / Math.max(dt, 0.001),
            smoothing
        );
        this.batAState.vy = Phaser.Math.Linear(
            this.batAState.vy,
            (this.batAState.y - this.batAState.prevY) / Math.max(dt, 0.001),
            smoothing
        );

        // Update bat B velocity
        this.batBState.vx = Phaser.Math.Linear(
            this.batBState.vx,
            (this.batBState.x - this.batBState.prevX) / Math.max(dt, 0.001),
            smoothing
        );
        this.batBState.vy = Phaser.Math.Linear(
            this.batBState.vy,
            (this.batBState.y - this.batBState.prevY) / Math.max(dt, 0.001),
            smoothing
        );
    }

    checkBatCollision(batState, direction, prevBallX, prevBallY, dt) {
        const b = this.ballState;
        const now = this.time.now;

        // ========================================
        // COLLISION COOLDOWN - Prevent multiple hits
        // ========================================
        if (now - this.lastHitTime < this.COLLISION_COOLDOWN) {
            return;  // Still in cooldown period, skip collision check
        }

        // ========================================
        // CONTINUOUS COLLISION DETECTION
        // ========================================
        // Check both current position AND if ball crossed through bat

        // Current distance
        const currentDist = PhysicsUtils.distance(b.x, b.y, batState.x, batState.y);

        // Distance at previous frame
        const prevDist = PhysicsUtils.distance(prevBallX, prevBallY, batState.x, batState.y);

        // Check if ball's path intersects with bat's collision circle
        // Using swept circle collision detection
        const collisionRadius = GameConfig.PHYSICS.BAT_COLLISION_RADIUS;

        // Method 1: Current position check
        const currentlyColliding = currentDist < collisionRadius;

        // Method 2: Check if ball crossed through bat (was far, now close on other side)
        const crossedThrough = this.checkLineSphereIntersection(
            prevBallX, prevBallY,  // Line start (prev ball pos)
            b.x, b.y,              // Line end (current ball pos)
            batState.x, batState.y, // Sphere center (bat pos)
            collisionRadius        // Sphere radius
        );

        // Collision detected if either condition is true
        const hasCollision = currentlyColliding || crossedThrough;

        if (GameConfig.DEBUG.LOG_COLLISIONS) {
            console.log('Collision check:', {
                currentDist: currentDist.toFixed(1),
                prevDist: prevDist.toFixed(1),
                radius: collisionRadius,
                currentlyColliding,
                crossedThrough,
                hasCollision
            });
        }

        if (hasCollision) {
            // ========================================
            // COLLISION CONFIRMED - Apply cooldown
            // ========================================
            this.lastHitTime = now;

            // Play hit sound
            this.sound.play(TableTennisConfig.ASSETS.BAT_HIT);

            // Hit!
            if (this.isServing) {
                // Only server can hit during serve
                const isServerA = (this.currentServer === 'A');
                const isBatA = (this.role === 'A');
                if (isServerA !== isBatA) return;
                this.isServing = false;
            }

            // ========================================
            // ELASTIC COLLISION - Transfer bat velocity to ball
            // ========================================

            // Transfer bat's Y velocity (forward/backward motion)
            const batVyTransfer = batState.vy * GameConfig.PHYSICS.BAT_VELOCITY_TRANSFER;
            b.vy = -direction * GameConfig.PHYSICS.GUARANTEED_REACH_VELOCITY + batVyTransfer;

            // Transfer bat's X velocity (left/right motion)
            const batVxTransfer = batState.vx * GameConfig.PHYSICS.BAT_VELOCITY_TRANSFER;
            const dx = b.x - batState.x;
            b.vx = dx * GameConfig.PHYSICS.BAT_HIT_VELOCITY_MULTIPLIER + batVxTransfer;

            // Clamp velocities
            b.vy = Phaser.Math.Clamp(b.vy, -GameConfig.PHYSICS.MAX_SPEED, GameConfig.PHYSICS.MAX_SPEED);
            b.vx = Phaser.Math.Clamp(b.vx, -GameConfig.PHYSICS.MAX_SPEED, GameConfig.PHYSICS.MAX_SPEED);

            // ========================================
            // SPIN MECHANICS
            // ========================================
            if (GameConfig.PHYSICS.SPIN_ENABLED) {
                // Vertical bat movement creates spin
                // Forward movement (away from player) = topspin (positive)
                // Backward movement (toward player) = backspin (negative)
                b.spin = -batState.vy * direction * GameConfig.PHYSICS.SPIN_MULTIPLIER;

                if (GameConfig.DEBUG.LOG_COLLISIONS) {
                    const spinType = b.spin > 0 ? 'topspin' : b.spin < 0 ? 'backspin' : 'none';
                    console.log('Spin applied:', spinType, b.spin);
                }
            }

            // ========================================
            // VERTICAL IMPULSE - Optimized for table reach
            // ========================================
            // Calculate optimal Z impulse for nice arc
            const optimalAngleRad = GameConfig.PHYSICS.OPTIMAL_HIT_ANGLE * (Math.PI / 180);
            b.vz = Math.abs(b.vy) * Math.tan(optimalAngleRad);

            // Ensure minimum Z impulse
            if (b.vz < GameConfig.PHYSICS.BAT_HIT_Z_IMPULSE) {
                b.vz = GameConfig.PHYSICS.BAT_HIT_Z_IMPULSE;
            }

            // Send HIT Event to sync opponent
            this.sendHitEvent();

            if (GameConfig.DEBUG.LOG_COLLISIONS) {
                console.log('🎯 Bat collision:', {
                    role: this.role,
                    direction,
                    method: currentlyColliding ? 'current' : 'continuous',
                    batVel: { vx: batState.vx.toFixed(1), vy: batState.vy.toFixed(1) },
                    ballVel: { vx: b.vx.toFixed(1), vy: b.vy.toFixed(1), vz: b.vz.toFixed(1) },
                    spin: b.spin.toFixed(2)
                });
            }
        }
    }

    // Helper method for continuous collision detection
    checkLineSphereIntersection(x1, y1, x2, y2, cx, cy, radius) {
        // Check if line segment (x1,y1) to (x2,y2) intersects circle at (cx,cy) with radius

        // Vector from circle center to line start
        const dx = x1 - cx;
        const dy = y1 - cy;

        // Line direction vector
        const lx = x2 - x1;
        const ly = y2 - y1;

        // Coefficients for quadratic equation
        const a = lx * lx + ly * ly;
        const b = 2 * (dx * lx + dy * ly);
        const c = dx * dx + dy * dy - radius * radius;

        // Discriminant
        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            return false;  // No intersection
        }

        // Calculate intersection points
        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

        // Check if intersection is within line segment (t between 0 and 1)
        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    }

    handleScoreChange(winner) {
        if (winner === 'A') {
            this.scoreA++;
            this.currentServer = 'A';
        } else {
            this.scoreB++;
            this.currentServer = 'B';
        }
        this.isServing = true;

        // Reset ball first
        this.resetBall();

        // Update scoreboard
        this.redrawScoreBoard();

        // Check for Win Condition
        this.checkWinCondition();

        // Send Score Update
        if (this.pingPongConnection) {
            this.pingPongConnection.sendScoreUpdate(this.scoreA, this.scoreB, this.currentServer);
        }
    }

    checkWinCondition() {
        if (this.gameOver) return;

        const winningScore = GameConfig.GAME.WINNING_SCORE;
        let winner = null;

        if (this.scoreA >= winningScore) {
            winner = 'A';
        } else if (this.scoreB >= winningScore) {
            winner = 'B';
        }

        if (winner) {
            this.handleWin(winner);
        }
    }

    handleWin(winner) {
        this.gameOver = true;
        this.gameStarted = false; // Stop updates

        const isMeWinner = (this.role === winner);

        // Visuals
        const overlayColor = (winner === 'A') ? 0xff0000 : 0x0000ff; // Red (A) or Blue (B)
        const overlayAlpha = GameConfig.UI.WIN_OVERLAY_ALPHA;

        const winText = isMeWinner ? "You Won" : "Opponent Won";

        // Create Full Screen Overlay
        const overlay = this.add.graphics();
        overlay.setDepth(200);
        overlay.fillStyle(overlayColor, overlayAlpha);
        overlay.fillRect(0, 0, GameConfig.DISPLAY.WIDTH, GameConfig.DISPLAY.HEIGHT);

        // Create Win Text
        const text = this.add.text(
            this.centerX,
            this.centerY,
            winText,
            {
                fontSize: '64px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        text.setDepth(201);
    }

    resetBall() {
        const serveY = (this.currentServer === 'A')
            ? GameConfig.GAME.BALL_SERVE_Y_OFFSET
            : -GameConfig.GAME.BALL_SERVE_Y_OFFSET;

        this.ballState = {
            x: 0,
            y: serveY,
            z: GameConfig.GAME.BALL_SERVE_Z,
            vx: 0,
            vy: 0,
            vz: 0,
            spin: 0  // Reset spin
        };
    }

    render() {
        // Position Sprites using ViewTransform
        const posA = this.viewTransform.worldToScreen(
            this.batAState.x,
            this.batAState.y,
            0,
            this.role
        );
        this.batA.setPosition(posA.x, posA.y);

        const posB = this.viewTransform.worldToScreen(
            this.batBState.x,
            this.batBState.y,
            0,
            this.role
        );
        this.batB.setPosition(posB.x, posB.y);

        const posBall = this.viewTransform.worldToScreen(
            this.ballState.x,
            this.ballState.y,
            this.ballState.z,
            this.role
        );
        this.ball.setPosition(posBall.x, posBall.y);

        // Scale ball based on depth
        const scale = this.viewTransform.calculateDepthScale(
            this.ballState.z,
            GameConfig.ASSETS.BALL_BASE_SCALE,
            GameConfig.ASSETS.BALL_Z_SCALE_FACTOR
        );
        this.ball.setScale(scale);
    }

    sendBatUpdate() {
        if (this.pingPongConnection) {
            const myBatState = (this.role === 'A') ? this.batAState : this.batBState;
            this.pingPongConnection.sendBatUpdate(
                this.role,
                myBatState.x,
                myBatState.y,
                myBatState.vx,
                myBatState.vy
            );
        }
    }

    sendHitEvent() {
        if (this.pingPongConnection) {
            this.pingPongConnection.sendHitEvent(this.ballState, this.isServing);
        }
    }

    handleRemoteBat(msg) {
        if (msg.role !== this.role) {
            const targetBatState = (msg.role === 'A') ? this.batAState : this.batBState;
            targetBatState.prevX = targetBatState.x;
            targetBatState.prevY = targetBatState.y;
            targetBatState.x = msg.x;
            targetBatState.y = msg.y;
            if (msg.vx !== undefined) targetBatState.vx = msg.vx;
            if (msg.vy !== undefined) targetBatState.vy = msg.vy;
        }
    }

    handleRemoteHit(msg) {
        this.ballState = msg.state;
        this.isServing = msg.isServing;
    }

    handleRemoteScore(msg) {
        this.scoreA = msg.scoreA;
        this.scoreB = msg.scoreB;
        this.currentServer = msg.currentServer;
        this.isServing = true;
        this.isServing = true;
        this.resetBall();

        // Update scoreboard
        this.redrawScoreBoard();

        // Check for win on remote update too
        this.checkWinCondition();
        // this.scoreText.setText(`A: ${this.scoreA}  B: ${this.scoreB}`);
    }
}
