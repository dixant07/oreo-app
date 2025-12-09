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
    Crown // Added import
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { useCurrentOpponent } from '@/lib/contexts/OpponentContext';
import { ReportModal } from '@/components/dialogs/ReportModal';
import { auth } from '@/lib/config/firebase';
import { useChat } from '@/lib/contexts/ChatContext';

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

        // Initial check if already connected
        if (networkManager.videoConnection?.localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = networkManager.videoConnection.localStream;
        }
        if (networkManager.videoConnection?.remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = networkManager.videoConnection.remoteStream;
            setStatus("Connected");
        }

        // Connect and find match on mount
        const initConnection = async () => {
            if (!networkManager.socket?.connected) {
                try {
                    await networkManager.connect();
                    networkManager.findMatch({ mode: 'video' });
                } catch (err) {
                    console.error("Failed to connect:", err);
                }
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
        <div className="flex h-screen flex-col bg-[#FFF8F0]">
            {/* Header */}
            <TopBar mode={mode} onModeChange={handleModeToggle} />

            {/* Main Content */}
            <main className="flex-1 flex p-6 gap-6 overflow-hidden">

                {/* Left: Local Video */}
                <Card className="flex-1 rounded-[2rem] overflow-hidden bg-[#D1D5DB] relative border-0 shadow-none">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-xs font-medium">
                        You
                    </div>
                </Card>

                {/* Middle: Remote Video */}
                <Card className="flex-1 rounded-[2rem] overflow-hidden bg-[#EAE8D9] relative border-0 shadow-none group">
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

                    {/* User Info Overlay */}
                    <div className="absolute top-6 left-6 right-6 flex justify-between">
                        <div className="bg-black/20 backdrop-blur-md text-white px-4 py-2 rounded-xl">
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
                    <div className="absolute bottom-6 right-6">
                        <Button
                            onClick={handleSkip}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-6 font-bold text-lg shadow-lg flex items-center gap-2"
                        >
                            <div className="flex -space-x-1">
                                <SkipForward className="w-6 h-6 fill-current" />
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
                </Card>

                {/* Right: Chat */}
                <Card className="w-96 flex flex-col rounded-[2rem] bg-white border-0 shadow-sm overflow-hidden">
                    {/* Chat Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                            <UserIcon className="w-8 h-8 text-orange-500 translate-y-1" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{opponent?.name || "Opponent"}</h3>
                            <p className="text-xs text-green-500 font-medium">{status === "Connected" ? "Online" : status}</p>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.isLocal ? 'justify-end' : 'justify-start'}`}>
                                <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm ${msg.isLocal
                                    ? 'bg-pink-100 text-gray-800 rounded-tr-none'
                                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-gray-50">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-2 py-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                            <Input
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder="Type your message..."
                                className="border-0 focus-visible:ring-0 shadow-none bg-transparent h-10 px-4"
                            />
                            <Button type="button" variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 rounded-full">
                                <Smile className="w-5 h-5" />
                            </Button>
                            <Button type="submit" size="icon" className="bg-red-500 hover:bg-red-600 text-white rounded-full h-10 w-10 shadow-md">
                                <Send className="w-4 h-4 ml-0.5" />
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
        </div>
    );
}
