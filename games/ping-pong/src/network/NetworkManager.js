import { CONFIG } from '../config.js';
import { io } from 'socket.io-client';
import { GameConnection } from './GameConnection.js';

/**
 * NetworkManager - Main network coordinator
 * Manages Socket.IO connection (or embedded messaging), matchmaking, and coordinates WebRTC connections
 * This is game-agnostic and handles only matchmaking and connection coordination
 */
export class NetworkManager {
    constructor(scene) {
        this.scene = scene;
        this.socket = null;
        this.userId = CONFIG.USER_ID; // Use ID from config
        this.roomId = null;
        this.role = null; // 'A' or 'B'
        this.opponentId = null;
        this.isInitiator = false;
        this.iceServers = { game: [] };

        // Connection instances
        this.gameConnection = null;

        // Connection states
        this.isSignalingConnected = false;
        this.isEmbedded = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        // Buffer for pending offer if user hasn't clicked connect yet
        this.pendingOffer = null;
        this.pendingCandidates = [];
    }

    /**
     * Connect to signaling server (or setup embedded listeners)
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // Use userId from config
                this.userId = CONFIG.USER_ID;

                if (!this.userId) {
                    console.warn("No user ID found. Connection might fail.");
                }

                // Check for embedded mode
                if (CONFIG.MATCH_DATA && CONFIG.MATCH_DATA.mode === 'embedded') {
                    console.log('[NetworkManager] Starting in EMBEDDED mode. Skipping direct socket connection.');
                    this.isEmbedded = true;
                    this.isSignalingConnected = true; // Virtual connection via parent
                    this.setupEmbeddedHandlers();

                    // In embedded mode, we might receive ICE servers from parent via message
                    // But assume parent handles that negotiation or passes them in initial config if possible.
                    // We'll resolve immediately.
                    resolve();
                    return;
                }

                this.socket = io(CONFIG.NETWORK.SERVER_URL, {
                    auth: {
                        userId: this.userId,
                        token: this.userId
                    },
                    path: CONFIG.NETWORK.SOCKET_PATH,
                    transports: ['websocket', 'polling']
                });

                this.socket.on('connect', () => {
                    console.log('[NetworkManager] Connected to signaling server');
                    this.isSignalingConnected = true;
                    this.reconnectAttempts = 0;

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
     * Handler for Embedded Mode messages from Parent Window
     */
    setupEmbeddedHandlers() {
        window.addEventListener('message', (event) => {
            // Security check: in production, verify event.origin
            const { type, payload } = event.data;

            if (type === 'game_signal_offer') {
                if (this.gameConnection) {
                    this.gameConnection.handleOffer(payload);
                } else {
                    console.log('[NetworkManager] Buffering offer (embedded)...');
                    this.pendingOffer = payload;
                }
            } else if (type === 'game_signal_answer') {
                if (this.gameConnection) {
                    this.gameConnection.handleAnswer(payload);
                }
            } else if (type === 'game_signal_candidate') {
                if (this.gameConnection) {
                    this.gameConnection.handleCandidate(payload);
                } else {
                    console.log('[NetworkManager] Buffering candidate (embedded)...');
                    this.pendingCandidates.push(payload);
                }
            } else if (type === 'ice_servers_config') {
                console.log('[NetworkManager] Received ICE servers from parent:', payload);
                this.iceServers = payload || { game: [] };
            }
        });
    }

    /**
     * Wrapper to emit events either to Socket or Parent Window
     */
    emitToServer(event, payload) {
        if (this.isEmbedded) {
            window.parent.postMessage({
                type: 'game_signal_emit',
                event: event,
                payload: payload
            }, '*');
        } else if (this.socket && this.socket.connected) {
            this.socket.emit(event, payload);
        } else {
            console.warn(`[NetworkManager] Cannot emit '${event}': Not connected.`);
        }
    }

    /**
     * Alias for emitToServer to be compatible with GameConnection which expects socket.emit
     */
    emit(event, payload) {
        this.emitToServer(event, payload);
    }

