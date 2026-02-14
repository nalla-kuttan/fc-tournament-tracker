"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface AdminContextType {
    isAdmin: boolean;
    showPinModal: boolean;
    openPinModal: () => void;
    closePinModal: () => void;
    login: (pin: string, correctPin: string) => boolean;
    logout: () => void;
}

const AdminContext = createContext<AdminContextType>({
    isAdmin: false,
    showPinModal: false,
    openPinModal: () => { },
    closePinModal: () => { },
    login: () => false,
    logout: () => { },
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("fc-tracker-admin");
        if (stored === "true") setIsAdmin(true);
    }, []);

    const openPinModal = useCallback(() => setShowPinModal(true), []);
    const closePinModal = useCallback(() => setShowPinModal(false), []);

    const login = useCallback((pin: string, correctPin: string) => {
        if (pin === correctPin) {
            setIsAdmin(true);
            localStorage.setItem("fc-tracker-admin", "true");
            setShowPinModal(false);
            return true;
        }
        return false;
    }, []);

    const logout = useCallback(() => {
        setIsAdmin(false);
        localStorage.removeItem("fc-tracker-admin");
    }, []);

    return (
        <AdminContext.Provider
            value={{ isAdmin, showPinModal, openPinModal, closePinModal, login, logout }}
        >
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    return useContext(AdminContext);
}
