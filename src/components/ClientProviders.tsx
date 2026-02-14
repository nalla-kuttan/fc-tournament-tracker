"use client";

import { AdminProvider } from "@/lib/AdminContext";
import MusicPlayer from "@/components/MusicPlayer";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AdminProvider>
            {children}
            <MusicPlayer />
        </AdminProvider>
    );
}
