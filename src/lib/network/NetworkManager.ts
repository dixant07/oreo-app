import { io, Socket } from 'socket.io-client';
import { auth } from '@/lib/config/firebase';
import { VideoConnection } from './VideoConnection';

const MATCHMAKING_URL = process.env.NEXT_PUBLIC_MATCHMAKING_URL || 'http://localhost:5000';

interface MatchFoundData {
    roomId: string;
    role: string;
    opponentId: string; // Socket ID for signaling
    opponentUid: string; // Firestore UID for profile
    isInitiator: boolean;
    iceServers: { game: RTCIceServer[], video: RTCIceServer[] };
}

export class NetworkManager {
    eventEmitter: EventTarget;
    socket: Socket | null = null;
    userId: string | null = null;
    roomId: string | null = null;
    role: string | null = null;
    opponentId: string | null = null; // Socket ID
    opponentUid: string | null = null; // Firestore UID
    isInitiator: boolean = false;
    iceServers: { game: RTCIceServer[], video: RTCIceServer[] } = { game: [], video: [] };

    videoConnection: VideoConnection | null = null;
    isSignalingConnected: boolean = false;
    localStream: MediaStream | null = null;
    private isSearching: boolean = false; // [FIX] Track search state
    private lastPreferences: any = {};    // [FIX] Store prefs for re-queueing

    constructor() {
        this.eventEmitter = new EventTarget();

        // Handle video connection lost (terminal failure/opponent left abruptly)
        this.eventEmitter.addEventListener('video_connection_lost', () => {
            console.log('[NetworkManager] Video connection lost (terminal). Re-queueing...');
            this.cleanupCurrentMatch();
            this.findMatch();
        });

        // Handle unstable connection (waiting)
        this.eventEmitter.addEventListener('video_connection_unstable', () => {
            console.log('[NetworkManager] Video connection unstable. Waiting for reconnection...');
            // Do not cleanup or re-queue. Just wait.
            // UI can show a toast/spinner via this event.
        });
    }

