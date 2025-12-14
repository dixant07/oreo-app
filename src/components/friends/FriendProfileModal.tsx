import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Calendar, Globe, User } from 'lucide-react';

interface FriendProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    friend: {
        uid: string;
        name: string;
        avatarUrl: string;
        // Add more fields if available from useFriends or fetch them here
    } | null;
}

export function FriendProfileModal({ isOpen, onClose, friend }: FriendProfileModalProps) {
    if (!friend) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
                {/* Header Background */}
                <div className="h-24 bg-gradient-to-r from-orange-400 to-pink-500 relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 text-white/80 hover:bg-white/20 hover:text-white rounded-full"
                        onClick={onClose}
                    >
                        <span className="sr-only">Close</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Button>
                </div>

                <div className="px-6 pb-6 relative">
                    {/* Avatar */}
                    <div className="-mt-12 mb-4">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                            <AvatarImage src={friend.avatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-orange-100 text-orange-600 font-bold text-2xl">
                                {friend.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="space-y-4 text-center sm:text-left">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-gray-900">{friend.name}</DialogTitle>
                            <p className="text-sm text-gray-500">Friend</p>
                        </div>

                        {/* 
                            Note: Detailed info like location/bio would need fetching from 'users' collection 
                            if not present in the 'friends' basic info. 
                            For now, we display basic info.
                        */}
                        <div className="flex flex-col gap-2 pt-2">
                            {/* Placeholder for future detailed info if we fetch it */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="h-4 w-4 text-gray-400" />
                                <span>Oreo App User</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-gray-50 px-6 py-4 flex-row justify-end gap-2">
                    <Button variant="outline" onClick={onClose} className="rounded-full">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
