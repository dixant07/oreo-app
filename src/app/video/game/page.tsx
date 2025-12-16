"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useNetwork } from '@/lib/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    SkipForward,
    User as UserIcon,
    Crown,
    X,
    UserPlus,
    Flag,
    Send,
    Loader2,
    Video // Added import
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { GameList } from '@/components/games/GameList';
import { GameFrame } from '@/components/games/GameFrame'; // Added import
import { useCurrentOpponent } from '@/lib/contexts/OpponentContext';
import { ReportModal } from '@/components/dialogs/ReportModal';
import { auth } from '@/lib/config/firebase';
import { MessageCircle } from 'lucide-react';
import { useChat } from '@/lib/contexts/ChatContext';
import { AlertModal } from '@/components/ui/alert-modal';

export default function VideoGamePage() {
    return (
        <React.Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#FFF8F0]">Loading...</div>}>
            <VideoGameContent />
        </React.Suspense>
    );
}

// Game Base URL - defaults to Vite dev server for local development
const GAME_BASE_URL = process.env.NEXT_PUBLIC_GAMES_BASE_URL || "http://localhost:3000";

// Matchmaking Server URL - the game needs this to connect to the correct WebSocket server
const MATCHMAKING_URL = process.env.NEXT_PUBLIC_MATCHMAKING_URL || "http://localhost:5000";

