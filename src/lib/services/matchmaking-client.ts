import { io, Socket } from 'socket.io-client';

/**
 * MatchmakingClient - Singleton service for communicating with the matchmaking WebSocket server.
 * 
 * Use this to send admin commands like kicking/banning users from matchmaking.
 */
class MatchmakingClient {
    private socket: Socket | null = null;
    private connected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;

    constructor() {
        // Only connect on server-side
        if (typeof window === 'undefined') {
            this.connect();
        }
    }

    private connect() {
        const matchmakingUrl = process.env.MATCHMAKING_URL || 'http://localhost:5000';

        console.log(`[MatchmakingClient] Connecting to ${matchmakingUrl}...`);

        this.socket = io(matchmakingUrl, {
            auth: {
                userId: 'server-admin',
                serverKey: process.env.MATCHMAKING_SERVER_KEY || 'server-secret-key'
            },
            path: '/socket.io',
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000
        });

        this.socket.on('connect', () => {
            console.log('[MatchmakingClient] Connected to matchmaking server');
            this.connected = true;
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log(`[MatchmakingClient] Disconnected: ${reason}`);
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('[MatchmakingClient] Connection error:', error.message);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.warn('[MatchmakingClient] Max reconnection attempts reached.');
            }
        });

        this.socket.on('admin_action_result', (data: { success: boolean; action: string; message?: string }) => {
            console.log(`[MatchmakingClient] Action result:`, data);
        });
    }

    private ensureConnected(): boolean {
        if (!this.socket) {
            this.connect();
            return false;
        }

        if (!this.connected) {
            console.warn('[MatchmakingClient] Not connected to matchmaking server');
            if (!this.socket.connected) {
                this.socket.connect();
            }
            return false;
        }

        return true;
    }

    public kickUser(uid: string, reason?: string): void {
        if (!this.ensureConnected()) {
            console.error(`[MatchmakingClient] Cannot kick user ${uid} - not connected`);
            return;
        }

        console.log(`[MatchmakingClient] Kicking user ${uid}. Reason: ${reason || 'No reason provided'}`);

        this.socket!.emit('admin_kick_user', {
            targetUid: uid,
            reason: reason || 'Kicked by admin'
        });
    }

    public banUser(uid: string, reason: string, durationMinutes: number = 60): void {
        if (!this.ensureConnected()) {
            console.error(`[MatchmakingClient] Cannot ban user ${uid} - not connected`);
            return;
        }

        console.log(`[MatchmakingClient] Banning user ${uid} for ${durationMinutes} minutes. Reason: ${reason}`);

        this.socket!.emit('admin_ban_user', {
            targetUid: uid,
            reason,
            durationMinutes
        });
    }

    public unbanUser(uid: string): void {
        if (!this.ensureConnected()) {
            console.error(`[MatchmakingClient] Cannot unban user ${uid} - not connected`);
            return;
        }

        this.socket!.emit('admin_unban_user', { targetUid: uid });
    }

    public forceDisconnect(uid: string): void {
        if (!this.ensureConnected()) {
            console.error(`[MatchmakingClient] Cannot force disconnect user ${uid} - not connected`);
            return;
        }

        this.socket!.emit('admin_force_disconnect', { targetUid: uid });
    }

    public isConnected(): boolean {
        return this.connected;
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }
}

// Export singleton instance
export const matchmakingClient = new MatchmakingClient();
