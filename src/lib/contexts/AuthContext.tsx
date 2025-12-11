"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    avatarUrl: string;
    subscription: {
        expiresAt: string;
        tier: 'Free' | 'Gold' | 'Diamond';
    }
    counters: {
        unreadNotifs: number;
        unreadChats: number;
        friendRequests: number;
    };
    isOnline: boolean;
    lastActive: unknown;
    reportCount: {
        Nudity: number;
        Verbal_Abuse: number;
        Fraud: number;
        Spam: number;
        Crime: number;
    };
}

interface UserContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
}

const UserContext = createContext<UserContextType>({
    user: null,
    profile: null,
    loading: true,
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }

            if (currentUser) {
                const userRef = doc(db, 'users', currentUser.uid);
                unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setProfile(doc.data() as UserProfile);
                    } else {
                        setProfile(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user profile:", error);
                    setLoading(false);
                });
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
        };
    }, []);

    return (
        <UserContext.Provider value={{ user, profile, loading }}>
            {children}
        </UserContext.Provider>
    );
};
