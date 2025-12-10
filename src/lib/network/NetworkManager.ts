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

    constructor() {
        this.eventEmitter = new EventTarget();
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
                    path: '/matchmaking-server',
                    transports: ['websocket', 'polling']
                });

                this.socket.on('connect', () => {
                    console.log('[NetworkManager] Connected to signaling server');
                    this.isSignalingConnected = true;
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

                    // Close WebRTC connection
                    if (this.videoConnection) {
                        this.videoConnection.close();
                        this.videoConnection = null;
                    }

                    // Reset match data
                    this.roomId = null;
                    this.role = null;
                    this.opponentId = null;
                    this.opponentUid = null;
                    this.isInitiator = false;

                    // Notify UI that match ended/skipped
                    this.emit('match_skipped_client');
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
    }

    async handleMatchFound(msg: MatchFoundData) {
        this.roomId = msg.roomId;
        this.role = msg.role;
        this.opponentId = msg.opponentId; // Keep as Socket ID
        this.opponentUid = msg.opponentUid; // Store UID
        this.isInitiator = msg.isInitiator;
        this.iceServers = msg.iceServers || { game: [], video: [] };

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
        if (this.videoConnection) this.videoConnection.close();
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
}
