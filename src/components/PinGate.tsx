"use client";

import React, { useState } from "react";
import { useAdmin } from "@/lib/AdminContext";

interface PinGateProps {
    correctPin: string;
}

export default function PinGate({ correctPin }: PinGateProps) {
    const { showPinModal, closePinModal, login } = useAdmin();
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);

    if (!showPinModal) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const ok = login(pin, correctPin);
        if (!ok) {
            setError(true);
            setTimeout(() => setError(false), 1500);
        }
        setPin("");
    };

    return (
        <div className="modal-overlay" onClick={closePinModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">🔐 Admin Access</div>
                <p style={{ color: "var(--text-secondary)", textAlign: "center", marginBottom: 20, fontSize: 14 }}>
                    Enter the tournament PIN to unlock editing.
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            autoFocus
                            style={{
                                textAlign: "center",
                                fontSize: 24,
                                letterSpacing: 8,
                                borderColor: error ? "var(--accent-red)" : undefined,
                            }}
                        />
                    </div>
                    {error && (
                        <p style={{ color: "var(--accent-red)", textAlign: "center", fontSize: 13, marginBottom: 12 }}>
                            Incorrect PIN. Try again.
                        </p>
                    )}
                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                        Unlock
                    </button>
                </form>
            </div>
        </div>
    );
}
