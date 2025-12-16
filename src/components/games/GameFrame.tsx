"use client";

import React, { useState, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface GameFrameProps {
    gameUrl?: string;
    className?: string;
}

export const GameFrame = forwardRef<HTMLIFrameElement, GameFrameProps>(({ gameUrl, className }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const url = gameUrl || process.env.NEXT_PUBLIC_GAMES_BASE_URL || "http://localhost:3000";

    return (
        <div className={`relative w-full h-full bg-zinc-950/95 overflow-hidden ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/50 backdrop-blur-sm z-10 transition-all duration-500">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 blur-xl opacity-20 animate-pulse rounded-full" />
                        <div className="relative flex flex-col items-center gap-6 p-8 rounded-3xl border border-white/5 bg-zinc-900/80 shadow-2xl backdrop-blur-md">
                            <div className="relative">
                                <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full animate-[spin_3s_linear_infinite]" />
                                <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-[spin_1s_linear_infinite]" />
                                <div className="relative bg-zinc-950 p-4 rounded-full border border-white/10 shadow-inner">
                                    <Loader2 className="w-8 h-8 text-orange-500" />
                                </div>
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-zinc-200 font-bold text-lg tracking-tight">Loading Game</p>
                                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Please Wait</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <iframe
                ref={ref}
                src={url}
                className="w-full h-full border-none z-20 relative transition-opacity duration-500"
                title="Game Window"
                allow="camera; microphone; autoplay; fullscreen"
                onLoad={() => setIsLoading(false)}
            />
        </div>
    );
});

GameFrame.displayName = 'GameFrame';



