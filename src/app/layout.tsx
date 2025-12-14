import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NetworkProvider } from "@/lib/contexts/NetworkContext";
import { UserProvider } from "@/lib/contexts/AuthContext";
import { OpponentProvider } from "@/lib/contexts/OpponentContext";
import { ChatProvider } from "@/lib/contexts/ChatContext";

import AuthGuard from "@/components/layout/AuthGuard";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/layout/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Oreo",
  description: "Connect, play, and chat with people worldwide",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // App-like feel
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NetworkProvider>
          <UserProvider>
            <AuthGuard>
              <OpponentProvider>
                <ChatProvider>
                  {children}
                  <BottomNav />
                  <Toaster />
                </ChatProvider>
              </OpponentProvider>
            </AuthGuard>
          </UserProvider>
        </NetworkProvider>
      </body>
    </html>
  );
}