function VideoGameContent() {
    const { networkManager } = useNetwork();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { messages, sendMessage, clearMessages } = useChat();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const [status, setStatus] = useState("Waiting for connection...");
    const [mountTime] = useState(Date.now());
    const [gameUrl, setGameUrl] = useState<string>(GAME_BASE_URL);
    const [mode, setMode] = useState<'game' | 'video'>('game');
    const [showGame, setShowGame] = useState(false);
    const [incomingInvite, setIncomingInvite] = useState<{ gameId: string } | null>(null);
    const [outgoingInvite, setOutgoingInvite] = useState<{ gameId: string } | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [inputText, setInputText] = useState("");
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const { opponent } = useCurrentOpponent();

    // Bridge: NetworkManager -> Iframe
    useEffect(() => {
        if (!networkManager) return;

        const forwardToGame = (type: string, payload: any) => {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage({ type, payload }, '*');
            }
        };

        const handleGameOffer = (data: any) => forwardToGame('game_signal_offer', data);
        const handleGameAnswer = (data: any) => forwardToGame('game_signal_answer', data);
        const handleGameCandidate = (data: any) => forwardToGame('game_signal_candidate', data);
        const handleSessionEstablished = (data: any) => {
            /* Optional: notify game that connection is final on server */
        };

        const unsubs = [
            networkManager.on('game_signal_offer', handleGameOffer),
            networkManager.on('game_signal_answer', handleGameAnswer),
            networkManager.on('game_signal_candidate', handleGameCandidate),
            networkManager.on('session_established', handleSessionEstablished)
        ];

        return () => {
            unsubs.forEach(u => u());
        };
    }, [networkManager]);

    // Bridge: Iframe -> NetworkManager
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Security: In prod, check event.origin === GAME_BASE_URL
            const { type, event: signalEvent, payload } = event.data;

            if (type === 'game_signal_emit') {
                if (networkManager) {
                    networkManager.sendGameSignal(signalEvent, payload);
                }
            } else if (type === 'request_ice_servers') {
                if (networkManager && iframeRef.current && iframeRef.current.contentWindow) {
                    // Send current ICE servers to iframe
                    iframeRef.current.contentWindow.postMessage({
                        type: 'ice_servers_config',
                        payload: networkManager.iceServers
                    }, '*');
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [networkManager]);



    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;
        sendMessage(inputText);
        setInputText("");
    };


    useEffect(() => {
        if (!networkManager) return;

        const handleLocalStream = (data: unknown) => {
            const stream = data as MediaStream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        };

        const handleRemoteStream = (data: unknown) => {
            const stream = data as MediaStream;
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            setStatus("Connected");
        };

        const handleMatchFound = (data: any) => {
            setStatus("Match Found!");
            const currentUserId = networkManager.userId || auth.currentUser?.uid || '';
            const params = new URLSearchParams({
                roomId: data.roomId,
                role: data.role,
                opponentId: data.opponentId,
                opponentUid: data.opponentUid,
                mode: 'embedded',
                userId: currentUserId,
                isInitiator: data.isInitiator ? 'true' : 'false',
                serverUrl: encodeURIComponent(MATCHMAKING_URL)
            });
            if (data.gameId) {
                setGameUrl(`${GAME_BASE_URL}/${data.gameId}?${params.toString()}`);
            }
            // Removed auto-show to prevent bug where game opens on reconnect
            // setShowGame(true);
        };

        const handleVideoLost = () => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            setStatus("Opponent disconnected");
            setIncomingInvite(null);
            setShowGame(false);
        };

        const handleGameInvite = (data: unknown) => {
            const { gameId } = data as { gameId: string };
            setIncomingInvite({ gameId });
        };

        const handleGameAccept = (data: unknown) => {
            const { gameId } = data as { gameId: string };
            const currentUserId = networkManager.userId || auth.currentUser?.uid || '';
            const params = new URLSearchParams({
                roomId: networkManager.roomId || 'default',
                role: 'host',
                opponentId: networkManager.opponentId || '',
                opponentUid: networkManager.opponentUid || '',
                mode: 'embedded',
                userId: currentUserId,
                isInitiator: 'true',
                serverUrl: encodeURIComponent(MATCHMAKING_URL)
            });
            setGameUrl(`${GAME_BASE_URL}/${gameId}?${params.toString()}`);
            setShowGame(true);
            setOutgoingInvite(null);
        };

        const handleGameReject = (data: unknown) => {
            console.log("Game request rejected");
            setOutgoingInvite(null);
            setAlertState({
                isOpen: true,
                title: "Request Rejected",
                message: "Opponent rejected the game request.",
                type: "info"
            });
        };

        const handleGameLeave = () => {
            console.log("Opponent left the game");
            setStatus("Opponent left the game");
            setShowGame(false);
        };

        const handleGameCancel = () => {
            console.log("Opponent cancelled the invite");
            setIncomingInvite(null);
        };

        const unsubs = [
            networkManager.on('local_video_track', handleLocalStream),
            networkManager.on('remote_video_track', handleRemoteStream),
            networkManager.on('match_found', handleMatchFound),
            networkManager.on('video_connection_lost', handleVideoLost),
            networkManager.on('game_invite', handleGameInvite),
            networkManager.on('game_accept', handleGameAccept),
            networkManager.on('game_reject', handleGameReject),
            networkManager.on('game_leave', handleGameLeave),
            networkManager.on('game_cancel', handleGameCancel)
        ];

        if (networkManager.localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = networkManager.localStream;
        } else if (networkManager.videoConnection?.localStream && localVideoRef.current) {
            // Fallback to videoConnection if for some reason localStream isn't set but VC has it
            localVideoRef.current.srcObject = networkManager.videoConnection.localStream;
        } else {
            // Initiate local stream if not already
            networkManager.startLocalStream().catch(console.error);
        }

        if (networkManager.videoConnection?.remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = networkManager.videoConnection.remoteStream;
            setStatus("Connected");
        }

        // Connect and find match on mount, but wait for Auth
        const unsubAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log("Auth ready, user:", user.uid);

                // Hydrate if already in a match (e.g. from Internal Navigation)
                if (networkManager.roomId && networkManager.opponentId) {
                    console.log("Already in match, hydrating state...");
                    const matchData = {
                        roomId: networkManager.roomId,
                        role: networkManager.role,
                        opponentId: networkManager.opponentId,
                        opponentUid: networkManager.opponentUid,
                        isInitiator: networkManager.isInitiator,
                    };
                    handleMatchFound(matchData);

                } else if (!networkManager.socket?.connected) {
                    try {
                        await networkManager.connect();
                        networkManager.findMatch({ mode: 'game' });
                    } catch (err) {
                        console.error("Failed to connect:", err);
                    }
                } else if (!networkManager.roomId) {
                    // Connected but no match? Find one.
                    networkManager.findMatch({ mode: 'game' });
                }
            } else {
                console.warn("No user signed in. Connection might fail if guest access is disabled.");
            }
        });

        return () => {
            unsubAuth();

            // If unmounting while game is active, notify opponent
            if (showGame && networkManager?.videoConnection) {
                networkManager.videoConnection.sendGameLeave();
            }
            unsubs.forEach(unsub => unsub());
        };
    }, [networkManager, showGame]);

    useEffect(() => {
        const autoStart = searchParams.get('autoStart');
        const gameId = searchParams.get('gameId');

        if (autoStart === 'true' && gameId && networkManager?.roomId) {
            const currentUserId = networkManager.userId || auth.currentUser?.uid || '';
            const params = new URLSearchParams({
                roomId: networkManager.roomId,
                role: 'guest',
                opponentId: networkManager.opponentId || '',
                mode: 'embedded',
                userId: currentUserId,
                serverUrl: encodeURIComponent(MATCHMAKING_URL)
            });
            // Construct URL dynamically based on gameId, or default to knife-throw if needed
            // Assuming gameId maps to route
            setGameUrl(`${GAME_BASE_URL}/${gameId}?${params.toString()}`);
            setShowGame(true);
        }
    }, [searchParams, networkManager?.roomId, networkManager?.userId, networkManager?.opponentId]);

    useEffect(() => {
        if (!networkManager) return;

        const handleMatchSkippedClient = () => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            clearMessages();
            setStatus("Searching for next match...");
            setShowGame(false);
            setIncomingInvite(null);

            // Re-join queue immediately
            networkManager.findMatch({ mode });
        };

        const unsub = networkManager.on('match_skipped_client', handleMatchSkippedClient);
        return () => {
            unsub();
        };
    }, [networkManager, mode, clearMessages]);

    const handleSkip = async () => {
        if (networkManager) {
            setStatus("Skipping...");

            // If connected, ask server to skip match for both
            if (networkManager.socket && networkManager.socket.connected) {
                networkManager.skipMatch();
            } else {
                // Determine fallback if socket is dead
                networkManager.disconnect();
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                clearMessages();
                setShowGame(false);

                await networkManager.connect();
                networkManager.findMatch({ mode });
            }
        }
    };

    const handleModeToggle = (newMode: 'game' | 'video') => {
        setMode(newMode);
        if (newMode === 'video') {
            // Notify leaving game before switching
            if (showGame && networkManager?.videoConnection) {
                networkManager.videoConnection.sendGameLeave();
            }
            router.push('/video/chat');
        }
    };

    const handleCloseGame = () => {
        if (networkManager?.videoConnection) {
            networkManager.videoConnection.sendGameLeave();
        }
        setShowGame(false);
    };

    return (
        <div className="flex h-screen flex-col bg-[#FFF8F0]">
            <TopBar mode={mode} onModeChange={handleModeToggle} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col-reverse md:flex-row p-0 md:p-2 gap-2 overflow-hidden">

                {/* Left: Game Area (Larger) */}
                <Card className={`flex-1 md:flex-[2] rounded-[1rem] overflow-hidden border-0 shadow-2xl bg-white relative flex flex-col ring-1 ring-gray-100 p-0 ${showGame ? 'mb-0' : 'mb-16'} md:mb-0`}>

                    {/* Close Game Button */}
                    {showGame && (
                        <div className="absolute top-6 right-6 z-30">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="rounded-full shadow-lg hover:scale-105 transition-transform bg-red-500 hover:bg-red-600 text-white"
                                onClick={handleCloseGame}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    )}

                    {/* Game Content */}
                    <div className="flex-1 relative bg-white w-full h-full">
                        {showGame ? (
                            <GameFrame ref={iframeRef} gameUrl={gameUrl} />
                        ) : (
                            <div className="h-full w-full">
                                <GameList
                                    onSelectGame={(id) => {
                                        if (networkManager?.videoConnection) {
                                            networkManager.videoConnection.sendGameInvite(id);
                                            setOutgoingInvite({ gameId: id });
                                            console.log("Sent invite for", id);
                                        }
                                    }}
                                />
                                {/* Outgoing Invite Overlay */}
                                {outgoingInvite && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                                        <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-md w-full text-center animate-in fade-in zoom-in duration-300 ring-1 ring-gray-100">
                                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
                                                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Challenge Sent!</h3>
                                            <p className="text-gray-600 mb-8 text-lg">
                                                Waiting for opponent to accept <span className="font-bold text-gray-900">{outgoingInvite.gameId}</span>...
                                            </p>
                                            <div className="flex gap-4 justify-center">
                                                <Button
                                                    variant="outline"
                                                    className="rounded-xl px-8 py-6 text-lg border-2 hover:bg-gray-50 font-bold w-full"
                                                    onClick={() => {
                                                        networkManager?.videoConnection?.sendGameCancel();
                                                        setOutgoingInvite(null);
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Incoming Invite Overlay */}
                                {incomingInvite && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                                        <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-md w-full text-center animate-in fade-in zoom-in duration-300 ring-1 ring-gray-100">
                                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                                <Crown className="w-10 h-10 text-orange-500" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Game Challenge!</h3>
                                            <p className="text-gray-600 mb-8 text-lg">
                                                Your opponent wants to play <span className="font-bold text-gray-900">{incomingInvite.gameId}</span>.
                                            </p>
                                            <div className="flex gap-4 justify-center">
                                                <Button
                                                    variant="outline"
                                                    className="rounded-xl px-8 py-6 text-lg border-2 hover:bg-gray-50 font-bold"
                                                    onClick={() => {
                                                        networkManager?.videoConnection?.sendGameReject(incomingInvite.gameId);
                                                        setIncomingInvite(null);
                                                    }}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-8 py-6 text-lg font-bold shadow-xl shadow-orange-200 hover:shadow-orange-300 transition-all"
                                                    onClick={() => {
                                                        networkManager?.videoConnection?.sendGameAccept(incomingInvite.gameId);
                                                        const params = new URLSearchParams({
                                                            roomId: networkManager?.roomId || 'default',
                                                            role: 'guest',
                                                            opponentId: networkManager?.opponentId || '',
                                                            opponentUid: networkManager?.opponentUid || '',
                                                            mode: 'embedded',
                                                            userId: networkManager?.userId || auth.currentUser?.uid || '',
                                                            isInitiator: 'false',
                                                            serverUrl: encodeURIComponent(MATCHMAKING_URL)
                                                        });
                                                        setGameUrl(`${GAME_BASE_URL}/${incomingInvite.gameId}?${params.toString()}`);
                                                        setShowGame(true);
                                                        setIncomingInvite(null);
                                                    }}
                                                >
                                                    Accept Game
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Right: Video Area */}
                <div className="flex flex-col gap-2 min-w-[320px] md:h-full md:flex-1 shrink-0 overflow-hidden">

                    {/* Video Strip Wrapper */}
                    <div className="flex flex-row gap-2 h-32 md:h-auto md:flex-col md:flex-1 md:min-h-0 w-full relative">
                        {/* VS Label (Mobile Only) */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 md:hidden pointer-events-none">
                            <div className="bg-orange-600 text-white text-[10px] font-black italic tracking-tighter px-2 py-1 rounded-full shadow-lg border-2 border-white transform rotate-12">
                                VS
                            </div>
                        </div>

                        {/* Remote Video (Top Half) */}
                        <Card className="flex-1 md:flex-1 md:min-h-0 rounded-[1rem] overflow-hidden border-0 shadow-xl bg-[#EAE8D9] relative group p-0">
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />

                            {/* Opponent Info */}
                            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-left">
                                <p className="font-bold text-sm leading-none">{opponent?.displayName || opponent?.name || "Opponent"}</p>
                                <p className="opacity-80 text-[10px] leading-none mt-0.5">{status === "Connected" ? "Online" : status}</p>
                            </div>

                            {/* Actions (Desktop Only) */}
                            <div className="absolute top-4 right-4 hidden md:flex gap-2">
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-8 w-8 rounded-full bg-blue-500/40 backdrop-blur hover:bg-blue-600/60 text-white border-0 transition-colors"
                                    onClick={async () => {
                                        if (networkManager?.opponentUid) {
                                            try {
                                                const user = auth.currentUser;
                                                const token = await user?.getIdToken();
                                                await fetch('/api/friends/request', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({ toUid: networkManager.opponentUid })
                                                });
                                                setAlertState({
                                                    isOpen: true,
                                                    title: "Request Sent",
                                                    message: "Friend request sent!",
                                                    type: "success"
                                                });
                                            } catch (e) {
                                                console.error(e);
                                                setAlertState({
                                                    isOpen: true,
                                                    title: "Error",
                                                    message: "Failed to send friend request",
                                                    type: "error"
                                                });
                                            }
                                        }
                                    }}
                                >
                                    <UserPlus className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-8 w-8 rounded-full bg-red-500/40 backdrop-blur hover:bg-red-600/60 text-white border-0 transition-colors"
                                    onClick={() => setShowReportModal(true)}
                                >
                                    <Flag className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Skip Button (Desktop Only) */}
                            <div className="absolute bottom-4 right-4 z-20 hidden md:block">
                                <Button
                                    onClick={handleSkip}
                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5 py-2.5 font-bold text-sm shadow-lg flex items-center gap-1.5 transition-transform hover:scale-105"
                                >
                                    <div className="flex -space-x-1">
                                        <SkipForward className="w-4 h-4 fill-current" />
                                        <SkipForward className="w-4 h-4 fill-current" />
                                    </div>
                                    Skip
                                </Button>
                            </div>

                            {/* Placeholder */}
                            {!remoteVideoRef.current?.srcObject && (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#EAE8D9]">
                                    <div className="text-center text-gray-400">
                                        <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <UserIcon className="w-10 h-10 opacity-30" />
                                        </div>
                                        <p className="font-medium">Waiting for opponent...</p>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Local Video (Bottom Half) with Chat Overlay */}
                        <Card className="flex-1 md:flex-1 md:min-h-0 rounded-[1rem] overflow-hidden border-0 shadow-xl bg-gray-200 relative group/local p-0">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />

                            {/* Status Badge (Moved to top-left) */}
                            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-bold z-10">
                                You
                            </div>

                            {/* Floating Messages Overlay (Desktop Only) */}
                            <div className="hidden md:flex absolute bottom-4 left-4 right-4 flex-col justify-end pointer-events-none gap-2 z-10 min-h-[120px]">
                                <style jsx>{`
                                @keyframes floatFade {
                                    0% { opacity: 0; transform: translateY(20px); }
                                    10% { opacity: 1; transform: translateY(0); }
                                    80% { opacity: 1; transform: translateY(0); }
                                    100% { opacity: 0; transform: translateY(-10px); }
                                }
                                .msg-anim {
                                    animation: floatFade 6s forwards;
                                }
                            `}</style>
                                {messages.filter(m => m.timestamp > mountTime).slice(-4).map((msg) => (
                                    <div key={msg.id || Math.random()} className="msg-anim flex flex-col w-full">
                                        <div className={`backdrop-blur-md rounded-2xl px-4 py-2 text-sm text-white shadow-sm max-w-[85%] break-words bg-black/50 border border-white/10 ${msg.isLocal
                                            ? 'self-end rounded-br-sm'
                                            : 'self-start rounded-bl-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Mobile Action Bar (New) */}
                    <div className={`${showGame ? 'hidden' : 'flex'} flex-row justify-between items-center gap-2 md:hidden w-full h-12`}>
                        {/* Friend Request Button */}
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-12 w-12 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-600 border border-blue-200 shadow-sm"
                            onClick={async () => {
                                if (networkManager?.opponentUid) {
                                    try {
                                        const user = auth.currentUser;
                                        const token = await user?.getIdToken();
                                        await fetch('/api/friends/request', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({ toUid: networkManager.opponentUid })
                                        });
                                        setAlertState({
                                            isOpen: true,
                                            title: "Request Sent",
                                            message: "Friend request sent!",
                                            type: "success"
                                        });
                                    } catch (e) {
                                        console.error(e);
                                        setAlertState({
                                            isOpen: true,
                                            title: "Error",
                                            message: "Failed to send friend request",
                                            type: "error"
                                        });
                                    }
                                }
                            }}
                        >
                            <UserPlus className="w-5 h-5" />
                        </Button>

                        {/* Skip Button (Center, Prominent) */}
                        <Button
                            onClick={handleSkip}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 font-bold text-lg shadow-md flex items-center justify-center gap-2"
                        >
                            <div className="flex -space-x-1">
                                <SkipForward className="w-5 h-5 fill-current" />
                                <SkipForward className="w-5 h-5 fill-current" />
                            </div>
                            Skip Match
                        </Button>

                        {/* Report Button */}
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-12 w-12 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 shadow-sm"
                            onClick={() => setShowReportModal(true)}
                        >
                            <Flag className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Mobile Chat Overlay */}
                    <div className="md:hidden fixed bottom-16 left-4 right-4 flex flex-col justify-end pointer-events-none gap-2 z-40 h-32 mask-image-gradient-to-t">
                        <style jsx>{`
                            @keyframes floatFadeMobile {
                                0% { opacity: 0; transform: translateY(10px); }
                                10% { opacity: 1; transform: translateY(0); }
                                90% { opacity: 1; transform: translateY(0); }
                                100% { opacity: 0; transform: translateY(-5px); }
                            }
                            .msg-anim-mobile {
                                animation: floatFadeMobile 4s forwards;
                            }
                        `}</style>
                        {messages.filter(m => m.timestamp > mountTime).slice(-3).map((msg) => (
                            <div key={msg.id || Math.random()} className="msg-anim-mobile flex flex-col w-full">
                                <div className={`backdrop-blur-md rounded-2xl px-3 py-1.5 text-xs text-white shadow-sm max-w-[85%] break-words bg-black/60 border border-white/10 ${msg.isLocal
                                    ? 'self-end rounded-br-sm'
                                    : 'self-start rounded-bl-sm'
                                    }`}>
                                    <span className="font-bold mr-1 opacity-75"></span>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Bar (Below Video) */}
                    <div className={`w-full fixed bottom-0 left-0 right-0 p-2 bg-white/80 backdrop-blur-md md:static md:bg-transparent md:p-0 z-50 ${showGame ? 'hidden md:block' : ''}`}>
                        <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-white p-1.5 rounded-[1rem] border border-gray-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-orange-500/20">
                            <input
                                className="flex-1 bg-transparent border-none text-gray-900 text-sm placeholder-gray-500 px-4 py-1 focus:outline-none focus:ring-0"
                                placeholder="Type a message..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="h-9 w-9 rounded-full bg-orange-500 hover:bg-orange-600 text-white border-0 transition-all shadow-md hover:scale-105 shrink-0"
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </Button>
                        </form>
                    </div>

                </div>
            </main>
            {/* Report Modal */}
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                targetUid={networkManager?.opponentUid || ''}
                onReportSubmitted={() => {
                    networkManager?.disconnect();
                    setStatus("Disconnected (Reported)");
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                }}
            />

            {/* Mobile Video Chat Toggle Button */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50 md:hidden">
                <Button
                    onClick={() => router.push('/video/chat')}
                    className="rounded-l-full rounded-r-none bg-blue-500 hover:bg-blue-600 text-white shadow-lg pl-4 pr-2 py-6 font-bold flex items-center gap-2 transition-transform hover:-translate-x-1 border-r-0"
                >
                    <span className="text-sm sm:hidden">Chat</span>
                    <span className="text-sm hidden sm:inline">Video Chat</span>
                    <Video className="w-5 h-5" />
                </Button>
            </div>

            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />

            {/* Mobile Exit Button */}
            <div className="fixed top-4 right-4 z-50 md:hidden">
                <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 border border-gray-200"
                    onClick={() => router.push('/home')}
                >
                    <X className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
