"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNetwork } from './NetworkContext';
import { db } from '@/lib/config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface OpponentProfile {
    uid: string;
    name: string;
    displayName?: string;
    avatarUrl: string;
    isOnline: boolean;
}

interface OpponentContextType {
    opponent: OpponentProfile | null;
    loading: boolean;
}

const OpponentContext = createContext<OpponentContextType>({
    opponent: null,
    loading: false,
});

export const useCurrentOpponent = () => useContext(OpponentContext);

export const OpponentProvider = ({ children }: { children: React.ReactNode }) => {
    const { networkManager } = useNetwork();
    const [opponent, setOpponent] = useState<OpponentProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!networkManager) {
            setOpponent(null);
            return;
        }

        let unsubscribeSnapshot: (() => void) | null = null;

        const updateOpponent = (uid: string) => {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }

            if (!uid) {
                setOpponent(null);
                return;
            }

            setLoading(true);
            const userRef = doc(db, 'users', uid);
            unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    setOpponent(doc.data() as OpponentProfile);
                } else {
                    setOpponent(null);
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching opponent profile:", error);
                setLoading(false);
            });
        };

        const handleMatchFound = (data: unknown) => {
            const matchData = data as { opponentUid?: string };
            if (matchData.opponentUid) {
                updateOpponent(matchData.opponentUid);
            }
        };

        const handleDisconnect = () => {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }
            setOpponent(null);
        };

        if (networkManager.opponentUid) {
            updateOpponent(networkManager.opponentUid);
        }

        const unsubMatch = networkManager.on('match_found', handleMatchFound);
        const unsubLost = networkManager.on('video_connection_lost', handleDisconnect);

        return () => {
            unsubMatch();
            unsubLost();
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
        };
    }, [networkManager]);

    return (
        <OpponentContext.Provider value={{ opponent, loading }}>
            {children}
        </OpponentContext.Provider>
    );
};
