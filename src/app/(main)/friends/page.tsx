"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFriends } from '@/lib/hooks/useFriends';
import { useFriendRequests } from '@/lib/hooks/useFriendRequests';
import { FriendItem } from '@/components/friends/FriendItem';
import { FriendRequestItem } from '@/components/friends/FriendRequestItem';
import { Loader2, Users, UserPlus, Search, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function FriendsPage() {
    const router = useRouter();
    const { friends, loading: friendsLoading } = useFriends();
    const { requests, loading: requestsLoading } = useFriendRequests();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFriends = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isLoading = friendsLoading || requestsLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FFF8F0]">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFF8F0] p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-6 h-full">
                {/* Header with Back Button */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="hidden md:flex rounded-full hover:bg-orange-100 hover:text-orange-600 -ml-2"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Friend Requests (lg:col-span-4) */}
                    <div className="lg:col-span-4 flex flex-col gap-4 w-full">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col max-h-[500px] lg:max-h-[calc(100vh-160px)]">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-50 shrink-0">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-gray-900">Friend Requests</h2>
                                    <p className="text-xs text-gray-500">{requests.length} pending</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                                {requests.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        <p className="text-sm">No pending requests</p>
                                    </div>
                                ) : (
                                    requests.map(request => (
                                        <FriendRequestItem key={request.id} request={request} />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Friends List (lg:col-span-8) */}
                    <div className="lg:col-span-8 flex flex-col gap-4 w-full">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-200px)] lg:h-[calc(100vh-160px)]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-50 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg text-gray-900">My Friends</h2>
                                        <p className="text-xs text-gray-500">{friends.length} total</p>
                                    </div>
                                </div>

                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search friends..."
                                        className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all h-10 rounded-xl"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                                {filteredFriends.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                                        <Users className="h-12 w-12 mb-3 opacity-20" />
                                        {searchQuery ? (
                                            <p>No friends match "{searchQuery}"</p>
                                        ) : (
                                            <>
                                                <p className="font-medium text-gray-600 mb-1">Make some friends!</p>
                                                <p className="text-sm max-w-xs mx-auto">Connect with other players to see them here.</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {filteredFriends.map(friend => (
                                            <FriendItem key={friend.uid} friend={friend} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
