"use client";

import { useEffect } from 'react';
import { useUser } from '@/lib/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_PATHS = ['/', '/login', '/signup'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            const isPublic = PUBLIC_PATHS.includes(pathname) ||
                pathname.startsWith('/login') ||
                pathname.startsWith('/signup') ||
                pathname.startsWith('/games'); // embedded games might need public access if iframe? no they run in app context.

            if (!user && !isPublic) {
                console.log("[AuthGuard] Unauthorized access to", pathname, "- redirecting to login");
                router.push('/login');
            }
        }
    }, [user, loading, pathname, router]);

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/login') || pathname.startsWith('/signup');

    // If not authenticated and trying to access protected route, don't render children (prevent flash)
    if (!user && !isPublic) {
        return null;
    }

    return <>{children}</>;
}
