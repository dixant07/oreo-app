import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/config/firebase';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';

export interface Conversation {
    chatId: string;
    withUser: {
        uid: string;
        name: string;
        avatarUrl: string;
    };
    lastMessage: {
        content: string;
        type: string;
        timestamp: any;
        senderId: string;
    };
    unreadCount: number;
    updatedAt: any;
}

export function useConversations() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setConversations([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'users', user.uid, 'conversations'),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convs = snapshot.docs.map(doc => ({
                ...doc.data()
            } as Conversation));
            setConversations(convs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { conversations, loading };
}

export interface Message {
    id: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'game_invite';
    timestamp: any;
    readBy: string[];
}

export function useChatMessages(chatId: string | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('timestamp', 'asc') // Oldest first for chat log
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    return { messages, loading };
}
