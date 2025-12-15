"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { games, categories } from '@/app/(main)/game-catalog/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Play, Lock, MessageSquarePlus, X, Send, Loader2, Users } from 'lucide-react';
import { db, auth } from '@/lib/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AlertModal } from '@/components/ui/alert-modal';

interface GameListProps {
    onSelectGame?: (gameId: string) => void;
    compact?: boolean;
}

export function GameList({ onSelectGame, compact = false }: GameListProps) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Alert Modal State
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

    const handleSendFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackText.trim()) return;

        setIsSending(true);
        try {
            const user = auth.currentUser;
            await addDoc(collection(db, "feedback"), {
                text: feedbackText,
                uid: user?.uid || 'anonymous',
                name: user?.displayName || 'Anonymous',
                email: user?.email || 'no-email',
                createdAt: serverTimestamp(),
                source: 'game_list'
            });
            setFeedbackText("");
            setShowFeedback(false);
            setAlertState({
                isOpen: true,
                title: "Feedback Sent",
                message: "Thank you for your suggestion! We'll look into it.",
                type: "success"
            });
        } catch (error) {
            console.error("Error sending feedback:", error);
            setAlertState({
                isOpen: true,
                title: "Error",
                message: "Failed to send feedback. Please try again.",
                type: "error"
            });
        } finally {
            setIsSending(false);
        }
    };

    const filteredGames = selectedCategory === 'All'
        ? games
        : games.filter(game => game.category === selectedCategory);

    return (
        <div className={`h-full w-full bg-white/50 backdrop-blur-sm ${compact ? 'p-6' : 'p-8'} font-sans overflow-hidden flex flex-col relative`}>
            {/* Feedback Button */}
            <button
                onClick={() => setShowFeedback(true)}
                className="absolute top-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full shadow-lg transition-all hover:scale-105 group hidden md:flex items-center gap-2"
                title="Send Feedback"
            >
                <MessageSquarePlus className="w-4 h-4" />
                <span className="text-xs font-bold whitespace-nowrap">
                    Suggest Games
                </span>
            </button>

            {/* Feedback Modal */}
            {showFeedback && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm m-4 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Send Feedback</h3>
                            <button
                                onClick={() => setShowFeedback(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSendFeedback}>
                            <textarea
                                className="w-full h-32 p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none mb-4"
                                placeholder="Suggest a game or report a bug..."
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                autoFocus
                            />

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowFeedback(false)}
                                    disabled={isSending}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending || !feedbackText.trim()}
                                    className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send <Send className="w-3 h-3" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className={`flex-shrink-0 ${compact ? 'w-full' : 'max-w-7xl mx-auto w-full'}`}>
                {/* Header */}
                <div className="mb-3 text-center sm:text-left">
                    <h1 className={`${compact ? 'text-xl' : 'text-2xl'} font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 mb-1 tracking-tight`}>
                        Browse Games
                    </h1>
                    {!compact && (
                        <p className="text-gray-500 text-sm max-w-2xl text-balance hidden md:block">
                            Discover your next obsession. Play with friends or challenge strangers.
                        </p>
                    )}
                </div>

                {/* Filters */}
                <div className="hidden md:flex flex-wrap gap-1.5 mb-4 justify-center sm:justify-start">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all duration-300 transform hover:scale-105 ${selectedCategory === category
                                ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20 ring-2 ring-gray-900 ring-offset-1'
                                : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50 border border-gray-100 hover:text-gray-900'
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
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 pb-8 ${!compact ? 'max-w-7xl mx-auto' : ''}`}>
                    {filteredGames.map((game) => (
                        <Card key={game.id} className="group border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-lg overflow-hidden flex flex-col ring-1 ring-gray-100 hover:ring-orange-500/30">
                            <div className="relative aspect-video w-full overflow-hidden">
                                <Image
                                    src={game.image}
                                    alt={game.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                    {game.isAvailable ? (
                                        onSelectGame ? (
                                            <button
                                                onClick={() => onSelectGame(game.id)}
                                                className="bg-white text-gray-900 rounded-full p-2 shadow-lg hover:scale-110 transition-transform"
                                            >
                                                <Play className="w-4 h-4 fill-current" />
                                            </button>
                                        ) : (
                                            <Link href={game.route}>
                                                <button className="bg-white text-gray-900 rounded-full p-2 shadow-lg hover:scale-110 transition-transform">
                                                    <Play className="w-4 h-4 fill-current" />
                                                </button>
                                            </Link>
                                        )
                                    ) : (
                                        <div className="bg-black/60 text-white rounded-full p-1.5 backdrop-blur">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute top-1 right-1 pointer-events-none">
                                    <span className="text-[8px] font-bold text-white bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                        {game.category}
                                    </span>
                                </div>
                            </div>

                            <CardContent className="p-2 flex flex-col gap-0.5">
                                <h3 className="text-[11px] font-bold text-gray-800 leading-tight truncate group-hover:text-orange-600 transition-colors">
                                    {game.title}
                                </h3>
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">
                                        {game.category}
                                    </p>
                                    {!game.isAvailable && (
                                        <span className="text-[8px] text-orange-500 font-bold bg-orange-50 px-1 rounded">SOON</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />

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
