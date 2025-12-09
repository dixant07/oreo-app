import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/config/firebase';
import { collection, query, onSnapshot, orderBy, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export interface Friend {
    uid: string;
    name: string;
    avatarUrl: string;
    status: 'accepted' | 'pending';
    isOnline?: boolean; // Fetched separately
}

export function useFriends() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | null = null;

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            console.log("[useFriends] Auth state changed:", user?.uid);

            // Clean up previous snapshot listener
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }

            if (!user) {
                setFriends([]);
                setLoading(false);
                return;
            }

            console.log("[useFriends] Creating query for:", user.uid);
            const q = query(collection(db, 'users', user.uid, 'friends'));

            try {
                unsubscribeSnapshot = onSnapshot(q, async (snapshot) => {
                    console.log(`[useFriends] Snapshot received. Docs: ${snapshot.docs.length}`);

                    const promises = snapshot.docs.map(async (docSnapshot) => {
                        const data = docSnapshot.data();
                        console.log(`[useFriends] Processing doc:`, data);

                        // Basic validation
                        if (!data.uid) {
                            console.warn("[useFriends] Doc missing uid:", docSnapshot.id);
                            return null;
                        }

                        const friendUid = data.uid;
                        let isOnline = false;
                        try {
                            const friendUserDoc = await getDoc(doc(db, 'users', friendUid));
                            if (friendUserDoc.exists()) {
                                isOnline = friendUserDoc.data().isOnline || false;
                            }
                        } catch (e) {
                            console.error("[useFriends] Error fetching friend status", e);
                        }

                        return {
                            uid: friendUid,
                            name: data.name || 'Unknown',
                            avatarUrl: data.avatarUrl || '',
                            status: data.status,
                            isOnline
                        } as Friend;
                    });

                    const resolvedFriends = (await Promise.all(promises)).filter(f => f !== null) as Friend[];
                    console.log(`[useFriends] Resolved friends:`, resolvedFriends);
                    setFriends(resolvedFriends);
                    setLoading(false);
                }, (error) => {
                    console.error("[useFriends] Snapshot error:", error);
                    setLoading(false);
                });
                console.log("[useFriends] Listener attached successfully");
            } catch (err) {
                console.error("[useFriends] Failed to attach listener:", err);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
        };
    }, []);

    return { friends, loading };
}

export async function sendGameInvite(friendId: string) {
    const user = auth.currentUser;
    if (!user) return;

    // Check if friend is online
    const friendDoc = await getDoc(doc(db, 'users', friendId));
    if (!friendDoc.exists() || !friendDoc.data().isOnline) {
        throw new Error("User is offline");
    }

    // Send notification
    await addDoc(collection(db, 'users', friendId, 'notifications'), {
        type: 'game_invite',
        title: 'Game Invite',
        body: `${user.displayName} invited you to play!`,
        data: {
            fromUid: user.uid,
            roomId: 'generated_room_id_here' // In real app, generate this
        },
        isRead: false,
        createdAt: serverTimestamp()
    });
}
