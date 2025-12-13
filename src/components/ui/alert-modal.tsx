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
import { CheckCircle2, AlertCircle, Info } from "lucide-react"

interface AlertModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    message: string
    type?: "success" | "error" | "info"
}

export const AlertModal = ({
    isOpen,
    onClose,
    title,
    message,
    type = "info",
}: AlertModalProps) => {
    const getIcon = () => {
        switch (type) {
            case "success":
                return <CheckCircle2 className="h-6 w-6 text-green-500" />
            case "error":
                return <AlertCircle className="h-6 w-6 text-red-500" />
            default:
                return <Info className="h-6 w-6 text-blue-500" />
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] text-center flex flex-col items-center gap-6 py-10">
                <DialogHeader className="flex flex-col items-center gap-3 space-y-0">
                    <div className={`p-3 rounded-full ${type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        {getIcon()}
                    </div>
                    <DialogTitle className="text-xl font-bold">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-center text-base">
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="w-full sm:justify-center">
                    <Button onClick={onClose} className="min-w-[120px] rounded-full font-semibold">
                        Okay
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
