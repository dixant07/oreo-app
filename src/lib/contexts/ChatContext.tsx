"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNetwork } from './NetworkContext';

export interface ChatMessage {
    id: string;
    text: string;
    isLocal: boolean;
    timestamp: number;
}

interface ChatContextType {
    messages: ChatMessage[];
    sendMessage: (text: string) => void;
    clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType>({
    messages: [],
    sendMessage: () => { },
    clearMessages: () => { },
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const { networkManager } = useNetwork();
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        if (!networkManager) return;

        const handleChatMessage = (data: unknown) => {
            const msg = data as string;
            setMessages(prev => [...prev, {
                id: Math.random().toString(36).substring(7),
                text: msg,
                isLocal: false,
                timestamp: Date.now()
            }]);
        };

        const handleMatchFound = () => {
            setMessages([]);
        };

        const unsubs = [
            networkManager.on('chat_message', handleChatMessage),
            networkManager.on('match_found', handleMatchFound)
        ];

        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, [networkManager]);

    const sendMessage = (text: string) => {
        if (!text.trim()) return;

        if (networkManager?.videoConnection) {
            networkManager.videoConnection.sendChatMessage(text);
            setMessages(prev => [...prev, {
                id: Math.random().toString(36).substring(7),
                text,
                isLocal: true,
                timestamp: Date.now()
            }]);
        }
    };

    const clearMessages = () => {
        setMessages([]);
    };

    return (
        <ChatContext.Provider value={{ messages, sendMessage, clearMessages }}>
            {children}
        </ChatContext.Provider>
    );
};
