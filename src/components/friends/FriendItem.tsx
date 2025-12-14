import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, UserMinus, Loader2, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';
import { Friend, sendGameInvite } from '@/lib/hooks/useFriends';
import { ConfirmModal } from '@/components/ui/confirm-modal';

interface FriendItemProps {
    friend: Friend;
}

export function FriendItem({ friend }: FriendItemProps) {
    const router = useRouter();
    const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);

    const handleChat = () => {
        router.push(`/chat?startWith=${friend.uid}`);
    };

    const handleInvite = async () => {
        if (!friend.isOnline) {
            toast.error("User is offline");
            return;
        }

        setInviteLoading(true);
        try {
            await sendGameInvite(friend.uid);
            toast.success("Game invite sent!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to send invite");
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemove = async () => {
        setActionLoading(true);
        try {
            const token = await (await import('@/lib/config/firebase')).auth.currentUser?.getIdToken();
            if (!token) throw new Error("Not authenticated");

            const response = await fetch('/api/friends/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ targetUid: friend.uid })
            });

            if (!response.ok) {
                throw new Error("Failed to remove friend");
            }

            toast.success("Friend removed");
            // The list will update automatically via Firestore snapshot in useFriends
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove friend");
        } finally {
            setActionLoading(false);
            setIsRemoveConfirmOpen(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="h-12 w-12 border border-gray-100 shadow-sm">
                            <AvatarImage src={friend.avatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                                {friend.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        {friend.isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">{friend.name}</h4>
                        <p className={`text-xs ${friend.isOnline ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                            {friend.isOnline ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 rounded-full text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                        title="Chat"
                        onClick={handleChat}
                    >
                        <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className={`h-9 w-9 p-0 rounded-full ${friend.isOnline ? 'text-gray-400 hover:text-purple-500 hover:bg-purple-50' : 'text-gray-300 cursor-not-allowed'}`}
                        title={friend.isOnline ? "Invite to Connect" : "User Offline"}
                        onClick={handleInvite}
                        disabled={!friend.isOnline || inviteLoading}
                    >
                        {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gamepad2 className="h-4 w-4" />}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
                        title="Remove Friend"
                        onClick={() => setIsRemoveConfirmOpen(true)}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <ConfirmModal
                isOpen={isRemoveConfirmOpen}
                onClose={() => setIsRemoveConfirmOpen(false)}
                onConfirm={handleRemove}
                title="Remove Friend"
                message={`Are you sure you want to remove ${friend.name} from your friends list?`}
                variant="destructive"
            />
        </>
    );
}
