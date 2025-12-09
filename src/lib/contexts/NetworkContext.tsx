"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { NetworkManager } from '@/lib/network/NetworkManager';
import { auth } from '@/lib/config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface NetworkContextType {
    networkManager: NetworkManager | null;
    user: User | null;
    isConnected: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
    networkManager: null,
    user: null,
    isConnected: false,
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
    const [networkManager, setNetworkManager] = useState<NetworkManager | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const manager = new NetworkManager();
                setNetworkManager(manager);
            } else {
                if (networkManager) {
                    networkManager.disconnect();
                    setNetworkManager(null);
                    setIsConnected(false);
                }
            }
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <NetworkContext.Provider value={{ networkManager, user, isConnected }}>
            {children}
        </NetworkContext.Provider>
    );
};
