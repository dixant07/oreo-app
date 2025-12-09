import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Loader2, X, CheckCircle2, XCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from "@/components/ui/progress";

export type ConnectionStatus = 'idle' | 'sending' | 'sent' | 'accepted' | 'rejected' | 'error';

interface ConnectionStatusDialogProps {
    isOpen: boolean;
    status: ConnectionStatus;
    recipientName: string;
    recipientAvatar?: string;
    onCancel: () => void;
}

export function ConnectionStatusDialog({
    isOpen,
    status,
    recipientName,
    recipientAvatar,
    onCancel
}: ConnectionStatusDialogProps) {
    const [progress, setProgress] = useState(0);

    // Simulate progress for visual feedback
    useEffect(() => {
        if (!isOpen) {
            setProgress(0);
            return;
        }

        if (status === 'sending') {
            setProgress(30);
        } else if (status === 'sent') {
            setProgress(60);
        } else if (status === 'accepted') {
            setProgress(100);
        } else if (status === 'rejected') {
            setProgress(100);
        }
    }, [status, isOpen]);

    const getStatusContent = () => {
        switch (status) {
            case 'sending':
            case 'sent':
                return {
                    title: `Calling ${recipientName}...`,
                    desc: status === 'sending' ? 'Establishing connection...' : 'Waiting for response...',
                    icon: <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />,
                    color: 'text-orange-600'
                };
            case 'accepted':
                return {
                    title: 'Connected!',
                    desc: 'Starting video session...',
                    icon: <CheckCircle2 className="h-12 w-12 text-green-500 animate-in zoom-in" />,
                    color: 'text-green-600'
                };
            case 'rejected':
                return {
                    title: 'Declined',
                    desc: `${recipientName} is busy or declined.`,
                    icon: <XCircle className="h-12 w-12 text-red-500 animate-in zoom-in" />,
                    color: 'text-red-600'
                };
            case 'error':
                return {
                    title: 'Connection Failed',
                    desc: 'Something went wrong.',
                    icon: <XCircle className="h-12 w-12 text-red-500" />,
                    color: 'text-red-600'
                };
            default:
                return {
                    title: 'Connecting...',
                    desc: 'Please wait',
                    icon: <Loader2 className="h-12 w-12 text-gray-400" />,
                    color: 'text-gray-600'
                };
        }
    };

    const content = getStatusContent();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && status !== 'accepted' && onCancel()}>
            <DialogContent className="sm:max-w-sm border-none shadow-2xl bg-white/95 backdrop-blur-md rounded-3xl [&>button]:hidden">
                <div className="flex flex-col items-center justify-center py-6 gap-6">
                    <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                            <AvatarImage src={recipientAvatar} />
                            <AvatarFallback className="text-2xl font-bold bg-gray-100 text-gray-500">
                                {recipientName?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {(status === 'sending' || status === 'sent') && (
                            <span className="absolute -bottom-1 -right-1 flex h-6 w-6">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-6 w-6 bg-orange-500"></span>
                            </span>
                        )}
                    </div>

                    <div className="text-center space-y-2 w-full px-4">
                        <div className="flex flex-col items-center gap-2">
                            {content.icon}
                            <DialogTitle className="text-xl font-bold text-gray-900">{content.title}</DialogTitle>
                        </div>
                        <DialogDescription className="text-gray-500 font-medium">
                            {content.desc}
                        </DialogDescription>

                        {(status === 'sending' || status === 'sent') && (
                            <Progress value={progress} className="h-2 mt-4 bg-gray-100" indicatorClassName="bg-orange-500" />
                        )}
                    </div>
                </div>

                {/* Hide cancel button if accepted (transitioning) */}
                {status !== 'accepted' && (
                    <div className="flex justify-center pb-4">
                        <Button
                            variant="ghost"
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full h-12 w-12 p-0"
                            onClick={onCancel}
                            title="Cancel Call"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
