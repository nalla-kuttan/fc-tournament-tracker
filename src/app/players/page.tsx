"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RegisteredPlayer } from "@/lib/types";
import { getCareerLeaderboard, syncCareerStats } from "@/lib/playerRegistry";
import { listTournaments } from "@/lib/storage";

export default function PlayersPage() {
    const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function init() {
            const ts = await listTournaments();
            await syncCareerStats(ts);
            const leaderboard = await getCareerLeaderboard();
            setPlayers(leaderboard);
            setLoaded(true);
        }
        init();
    }, []);

    if (!loaded) return null;

    return (
        <div className="container page">
            <div style={{ marginBottom: 24 }}>
                <Link href="/" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    ← Back to Home
                </Link>
            </div>

            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 className="section-title">👤 Player Registry</h2>
                    <p className="section-subtitle">Career stats across all tournaments</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <Link
                        href="/analytics/h2h"
                        className="btn btn-secondary"
                        style={{ fontSize: 13, padding: "8px 18px", textDecoration: "none" }}
                    >
                        ⚔️ H2H Comparison
                    </Link>
                    <Link
                        href="/players/analytics"
                        className="btn btn-primary"
                        style={{ fontSize: 13, padding: "8px 18px", textDecoration: "none" }}
                    >
                        🌍 Global Analytics
                    </Link>
                </div>
            </div>

            {players.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-state-icon">👤</div>
                    <div className="empty-state-title">No players yet</div>
                    <p>Players are automatically registered when you create a tournament.</p>
                </div>
            ) : (
                <div className="card animate-fade-in" style={{ overflow: "auto" }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Player</th>
                                <th>Team</th>
                                <th style={{ textAlign: "center" }}>T</th>
                                <th style={{ textAlign: "center" }}>P</th>
                                <th style={{ textAlign: "center" }}>W</th>
                                <th style={{ textAlign: "center" }}>D</th>
                                <th style={{ textAlign: "center" }}>L</th>
                                <th style={{ textAlign: "center" }}>Win%</th>
                                <th style={{ textAlign: "center" }}>Goals</th>
                                <th style={{ textAlign: "center" }}>CS</th>
                                <th style={{ textAlign: "center" }}>MOTM</th>
                                <th style={{ textAlign: "center" }}>Avg Rtg</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((p, idx) => {
                                const c = p.career;
                                const winPct = c.totalMatches > 0 ? Math.round((c.totalWins / c.totalMatches) * 100) : 0;
                                const avgRtg = c.totalRatedMatches > 0 ? (c.totalRatingSum / c.totalRatedMatches).toFixed(1) : "—";

                                return (
                                    <tr key={p.id} style={{ cursor: "pointer" }}>
                                        <td>
                                            <span
                                                style={{
                                                    fontWeight: idx === 0 ? 800 : 600,
                                                    color: idx === 0 ? "var(--accent-gold)" : "var(--text-secondary)",
                                                }}
                                            >
                                                {idx === 0 ? "🏆" : idx + 1}
                                            </span>
                                        </td>
                                        <td>
                                            <Link
                                                href={`/players/${encodeURIComponent(p.name)}`}
                                                style={{ fontWeight: 700, color: "var(--accent-cyan)", textDecoration: "none" }}
                                            >
                                                {p.name}
                                            </Link>
                                        </td>
                                        <td style={{ color: "var(--text-secondary)" }}>{p.team}</td>
                                        <td style={{ textAlign: "center" }}>{c.tournamentsPlayed.length}</td>
                                        <td style={{ textAlign: "center" }}>{c.totalMatches}</td>
                                        <td style={{ textAlign: "center", color: "var(--accent-green)" }}>{c.totalWins}</td>
                                        <td style={{ textAlign: "center", color: "var(--accent-gold)" }}>{c.totalDraws}</td>
                                        <td style={{ textAlign: "center", color: "var(--accent-red)" }}>{c.totalLosses}</td>
                                        <td style={{ textAlign: "center", fontWeight: 700 }}>{winPct}%</td>
                                        <td style={{ textAlign: "center", fontWeight: 700, color: "var(--accent-cyan)" }}>{c.totalGoals}</td>
                                        <td style={{ textAlign: "center" }}>{c.totalCleanSheets}</td>
                                        <td style={{ textAlign: "center", color: "var(--accent-purple)" }}>{c.totalMotm}</td>
                                        <td
                                            style={{
                                                textAlign: "center",
                                                fontWeight: 700,
                                                color: Number(avgRtg) >= 7.5 ? "var(--accent-green)" : Number(avgRtg) >= 6 ? "var(--text-primary)" : "var(--accent-red)",
                                            }}
                                        >
                                            {avgRtg}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
