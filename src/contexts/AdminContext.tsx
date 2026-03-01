'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AdminContextType {
  verifiedTournaments: Set<string>;
  verifyPin: (tournamentId: string, pin: string) => Promise<boolean>;
  isAdmin: (tournamentId: string) => boolean;
  logout: (tournamentId: string) => void;
  getPinForTournament: (tournamentId: string) => string | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [verifiedTournaments, setVerifiedTournaments] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('admin_verified');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });

  const [pinCache, setPinCache] = useState<Map<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('admin_pins');
      return stored ? new Map(JSON.parse(stored)) : new Map();
    }
    return new Map();
  });

  const verifyPin = useCallback(async (tournamentId: string, pin: string): Promise<boolean> => {
    const res = await fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId, pin }),
    });
    const data = await res.json();

    if (data.success) {
      setVerifiedTournaments((prev) => {
        const next = new Set(prev);
        next.add(tournamentId);
        sessionStorage.setItem('admin_verified', JSON.stringify([...next]));
        return next;
      });
      setPinCache((prev) => {
        const next = new Map(prev);
        next.set(tournamentId, pin);
        sessionStorage.setItem('admin_pins', JSON.stringify([...next]));
        return next;
      });
      return true;
    }
    return false;
  }, []);

  const isAdmin = useCallback(
    (tournamentId: string) => verifiedTournaments.has(tournamentId),
    [verifiedTournaments]
  );

  const logout = useCallback((tournamentId: string) => {
    setVerifiedTournaments((prev) => {
      const next = new Set(prev);
      next.delete(tournamentId);
      sessionStorage.setItem('admin_verified', JSON.stringify([...next]));
      return next;
    });
    setPinCache((prev) => {
      const next = new Map(prev);
      next.delete(tournamentId);
      sessionStorage.setItem('admin_pins', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const getPinForTournament = useCallback(
    (tournamentId: string) => pinCache.get(tournamentId) ?? null,
    [pinCache]
  );

  return (
    <AdminContext.Provider value={{ verifiedTournaments, verifyPin, isAdmin, logout, getPinForTournament }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
