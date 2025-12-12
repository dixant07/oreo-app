"use client";

import { useEffect } from "react";
import { useNetwork } from "@/lib/contexts/NetworkContext";

export default function VideoLayout({ children }: { children: React.ReactNode }) {
    const { networkManager } = useNetwork();

    useEffect(() => {
        return () => {
            // This cleanup runs only when the VideoLayout unmounts
            // (i.e., when navigating away from /video/* routes)
            if (networkManager) {
                console.log("[VideoLayout] Leaving video section, disconnecting...");
                networkManager.disconnect();
            }
        };
    }, [networkManager]);

    return <>{children}</>;
}
