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
        this.gameStarted = false;

        // UI elements
        this.statusText = null;
        this.connectButton = null;
        this.scoreText = null;
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

        // Setup network event listeners
        this.setupNetworkEvents();

        // Connect to server
        this.connectToServer();

        // Input
        this.input.on('pointermove', (pointer) => {
            if (this.gameStarted) {
                this.handlePointerMove(pointer);
            }
        });

        // Start Game Loop logic
        this.resetBall();
    }

    createUI() {
        const padding = 20;
        const style = {
            fontSize: GameConfig.UI.SCORE_FONT_SIZE,
            fill: GameConfig.UI.SCORE_COLOR
        };

        // Score text
        this.scoreText = this.add.text(
            GameConfig.UI.SCORE_POSITION.x,
            GameConfig.UI.SCORE_POSITION.y,
            'A: 0  B: 0',
            style
        );

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
        this.statusText = this.add.text(
            this.centerX,
            GameConfig.DISPLAY.HEIGHT - padding,
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
            this.statusText.setText('Establishing connection...');
            this.network.connectToGame();
        });
    }

    async connectToServer() {
        try {
            await this.network.connect();

            if (GameConfig.MATCH_DATA && GameConfig.MATCH_DATA.roomId && GameConfig.MATCH_DATA.mode === 'embedded') {
                console.log('Using embedded match data:', GameConfig.MATCH_DATA);
                this.statusText.setText('Joining match...');

                // Wait 500ms to ensure ICE servers are received first
                await new Promise(resolve => setTimeout(resolve, 500));

                this.network.handleMatchFound(GameConfig.MATCH_DATA);
            } else {
                this.statusText.setText('Finding opponent...');
                this.network.findMatch();
            }
        } catch (error) {
            console.error('Failed to connect:', error);
            this.statusText.setText('Connection failed. Retrying...');
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
            this.statusText.setText('Waiting for opponent...');
        });

        this.events.on('match_found', (msg) => {
            this.role = msg.role; // Set local role
            this.isInitiator = msg.isInitiator;
            this.statusText.setText('Match found! Connecting to game...');
            this.network.connectToGame();
        });

        // Game connection established (WebRTC DataChannel open)
        this.events.on('game_datachannel_open', () => {
            console.log('Game Data Channel Open - Starting Sync');
            this.statusText.setText('Connected! Starting game...');

            // Hide status text after a moment
            this.time.delayedCall(2000, () => {
                this.statusText.setVisible(false);
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
            this.infoText.setText(`Player ${this.currentServer} Serving - Hit ball to start`);
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
        this.scoreText.setText(`A: ${this.scoreA}  B: ${this.scoreB}`);
        this.resetBall();

        // Send Score Update
        if (this.pingPongConnection) {
            this.pingPongConnection.sendScoreUpdate(this.scoreA, this.scoreB, this.currentServer);
        }
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
        this.resetBall();
        this.scoreText.setText(`A: ${this.scoreA}  B: ${this.scoreB}`);
    }
}
