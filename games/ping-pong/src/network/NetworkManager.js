import GameConfig from '../config/GameConfig.js';
import { io } from 'socket.io-client';
import { GameConnection } from './GameConnection.js';

/**
 * NetworkManager - Main network coordinator
 * Manages Socket.IO connection, matchmaking, and coordinates WebRTC connections
 * This is game-agnostic and handles only matchmaking and connection coordination
 */
export class NetworkManager {
    constructor(scene) {
        this.scene = scene;
        this.socket = null;
        this.userId = GameConfig.USER_ID; // Use ID from config
        this.roomId = null;
        this.role = null; // 'A' or 'B'
        this.opponentId = null;
        this.isInitiator = false;
        this.iceServers = { game: [] };

        // Connection instances
        this.gameConnection = null;

        // Connection states
        this.isSignalingConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        // Buffer for pending offer if user hasn't clicked connect yet
        this.pendingOffer = null;
    }

    /**
     * Connect to signaling server and setup matchmaking
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // Use userId from config
                this.userId = GameConfig.USER_ID;

                if (!this.userId) {
                    console.warn("No user ID found. Connection might fail.");
                }

                this.socket = io(GameConfig.NETWORK.SERVER_URL, {
                    auth: {
                        userId: this.userId,
                        // Passing userId as token if server expects 'token' field, 
                        // though ideally server should look for userId if no token:
                        token: this.userId
                    },
                    path: GameConfig.NETWORK.SOCKET_PATH,  // Must match server's SOCKET_IO_PATH
                    transports: ['websocket', 'polling']
                });

                this.socket.on('connect', () => {
                    console.log('[NetworkManager] Connected to signaling server');
                    this.isSignalingConnected = true;
                    this.reconnectAttempts = 0;

                    // Request ICE servers for embedded mode
                    console.log('[NetworkManager] Requesting ICE servers...');
                    this.socket.emit('get_ice_servers');

                    resolve();
                });

                this.socket.on('connect_error', (err) => {
                    console.error('[NetworkManager] Connection error:', err);
                    reject(err);
                });

                this.socket.on('disconnect', (reason) => {
                    console.log('[NetworkManager] Disconnected:', reason);
                    this.isSignalingConnected = false;
                });

                // Matchmaking Events
                this.socket.on('queued', (data) => {
                    console.log('[NetworkManager] Added to queue:', data);
                    this.scene.events.emit('queued', data);
                });

                this.socket.on('match_found', (msg) => {
                    this.handleMatchFound(msg);
                });

                this.socket.on('session_established', (data) => {
                    console.log('[NetworkManager] Session established:', data.roomId);
                });

                // Setup WebRTC signaling handlers
                this.setupSignalingHandlers();

            } catch (error) {
                console.error("[NetworkManager] Error initializing socket:", error);
                reject(error);
            }
        });
    }

    /**
     * Setup WebRTC signaling event handlers
     */
    setupSignalingHandlers() {
        // Listen for ICE servers configuration (for embedded mode)
        this.socket.on('ice_servers_config', (data) => {
            console.log('[NetworkManager] Received ICE servers config:', data.iceServers);
            this.iceServers = data.iceServers || { game: [] };
        });

        // Game connection signaling
        this.socket.on('offer', (data) => {
            if (this.gameConnection) {
                this.gameConnection.handleOffer(data);
            } else {
                console.log('[NetworkManager] Received offer before game connection initialized. Buffering...');
                this.pendingOffer = data;
            }
        });

        this.socket.on('answer', (data) => {
            if (this.gameConnection) {
                this.gameConnection.handleAnswer(data);
            }
        });

        this.socket.on('ice-candidate', (data) => {
            if (this.gameConnection) {
                this.gameConnection.handleCandidate(data);
            }
        });
    }