    async connect() {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let token = null;
                if (auth.currentUser) {
                    token = await auth.currentUser.getIdToken();
                    this.userId = auth.currentUser.uid;
                } else {
                    console.warn("No authenticated user found.");
                }

                this.socket = io(MATCHMAKING_URL, {
                    auth: { token },
                    path: '/socket.io',
                    transports: ['websocket', 'polling']
                });

                this.socket.on('connect', () => {
                    console.log('[NetworkManager] Connected to signaling server');
                    this.isSignalingConnected = true;
                    // [FIX] Auto-rejoin queue if we were searching before disconnect
                    if (this.isSearching) {
                        console.log('[NetworkManager] Restoring queue position after reconnect...');
                        this.socket?.emit('join_queue', {
                            mode: 'random',
                            preferences: this.lastPreferences
                        });
                    }
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
                    this.emit('queued', data);
                });

                this.socket.on('match_found', (msg) => {
                    this.handleMatchFound(msg);
                });

                this.socket.on('receive_invite', (msg) => {
                    console.log('[NetworkManager] Received invite:', msg);
                    this.emit('receive_invite', msg);
                });

                this.socket.on('invite_error', (msg) => {
                    console.warn('[NetworkManager] Invite error:', msg);
                    this.emit('invite_error', msg);
                });

                this.socket.on('invite_cancelled', (msg) => {
                    console.log('[NetworkManager] Invite cancelled:', msg);
                    this.emit('invite_cancelled', msg);
                });

                this.socket.on('match_skipped', () => {
                    console.log('[NetworkManager] Match skipped event received from server');
                    this.cleanupCurrentMatch();
                    // Notify UI that match ended/skipped
                    this.emit('match_skipped_client');

                    // If opponent skipped, we likely want to find a new match immediately
                    // But typically the UI might handle "Next". 
                    // However, if the user requested "someone left... join matchmaking", dealing with socket 'match_skipped' 
                    // (which happens if opponent leaves) implies we should auto-requeue?
                    // Let's assume yes for "seamless" experience, or stick to just emitting client event?
                    // The user prompt specifically mentioned "closed the tab... status becomes disconnected/failed".
                    // It didn't explicitly say "if opponent clicks next".
                    // But "closed connection" -> "failed" -> 'video_connection_lost' -> we handle it above.
                    // If opponent disconnects socket -> Server sends 'match_skipped'? 
                    // If so, we should arguably re-queue here too. 
                    this.findMatch();
                });

                this.setupSignalingHandlers();

            } catch (error) {
                console.error("[NetworkManager] Error initializing socket:", error);
                reject(error);
            }
        });
    }

    setupSignalingHandlers() {
        if (!this.socket) return;

        // Video Signaling
        this.socket.on('video-offer', (data) => {
            if (this.videoConnection) {
                this.videoConnection.handleOffer(data);
            }
        });

        this.socket.on('video-answer', (data) => {
            if (this.videoConnection) {
                this.videoConnection.handleAnswer(data);
            }
        });

        this.socket.on('video-ice-candidate', (data) => {
            if (this.videoConnection) {
                this.videoConnection.handleCandidate(data);
            }
        });

        // Game Signaling (Relay to Embedded Game)
        this.socket.on('offer', (data) => {
            console.log('[NetworkManager] Received GAME offer. Relaying to app...');
            this.emit('game_signal_offer', data);
        });

        this.socket.on('answer', (data) => {
            console.log('[NetworkManager] Received GAME answer. Relaying to app...');
            this.emit('game_signal_answer', data);
        });

        this.socket.on('ice-candidate', (data) => {
            // Check if this is for game (usually structure differentiates, or we assume if not handled by video)
            // Architecture: Video uses 'video-ice-candidate'. Game uses 'ice-candidate'.
            console.log('[NetworkManager] Received GAME candidate. Relaying to app...');
            this.emit('game_signal_candidate', data);
        });

        // Session Established
        this.socket.on('session_established', (data) => {
            console.log('[NetworkManager] Session Established Event', data);
            this.emit('session_established', data);
        });
    }

    sendGameSignal(event: string, payload: any) {
        if (this.socket && this.isSignalingConnected) {
            console.log(`[NetworkManager] Sending GAME signal: ${event}`, payload);
            this.socket.emit(event, payload);
        } else {
            console.warn('[NetworkManager] Cannot send game signal - disconnected');
        }
    }

    async handleMatchFound(msg: MatchFoundData) {
        this.roomId = msg.roomId;
        this.role = msg.role;
        this.opponentId = msg.opponentId; // Keep as Socket ID
        this.opponentUid = msg.opponentUid; // Store UID
        this.isInitiator = msg.isInitiator;
        this.iceServers = msg.iceServers || { game: [], video: [] };
        this.isSearching = false; // [FIX] Clear flag when matched

        console.log('=== MATCH FOUND ===');
        console.log('Opponent Socket:', this.opponentId, 'UID:', this.opponentUid);
        this.emit('match_found', msg);

        await this.initializeVideoConnection();
    }

    async initializeVideoConnection() {
        if (!this.socket) return;

        this.videoConnection = new VideoConnection(this.socket, this.eventEmitter);

        await this.videoConnection.initialize({
            isInitiator: this.isInitiator,
            opponentId: this.opponentId!,
            roomId: this.roomId!,
            iceServers: this.iceServers.video || []
        });

        if (!this.localStream) {
            await this.startLocalStream();
        }

        if (this.localStream) {
            await this.videoConnection.useLocalStream(this.localStream);
        }

        if (this.isInitiator) {
            await this.videoConnection.createAndSendOffer();
        }
    }

    async startLocalStream() {
        if (this.localStream) {
            this.emit('local_video_track', this.localStream);
            return this.localStream;
        }

        try {
            console.log('[NetworkManager] Starting local media stream...');
            this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            this.emit('local_video_track', this.localStream);
            return this.localStream;
        } catch (err) {
            console.error('[NetworkManager] Error accessing local media:', err);
            throw err;
        }
    }

    stopLocalStream() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
    }

    async findMatch(preferences = {}) {
        if (this.roomId) {
            console.warn('[NetworkManager] Already in a match, ignoring findMatch request.');
            return;
        }
        this.isSearching = true; // [FIX] Set flag
        this.lastPreferences = preferences; // [FIX] Store prefs

        if (this.socket && this.isSignalingConnected) {
            console.log('[NetworkManager] Joining matchmaking queue...');
            this.socket.emit('join_queue', {
                mode: 'random',
                preferences: preferences
            });
        }
    }

    sendFriendInvite(targetUid: string) {
        if (this.socket && this.isSignalingConnected) {
            this.socket.emit('send_invite', { targetUid });
        }
    }

    acceptFriendInvite(inviterUid: string) {
        if (this.socket && this.isSignalingConnected) {
            this.socket.emit('accept_invite', { inviterUid });
        }
    }

    rejectFriendInvite(inviterUid: string) {
        if (this.socket && this.isSignalingConnected) {
            this.socket.emit('reject_invite', { inviterUid });
        }
    }

    // Aliases for clearer intent in UI
    connectToFriend(targetUid: string) {
        this.sendFriendInvite(targetUid);
    }

    acceptConnection(inviterUid: string) {
        this.acceptFriendInvite(inviterUid);
    }

    rejectConnection(inviterUid: string) {
        this.rejectFriendInvite(inviterUid);
    }

    cancelInvite(targetUid: string) {
        if (this.socket && this.isSignalingConnected) {
            this.socket.emit('cancel_invite', { targetUid });
        }
    }

    // Also clear flag if user cancels manually (if you have a cancel function)
    cancelSearch() {
        this.isSearching = false;
        if (this.socket && this.isSignalingConnected) {
            // actually tell the server to remove us
            this.socket.emit('leave_queue');
        }
    }

    skipMatch() {
        if (this.socket && this.isSignalingConnected) {
            console.log('[NetworkManager] Sending skip_match signal...');
            this.socket.emit('skip_match');
        } else {
            // Fallback if not connected properly
            this.emit('match_skipped_client');
        }
    }

    disconnect() {
        console.log('[NetworkManager] Disconnecting all connections...');
        this.cleanupCurrentMatch();
        if (this.socket) this.socket.disconnect();
    }

    on(eventName: string, callback: (data: unknown) => void) {
        const handler = (e: Event) => {
            callback((e as CustomEvent).detail);
        };
        this.eventEmitter.addEventListener(eventName, handler);
        return () => this.eventEmitter.removeEventListener(eventName, handler);
    }

    private emit(eventName: string, detail?: unknown) {
        this.eventEmitter.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
    cleanupCurrentMatch() {
        if (this.videoConnection) {
            this.videoConnection.close();
            this.videoConnection = null;
        }
        this.roomId = null;
        this.role = null;
        this.opponentId = null;
        this.opponentUid = null;
        this.isInitiator = false;
        this.iceServers = { game: [], video: [] };
    }
}
