import { useState, useEffect } from 'react';
import { db } from '@/lib/config/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useUser } from '@/lib/contexts/AuthContext';

export interface FriendRequest {
    id: string;
    fromUid: string;
    toUid: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: any;
    sender?: {
        name: string;
        avatarUrl: string;
    };
}

export function useNotifications() {
    const { user } = useUser();
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setFriendRequests([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('toUid', '==', user.uid),
            where('type', '==', 'friend_request'),
            where('status', '==', 'PENDING')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const requests: FriendRequest[] = [];

            // We need to fetch sender details for each request
            // Ideally this should be done with a listener, but for now we'll just fetch once per snapshot update
            // Or we can rely on a separate fetch. 
            // To keep it simple and reactive, let's just map the data first.

            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));

            // Fetch sender info for each request
            // Note: This might be N+1 if many requests, but usually friend requests are few.
            const enrichedRequests = await Promise.all(docs.map(async (req) => {
                try {
                    const senderDoc = await import('firebase/firestore').then(mod => mod.getDoc(mod.doc(db, 'users', req.fromUid)));
                    if (senderDoc.exists()) {
                        const senderData = senderDoc.data();
                        return {
                            ...req,
                            sender: {
                                name: senderData.name || 'Unknown',
                                avatarUrl: senderData.avatarUrl || ''
                            }
                        };
                    }
                } catch (e) {
                    console.error("Error fetching sender details", e);
                }
                return req;
            }));

            setFriendRequests((enrichedRequests as FriendRequest[]).sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            }));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { friendRequests, loading };
}
