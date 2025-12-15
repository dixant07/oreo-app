import { Socket } from 'socket.io-client';

export interface VideoConnectionConfig {
    isInitiator: boolean;
    opponentId: string;
    roomId: string;
    iceServers?: RTCIceServer[];
}

interface SignalingData {
    from?: string;
    to?: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}

export class VideoConnection {
    socket: Socket;
    eventEmitter: EventTarget;
    peerConnection: RTCPeerConnection | null = null;
    localStream: MediaStream | null = null;
    remoteStream: MediaStream | null = null;
    isConnected: boolean = false;
    isInitiator: boolean = false;
    opponentId: string | null = null;
    roomId: string | null = null;
    dataChannel: RTCDataChannel | null = null;
    iceServers: RTCIceServer[] = [];

    constructor(socket: Socket, eventEmitter: EventTarget) {
        this.socket = socket;
        this.eventEmitter = eventEmitter;
    }

    async initialize(config: VideoConnectionConfig) {
        this.isInitiator = config.isInitiator;
        this.opponentId = config.opponentId;
        this.roomId = config.roomId;
        this.iceServers = config.iceServers || [];

        console.log('[VideoConnection] Initializing WebRTC for video...');

        const rtcConfig: RTCConfiguration = {
            iceServers: this.iceServers
        };

        this.peerConnection = new RTCPeerConnection(rtcConfig);

        if (this.isInitiator) {
            this.dataChannel = this.peerConnection.createDataChannel("chat");
            this.setupDataChannel(this.dataChannel);
        } else {
            this.peerConnection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannel(this.dataChannel);
            };
        }

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('video-ice-candidate', {
                    candidate: event.candidate,
                    to: this.opponentId
                });
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            console.log('[VideoConnection] State:', this.peerConnection?.connectionState);

            if (this.peerConnection?.connectionState === 'connected') {
                this.isConnected = true;
                this.emit('video_connection_established');

                this.socket.emit('connection_stable', {
                    roomId: this.roomId,
                    service: 'video'
                });
            } else if (this.peerConnection?.connectionState === 'disconnected') {
                console.log('[VideoConnection] Connection disconnected (poor connection), waiting...');
                this.isConnected = false;
                this.emit('video_connection_unstable');
            } else if (this.peerConnection?.connectionState === 'failed') {
                console.log('[VideoConnection] Connection failed (terminal)');
                this.isConnected = false;
                this.emit('video_connection_lost');
            }
        };

        this.peerConnection.ontrack = (event) => {
            console.log('[VideoConnection] Received remote track');
            this.remoteStream = event.streams[0];
            this.emit('remote_video_track', event.streams[0]);
        };
    }

    setupDataChannel(channel: RTCDataChannel) {
        channel.onopen = () => {
            console.log('[VideoConnection] Data channel opened');
            this.emit('chat_channel_open');
        };
        channel.onmessage = (event) => {
            console.log('[VideoConnection] Received message:', event.data);
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'chat') {
                    this.emit('chat_message', data.payload);
                } else if (data.type === 'game_invite') {
                    this.emit('game_invite', data.payload);
                } else if (data.type === 'game_accept') {
                    this.emit('game_accept', data.payload);
                } else if (data.type === 'game_reject') {
                    this.emit('game_reject', data.payload);
                } else if (data.type === 'game_leave') {
                    this.emit('game_leave', data.payload);
                } else if (data.type === 'game_cancel') {
                    this.emit('game_cancel', data.payload);
                } else {
                    // Fallback for unknown types or legacy plain text
                    this.emit('chat_message', event.data);
                }
            } catch (e) {
                // Not JSON, treat as plain text chat
                this.emit('chat_message', event.data);
            }
        };
    }

    sendData(type: string, payload: any) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify({ type, payload }));
        } else {
            console.warn('[VideoConnection] Data channel not open');
        }
    }

    sendChatMessage(message: string) {
        this.sendData('chat', message);
    }

    sendGameInvite(gameId: string) {
        this.sendData('game_invite', { gameId });
    }

    sendGameAccept(gameId: string) {
        this.sendData('game_accept', { gameId });
    }

    sendGameReject(gameId: string) {
        this.sendData('game_reject', { gameId });
    }

    sendGameLeave() {
        this.sendData('game_leave', {});
    }

    sendGameCancel() {
        this.sendData('game_cancel', {});
    }

    async useLocalStream(stream: MediaStream) {
        this.localStream = stream;
        console.log('[VideoConnection] Using existing local stream');

        if (this.peerConnection) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection!.addTrack(track, this.localStream!);
            });
        }

        // Emit for consistency if UI listeners expect it from connection, 
        // though typically they might get it from NetworkManager now.
        this.emit('local_video_track', this.localStream);
    }

    async startLocalMedia(constraints: MediaStreamConstraints = { video: true, audio: true }) {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('[VideoConnection] Local media started');

            if (this.peerConnection) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection!.addTrack(track, this.localStream!);
                });
            }

            this.emit('local_video_track', this.localStream);
            return this.localStream;
        } catch (err) {
            console.error('[VideoConnection] Error accessing media devices:', err);
            throw err;
        }
    }

    async createAndSendOffer() {
        if (!this.peerConnection) return;
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            console.log(`[VideoConnection] Sending offer to: ${this.opponentId}`);

            this.socket.emit('video-offer', {
                offer: offer,
                to: this.opponentId
            });
        } catch (err) {
            console.error('[VideoConnection] Error creating offer:', err);
        }
    }

    async handleOffer(data: SignalingData) {
        if (!this.peerConnection) {
            console.error('[VideoConnection] PeerConnection not initialized');
            return;
        }

        try {
            console.log(`[VideoConnection] Received offer from: ${data.from}`);
            if (data.offer) {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

                const answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setLocalDescription(answer);

                console.log(`[VideoConnection] Sending answer to: ${this.opponentId}`);
                this.socket.emit('video-answer', {
                    answer: answer,
                    to: this.opponentId
                });
            }
        } catch (err) {
            console.error('[VideoConnection] Error handling offer:', err);
        }
    }

    async handleAnswer(data: SignalingData) {
        if (!this.peerConnection) {
            console.error('[VideoConnection] PeerConnection not initialized');
            return;
        }
        try {
            console.log(`[VideoConnection] Received answer. Current State: ${this.peerConnection.signalingState}`);
            // [FIX] Guard Clause: Ignore answers if we are not waiting for one
            if (this.peerConnection.signalingState === 'stable') {
                console.warn('[VideoConnection] Received answer while in stable state. Ignoring duplicate or late message.');
                return;
            }
            if (data.answer) {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        } catch (err) {
            console.error('[VideoConnection] Error handling answer:', err);
        }
    }

    async handleCandidate(data: SignalingData) {
        if (!this.peerConnection) return;
        try {
            if (data.candidate) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        } catch (err) {
            console.error('[VideoConnection] Error handling ICE candidate:', err);
        }
    }

    toggleAudio(enabled: boolean) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    toggleVideo(enabled: boolean) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    stopLocalMedia() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
    }

    close() {
        // Do NOT stop local media here automatically, as it might be managed by proper owner (NetworkManager)
        // this.stopLocalMedia(); 

        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        if (this.peerConnection) this.peerConnection.close();
        this.isConnected = false;
    }

    private emit(eventName: string, detail?: unknown) {
        this.eventEmitter.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}
