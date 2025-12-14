"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useNetwork } from '@/lib/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    UserPlus,
    History,
    Search,
    Crown,
    User as UserIcon,
    MessageSquare,
    Globe,
    Gamepad2,
    Video
} from 'lucide-react';
import data from './data.json';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';

export default function HomePage() {
    const { networkManager, user } = useNetwork();
    const router = useRouter();
    const localVideoRef = useRef<HTMLVideoElement>(null);

    const [mode, setMode] = useState<'game' | 'video'>('video');
    const [selectedGame, setSelectedGame] = useState(data.games[0].id);
    const [selectedRegion, setSelectedRegion] = useState(data.regions[0].id);
    const [selectedGender, setSelectedGender] = useState(data.genders[0].id);
    const [selectedLanguage, setSelectedLanguage] = useState(data.languages[0].id);

    useEffect(() => {
        // Start local camera
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        };

        startCamera();

        return () => {
            // Cleanup stream on unmount
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                const stream = localVideoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleStartChat = async () => {
        if (!networkManager) return;

        const preferences = {
            mode,
            game: mode === 'game' ? selectedGame : null,
            region: selectedRegion,
            gender: selectedGender,
            language: selectedLanguage
        };

        try {
            // Navigate to the appropriate page based on mode
            // We'll pass preferences via query params or context, 
            // but for now let's assume the network manager handles the queueing
            // and we just redirect to the waiting/active view.

            // Actually, the requirement says "send to api call to matchmaking server".
            // The NetworkManager.findMatch does exactly that.

            await networkManager.findMatch(preferences);

            if (mode === 'game') {
                router.push('/video/game');
            } else {
                router.push('/video/chat');
            }
        } catch (error) {
            console.error("Failed to start chat:", error);
        }
    };

    return (
        <div className="flex h-screen flex-col bg-[#FFF8F0]">
            <TopBar mode={mode} onModeChange={setMode} showToggle={false} />

            {/* Main Body */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Half - Video */}
                <div className="hidden md:flex md:w-1/2 p-8 items-center justify-center relative">
                    <div className="relative w-full max-w-[340px] aspect-[3/5] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white bg-black">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        {/* Phone UI Overlay elements */}
                        <div className="absolute top-4 left-0 right-0 flex justify-between px-6 text-white/80 text-xs font-medium">
                            <span>Orea</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            </div>
                        </div>

                        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                                <Video className="w-5 h-5 text-white" />
                            </div>
                            <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform cursor-pointer">
                                <div className="w-5 h-5 bg-white rounded-sm"></div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                                <Gamepad2 className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Decorative background blob */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[70%] bg-orange-200/30 blur-3xl -z-10 rounded-full"></div>
                </div>

                {/* Right Half - Configuration */}
                <div className="w-full md:w-1/2 flex items-center justify-center p-8">
                    <Card className="w-full max-w-sm p-6 shadow-xl border-0 bg-white/80 backdrop-blur-md rounded-2xl">

                        {/* Toggle */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-gray-100 p-1 rounded-full flex relative">
                                <button
                                    onClick={() => setMode('video')}
                                    className={`relative z-10 px-6 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${mode === 'video' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Video
                                </button>
                                <button
                                    onClick={() => setMode('game')}
                                    className={`relative z-10 px-6 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${mode === 'game' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Game
                                </button>

                                {/* Sliding background */}
                                <div
                                    className={`absolute top-1 bottom-1 rounded-full bg-orange-500 transition-all duration-300 shadow-md`}
                                    style={{
                                        left: mode === 'video' ? '4px' : '50%',
                                        width: 'calc(50% - 4px)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Illustration/Icon */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 bg-orange-50 rounded-2xl mb-3 flex items-center justify-center">
                                {mode === 'game' ? (
                                    <Gamepad2 className="w-8 h-8 text-orange-500" />
                                ) : (
                                    <Video className="w-8 h-8 text-orange-500" />
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {mode === 'game' ? 'Play with strangers!' : 'Talk to strangers!'}
                            </h2>
                        </div>

                        {/* Configuration Form */}
                        <div className="space-y-3 mb-6">
                            {/* Game Selector - Only in Game Mode */}
                            {mode === 'game' && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Game</Label>
                                    <select
                                        value={selectedGame}
                                        onChange={(e) => setSelectedGame(e.target.value)}
                                        className="w-full p-2 rounded-lg bg-gray-50 border-transparent focus:border-orange-500 focus:ring-0 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100"
                                    >
                                        {data.games.map(g => (
                                            <option key={g.id} value={g.id}>{g.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gender</Label>
                                    <select
                                        value={selectedGender}
                                        onChange={(e) => setSelectedGender(e.target.value)}
                                        className="w-full p-2 rounded-lg bg-gray-50 border-transparent focus:border-orange-500 focus:ring-0 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100"
                                    >
                                        {data.genders.map(g => (
                                            <option key={g.id} value={g.id}>{g.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Region</Label>
                                    <select
                                        value={selectedRegion}
                                        onChange={(e) => setSelectedRegion(e.target.value)}
                                        className="w-full p-2 rounded-lg bg-gray-50 border-transparent focus:border-orange-500 focus:ring-0 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100"
                                    >
                                        {data.regions.map(r => (
                                            <option key={r.id} value={r.id}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Language</Label>
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className="w-full p-2 rounded-lg bg-gray-50 border-transparent focus:border-orange-500 focus:ring-0 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100"
                                >
                                    {data.languages.map(l => (
                                        <option key={l.id} value={l.id}>{l.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Start Button */}
                        <Button
                            onClick={handleStartChat}
                            className="w-full h-11 text-base font-bold rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Start Video Chat
                        </Button>

                    </Card>
                </div>
            </main>
        </div>
    );
}
