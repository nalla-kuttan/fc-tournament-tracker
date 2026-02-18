"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RegisteredPlayer } from "@/lib/types";
import { getCareerLeaderboard, getH2HStats } from "@/lib/actions/playerActions";
import dynamic from "next/dynamic";

const RadarChart = dynamic(() => import("@/components/RadarChart"), { ssr: false });
const WDLCharts = dynamic(() => import("@/components/DoughnutChart"), { ssr: false });

export default function H2HPage() {
    const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
    const [p1Name, setP1Name] = useState<string>("");
    const [p2Name, setP2Name] = useState<string>("");
    const [h2h, setH2H] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            const list = await getCareerLeaderboard();
            setPlayers(list);
            if (list.length >= 2) {
                setP1Name(list[0].name);
                setP2Name(list[1].name);
            }
        }
        load();
    }, []);

    useEffect(() => {
        if (p1Name && p2Name && p1Name !== p2Name) {
            setLoading(true);
            getH2HStats(p1Name, p2Name).then(stats => {
                setH2H(stats);
                setLoading(false);
            });
        } else {
            setH2H(null);
        }
    }, [p1Name, p2Name]);

    const player1 = players.find(p => p.name === p1Name);
    const player2 = players.find(p => p.name === p2Name);

    const getRadarData = () => {
        if (!player1 || !player2) return [];

        const normalize = (p: RegisteredPlayer) => {
            const c = p.career;
            const matches = c.totalMatches || 1;
            return {
                playerName: p.name,
                color: "#ff0000",
                goals: Math.min(100, (c.totalGoals / (matches * 3)) * 100), // ~3 goals per match is 100%
                cleanSheets: Math.min(100, (c.totalCleanSheets / matches) * 100),
                winRate: Math.round((c.totalWins / matches) * 100),
                avgRating: ((c.totalRatedMatches > 0 ? c.totalRatingSum / c.totalRatedMatches : 0) / 10) * 100,
                possession: c.totalPossessionMatches > 0 ? Math.round(c.totalPossessionSum / c.totalPossessionMatches) : 50
            };
        };

        return [normalize(player1), normalize(player2)];
    };

    return (
        <div className="container page">
            <div style={{ marginBottom: 24 }}>
                <Link href="/players" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    ← Back to Players
                </Link>
            </div>

            <div className="section-header">
                <div>
                    <h2 className="section-title">⚔️ Global H2H Comparison</h2>
                    <p className="section-subtitle">Compare career performance between two players</p>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 32, gap: 20 }}>
                <div className="card" style={{ padding: 20 }}>
                    <label className="form-label">Player 1</label>
                    <select
                        className="form-select"
                        value={p1Name}
                        onChange={(e) => setP1Name(e.target.value)}
                    >
                        <option value="">Select Player...</option>
                        {players.map(p => (
                            <option key={p.id} value={p.name} disabled={p.name === p2Name}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="card" style={{ padding: 20 }}>
                    <label className="form-label">Player 2</label>
                    <select
                        className="form-select"
                        value={p2Name}
                        onChange={(e) => setP2Name(e.target.value)}
                    >
                        <option value="">Select Player...</option>
                        {players.map(p => (
                            <option key={p.id} value={p.name} disabled={p.name === p1Name}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                    Analyzing historical data...
                </div>
            ) : h2h ? (
                <div className="animate-fade-in">
                    {/* Summary Row */}
                    <div className="card h2h-summary" style={{ marginBottom: 24, padding: "30px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                            <div style={{ textAlign: "center", flex: 1 }}>
                                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>{player1?.team}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--accent-cyan)" }}>{p1Name}</div>
                                <div style={{ fontSize: 40, fontWeight: 800, marginTop: 10 }}>{h2h.p1Wins}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>Wins</div>
                            </div>

                            <div style={{ textAlign: "center", padding: "0 20px" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>{h2h.totalMatches} MTCH</div>
                                <div style={{ height: 2, background: "var(--border-color)", width: 40, margin: "10px auto" }} />
                                <div style={{ fontSize: 18, fontWeight: 700 }}>{h2h.draws} <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Draws</span></div>
                            </div>

                            <div style={{ textAlign: "center", flex: 1 }}>
                                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>{player2?.team}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--accent-purple)" }}>{p2Name}</div>
                                <div style={{ fontSize: 40, fontWeight: 800, marginTop: 10 }}>{h2h.p2Wins}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>Wins</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: 24 }}>
                        {/* Comparison Table */}
                        <div className="card">
                            <div className="analytics-card-header" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
                                <span className="analytics-card-title">Detailed Comparison</span>
                            </div>
                            <div style={{ padding: 16 }}>
                                <table className="table" style={{ border: "none" }}>
                                    <tbody>
                                        {[
                                            { label: "Career Win %", v1: `${Math.round((player1!.career.totalWins / player1!.career.totalMatches) * 100)}%`, v2: `${Math.round((player2!.career.totalWins / player2!.career.totalMatches) * 100)}%` },
                                            { label: "Head-to-Head Goals", v1: h2h.p1Goals, v2: h2h.p2Goals },
                                            { label: "Career Avg Rating", v1: (player1!.career.totalRatingSum / Math.max(1, player1!.career.totalRatedMatches)).toFixed(1), v2: (player2!.career.totalRatingSum / Math.max(1, player2!.career.totalRatedMatches)).toFixed(1) },
                                            { label: "MOTM Awards", v1: player1!.career.totalMotm, v2: player2!.career.totalMotm },
                                            { label: "Avg Possession", v1: `${Math.round(player1!.career.totalPossessionSum / Math.max(1, player1!.career.totalPossessionMatches))}%`, v2: `${Math.round(player2!.career.totalPossessionSum / Math.max(1, player2!.career.totalPossessionMatches))}%` },
                                        ].map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                                <td style={{ textAlign: "left", width: "25%", color: "var(--accent-cyan)", fontWeight: 700 }}>{row.v1}</td>
                                                <td style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>{row.label}</td>
                                                <td style={{ textAlign: "right", width: "25%", color: "var(--accent-purple)", fontWeight: 700 }}>{row.v2}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Radar Chart */}
                        <div className="card">
                            <div className="analytics-card-header" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
                                <span className="analytics-card-title">Performance Shapes</span>
                            </div>
                            <div style={{ padding: 16 }}>
                                <RadarChart players={getRadarData()} />
                            </div>
                        </div>
                    </div>

                    {/* Match History Between Them */}
                    <div className="card">
                        <div className="analytics-card-header" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
                            <span className="analytics-card-title">Direct Encounters</span>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Tournament</th>
                                        <th style={{ textAlign: "right" }}>{p1Name}</th>
                                        <th style={{ textAlign: "center" }}>Score</th>
                                        <th style={{ textAlign: "left" }}>{p2Name}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {h2h.history.map((m: any) => (
                                        <tr key={m.id}>
                                            <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(m.date).toLocaleDateString()}</td>
                                            <td style={{ fontSize: 13, fontWeight: 600 }}>{m.tournamentName}</td>
                                            <td style={{ textAlign: "right", color: m.p1Score > m.p2Score ? "var(--accent-green)" : "var(--text-primary)" }}>{m.p1Score}</td>
                                            <td style={{ textAlign: "center", fontWeight: 800 }}>–</td>
                                            <td style={{ textAlign: "left", color: m.p2Score > m.p1Score ? "var(--accent-green)" : "var(--text-primary)" }}>{m.p2Score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: 60, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⚔️</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Select two players to compare</div>
                    <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>Choose from the registry above to see their career rivalry.</p>
                </div>
            )}
        </div>
    );
}
