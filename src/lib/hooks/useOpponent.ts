import { useState, useEffect } from 'react';
import { db } from '@/lib/config/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useUser } from '@/lib/contexts/AuthContext';

export interface OpponentProfile {
    uid: string;
    name: string;
    avatarUrl: string;
    isOnline: boolean;
}

export function useOpponent(opponentId: string | null) {
    const [opponent, setOpponent] = useState<OpponentProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const { user, loading: authLoading } = useUser();

    useEffect(() => {
        if (!opponentId || authLoading || !user) {
            setOpponent(null);
            return;
        }

        setLoading(true);
        // Initial fetch
        const fetchOpponent = async () => {
            try {
                const userRef = doc(db, 'users', opponentId);
                const snapshot = await getDoc(userRef);
                if (snapshot.exists()) {
                    setOpponent(snapshot.data() as OpponentProfile);
                }
            } catch (err) {
                console.error("Error fetching opponent", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOpponent();

        // Optional: Realtime listener for online status if needed
        const unsubscribe = onSnapshot(doc(db, 'users', opponentId), (doc) => {
            if (doc.exists()) {
                setOpponent(prev => ({ ...prev, ...doc.data() } as OpponentProfile));
            }
        }, (error) => {
            console.error("Opponent snapshot error:", error);
        });

        return () => unsubscribe();
    }, [opponentId, user, authLoading]);

    return { opponent, loading };
}
