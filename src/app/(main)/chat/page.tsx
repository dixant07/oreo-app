"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useConversations, useChatMessages, Conversation, Message } from '@/lib/hooks/useChat';
import { useNetwork } from '@/lib/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// REMOVED Popover imports to use manual state control for reliability
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Send, MoreVertical, ArrowLeft, Smile, Loader2, Flag, Ban, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { ReportModal } from '@/components/dialogs/ReportModal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { toast } from 'sonner';

// Top emojis list
const TOP_EMOJIS = ["😂", "❤️", "👍", "😭", "😮", "😡"];

// Loading fallback component
function ChatLoadingFallback() {
    return (
        <div className="flex h-screen bg-gray-50 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p className="text-gray-500">Loading chat...</p>
            </div>
        </div>
    );
}

// Main page component with Suspense boundary
interface ChatPageProps {
    preselectedChatId?: string | null;
    preselectedStartWith?: string | null;
    onBack?: () => void;
}

export default function ChatPage({ preselectedChatId, preselectedStartWith, onBack }: ChatPageProps) {
    return (
        <Suspense fallback={<ChatLoadingFallback />}>
            <ChatContent preselectedChatId={preselectedChatId} preselectedStartWith={preselectedStartWith} onBack={onBack} />
        </Suspense>
    );
}

