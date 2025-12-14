import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/config/firebase';
import { collection, query, onSnapshot, where, getDoc, doc } from 'firebase/firestore';

export interface FriendRequest {
    id: string; // Notification ID
    fromUid: string;
    sender: {
        name: string;
        avatarUrl: string;
    };
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    timestamp: any;
}

export function useFriendRequests() {
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | null = null;

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }

            if (!user) {
                setRequests([]);
                setLoading(false);
                return;
            }

            // Listen to notifications that are friend requests and pending
            const q = query(
                collection(db, 'notifications'),
                where('toUid', '==', user.uid),
                where('type', '==', 'friend_request'),
                where('status', '==', 'PENDING')
            );

            unsubscribeSnapshot = onSnapshot(q, async (snapshot) => {
                const promises = snapshot.docs.map(async (docSnapshot) => {
                    const data = docSnapshot.data();
                    const fromUid = data.fromUid;

                    let senderData = { name: 'Unknown User', avatarUrl: '' };

                    try {
                        const senderDoc = await getDoc(doc(db, 'users', fromUid));
                        if (senderDoc.exists()) {
                            const userData = senderDoc.data();
                            senderData = {
                                name: userData.name || userData.displayName || 'Unknown User',
                                avatarUrl: userData.avatarUrl || userData.photoURL || ''
                            };
                        }
                    } catch (e) {
                        console.error("Error fetching sender info", e);
                    }

                    return {
                        id: docSnapshot.id,
                        fromUid,
                        sender: senderData,
                        status: data.status,
                        timestamp: data.createdAt
                    } as FriendRequest;
                });

                const resolvedRequests = await Promise.all(promises);
                setRequests(resolvedRequests);
                setLoading(false);
            }, (error) => {
                console.error("Error listening to friend requests:", error);
                setLoading(false);
            });
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, []);

    return { requests, loading };
}
