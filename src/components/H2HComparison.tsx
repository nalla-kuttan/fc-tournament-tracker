"use client";

import React, { useState, useEffect } from "react";
import { getH2HStats } from "@/lib/actions/playerActions";
import { RegisteredPlayer } from "@/lib/types";

interface H2HComparisonProps {
    players: RegisteredPlayer[];
}

export default function H2HComparison({ players }: H2HComparisonProps) {
    const [p1, setP1] = useState<string>("");
    const [p2, setP2] = useState<string>("");
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (p1 && p2 && p1 !== p2) {
            fetchStats();
        } else {
            setStats(null);
        }
    }, [p1, p2]);

    const fetchStats = async () => {
        setLoading(true);
        const data = await getH2HStats(p1, p2);
        setStats(data);
        setLoading(false);
    };

    return (
        <div className="h2h-comparison">
            <div className="grid-2" style={{ marginBottom: 32, gap: 20 }}>
                <div className="form-group">
                    <label className="form-label">Player 1</label>
                    <select
                        className="form-select"
                        value={p1}
                        onChange={(e) => setP1(e.target.value)}
                    >
                        <option value="">Select Player...</option>
                        {players.map(p => (
                            <option key={p.id} value={p.name} disabled={p.name === p2}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Player 2</label>
                    <select
                        className="form-select"
                        value={p2}
                        onChange={(e) => setP2(e.target.value)}
                    >
                        <option value="">Select Player...</option>
                        {players.map(p => (
                            <option key={p.id} value={p.name} disabled={p.name === p1}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && <div style={{ textAlign: "center", padding: 40 }}>Loading stats...</div>}

            {stats && !loading && (
                <div className="animate-fade-in">
                    {/* Summary Cards */}
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 40,
                        marginBottom: 40,
                        padding: "20px",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "var(--radius-lg)"
                    }}>
                        <div style={{ textAlign: "center", flex: 1 }}>
                            <div style={{ fontSize: 40, fontWeight: 800, color: "var(--accent-cyan)" }}>{stats.p1Wins}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{stats.p1} Wins</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 24, fontWeight: 600, color: "var(--text-muted)" }}>{stats.draws}</div>
                            <div style={{ fontSize: 12, textTransform: "uppercase" }}>Draws</div>
                        </div>
                        <div style={{ textAlign: "center", flex: 1 }}>
                            <div style={{ fontSize: 40, fontWeight: 800, color: "var(--accent-purple)" }}>{stats.p2Wins}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{stats.p2} Wins</div>
                        </div>
                    </div>

                    <div className="grid-2" style={{ gap: 30 }}>
                        {/* Goal Stats */}
                        <div className="card">
                            <h3 style={{ fontSize: 16, marginBottom: 20 }}>Goals Scored</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                                <div style={{ width: "100%", height: 12, background: "rgba(255,255,255,0.05)", borderRadius: 6, overflow: "hidden", display: "flex" }}>
                                    <div style={{
                                        width: `${(stats.p1Goals / (stats.p1Goals + stats.p2Goals || 1)) * 100}%`,
                                        background: "var(--accent-cyan)"
                                    }} />
                                    <div style={{
                                        width: `${(stats.p2Goals / (stats.p1Goals + stats.p2Goals || 1)) * 100}%`,
                                        background: "var(--accent-purple)"
                                    }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                                    <span>{stats.p1}: <strong>{stats.p1Goals}</strong></span>
                                    <span>{stats.p2}: <strong>{stats.p2Goals}</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* Match History */}
                        <div className="card">
                            <h3 style={{ fontSize: 16, marginBottom: 20 }}>Match History</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto" }}>
                                {stats.history.map((m: any) => (
                                    <div key={m.id} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "8px 12px",
                                        background: "rgba(255,255,255,0.02)",
                                        borderRadius: 4,
                                        fontSize: 12
                                    }}>
                                        <span style={{ color: "var(--text-muted)" }}>{m.tournamentName}</span>
                                        <span style={{ fontWeight: 700 }}>{m.p1Score} - {m.p2Score}</span>
                                    </div>
                                ))}
                                {stats.history.length === 0 && <div style={{ color: "var(--text-muted)", textAlign: "center" }}>No shared history found.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
