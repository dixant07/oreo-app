"use client";

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface GameFrameProps {
    gameUrl?: string;
    className?: string;
}

export function GameFrame({ gameUrl, className }: GameFrameProps) {
    const [isLoading, setIsLoading] = useState(true);
    const url = gameUrl || process.env.NEXT_PUBLIC_GAMES_BASE_URL || "http://localhost:3000";

    return (
        <div className={`relative w-full h-full bg-zinc-950 overflow-hidden ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                        <p className="text-zinc-500 font-medium animate-pulse">Loading Game...</p>
                    </div>
                </div>
            )}
            <iframe
                src={url}
                className="w-full h-full border-none z-20 relative"
                title="Game Window"
                allow="camera; microphone; autoplay"
                onLoad={() => setIsLoading(false)}
            />
        </div>
    );
}

