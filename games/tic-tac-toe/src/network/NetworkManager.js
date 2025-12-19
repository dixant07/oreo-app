import GameConfig from '../config/GameConfig.js';
import { io } from 'socket.io-client';
import { GameConnection } from './GameConnection.js';

/**
 * NetworkManager - Main network coordinator
 */
export class NetworkManager {
    constructor(scene) {
        this.scene = scene;
        this.socket = null;
        this.userId = GameConfig.USER_ID;
        this.roomId = null;
        this.role = null;
        this.opponentId = null;
        this.isInitiator = false;
        this.iceServers = { game: [] };

        this.gameConnection = null;

        this.isSignalingConnected = false;
        this.isEmbedded = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        this.pendingOffer = null;
        this.pendingCandidates = [];
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.userId = GameConfig.USER_ID;

                if (!this.userId) {
                    console.warn("No user ID found. Connection might fail.");
                }

                if (GameConfig.MATCH_DATA && GameConfig.MATCH_DATA.mode === 'embedded') {
                    console.log('[NetworkManager] Starting in EMBEDDED mode.');
                    this.isEmbedded = true;
                    this.isSignalingConnected = true;
                    this.setupEmbeddedHandlers();
                    resolve();
                    return;
                }

                this.socket = io(GameConfig.NETWORK.SERVER_URL, {
                    auth: {
                        userId: this.userId,
                        token: this.userId
                    },
                    path: GameConfig.NETWORK.SOCKET_PATH,
                    transports: ['websocket', 'polling']
                });

                this.socket.on('connect', () => {
                    console.log('[NetworkManager] Connected to signaling server');
                    this.isSignalingConnected = true;
                    this.reconnectAttempts = 0;
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

                this.socket.on('queued', (data) => {
                    console.log('[NetworkManager] Added to queue:', data);
                    this.scene.events.emit('queued', data);
                });

                this.socket.on('match_found', (msg) => {
                    this.handleMatchFound(msg);
                });

                this.setupSignalingHandlers();

            } catch (error) {
                console.error("[NetworkManager] Error initializing socket:", error);
                reject(error);
            }
        });
    }

    setupEmbeddedHandlers() {
        window.addEventListener('message', (event) => {
            const { type, payload } = event.data;
            if (type === 'game_signal_offer') {
                if (this.gameConnection) {
                    this.gameConnection.handleOffer(payload);
                } else {
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
                    this.pendingCandidates.push(payload);
                }
            } else if (type === 'ice_servers_config') {
                this.iceServers = payload || { game: [] };
            }
        });
    }

    emitToServer(event, payload) {
        if (this.isEmbedded) {
            window.parent.postMessage({
                type: 'game_signal_emit',
                event: event,
                payload: payload
            }, '*');
        } else if (this.socket && this.socket.connected) {
            this.socket.emit(event, payload);
        }
    }

    emit(event, payload) {
        this.emitToServer(event, payload);
    }

    setupSignalingHandlers() {
        if (!this.socket) return;

        this.socket.on('ice_servers_config', (data) => {
            this.iceServers = data.iceServers || { game: [] };
        });

        this.socket.on('offer', (data) => {
            if (this.gameConnection) {
                this.gameConnection.handleOffer(data);
            } else {
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
                this.pendingCandidates.push(data);
            }
        });
    }

    async handleMatchFound(msg) {
        this.roomId = msg.roomId;
        this.role = msg.role;
        this.opponentId = msg.opponentId;
        this.opponentUid = msg.opponentUid;
        this.isInitiator = msg.isInitiator;

        if (msg.iceServers) {
            this.iceServers = msg.iceServers;
        }

        this.scene.events.emit('match_found', {
            roomId: this.roomId,
            role: this.role,
            opponentId: this.opponentId,
            opponentUid: this.opponentUid,
            isInitiator: this.isInitiator,
            iceServers: this.iceServers
        });
    }

    async connectToGame() {
        if (!this.roomId || !this.opponentId) return;

        if ((!this.iceServers || !this.iceServers.game || this.iceServers.game.length === 0)) {
            if (this.socket) {
                try {
                    await this.waitForIceServers(5000);
                } catch (err) {
                    console.warn('[NetworkManager] Timeout waiting for ICE servers');
                }
            } else if (this.isEmbedded) {
                window.parent.postMessage({ type: 'request_ice_servers' }, '*');
            }
        }

        await this.initializeGameConnection();

        if (this.pendingOffer && !this.isInitiator) {
            await this.gameConnection.handleOffer(this.pendingOffer);
            this.pendingOffer = null;
        }

        if (this.pendingCandidates.length > 0) {
            for (const candidateData of this.pendingCandidates) {
                await this.gameConnection.handleCandidate(candidateData);
            }
            this.pendingCandidates = [];
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
        if (this.isEmbedded) return;
        if (this.socket && this.isSignalingConnected) {
            this.socket.emit('join_queue', {
                mode: 'random',
                preferences: preferences
            });
        }
    }

    disconnect() {
        if (this.gameConnection) this.gameConnection.close();
        if (this.socket) this.socket.disconnect();
    }

    get isConnected() {
        return this.gameConnection ? this.gameConnection.isConnected : false;
    }
}
