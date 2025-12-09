"use client";

import { useEffect, useRef, useState } from 'react';
import { useNetwork } from '@/lib/contexts/NetworkContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Camera, CameraOff, SkipForward } from 'lucide-react';

export function VideoChat() {
    const { networkManager } = useNetwork();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [status, setStatus] = useState("Waiting for connection...");
    const [messages, setMessages] = useState<{ text: string, isLocal: boolean }[]>([]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
        };

        const handleMatchFound = () => {
            setStatus("Match Found!");
            setMessages([]); // Clear messages on new match
            setTimeout(() => setStatus("Connected"), 2000);
        };

        const handleQueued = () => {
            setStatus("Searching for opponent...");
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            setMessages([]);
        };

        const handleVideoLost = () => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            setStatus("Opponent disconnected");
        };

        const handleChatMessage = (data: unknown) => {
            const msg = data as string;
            setMessages(prev => [...prev, { text: msg, isLocal: false }]);
        };

        networkManager.on('local_video_track', handleLocalStream);
        networkManager.on('remote_video_track', handleRemoteStream);
        networkManager.on('match_found', handleMatchFound);
        networkManager.on('queued', handleQueued);
        networkManager.on('video_connection_lost', handleVideoLost);
        networkManager.on('chat_message', handleChatMessage);

        return () => {
            // Cleanup listeners if needed
        };
    }, [networkManager]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const toggleMic = () => {
        if (networkManager?.videoConnection) {
            networkManager.videoConnection.toggleAudio(!isMicOn);
            setIsMicOn(!isMicOn);
        }
    };

    const toggleCamera = () => {
        if (networkManager?.videoConnection) {
            networkManager.videoConnection.toggleVideo(!isCameraOn);
            setIsCameraOn(!isCameraOn);
        }
    };

    const handleSkip = async () => {
        if (networkManager) {
            setStatus("Skipping...");
            networkManager.disconnect();
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            setMessages([]);

            await networkManager.connect();
            networkManager.findMatch();
        }
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !networkManager?.videoConnection) return;

        networkManager.videoConnection.sendChatMessage(inputText);
        setMessages(prev => [...prev, { text: inputText, isLocal: true }]);
        setInputText("");
    };

    return (
        <div className="flex flex-col h-full gap-4 p-4 bg-zinc-900 text-white">
            {/* Remote Video */}
            <Card className="flex-1 relative overflow-hidden bg-black border-zinc-800 min-h-0">
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black/50 px-2 py-1 rounded text-sm">
                    Remote
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 px-4 py-2 rounded text-lg font-bold pointer-events-none">
                    {status}
                </div>
            </Card>

            {/* Chat Area */}
            <Card className="h-48 flex flex-col bg-zinc-900 border-zinc-800">
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.isLocal ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded px-2 py-1 max-w-[80%] text-sm ${msg.isLocal ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-2 border-t border-zinc-800 flex gap-2">
                    <input
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 h-8 bg-zinc-800 border-zinc-700 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Button type="submit" size="icon" className="h-8 w-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    </Button>
                </form>
            </Card>

            {/* Local Video */}
            <Card className="h-32 relative overflow-hidden bg-black border-zinc-800">
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
                    You
                </div>
            </Card>

            {/* Controls */}
            <div className="flex justify-center gap-4 py-2">
                <Button
                    variant={isMicOn ? "secondary" : "destructive"}
                    size="icon"
                    onClick={toggleMic}
                    className="rounded-full w-12 h-12"
                >
                    {isMicOn ? <Mic /> : <MicOff />}
                </Button>

                <Button
                    variant={isCameraOn ? "secondary" : "destructive"}
                    size="icon"
                    onClick={toggleCamera}
                    className="rounded-full w-12 h-12"
                >
                    {isCameraOn ? <Camera /> : <CameraOff />}
                </Button>

                <Button
                    variant="destructive"
                    onClick={handleSkip}
                    className="rounded-full px-6 font-bold bg-red-600 hover:bg-red-700"
                >
                    <SkipForward className="mr-2 h-4 w-4" /> Skip
                </Button>
            </div>
        </div>
    );
}
