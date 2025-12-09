"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { games, categories } from '@/app/(main)/games/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Play, Lock } from 'lucide-react';

interface GameListProps {
    onSelectGame?: (gameId: string) => void;
    compact?: boolean;
}

export function GameList({ onSelectGame, compact = false }: GameListProps) {
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredGames = selectedCategory === 'All'
        ? games
        : games.filter(game => game.category === selectedCategory);

    return (
        <div className={`h-full w-full bg-white/50 backdrop-blur-sm ${compact ? 'p-6' : 'p-8'} font-sans overflow-hidden flex flex-col`}>
            <div className={`flex-shrink-0 ${compact ? 'w-full' : 'max-w-7xl mx-auto w-full'}`}>
                {/* Header */}
                <div className="mb-4 text-center sm:text-left">
                    <h1 className={`${compact ? 'text-2xl' : 'text-3xl'} font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 mb-2 tracking-tight`}>
                        Browse Games
                    </h1>
                    {!compact && (
                        <p className="text-gray-500 text-base max-w-2xl">
                            Discover your next obsession. Play with friends or challenge strangers in our curated collection.
                        </p>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 transform hover:scale-105 ${selectedCategory === category
                                ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                                : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                {/* Games Grid */}
                <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-5 pb-8 ${!compact ? 'max-w-7xl mx-auto' : ''}`}>
                    {filteredGames.map((game) => (
                        <Card key={game.id} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur rounded-3xl overflow-hidden flex flex-col h-full ring-1 ring-gray-100 hover:ring-2 hover:ring-blue-500/20">
                            <div className="relative aspect-[4/3] w-full overflow-hidden">
                                <Image
                                    src={game.image}
                                    alt={game.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                    <span className="text-white font-medium text-xs bg-black/30 backdrop-blur px-2 py-1 rounded-lg border border-white/20">
                                        {game.category}
                                    </span>
                                </div>
                            </div>

                            <CardContent className="p-4 flex-grow">
                                <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight group-hover:text-blue-600 transition-colors">
                                    {game.title}
                                </h3>
                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider opacity-70">
                                    {game.category}
                                </p>
                            </CardContent>

                            <CardFooter className="p-4 pt-0">
                                {game.isAvailable ? (
                                    onSelectGame ? (
                                        <Button
                                            onClick={() => onSelectGame(game.id)}
                                            className="w-full rounded-xl bg-gray-900 hover:bg-blue-600 text-white font-bold h-9 text-sm shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group-hover:scale-[1.02]"
                                        >
                                            <Play className="w-3.5 h-3.5 mr-2 fill-current" /> Play
                                        </Button>
                                    ) : (
                                        <Link href={game.route} className="w-full">
                                            <Button className="w-full rounded-xl bg-gray-900 hover:bg-blue-600 text-white font-bold h-9 text-sm shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group-hover:scale-[1.02]">
                                                <Play className="w-3.5 h-3.5 mr-2 fill-current" /> Play
                                            </Button>
                                        </Link>
                                    )
                                ) : (
                                    <Button disabled className="w-full rounded-xl bg-gray-100 text-gray-400 font-bold h-9 text-sm border border-gray-200 cursor-not-allowed">
                                        <Lock className="w-3.5 h-3.5 mr-2" /> Soon
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.3);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(156, 163, 175, 0.5);
                }
            `}</style>
        </div>
    );
}

