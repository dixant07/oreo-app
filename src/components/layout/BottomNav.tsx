"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, MessageSquare, Users, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function BottomNav() {
    const pathname = usePathname();

    if (pathname?.includes('/video/')) {
        return null;
    }

    const navItems = [
        {
            label: "Home",
            href: "/home",
            icon: Home,
            isActive: (path: string) => path === "/home",
        },

        {
            label: "Chat",
            href: "/chat",
            icon: MessageSquare,
            isActive: (path: string) => path.startsWith("/chat"),
        },
        {
            label: "Friends",
            href: "/friends", // Placeholder for now, user will specify content later
            icon: Users,
            isActive: (path: string) => path === "/friends",
        },
        {
            label: "Profile",
            href: "/user-profile",
            icon: User,
            isActive: (path: string) => path === "/user-profile",
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 md:hidden safe-area-bottom">
            {navItems.map((item) => {
                const active = item.isActive(pathname || "");
                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full gap-1",
                            active ? "text-orange-500" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <item.icon className={cn("w-6 h-6", active && "fill-current")} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
