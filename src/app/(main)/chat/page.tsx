
"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useConversations, useChatMessages, Conversation } from '@/lib/hooks/useChat';
import { useNetwork } from '@/lib/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Phone, Video, MoreVertical, ArrowLeft, Smile, Loader2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { EmojiClickData, Theme } from 'emoji-picker-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

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
    const searchParams = useSearchParams();
    const initialChatId = preselectedChatId ?? searchParams.get('id');
    const startWithId = preselectedStartWith ?? searchParams.get('startWith');

    const { conversations, loading: loadingConvs } = useConversations();
    const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId);
    const [tempConversation, setTempConversation] = useState<Conversation | null>(null);

    // Pass selectedChatId to hooks
    const { messages, loading: loadingMessages } = useChatMessages(selectedChatId);

    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

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
            }
        };

        handleInit();
    }, [user, loadingConvs, initialChatId, startWithId, conversations]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, tempConversation]);

    // Determine active conversation (real or temp)
    const activeConversation = conversations.find(c => c.chatId === selectedChatId) ||
        (selectedChatId === tempConversation?.chatId ? tempConversation : null);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !user) return;

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
                    text: newMessage
                })
            });
            setNewMessage('');
            // If this was a temp conversation, the real one will come via Firestore listener and Replace it automatically
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setNewMessage((prev) => prev + emojiData.emoji);
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Left Pane: Conversations List */}
            <div className={`w-full md:w-96 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col transition-all duration-300 ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {onBack ? (
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500 hover:bg-gray-100/50 rounded-full" onClick={onBack}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        ) : (
                            <Link href="/home">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500 hover:bg-gray-100/50 rounded-full">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                        )}
                        <h1 className="font-bold text-2xl tracking-tight text-gray-800">Messages</h1>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-3">
                    {loadingConvs ? (
                        <div className="p-8 text-center text-gray-400 animate-pulse">Loading conversations...</div>
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
                                    onClick={() => setSelectedChatId(tempConversation.chatId)}
                                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 group
                                        ${selectedChatId === tempConversation.chatId
                                            ? 'bg-gradient-to-r from-orange-50 to-orange-100/50 border-l-4 border-orange-500 shadow-sm'
                                            : 'hover:bg-gray-50 hover:shadow-sm border-l-4 border-transparent'
                                        }`}
                                >
                                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                                        <AvatarImage src={tempConversation.withUser.avatarUrl} className="object-cover" />
                                        <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">{tempConversation.withUser.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className={`font-semibold text-[15px] truncate ${selectedChatId === tempConversation.chatId ? 'text-orange-900' : 'text-gray-900'}`}>{tempConversation.withUser.name}</h3>
                                        </div>
                                        <p className="text-sm text-gray-400 italic truncate">New conversation</p>
                                    </div>
                                </div>
                            )}

                            {conversations.map(conv => (
                                <div
                                    key={conv.chatId}
                                    onClick={() => setSelectedChatId(conv.chatId)}
                                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 group
                                        ${selectedChatId === conv.chatId
                                            ? 'bg-gradient-to-r from-orange-50 to-orange-100/50 border-l-4 border-orange-500 shadow-sm'
                                            : 'hover:bg-gray-50 hover:shadow-sm border-l-4 border-transparent'
                                        }`}
                                >
                                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                                        <AvatarImage src={conv.withUser.avatarUrl} className="object-cover" />
                                        <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">{conv.withUser.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className={`font-semibold text-[15px] truncate ${selectedChatId === conv.chatId ? 'text-orange-900' : 'text-gray-900'}`}>{conv.withUser.name}</h3>
                                            {conv.unreadCount > 0 && (
                                                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] text-center">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm truncate ${selectedChatId === conv.chatId ? 'text-orange-700/70' : 'text-gray-500'}`}>
                                            {conv.lastMessage.senderId === user?.uid ? 'You: ' : ''}
                                            {conv.lastMessage.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Right Pane: Chat Window */}
            <div className={`flex-1 flex flex-col bg-white relative overflow-hidden ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                {selectedChatId && activeConversation ? (
                    <>
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                            }}
                        />

                        {/* Chat Header */}
                        <div className="h-20 border-b border-gray-100 flex items-center justify-between px-6 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-gray-500" onClick={() => setSelectedChatId(null)}>
                                    <ArrowLeft className="h-6 w-6" />
                                </Button>
                                <div className="relative">
                                    <Avatar className="h-10 w-10 border-2 border-gray-50">
                                        <AvatarImage src={activeConversation.withUser.avatarUrl} />
                                        <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">{activeConversation.withUser.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900 text-lg leading-tight">{activeConversation.withUser.name}</h2>
                                    <p className="text-xs text-green-600 font-medium">Online</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors rounded-full"><Phone className="h-5 w-5" /></Button>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors rounded-full"><Video className="h-5 w-5" /></Button>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors rounded-full"><MoreVertical className="h-5 w-5" /></Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 p-6 relative z-10 w-full">
                            <div className="space-y-6 max-w-4xl mx-auto pb-4">
                                {messages.map((msg, index) => {
                                    const isMe = msg.senderId === user?.uid;

                                    return (
                                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div
                                                    className={`px-5 py-3 shadow-sm text-[15px] leading-relaxed relative group
                                                        ${isMe
                                                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl rounded-tr-sm'
                                                            : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                                                        }`}
                                                >
                                                    <p>{msg.content}</p>
                                                </div>
                                                <span className={`text-[10px] mt-1 px-1 font-medium ${isMe ? 'text-gray-400' : 'text-gray-300'}`}>
                                                    {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100 relative z-20">
                            <div className="max-w-4xl mx-auto">
                                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-orange-500 mb-1 rounded-full hover:bg-orange-50 transition-colors">
                                                <Smile className="h-6 w-6" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-none shadow-xl rounded-2xl" side="top" align="start">
                                            <EmojiPicker
                                                onEmojiClick={onEmojiClick}
                                                theme={Theme.LIGHT}
                                                searchDisabled={false}
                                                width={320}
                                                height={400}
                                                previewConfig={{ showPreview: false }}
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <div className="flex-1 relative">
                                        <Input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="w-full py-6 pr-12 rounded-2xl bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-50/50 transition-all text-base"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className={`h-12 w-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center
                                            ${newMessage.trim()
                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:scale-105 hover:shadow-orange-200'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <Send className="h-5 w-5 ml-0.5" />
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
                        <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center shadow-inner mb-2 animate-pulse">
                            <Send className="w-10 h-10 text-orange-400 -ml-1 mt-1" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Your Messages</h3>
                            <p className="text-gray-500 max-w-xs mx-auto">Select a chat from the left to view your conversation or start a new one.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