    /**
     * Setup WebRTC signaling event handlers (Socket Mode)
     */
    setupSignalingHandlers() {
        if (!this.socket) return;

        this.socket.on('ice_servers_config', (data) => {
            console.log('[NetworkManager] Received ICE servers config:', data.iceServers);
            this.iceServers = data.iceServers || { game: [] };
        });

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
            } else {
                console.log('[NetworkManager] Received candidate before game connection initialized. Buffering...');
                this.pendingCandidates.push(data);
            }
        });
    }

    /**
     * Handle match found event - Share config with both connections
     */
    async handleMatchFound(msg) {
        this.roomId = msg.roomId;
        this.role = msg.role;
        this.opponentId = msg.opponentId;
        this.opponentUid = msg.opponentUid; // Store opponentUid
        this.isInitiator = msg.isInitiator;

        // Use ICE servers from message, or fall back to pre-fetched ones
        if (msg.iceServers && (msg.iceServers.game?.length > 0 || msg.iceServers.video?.length > 0)) {
            this.iceServers = msg.iceServers;
        }

        console.log('=== MATCH FOUND ===');
        console.log(`Room: ${this.roomId}`);
        console.log(`Role: ${this.role}`);
        console.log(`Initiator: ${this.isInitiator}`);
        console.log(`Opponent ID: ${this.opponentId}`);

        // Emit match found event with all connection config
        this.scene.events.emit('match_found', {
            roomId: this.roomId,
            role: this.role,
            opponentId: this.opponentId,
            opponentUid: this.opponentUid,
            isInitiator: this.isInitiator,
            iceServers: this.iceServers
        });
    }

    /**
     * Connect to game WebRTC connection
     */
    async connectToGame() {
        if (!this.roomId || !this.opponentId) {
            console.error("[NetworkManager] Cannot connect to game: No match details found");
            return;
        }

        // Wait for ICE servers if needed
        if ((!this.iceServers || !this.iceServers.game || this.iceServers.game.length === 0)) {
            if (this.socket) {
                try {
                    await this.waitForIceServers(5000);
                } catch (err) {
                    console.warn('[NetworkManager] Timeout waiting for ICE servers (Socket Mode)');
                }
            } else if (this.isEmbedded) {
                // In embedded mode, we hope parent sent them or will send them. 
                // We won't block indefinitely here, maybe just proceed or request them?
                // Let's request them from parent
                window.parent.postMessage({ type: 'request_ice_servers' }, '*');
                // Wait a bit? Or just proceed.
                console.log('[NetworkManager] Requesting ICE servers from parent (Embedded Mode)...');
            }
        }

        await this.initializeGameConnection();

        // 1. Process pending offer if any
        if (this.pendingOffer && !this.isInitiator) {
            console.log('[NetworkManager] Processing buffered offer...');
            await this.gameConnection.handleOffer(this.pendingOffer);
            this.pendingOffer = null;
        }

        // 2. Process pending candidates
        if (this.pendingCandidates.length > 0) {
            console.log(`[NetworkManager] Processing ${this.pendingCandidates.length} buffered ICE candidates...`);
            for (const candidateData of this.pendingCandidates) {
                await this.gameConnection.handleCandidate(candidateData);
            }
            this.pendingCandidates = []; // Clear buffer
        }
    }

    async waitForIceServers(timeoutMs = 5000) {
        return new Promise((resolve, reject) => {
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
                resolve(data.iceServers);
            };

            this.socket.once('ice_servers_config', handler);
            this.socket.emit('get_ice_servers');
        });
    }

    async initializeGameConnection() {
        // Pass 'this' (NetworkManager) to GameConnection so it can call emitToServer
        this.gameConnection = new GameConnection(this, this.scene.events);

        await this.gameConnection.initialize({
            isInitiator: this.isInitiator,
            opponentId: this.opponentId,
            opponentUid: this.opponentUid,
            roomId: this.roomId,
            iceServers: this.iceServers.game || []
        });
    }

    async findMatch(preferences = {}) {
        if (this.isEmbedded) {
            console.warn('[NetworkManager] findMatch called in embedded mode - ignoring (Parent should handle this)');
            return;
        }
        if (this.socket && this.isSignalingConnected) {
            console.log('[NetworkManager] Joining matchmaking queue...');
            this.socket.emit('join_queue', {
                mode: 'random',
                preferences: preferences
            });
        }
    }

    disconnect() {
        console.log('[NetworkManager] Disconnecting all connections...');
        if (this.gameConnection) this.gameConnection.close();
        if (this.socket) this.socket.disconnect();
    }

    get isConnected() {
        return this.gameConnection ? this.gameConnection.isConnected : false;
    }
}
