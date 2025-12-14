import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FriendRequest } from '@/lib/hooks/useFriendRequests';

interface FriendRequestItemProps {
    request: FriendRequest;
}

export function FriendRequestItem({ request }: FriendRequestItemProps) {
    const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);

    const handleAction = async (action: 'accept' | 'reject') => {
        setActionLoading(action);
        try {
            const token = await (await import('@/lib/config/firebase')).auth.currentUser?.getIdToken();
            if (!token) throw new Error("Not authenticated");

            const endpoint = action === 'accept' ? '/api/friends/accept' : '/api/friends/reject';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    requestId: request.id,
                    fromUid: request.fromUid
                })
            });

            if (!response.ok) {
                throw new Error("Failed to process request");
            }

            toast.success(action === 'accept' ? "Friend accepted!" : "Request rejected");
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-gray-100">
                    <AvatarImage src={request.sender.avatarUrl} />
                    <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                        {request.sender.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">{request.sender.name}</h4>
                    <p className="text-xs text-gray-500">Wants to be friends</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="h-9 w-9 p-0 rounded-full border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50"
                    onClick={() => handleAction('reject')}
                    disabled={!!actionLoading}
                >
                    {actionLoading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                </Button>
                <Button
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-orange-200"
                    onClick={() => handleAction('accept')}
                    disabled={!!actionLoading}
                >
                    {actionLoading === 'accept' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}
