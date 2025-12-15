"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useNetwork } from '@/lib/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    SkipForward,
    User as UserIcon,
    Send,
    Smile,
    UserPlus,
    Flag,
    Crown,
    Gamepad2,
    X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { useCurrentOpponent } from '@/lib/contexts/OpponentContext';
import { ReportModal } from '@/components/dialogs/ReportModal';
import { auth } from '@/lib/config/firebase';
import { useChat } from '@/lib/contexts/ChatContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertModal } from '@/components/ui/alert-modal';

export default function VideoChatPage() {
    const { networkManager } = useNetwork();
    const router = useRouter();
    const { messages, sendMessage, clearMessages } = useChat();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [status, setStatus] = useState("Waiting for connection...");
    const [inputText, setInputText] = useState("");
    const [mode, setMode] = useState<'game' | 'video'>('video');
    const [showReportModal, setShowReportModal] = useState(false);
    const [incomingInvite, setIncomingInvite] = useState<{ gameId: string } | null>(null);
    const [mountTime] = useState(Date.now()); // Added for chat animation
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

        const handleMatchFound = () => {
            setStatus("Match Found!");
            // clearMessages handled in context, or here if strict per-match view clearing is needed
            // context handles it on match_found event.
        };

        const handleVideoLost = () => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            setStatus("Opponent disconnected");
            setIncomingInvite(null);
        };

        // Add handleGameInvite
        const handleGameInvite = (data: unknown) => {
            const { gameId } = data as { gameId: string };
            setIncomingInvite({ gameId });
        };

        const unsubs = [
            networkManager.on('local_video_track', handleLocalStream),
            networkManager.on('remote_video_track', handleRemoteStream),
            networkManager.on('match_found', handleMatchFound),
            networkManager.on('video_connection_lost', handleVideoLost),
            networkManager.on('game_invite', handleGameInvite)
        ];

        // Initial check if already connected or start local stream
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

        // Connect and find match on mount
        const initConnection = async () => {
            // Hydrate if already in a match (e.g. from Internal Navigation)
            if (networkManager.roomId && networkManager.opponentId) {
                console.log("Already in match, resuming chat session...");
                setStatus("Match Found!");
                if (networkManager.videoConnection?.remoteStream) {
                    setStatus("Connected");
                }
                return;
            }

            if (!networkManager.socket?.connected) {
                try {
                    await networkManager.connect();
                    networkManager.findMatch({ mode: 'video' });
                } catch (err) {
                    console.error("Failed to connect:", err);
                }
            } else {
                // Connected but no match/room? Find one.
                networkManager.findMatch({ mode: 'video' });
            }
        };
        initConnection();

        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, [networkManager]);

    useEffect(() => {
        if (!networkManager) return;

        const handleMatchSkippedClient = () => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            clearMessages();
            setStatus("Searching for next match...");
            setIncomingInvite(null);

            // Re-join queue immediately
            networkManager.findMatch({ mode });
        };

        const unsub = networkManager.on('match_skipped_client', handleMatchSkippedClient);
        return () => {
            unsub();
        };
    }, [networkManager, mode, clearMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSkip = async () => {
        if (networkManager) {
            setStatus("Skipping...");
            // Determine if we need to reconnect or just skip
            // If connected, ask server to skip match for both
            if (networkManager.socket && networkManager.socket.connected) {
                networkManager.skipMatch();
            } else {
                // Determine fallback if socket is dead
                networkManager.disconnect();
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                clearMessages();

                await networkManager.connect();
                networkManager.findMatch({ mode });
            }
        }
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;

        sendMessage(inputText);
        setInputText("");
    };

    const handleModeToggle = (newMode: 'game' | 'video') => {
        setMode(newMode);
        if (newMode === 'game') {
            router.push('/video/game');
        }
    };

    return (
        <div className="flex h-screen flex-col bg-[#FFF8F0] overflow-hidden">
            {/* Header */}
            <TopBar mode={mode} onModeChange={handleModeToggle} />

            {/* Main Content */}
            <main className="flex-1 flex md:p-2 gap-0 md:gap-2 overflow-hidden relative">

                {/* Left: Local Video (PiP on Mobile) */}
                <Card className="flex-1 md:flex-1 rounded-[1rem] overflow-hidden bg-[#D1D5DB] border-0 shadow-lg md:shadow-none p-0 absolute md:relative top-16 right-4 w-32 h-48 md:w-auto md:h-auto md:inset-auto z-20 transition-all">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium hidden md:block">
                        You
                    </div>
                </Card>

                {/* Middle: Remote Video (Fullscreen on Mobile) */}
                <Card className="flex-1 rounded-none md:rounded-[1rem] overflow-hidden bg-[#EAE8D9] relative border-0 shadow-none group p-0 absolute inset-0 md:relative md:inset-auto z-0">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />

                    {/* Incoming Invite Overlay */}
                    {incomingInvite && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Crown className="w-8 h-8 text-orange-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Game Invite!</h3>
                                <p className="text-gray-600 mb-6">
                                    Your opponent wants to play <span className="font-bold text-gray-900">{incomingInvite.gameId}</span>.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <Button
                                        variant="outline"
                                        className="rounded-xl px-6 border-2 hover:bg-gray-50 font-bold"
                                        onClick={() => {
                                            networkManager?.videoConnection?.sendGameReject(incomingInvite.gameId);
                                            setIncomingInvite(null);
                                        }}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 font-bold shadow-lg shadow-orange-200"
                                        onClick={() => {
                                            networkManager?.videoConnection?.sendGameAccept(incomingInvite.gameId);
                                            // Redirect to game view
                                            router.push(`/video/game?autoStart=true&gameId=${incomingInvite.gameId}`);
                                            setIncomingInvite(null);
                                        }}
                                    >
                                        Accept
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User Info Overlay (Opponent Name) */}
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-left z-10 w-fit">
                        <p className="font-bold text-sm leading-none">{opponent?.displayName || opponent?.name || "Opponent"}</p>
                        <p className="opacity-80 text-[10px] leading-none mt-0.5">{status === "Connected" ? "Online" : status}</p>
                    </div>

                    {/* Actions (Friend/Report) */}
                    <div className="absolute md:top-4 md:right-4 md:left-auto top-16 left-4 flex flex-col md:flex-row gap-2 z-10">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10 md:h-8 md:w-8 rounded-full bg-blue-500/40 backdrop-blur hover:bg-blue-600/60 text-white border-0 transition-colors shadow-sm"
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
                            <UserPlus className="w-5 h-5 md:w-4 md:h-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10 md:h-8 md:w-8 rounded-full bg-red-500/40 backdrop-blur hover:bg-red-600/60 text-white border-0 transition-colors shadow-sm"
                            onClick={() => setShowReportModal(true)}
                        >
                            <Flag className="w-5 h-5 md:w-4 md:h-4" />
                        </Button>
                    </div>

                    {/* Skip Button (Bottom Right) */}
                    <div className="absolute bottom-24 md:bottom-4 right-4 z-20">
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

                    {/* Placeholder if no video */}
                    {!remoteVideoRef.current?.srcObject && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-gray-400 font-medium">{status}</div>
                        </div>
                    )}

                    {/* Mobile Floating Chat Overlay */}
                    <div className="absolute bottom-20 left-4 right-4 flex flex-col justify-end pointer-events-none gap-2 z-30 min-h-[120px] md:hidden">
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

                {/* Mobile Chat Input (Bottom Fixed) moved outside Remote Video Card for z-index layering above everything */}
                <div className="absolute bottom-0 left-0 right-0 p-2 md:hidden z-40 bg-gradient-to-t from-black/20 to-transparent pb-4">
                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-white/90 backdrop-blur p-1.5 rounded-[1rem] border border-gray-200/50 shadow-lg transition-all focus-within:ring-2 focus-within:ring-orange-500/20">
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

                {/* Right: Chat (Desktop Only) */}
                <Card className="w-80 hidden md:flex flex-col rounded-[1rem] bg-white border-0 shadow-sm overflow-hidden p-0 gap-0">
                    {/* Chat Header */}
                    <div className="p-2 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                            <UserIcon className="w-5 h-5 text-orange-500 translate-y-0.5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm leading-tight">{opponent?.displayName || opponent?.name || "Opponent"}</h3>
                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">{status === "Connected" ? "Online" : status}</p>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-white scrollbar-thin scrollbar-thumb-gray-200">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.isLocal ? 'justify-end' : 'justify-start'}`}>
                                <div className={`rounded-2xl px-3 py-2 max-w-[85%] text-xs font-medium leading-relaxed shadow-sm ${msg.isLocal
                                    ? 'bg-orange-500 text-white rounded-tr-none'
                                    : 'bg-gray-100 text-gray-700 rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-2 bg-white border-t border-gray-100">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-1.5 py-1.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500/50 transition-all shadow-sm">

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full shrink-0 transition-colors">
                                        <Smile className="w-5 h-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-1.5 rounded-xl border-gray-200 shadow-xl" side="top" align="start" sideOffset={10}>
                                    <div className="flex gap-1">
                                        {['😂', '❤️', '👍', '🔥', '😭', '😮'].map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                className="hover:bg-orange-50 hover:scale-110 p-2 rounded-lg text-xl transition-all duration-200 cursor-pointer"
                                                onClick={() => setInputText(prev => prev + emoji)}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Input
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder="Type..."
                                className="border-0 focus-visible:ring-0 shadow-none bg-transparent h-8 px-2 text-sm min-w-0 placeholder:text-gray-400"
                            />
                            <Button type="submit" size="icon" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full h-8 w-8 shadow-sm shrink-0 transition-transform hover:scale-105">
                                <Send className="w-3.5 h-3.5 ml-0.5" />
                            </Button>
                        </form>
                    </div>
                </Card>

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
                    clearMessages();
                }}
            />

            {/* Mobile Game Toggle Button */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-50 md:hidden">
                <Button
                    onClick={() => router.push('/video/game')}
                    className="rounded-r-full rounded-l-none bg-orange-500 hover:bg-orange-600 text-white shadow-lg pl-2 pr-4 py-6 font-bold flex items-center gap-2 transition-transform hover:translate-x-1 border-l-0"
                >
                    <Gamepad2 className="w-5 h-5" />
                    <span className="text-sm hidden sm:inline">Let's Play</span>
                    <span className="text-sm sm:hidden">Play</span>
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
