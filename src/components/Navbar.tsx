"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/lib/AdminContext";

interface NavbarProps {
    tournamentId: string;
    tournamentName: string;
}

export default function Navbar({ tournamentId, tournamentName }: NavbarProps) {
    const pathname = usePathname();
    const { isAdmin, openPinModal, logout } = useAdmin();

    const base = `/tournament/${tournamentId}`;

    const tabs = [
        { label: "Dashboard", href: base },
        { label: "Schedule", href: `${base}/schedule` },
        { label: "Analytics", href: `${base}/analytics` },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand">
                    ⚽ {tournamentName}
                </Link>
                <div className="navbar-tabs">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`navbar-tab ${pathname === tab.href ? "active" : ""}`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                    {isAdmin ? (
                        <button className="navbar-tab" onClick={logout} title="Logout admin">
                            🔓
                        </button>
                    ) : (
                        <button className="navbar-tab" onClick={openPinModal} title="Admin login">
                            🔒
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
