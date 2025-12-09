"use client";

import React from 'react';
import { GameList } from '@/components/games/GameList';

export default function GamesPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <GameList />
        </div>
    );
}
