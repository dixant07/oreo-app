"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Settings,
    User as UserIcon,
    Bell,
    Search,
    Crown,
    UserPlus,
    MessageSquare,
    LogOut,
    CreditCard,
    Users,
    Gamepad2,
    X,
    MessageCircle // Keep existing imports
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/config/firebase';
import ChatPage from '@/app/(main)/chat/page';
import { IncomingCallDialog } from '@/components/dialogs/IncomingCallDialog';
import { ConnectionStatusDialog, ConnectionStatus } from '@/components/dialogs/ConnectionStatusDialog';
import { useConversations } from '@/lib/hooks/useChat';
import { useRouter } from 'next/navigation';
import { useNetwork } from '@/lib/contexts/NetworkContext';
import { useUser } from '@/lib/contexts/AuthContext';
import { useFriends, sendGameInvite } from '@/lib/hooks/useFriends';
import { useNotifications } from '@/lib/hooks/useNotifications';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import data from '@/app/(main)/home/data.json';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MembershipDialog } from "@/components/dialogs/MembershipDialog";
import { AlertModal } from "@/components/ui/alert-modal";

interface TopBarProps {
    mode: 'game' | 'video';
    onModeChange: (mode: 'game' | 'video') => void;
    showToggle?: boolean;
}

export function TopBar({ mode, onModeChange, showToggle = true }: TopBarProps) {
    const { user, networkManager } = useNetwork();
    const { profile } = useUser();
    const router = useRouter();

    const { friendRequests, loading: loadingNotifications } = useNotifications();
    const { friends, loading: friendsLoading } = useFriends();

    const [isPreferenceOpen, setIsPreferenceOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState(data.games[0].id);
    const [selectedRegion, setSelectedRegion] = useState(data.regions[0].id);
    const [selectedGender, setSelectedGender] = useState(data.genders[0].id);
    const [selectedLanguage, setSelectedLanguage] = useState(data.languages[0].id);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatStartWith, setChatStartWith] = useState<string | null>(null);
    const [isMembershipOpen, setIsMembershipOpen] = useState(false);

    // Incoming Call State
    const [incomingCall, setIncomingCall] = useState<{ fromUid: string; fromName: string; fromAvatar?: string } | null>(null);

    // Outgoing Call State
    const [outgoingStatus, setOutgoingStatus] = useState<ConnectionStatus>('idle');
    const [recipientInfo, setRecipientInfo] = useState<{ name: string; avatar?: string; uid: string } | null>(null);

    // Chat Badge
    const { conversations } = useConversations();
    const unreadCount = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Handle initial connection
    const handleConnect = async (friendId: string, friendName?: string, friendAvatar?: string) => {
        try {
            if (!networkManager) {
                throw new Error("Network not connected");
            }

            setRecipientInfo({ name: friendName || 'Friend', avatar: friendAvatar, uid: friendId });
            setOutgoingStatus('sending');

            // Use connectToFriend (which should exist in NetworkManager or similar functionality to initiate video call)
            // Assuming simplified flow: we just want to start a video session
            networkManager.connectToFriend(friendId);

            // Artificial delay to show "Sent" state
            setTimeout(() => {
                setOutgoingStatus((prev) => prev === 'sending' ? 'sent' : prev);
            }, 800);

        } catch (err: any) {
            console.error("Failed to send invite:", err);
            setOutgoingStatus('idle');
            setRecipientInfo(null);
            setAlertState({
                isOpen: true,
                title: "Invite Failed",
                message: err.message || "Failed to send invite",
                type: "error"
            });
        }
    };

    // Reset call state helper
    const resetCallState = () => {
        setOutgoingStatus('idle');
        setRecipientInfo(null);
        setIncomingCall(null);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleFindMatch = async () => {
        if (!networkManager) return;

        setIsPreferenceOpen(false);

        // 1. Disconnect existing connections
        if (networkManager.socket?.connected) {
            console.log("Disconnecting existing match before searching new one...");
            networkManager.skipMatch(); // Skip current match if any
            // Or explicitly:
            // networkManager.disconnect(); 
            // await networkManager.connect(); 
            // But usually findMatch can be called directly if we just want to queue up, 
            // however the user asked to "disconnect existing connection". 
            // skipMatch() effectively ends the current WEBRTC session. 
        }

        const preferences = {
            mode,
            game: mode === 'game' ? selectedGame : null,
            region: selectedRegion,
            gender: selectedGender,
            language: selectedLanguage
        };

        console.log("Finding match with preferences:", preferences);

        // 2. Connect to matchmaking server with these preferences
        networkManager.findMatch(preferences);
    };

    React.useEffect(() => {
        if (!networkManager) return;

        const handleInvite = (data: any) => {
            const { fromUid, fromName, fromAvatar } = data;
            setIncomingCall({ fromUid, fromName, fromAvatar });
        };

        const handleMatchFound = () => {
            // If we are showing outgoing dialog, update it
            if (outgoingStatus === 'sent' || outgoingStatus === 'sending') {
                setOutgoingStatus('accepted');
                // Wait a bit before navigating to let user see "Accepted"
                setTimeout(() => {
                    router.push('/video/chat');
                    resetCallState();
                }, 1000);
            } else if (incomingCall) {
                // For receiver, if match found, it means connection established
                router.push('/video/chat');
                resetCallState();
            }
        };

        const handleRejected = (data: any) => {
            // If we are sender
            setOutgoingStatus('rejected');
            setTimeout(() => {
                resetCallState();
            }, 2000);
        };

        const handleError = (data: any) => {
            setOutgoingStatus('error');
            setTimeout(() => resetCallState(), 2000);
        };

        const handleCancelled = (data: any) => {
            // If we are receiver, close the dialog
            if (incomingCall) {
                setIncomingCall(null);
            }
        };

        const cleanupInvite = networkManager.on('receive_invite', handleInvite);
        const cleanupMatch = networkManager.on('match_found', handleMatchFound);
        const cleanupRejected = networkManager.on('invite_rejected', handleRejected);
        const cleanupError = networkManager.on('invite_error', handleError);
        const cleanupCancelled = networkManager.on('invite_cancelled', handleCancelled);

        return () => {
            cleanupInvite();
            cleanupMatch();
            cleanupRejected();
            cleanupError();
            cleanupCancelled();
        };
    }, [networkManager, router, outgoingStatus, incomingCall]);

    const handleChat = (friendId: string) => {
        setChatStartWith(friendId);
        setIsChatOpen(true);
    };

    return (
        <>
            <header className="sticky top-0 z-50 hidden md:flex h-16 w-full items-center justify-between px-6 border-b border-gray-200 bg-white/80 backdrop-blur-md">
                {/* Left: Logo */}
                <Link href="/home">
                    <div className="bg-orange-500 text-black font-bold text-lg px-5 py-1.5 rounded-full shadow-md hover:opacity-90 transition-opacity cursor-pointer">
                        Rumi
                    </div>
                </Link>

                {/* Middle: Toggle & Preference */}
                {showToggle && (
                    <div className="order-3 w-full flex justify-center mt-2 md:mt-0 md:w-auto md:order-none md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 items-center gap-2">
                        <div className="bg-white p-1 rounded-full flex shadow-sm border border-gray-100">
                            <button
                                onClick={() => onModeChange('game')}
                                className={`px-6 py-1.5 rounded-full text-sm font-bold transition-all ${mode === 'game' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Game
                            </button>
                            <button
                                onClick={() => onModeChange('video')}
                                className={`px-6 py-1.5 rounded-full text-sm font-bold transition-all ${mode === 'video' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Video
                            </button>
                        </div>

                        <Dialog open={isPreferenceOpen} onOpenChange={setIsPreferenceOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="bg-white hover:bg-gray-50 text-black font-bold rounded-full px-3 py-1.5 h-auto shadow-sm border border-gray-100 gap-1.5">
                                    <Settings className="w-4 h-4" />
                                    <span>Preference</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle>Match Preferences</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    {mode === 'game' && (
                                        <div className="space-y-2">
                                            <Label>Game</Label>
                                            <Select value={selectedGame} onValueChange={setSelectedGame}>
                                                <SelectTrigger><SelectValue placeholder="Select Game" /></SelectTrigger>
                                                <SelectContent>
                                                    {data.games.map(g => (
                                                        <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label>Gender</Label>
                                        <Select value={selectedGender} onValueChange={setSelectedGender}>
                                            <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                                            <SelectContent>
                                                {data.genders.map(g => (
                                                    <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Region</Label>
                                        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                            <SelectTrigger><SelectValue placeholder="Select Region" /></SelectTrigger>
                                            <SelectContent>
                                                {data.regions.map(r => (
                                                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Language</Label>
                                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                            <SelectTrigger><SelectValue placeholder="Select Language" /></SelectTrigger>
                                            <SelectContent>
                                                {data.languages.map(l => (
                                                    <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter className="sm:justify-center">
                                    <Button
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl py-6"
                                        onClick={handleFindMatch}
                                    >
                                        Find
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {/* Right: User Panel */}
                <div className="flex items-center gap-2 ml-auto">
                    {/* Tier Badge - Clickable to open membership dialog */}
                    <button
                        onClick={() => setIsMembershipOpen(true)}
                        className="bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-yellow-200 hover:shadow-md transition-all cursor-pointer"
                    >
                        <Crown className="w-4 h-4 text-yellow-600 fill-current" />
                        {profile?.subscription?.tier?.toUpperCase() || 'FREE'}
                    </button>

                    {/* Chats Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:bg-orange-50 rounded-full relative"
                        onClick={() => {
                            setChatStartWith(null);
                            setIsChatOpen(true);
                        }}
                    >
                        <MessageSquare className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                        )}
                    </Button>

                    {/* Friends List */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-orange-50 rounded-full relative">
                                <Users className="w-6 h-6" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4 rounded-2xl shadow-xl border-0">
                            <h3 className="font-bold text-gray-900 mb-3">Online Friends</h3>
                            <div className="space-y-2">
                                {friendsLoading ? (
                                    <p className="text-sm text-gray-500 text-center py-2">Loading...</p>
                                ) : friends.filter(f => f.isOnline).length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-2">No friends online</p>
                                ) : (
                                    friends
                                        .filter(f => f.isOnline)
                                        .slice(0, 3)
                                        .map(friend => (
                                            <div key={friend.uid} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full bg-green-500`} />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{friend.name}</span>
                                                        <span className="text-[10px] text-gray-400">Online</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 hover:bg-blue-50 hover:text-blue-600"
                                                        onClick={() => {
                                                            setChatStartWith(friend.uid);
                                                            setIsChatOpen(true);
                                                        }}
                                                    >
                                                        <MessageSquare className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 hover:bg-orange-50 hover:text-orange-600"
                                                        onClick={() => handleConnect(friend.uid, friend.name, friend.avatarUrl)}
                                                        disabled={outgoingStatus !== 'idle'}
                                                    >
                                                        <Gamepad2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                                <Link href="/friends" className="text-xs font-bold text-orange-500 hover:text-orange-600 hover:underline">
                                    See All
                                </Link>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Notifications */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-orange-50 rounded-full relative">
                                <Bell className="w-6 h-6" />
                                {friendRequests.length > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4 rounded-2xl shadow-xl border-0">
                            <h3 className="font-bold text-gray-900 mb-3">Notifications</h3>
                            <div className="space-y-3">
                                {loadingNotifications ? (
                                    <p className="text-sm text-center text-gray-500">Loading...</p>
                                ) : friendRequests.length === 0 ? (
                                    <p className="text-sm text-center text-gray-500">No new notifications</p>
                                ) : (
                                    friendRequests.slice(0, 3).map(req => (
                                        <div key={req.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {req.sender?.avatarUrl ? (
                                                        <img src={req.sender.avatarUrl} alt={req.sender.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <UserPlus className="w-5 h-5 text-orange-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-800">
                                                        <span className="font-bold">{req.sender?.name || 'User'}</span> sent you a friend request.
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pl-12">
                                                <Button
                                                    size="sm"
                                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 h-8 text-xs font-bold"
                                                    onClick={async () => {
                                                        try {
                                                            const token = await user?.getIdToken();
                                                            await fetch('/api/friends/accept', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    'Authorization': `Bearer ${token}`
                                                                },
                                                                body: JSON.stringify({ requestId: req.id })
                                                            });
                                                            // Optimistic update handled by snapshot listener
                                                        } catch (e) {
                                                            console.error("Accept error", e);
                                                        }
                                                    }}
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg px-4 h-8 text-xs font-bold"
                                                    onClick={async () => {
                                                        try {
                                                            const token = await user?.getIdToken();
                                                            await fetch('/api/friends/reject', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    'Authorization': `Bearer ${token}`
                                                                },
                                                                body: JSON.stringify({ requestId: req.id })
                                                            });
                                                        } catch (e) {
                                                            console.error("Reject error", e);
                                                        }
                                                    }}
                                                >
                                                    Decline
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                                <Link href="/friends" className="text-xs font-bold text-orange-500 hover:text-orange-600 hover:underline">
                                    See All
                                </Link>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center cursor-pointer border-2 border-white shadow-sm hover:ring-2 ring-orange-200 transition-all">
                                {profile?.avatarUrl || user?.photoURL ? (
                                    <img src={profile?.avatarUrl || user?.photoURL || ''} alt="User" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-orange-600 font-bold">{profile?.name?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || 'U'}</span>
                                )}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-0 shadow-xl">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{profile?.name || user?.displayName || 'User'}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{profile?.email || user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/user-profile')} className="rounded-lg cursor-pointer">
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>User Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/membership')} className="rounded-lg cursor-pointer">
                                <CreditCard className="mr-2 h-4 w-4" />
                                <span>Membership</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {isChatOpen && (
                <div className="fixed inset-0 z-[100] bg-white animate-in fade-in zoom-in duration-200">
                    <ChatPage
                        preselectedStartWith={chatStartWith}
                        onBack={() => {
                            setIsChatOpen(false);
                            setChatStartWith(null);
                        }}
                    />
                </div>
            )}

            <IncomingCallDialog
                isOpen={!!incomingCall}
                callerName={incomingCall?.fromName || 'Friend'}
                callerAvatar={incomingCall?.fromAvatar}
                onAccept={() => {
                    if (incomingCall && networkManager) {
                        networkManager.acceptConnection(incomingCall.fromUid);
                    }
                }}
                onReject={() => {
                    if (incomingCall && networkManager) {
                        networkManager.rejectConnection(incomingCall.fromUid);
                        setIncomingCall(null);
                    }
                }}
            />

            <ConnectionStatusDialog
                isOpen={outgoingStatus !== 'idle'}
                status={outgoingStatus}
                recipientName={recipientInfo?.name || 'Friend'}
                recipientAvatar={recipientInfo?.avatar}
                onCancel={() => {
                    if (recipientInfo?.uid && networkManager) {
                        networkManager.cancelInvite(recipientInfo.uid);
                    }
                    resetCallState();
                }}
            />

            <MembershipDialog
                open={isMembershipOpen}
                onOpenChange={setIsMembershipOpen}
            />

            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
        </>
    );
}