    /**
     * Handle match found event - Share config with both connections
     */
    async handleMatchFound(msg) {
        this.roomId = msg.roomId;
        // Normalize Role: 'host' -> 'A', anything else -> 'B'
        if (msg.role === 'host') {
            this.role = 'A';
        } else if (msg.role === 'guest' || msg.role === 'client') {
            this.role = 'B';
        } else {
            this.role = msg.role; // specific 'A' or 'B' passed directly
        }
        this.opponentId = msg.opponentId;
        this.opponentUid = msg.opponentUid; // Store opponentUid
        this.isInitiator = msg.isInitiator;

        // Use ICE servers from message, or fall back to pre-fetched ones
        if (msg.iceServers && (msg.iceServers.game?.length > 0 || msg.iceServers.video?.length > 0)) {
            this.iceServers = msg.iceServers;
        } else if (!this.iceServers || !this.iceServers.game || this.iceServers.game.length === 0) {
            console.log('[NetworkManager] No ICE servers in match data, using pre-fetched or defaults');
            // Keep existing pre-fetched iceServers, or use empty fallback
        }

        console.log('=== MATCH FOUND ===');
        console.log(`Room: ${this.roomId}`);
        console.log(`Role: ${this.role}`);
        console.log(`Initiator: ${this.isInitiator}`);
        console.log(`Opponent ID: ${this.opponentId}`);
        console.log(`Opponent UID: ${this.opponentUid}`);
        console.log(`Game ICE Servers:`, this.iceServers.game);

        // Emit match found event with all connection config
        this.scene.events.emit('match_found', {
            roomId: this.roomId,
            role: this.role,
            opponentId: this.opponentId,
            opponentUid: this.opponentUid,
            isInitiator: this.isInitiator,
            iceServers: this.iceServers
        });

        // Note: Game connection is now initialized manually via connectToGame()
    }

    /**
     * Connect to game WebRTC connection
     * Should be called after match_found when user is ready
     */
    async connectToGame() {
        if (!this.roomId || !this.opponentId) {
            console.error("[NetworkManager] Cannot connect to game: No match details found");
            return;
        }

        // Ensure ICE servers are available before initializing
        if ((!this.iceServers || !this.iceServers.game || this.iceServers.game.length === 0) && this.socket) {
            console.log('[NetworkManager] No ICE servers available, waiting for config...');
            try {
                // Wait up to 5 seconds for ICE servers
                await this.waitForIceServers(5000);
            } catch (err) {
                console.warn('[NetworkManager] Timeout waiting for ICE servers, proceeding with defaults (connection may fail in production)');
            }
        }

        await this.initializeGameConnection();

        // Process pending offer if any
        if (this.pendingOffer && !this.isInitiator) {
            console.log('[NetworkManager] Processing buffered offer...');
            await this.gameConnection.handleOffer(this.pendingOffer);
            this.pendingOffer = null;
        }
    }

    /**
     * Wait for ICE servers configuration
     * @param {number} timeoutMs - Timeout in milliseconds
     */
    async waitForIceServers(timeoutMs = 5000) {
        return new Promise((resolve, reject) => {
            // Check if already available
            if (this.iceServers && this.iceServers.game && this.iceServers.game.length > 0) {
                resolve(this.iceServers);
                return;
            }

            const timeout = setTimeout(() => {
                this.socket.off('ice_servers_config', handler);
                reject(new Error('Timeout waiting for ICE servers'));
            }, timeoutMs);

            const handler = (data) => {
                clearTimeout(timeout);
                // Listener already updates this.iceServers in setupSignalingHandlers
                // but we need to wait for it to happen or do it here. 
                // The existing listener runs first.
                resolve(data.iceServers);
            };

            this.socket.once('ice_servers_config', handler);

            // Re-request just in case
            this.socket.emit('get_ice_servers');
        });
    }

    /**
     * Initialize game WebRTC connection
     */
    async initializeGameConnection() {
        this.gameConnection = new GameConnection(this.socket, this.scene.events);

        await this.gameConnection.initialize({
            isInitiator: this.isInitiator,
            opponentId: this.opponentId,
            opponentUid: this.opponentUid,
            roomId: this.roomId,
            iceServers: this.iceServers.game || []
        });
    }

    /**
     * Find a match (matchmaking)
     */
    async findMatch(preferences = {}) {
        if (this.socket && this.isSignalingConnected) {
            console.log('[NetworkManager] Joining matchmaking queue...');
            this.socket.emit('join_queue', {
                mode: 'random',
                preferences: preferences
            });
        } else {
            console.error("[NetworkManager] Cannot find match: Not connected to signaling server");
        }
    }

    /**
     * Disconnect all connections
     */
    disconnect() {
        console.log('[NetworkManager] Disconnecting all connections...');
        if (this.gameConnection) this.gameConnection.close();
        if (this.socket) this.socket.disconnect();
    }

    /**
     * Getters for connection state
     */
    get isConnected() {
        return this.gameConnection ? this.gameConnection.isConnected : false;
    }
}