// Chat content component that uses useSearchParams
function ChatContent({ preselectedChatId, preselectedStartWith, onBack }: ChatPageProps) {
    const { user } = useNetwork();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialChatId = preselectedChatId ?? searchParams.get('id');
    const startWithId = preselectedStartWith ?? searchParams.get('startWith');

    const { conversations, loading: loadingConvs } = useConversations();
    const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId);
    const [tempConversation, setTempConversation] = useState<Conversation | null>(null);

    // Pass selectedChatId to hooks
    const { messages, loading: loadingMessages } = useChatMessages(selectedChatId);

    // Local state for optimistic UI
    const [pendingMessages, setPendingMessages] = useState<Message[]>([]);

    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Manual emoji picker state
    const scrollRef = useRef<HTMLDivElement>(null);

    // Report Modal State
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Confirm Modal State
    const [confirmData, setConfirmData] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: "default" | "destructive";
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
        variant: "default",
        onConfirm: () => { }
    });

    // Combined messages for display
    const displayedMessages = [...messages, ...pendingMessages].sort((a, b) => {
        const tA = a.timestamp?.seconds || Date.now() / 1000;
        const tB = b.timestamp?.seconds || Date.now() / 1000;
        return tA - tB;
    });

    // Handle initial navigation (id or startWith)
    useEffect(() => {
        if (!user || loadingConvs) return;

        const handleInit = async () => {
            let targetId = initialChatId;

            // If startWithId provided, determine chat ID from it
            if (startWithId && !targetId) {
                const uids = [user.uid, startWithId].sort();
                targetId = `${uids[0]}_${uids[1]}`;
            }

            if (targetId) {
                // Check if already in conversations list
                const exists = conversations.find(c => c.chatId === targetId);
                if (exists) {
                    setSelectedChatId(targetId);
                } else if (startWithId) {
                    // Not in list, need to fetch user info to show empty chat UI
                    try {
                        const userDoc = await getDoc(doc(db, 'users', startWithId));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            setTempConversation({
                                chatId: targetId,
                                withUser: {
                                    uid: startWithId,
                                    name: userData.name || 'User',
                                    avatarUrl: userData.avatarUrl || ''
                                },
                                lastMessage: {
                                    content: 'Start a conversation',
                                    type: 'text',
                                    timestamp: null,
                                    senderId: ''
                                },
                                unreadCount: 0,
                                updatedAt: null
                            });
                            setSelectedChatId(targetId);
                        }
                    } catch (err) {
                        console.error("Error fetching user for new chat", err);
                    }
                }
            } else {
                setSelectedChatId(null);
            }
        };

        handleInit();
    }, [user, loadingConvs, initialChatId, startWithId, conversations]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [displayedMessages, tempConversation]);

    // Mark conversation as read when active or messages update
    useEffect(() => {
        if (!selectedChatId || !user) return;

        const markAsRead = async () => {
            // Only try to mark as read if we have a valid conversation in the list
            // or check if it exists logic could be improved, but usually we just want to reset if ID is valid

            try {
                // If the user has this conversation in their list
                if (conversations.find(c => c.chatId === selectedChatId)) {
                    const conversationRef = doc(db, 'users', user.uid, 'conversations', selectedChatId);
                    await updateDoc(conversationRef, {
                        unreadCount: 0
                    });
                }
            } catch (error) {
                console.error("Error marking chat as read:", error);
            }
        };

        markAsRead();
    }, [selectedChatId, user, messages.length, conversations]);


    // Close emoji picker when clicking outside (simple version)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showEmojiPicker && !(e.target as Element).closest('.emoji-picker-container')) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);


    // Determine active conversation (real or temp)
    const activeConversation = conversations.find(c => c.chatId === selectedChatId) ||
        (selectedChatId === tempConversation?.chatId ? tempConversation : null);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !user) return;

        const textToSend = newMessage;
        setNewMessage(''); // Clear input immediately (Optimistic)
        setShowEmojiPicker(false); // Close emoji picker on send

        // Create a temporary message object
        const tempId = `temp_${Date.now()}`;
        const tempMsg: Message = {
            id: tempId,
            senderId: user.uid,
            content: textToSend,
            type: 'text',
            timestamp: Timestamp.now(), // Use Firestore Timestamp for consistency
            readBy: []
        };

        // Add to pending messages
        setPendingMessages(prev => [...prev, tempMsg]);

        try {
            const token = await user.getIdToken();
            await fetch('/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    receiverId: activeConversation.withUser.uid,
                    text: textToSend
                })
            });

            // Once sent successfully, remove from pending.
            // The real message will appear via Firestore listener 'messages'
            setPendingMessages(prev => prev.filter(m => m.id !== tempId));

        } catch (error) {
            console.error("Failed to send message", error);
            // Optionally restore the message to input or show error
            setPendingMessages(prev => prev.filter(m => m.id !== tempId));
            toast.error("Failed to send message");
            setNewMessage(textToSend); // Restore text
        }
    };

    const handleBlockUser = async () => {
        if (!activeConversation || !user) return;

        setConfirmData({
            isOpen: true,
            title: "Block User",
            message: "Are you sure you want to block this user? Chat history will be removed.",
            variant: "destructive",
            onConfirm: async () => {
                const toastId = toast.loading("Blocking user...");
                try {
                    const token = await user.getIdToken();
                    const res = await fetch('/api/user/block', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ targetUid: activeConversation.withUser.uid })
                    });
                    if (!res.ok) throw new Error("Failed to block");

                    toast.success("User blocked", { id: toastId });
                    router.push('/chat'); // Clear selection
                } catch (error) {
                    console.error(error);
                    toast.error("Failed to block user", { id: toastId });
                }
            }
        });
    };

    const handleRemoveFriend = async () => {
        if (!activeConversation || !user) return;

        setConfirmData({
            isOpen: true,
            title: "Remove Friend",
            message: "Remove from friends list?",
            variant: "default",
            onConfirm: async () => {
                const toastId = toast.loading("Removing friend...");
                try {
                    const token = await user.getIdToken();
                    const res = await fetch('/api/friends/remove', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ targetUid: activeConversation.withUser.uid })
                    });
                    if (!res.ok) throw new Error("Failed to remove");

                    toast.success("Friend removed", { id: toastId });
                } catch (error) {
                    console.error(error);
                    toast.error("Failed to remove friend", { id: toastId });
                }
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e as unknown as React.FormEvent);
        }
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden pb-16 md:pb-0">
            {/* Left Pane: Conversations List */}
            {/* Added shrink-0 to prevent this pane from collapsing weirdly, though usually it's hidden on mobile */}
            <div className={`w-full md:w-80 lg:w-96 shrink-0 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col transition-all duration-300 ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        {onBack ? (
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-700 hover:bg-gray-200/50 rounded-full font-bold hidden md:flex" onClick={onBack}>
                                <ArrowLeft className="h-6 w-6 stroke-[3px]" />
                            </Button>
                        ) : (
                            <Link href="/home">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-700 hover:bg-gray-200/50 rounded-full font-bold hidden md:flex">
                                    <ArrowLeft className="h-6 w-6 stroke-[3px]" />
                                </Button>
                            </Link>
                        )}
                        <h1 className="font-bold text-xl md:text-2xl tracking-tight text-gray-800">Messages</h1>
                    </div>
                </div>

                {/* Using div with overflow-y-auto instead of ScrollArea for the list too if needed, but ScrollArea usually fine here */}
                {/* We'll stick to a simple div for consistency and robustness */}
                <div className="flex-1 overflow-y-auto p-2 md:p-3 scroll-smooth">
                    {loadingConvs ? (
                        <div className="p-8 text-center text-gray-400 animate-pulse">Loading...</div>
                    ) : conversations.length === 0 && !tempConversation ? (
                        <div className="p-8 text-center text-gray-400">
                            <p className="text-lg font-medium text-gray-600 mb-2">No chats yet</p>
                            <p className="text-sm">Start a conversation from your friends list!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {/* Show Temp Conversation if active and not in list yet */}
                            {tempConversation && !conversations.find(c => c.chatId === tempConversation.chatId) && (
                                <div
                                    onClick={() => router.push(`/chat?id=${tempConversation.chatId}`)}
                                    className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 group
                                        ${selectedChatId === tempConversation.chatId
                                            ? 'bg-gradient-to-r from-orange-50 to-orange-100/50 border-l-4 border-orange-500 shadow-sm'
                                            : 'hover:bg-gray-50 hover:shadow-sm border-l-4 border-transparent'
                                        }`}
                                >
                                    <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                                        <AvatarImage src={tempConversation.withUser.avatarUrl} className="object-cover" />
                                        <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">{tempConversation.withUser.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className={`font-semibold text-sm md:text-[15px] truncate ${selectedChatId === tempConversation.chatId ? 'text-orange-900' : 'text-gray-900'}`}>{tempConversation.withUser.name}</h3>
                                        </div>
                                        <p className="text-xs md:text-sm text-gray-400 italic truncate">New conversation</p>
                                    </div>
                                </div>
                            )}

                            {conversations.map(conv => (
                                <div
                                    key={conv.chatId}
                                    onClick={() => router.push(`/chat?id=${conv.chatId}`)}
                                    className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 group
                                        ${selectedChatId === conv.chatId
                                            ? 'bg-gradient-to-r from-orange-50 to-orange-100/50 border-l-4 border-orange-500 shadow-sm'
                                            : 'hover:bg-gray-50 hover:shadow-sm border-l-4 border-transparent'
                                        }`}
                                >
                                    <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                                        <AvatarImage src={conv.withUser.avatarUrl} className="object-cover" />
                                        <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">{conv.withUser.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className={`font-semibold text-sm md:text-[15px] truncate ${selectedChatId === conv.chatId ? 'text-orange-900' : 'text-gray-900'}`}>{conv.withUser.name}</h3>
                                            {conv.unreadCount > 0 && (
                                                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] text-center">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs md:text-sm truncate ${selectedChatId === conv.chatId ? 'text-orange-700/70' : 'text-gray-500'}`}>
                                            {conv.lastMessage.senderId === user?.uid ? 'You: ' : ''}
                                            {conv.lastMessage.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Pane: Chat Window */}
            {/* Added h-full and flex-1 to ensure it takes up space, and overflow-hidden to contain inner scrolls */}
            <div className={`flex-1 flex flex-col bg-white relative h-full overflow-hidden ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                {selectedChatId && activeConversation ? (
                    <>
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                            }}
                        />

                        {/* Chat Header */}
                        {/* Added shrink-0. This prevents header from collapsing when content grows/keyboard opens */}
                        <div className="h-16 md:h-20 shrink-0 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                            <div className="flex items-center gap-3">
                                {/* Back Button inside Chat Header for Mobile - Made more visible */}
                                <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-gray-800 hover:bg-gray-100 rounded-full" onClick={() => router.push('/chat')}>
                                    <ArrowLeft className="h-6 w-6 stroke-[3px]" />
                                </Button>
                                <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-gray-50">
                                    <AvatarImage src={activeConversation.withUser.avatarUrl} />
                                    <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">{activeConversation.withUser.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="font-bold text-gray-900 text-base md:text-lg leading-tight">{activeConversation.withUser.name}</h2>
                                    {/* Updated: Removed Online Status */}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors rounded-full">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-white border border-gray-100 shadow-xl rounded-xl p-1.5 w-48 z-[120]">
                                        <DropdownMenuItem onClick={handleRemoveFriend} className="text-gray-600">
                                            <UserMinus className="mr-2 h-4 w-4" />
                                            Remove Friend
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleBlockUser} className="text-gray-600">
                                            <Ban className="mr-2 h-4 w-4" />
                                            Block
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                            <Flag className="mr-2 h-4 w-4" />
                                            Report
                                        </DropdownMenuItem>

                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Messages Area */}
                        {/* REPLACED ScrollArea with div.flex-1.overflow-y-auto to fix scrolling issues */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10 w-full scroll-smooth">
                            <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto pb-4">
                                {displayedMessages.map((msg, index) => {
                                    const isMe = msg.senderId === user?.uid;
                                    const isPending = msg.id.startsWith('temp_');

                                    return (
                                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isMe ? 'items-end' : 'items-start'} ${isPending ? 'opacity-70' : ''}`}>
                                                <div
                                                    className={`px-4 py-2 md:px-5 md:py-3 shadow-sm text-sm md:text-[15px] leading-relaxed relative group
                                                        ${isMe
                                                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl rounded-tr-sm'
                                                            : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                                                        }`}
                                                >
                                                    <p>{msg.content}</p>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className={`text-[10px] px-1 font-medium ${isMe ? 'text-gray-400' : 'text-gray-300'}`}>
                                                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        {/* Added shrink-0 to prevent input from being squashed */}
                        <div className="shrink-0 p-3 md:p-4 bg-white border-t border-gray-100 relative z-20">
                            {/* Emoji Picker Manual Implementation - Replaces Popover for reliability */}
                            <div className="emoji-picker-container relative max-w-4xl mx-auto">
                                {showEmojiPicker && (
                                    <div className="absolute bottom-full left-0 mb-4 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 z-50 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex gap-2">
                                            {TOP_EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setNewMessage(prev => prev + emoji);
                                                    }}
                                                    className="text-2xl hover:bg-gray-100 p-2 rounded-xl transition-colors cursor-pointer active:scale-95 transform select-none"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                        {/* Little arrow at bottom */}
                                        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
                                    </div>
                                )}
                            </div>

                            <div className="max-w-4xl mx-auto">
                                <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3 items-end">
                                    <div className="emoji-picker-container">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className={`mb-1 rounded-full transition-colors shrink-0 ${showEmojiPicker ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'}`}
                                        >
                                            <Smile className="h-6 w-6" />
                                        </Button>
                                    </div>

                                    <div className="flex-1 relative">
                                        <Input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Type a message..."
                                            className="w-full py-5 md:py-6 pr-12 rounded-2xl bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-50/50 transition-all text-sm md:text-base"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className={`h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center shrink-0
                                            ${newMessage.trim()
                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:scale-105 hover:shadow-orange-200'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <Send className="h-4 w-4 md:h-5 md:w-5 ml-0.5" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50/30 flex-col gap-6 p-8 text-center relative overflow-hidden">
                        {/* Empty State Illustration or Icon */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
                        />
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center shadow-inner mb-2 animate-pulse">
                            <Send className="w-8 h-8 md:w-10 md:h-10 text-orange-400 -ml-1 mt-1" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Your Messages</h3>
                            <p className="text-gray-500 max-w-xs mx-auto text-sm">Select a chat from the left to view your conversation or start a new one.</p>
                        </div>
                    </div>
                )}
            </div>

            {activeConversation && (
                <>
                    <ReportModal
                        isOpen={isReportModalOpen}
                        onClose={() => setIsReportModalOpen(false)}
                        targetUid={activeConversation.withUser.uid}
                        onReportSubmitted={() => {
                            toast.success("User reported");
                            router.push('/chat'); // Close chat as per requirement "chat with that person will disappear"
                        }}
                    />
                    <ConfirmModal
                        isOpen={confirmData.isOpen}
                        onClose={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
                        onConfirm={confirmData.onConfirm}
                        title={confirmData.title}
                        message={confirmData.message}
                        variant={confirmData.variant}
                    />
                </>
            )}
        </div>
    );
}
