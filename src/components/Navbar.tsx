"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/lib/AdminContext";

interface NavbarProps {
    tournamentId: string;
    tournamentName: string;
    onRename?: (newName: string) => void;
}

export default function Navbar({ tournamentId, tournamentName, onRename }: NavbarProps) {
    const pathname = usePathname();
    const { isAdmin, openPinModal, logout } = useAdmin();
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(tournamentName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTempName(tournamentName);
    }, [tournamentName]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (tempName.trim() && tempName !== tournamentName && onRename) {
            onRename(tempName);
        } else {
            setTempName(tournamentName); // Revert if empty or unchanged
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setTempName(tournamentName);
            setIsEditing(false);
        }
    };

    const base = `/tournament/${tournamentId}`;

    const tabs = [
        { label: "Dashboard", href: base },
        { label: "Schedule", href: `${base}/schedule` },
        { label: "Analytics", href: `${base}/analytics` },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <div className="navbar-brand-container" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Link href="/" style={{ textDecoration: "none", fontSize: 20 }}>
                        ⚽
                    </Link>
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            style={{
                                background: "rgba(255,255,255,0.1)",
                                border: "1px solid var(--accent-blue)",
                                borderRadius: 4,
                                color: "white",
                                padding: "4px 8px",
                                fontSize: 18,
                                fontWeight: 700,
                                outline: "none",
                                width: 200
                            }}
                        />
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Link href="/" className="navbar-brand" style={{ marginRight: 0 }}>
                                {tournamentName}
                            </Link>
                            {isAdmin && onRename && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "var(--text-muted)",
                                        fontSize: 14,
                                        padding: 4,
                                        opacity: 0.7
                                    }}
                                    title="Edit Name"
                                >
                                    ✏️
                                </button>
                            )}
                        </div>
                    )}
                </div>

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
