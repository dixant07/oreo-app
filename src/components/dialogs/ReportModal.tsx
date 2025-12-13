import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { auth } from "@/lib/config/firebase";
import { AlertModal } from "@/components/ui/alert-modal";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUid: string;
    onReportSubmitted: () => void;
}

const REPORT_TYPES = ["Nudity", "Verbal Abuse", "Fraud", "Spam", "Crime"];

export function ReportModal({ isOpen, onClose, targetUid, onReportSubmitted }: ReportModalProps) {
    const [selectedType, setSelectedType] = useState<string>("");
    const [loading, setLoading] = useState(false);
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

    const handleSubmit = async () => {
        if (!selectedType) return;
        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");
            const token = await user.getIdToken();

            const res = await fetch('/api/user/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    targetUid,
                    type: selectedType
                })
            });

            if (!res.ok) throw new Error("Failed to submit report");

            onReportSubmitted();
            onClose();
        } catch (error) {
            console.error("Report error:", error);
            setAlertState({
                isOpen: true,
                title: "Report Failed",
                message: "Failed to submit report. Please try again.",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Report User</DialogTitle>
                        <DialogDescription>
                            Please select the reason for reporting this user. This will disconnect your current session.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <RadioGroup onValueChange={setSelectedType} className="grid gap-2">
                            {REPORT_TYPES.map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                    <RadioGroupItem value={type} id={type} />
                                    <Label htmlFor={type}>{type}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={!selectedType || loading} variant="destructive">
                            {loading ? "Submitting..." : "Report & Disconnect"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
