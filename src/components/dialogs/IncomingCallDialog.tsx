import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { PhoneIncoming, PhoneOff, Phone } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface IncomingCallDialogProps {
    isOpen: boolean;
    callerName: string;
    callerAvatar?: string;
    onAccept: () => void;
    onReject: () => void;
}

export function IncomingCallDialog({
    isOpen,
    callerName,
    callerAvatar,
    onAccept,
    onReject
}: IncomingCallDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onReject()}>
            <DialogContent className="sm:max-w-sm border-none shadow-2xl bg-white/95 backdrop-blur-md rounded-3xl [&>button]:hidden">
                <div className="flex flex-col items-center justify-center py-6 gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-orange-100 p-4 rounded-full">
                            <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                                <AvatarImage src={callerAvatar} />
                                <AvatarFallback className="text-2xl font-bold bg-orange-500 text-white">
                                    {callerName?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full border-4 border-white shadow-md">
                            <PhoneIncoming className="w-5 h-5 animate-pulse" />
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <DialogTitle className="text-2xl font-bold text-gray-900">{callerName}</DialogTitle>
                        <DialogDescription className="text-gray-500 font-medium flex items-center justify-center gap-2">
                            Incoming Video Call...
                        </DialogDescription>
                    </div>
                </div>

                <DialogFooter className="flex gap-4 sm:justify-center w-full px-4 pb-4">
                    <Button
                        variant="destructive"
                        size="lg"
                        className="flex-1 rounded-2xl h-14 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 border-0"
                        onClick={onReject}
                    >
                        <PhoneOff className="mr-2 h-5 w-5" />
                        Decline
                    </Button>
                    <Button
                        size="lg"
                        className="flex-1 rounded-2xl h-14 bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200 border-0 text-white"
                        onClick={onAccept}
                    >
                        <Phone className="mr-2 h-5 w-5" />
                        Accept
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
