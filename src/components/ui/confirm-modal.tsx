"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, HelpCircle } from "lucide-react"

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
}

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
}: ConfirmModalProps) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] text-center flex flex-col items-center gap-6 py-10">
                <DialogHeader className="flex flex-col items-center gap-3 space-y-0">
                    <div className={`p-3 rounded-full ${variant === 'destructive' ? 'bg-red-100' : 'bg-orange-100'}`}>
                        {variant === 'destructive' ? (
                            <AlertTriangle className={`h-6 w-6 ${variant === 'destructive' ? 'text-red-500' : 'text-orange-500'}`} />
                        ) : (
                            <HelpCircle className="h-6 w-6 text-orange-500" />
                        )}
                    </div>
                    <DialogTitle className="text-xl font-bold">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-center text-base">
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="w-full sm:justify-center gap-2">
                    <Button variant="outline" onClick={onClose} className="min-w-[100px] rounded-full">
                        {cancelText}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        className={`min-w-[100px] rounded-full ${variant === 'default' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
