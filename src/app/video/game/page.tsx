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
    Loader2 // Added import
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

    const [status, setStatus] = useState("Waiting for connection...");
    const [mountTime] = useState(Date.now());
    const [gameUrl, setGameUrl] = useState<string>(GAME_BASE_URL);
    const [mode, setMode] = useState<'game' | 'video'>('game');
    const [showGame, setShowGame] = useState(false);
    const [incomingInvite, setIncomingInvite] = useState<{ gameId: string } | null>(null);
    const [outgoingInvite, setOutgoingInvite] = useState<{ gameId: string } | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [inputText, setInputText] = useState("");

    const { opponent } = useCurrentOpponent();

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
            alert("Opponent rejected the game request.");
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
            <main className="flex-1 flex p-6 gap-6 overflow-hidden">

                {/* Left: Game Area (Larger) */}
                {/* Left: Game Area (Larger) */}
                <Card className="flex-[2] rounded-[2.5rem] overflow-hidden border-0 shadow-2xl bg-white relative flex flex-col h-full ring-1 ring-gray-100">

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
                            <GameFrame gameUrl={gameUrl} />
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
                <div className="flex-1 flex flex-col gap-6 min-w-[320px]">

                    {/* Remote Video (Top Half) */}
                    <Card className="flex-1 rounded-[2.5rem] overflow-hidden border-0 shadow-xl bg-[#EAE8D9] relative group">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />

                        {/* Opponent Info & Actions */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                            <div className="bg-black/20 backdrop-blur-md text-white px-4 py-2 rounded-2xl">
                                <p className="font-bold text-sm">{opponent?.name || "Opponent"}</p>
                                <p className="opacity-80 text-xs">{status === "Connected" ? "Online" : status}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-9 w-9 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 text-white border-0"
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
                                                alert("Friend request sent!");
                                            } catch (e) {
                                                console.error(e);
                                                alert("Failed to send friend request");
                                            }
                                        }
                                    }}
                                >
                                    <UserPlus className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-9 w-9 rounded-full bg-white/20 backdrop-blur hover:bg-red-500/40 text-white border-0"
                                    onClick={() => setShowReportModal(true)}
                                >
                                    <Flag className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>





                        {/* Skip Button */}
                        <div className="absolute bottom-4 right-4 z-20">
                            <Button
                                onClick={handleSkip}
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-6 font-bold text-lg shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                            >
                                <div className="flex -space-x-1">
                                    <SkipForward className="w-5 h-5 fill-current" />
                                    <SkipForward className="w-5 h-5 fill-current" />
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
                    <Card className="flex-1 rounded-[2.5rem] overflow-hidden border-0 shadow-xl bg-gray-200 relative group/local">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />

                        {/* Status Badge (Moved to top-left) */}
                        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-4 py-1.5 rounded-xl text-xs font-bold z-10">
                            You
                        </div>

                        {/* Floating Messages Overlay */}
                        <div className="absolute bottom-20 left-4 right-4 flex flex-col justify-end pointer-events-none gap-2 z-10 min-h-[120px]">
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
                                    <div className={`backdrop-blur-md rounded-2xl px-4 py-2 text-sm text-white shadow-sm max-w-[85%] break-words ${msg.isLocal
                                        ? 'bg-white/20 self-end rounded-br-none border border-white/20'
                                        : 'bg-black/40 self-start rounded-bl-none border border-white/10'
                                        }`}>
                                        <span className="font-bold text-[10px] opacity-75 block mb-0.5 uppercase tracking-wider">{msg.isLocal ? 'You' : opponent?.name || 'Opponent'}</span>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Translucent Input Bar */}
                        <div className="absolute bottom-4 left-4 right-4 z-20">
                            <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-lg transition-all focus-within:bg-black/60 focus-within:border-white/30 focus-within:shadow-xl">
                                <input
                                    className="flex-1 bg-transparent border-none text-white text-sm placeholder-white/60 px-4 py-1 focus:outline-none focus:ring-0"
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
                    </Card>

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
        </div>
    );
}
