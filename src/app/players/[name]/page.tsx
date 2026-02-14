"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RegisteredPlayer, Tournament } from "@/lib/types";
import { loadRegistry, syncCareerStats } from "@/lib/playerRegistry";
import { listTournaments } from "@/lib/storage";
import {
    getPlayerMatchHistory,
    getPlayerTournamentBreakdowns,
    PlayerMatchRecord,
    TournamentBreakdown,
} from "@/lib/standings";
import dynamic from "next/dynamic";

const WDLCharts = dynamic(() => import("@/components/DoughnutChart"), { ssr: false });
const RadarChart = dynamic(() => import("@/components/RadarChart"), { ssr: false });

export default function PlayerProfilePage() {
    const params = useParams();
    const playerName = decodeURIComponent(params.name as string);

    const [player, setPlayer] = useState<RegisteredPlayer | null>(null);
    const [matches, setMatches] = useState<PlayerMatchRecord[]>([]);
    const [breakdowns, setBreakdowns] = useState<TournamentBreakdown[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const tournaments = listTournaments();
        syncCareerStats(tournaments);
        const registry = loadRegistry();
        const found = registry.find(
            (p) => p.name.toLowerCase() === playerName.toLowerCase()
        );
        if (found) {
            setPlayer(found);
            setMatches(getPlayerMatchHistory(found.name, tournaments));
            setBreakdowns(getPlayerTournamentBreakdowns(found.name, tournaments));
        }
        setLoaded(true);
    }, [playerName]);

    if (!loaded) return null;

    if (!player) {
        return (
            <div className="container page">
                <div className="empty-state card">
                    <div className="empty-state-icon">❓</div>
                    <div className="empty-state-title">Player not found</div>
                    <p>No player named &ldquo;{playerName}&rdquo; in the registry.</p>
                    <Link href="/players" className="btn btn-primary" style={{ marginTop: 16 }}>
                        ← Back to Players
                    </Link>
                </div>
            </div>
        );
    }

    const c = player.career;
    const winPct = c.totalMatches > 0 ? Math.round((c.totalWins / c.totalMatches) * 100) : 0;
    const avgRtg = c.totalRatedMatches > 0 ? (c.totalRatingSum / c.totalRatedMatches).toFixed(1) : "—";
    const avgGoals = c.totalMatches > 0 ? (c.totalGoals / c.totalMatches).toFixed(1) : "0";

    // Form streak
    const form = matches.slice(-10).map((m) => m.result);
    const currentStreak = (() => {
        if (matches.length === 0) return "";
        const last = matches[matches.length - 1].result;
        let count = 0;
        for (let i = matches.length - 1; i >= 0; i--) {
            if (matches[i].result === last) count++;
            else break;
        }
        return `${count}${last}`;
    })();

    // Radar data (single player)
    const maxGoals = c.totalGoals || 1;
    const radarPlayers = [{
        playerName: player.name,
        color: "",
        goals: Math.min(100, (c.totalGoals / Math.max(maxGoals, 5)) * 100),
        cleanSheets: Math.min(100, (c.totalCleanSheets / Math.max(c.totalMatches, 1)) * 100),
        winRate: winPct,
        avgRating: ((Number(avgRtg) || 0) / 10) * 100,
        possession: matches.filter(m => m.possession !== null).length > 0
            ? Math.round(matches.filter(m => m.possession !== null).reduce((sum, m) => sum + (m.possession ?? 0), 0) / matches.filter(m => m.possession !== null).length)
            : 50,
    }];

    return (
        <div className="container page">
            <div style={{ marginBottom: 24 }}>
                <Link href="/players" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    ← Back to Players
                </Link>
            </div>

            {/* ── Hero Card ──────────────────────────────── */}
            <div className="card animate-fade-in" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 28,
                        fontWeight: 800,
                        fontFamily: "var(--font-heading)",
                        color: "#0a0f1e",
                        flexShrink: 0,
                    }}>
                        {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 150 }}>
                        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 800, marginBottom: 2 }}>
                            {player.name}
                        </h1>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                            {player.team} · {c.tournamentsPlayed.length} tournament{c.tournamentsPlayed.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                        {[
                            { label: "Matches", value: c.totalMatches, color: "var(--text-primary)" },
                            { label: "Win %", value: `${winPct}%`, color: winPct >= 50 ? "var(--accent-green)" : "var(--accent-red)" },
                            { label: "Goals", value: c.totalGoals, color: "var(--accent-cyan)" },
                            { label: "Avg Rtg", value: avgRtg, color: Number(avgRtg) >= 7 ? "var(--accent-green)" : "var(--text-primary)" },
                            { label: "MOTM", value: c.totalMotm, color: "var(--accent-gold)" },
                        ].map((stat) => (
                            <div key={stat.label} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-heading)", color: stat.color }}>
                                    {stat.value}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form guide */}
                {form.length > 0 && (
                    <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>FORM:</span>
                        {form.map((f, i) => (
                            <span
                                key={i}
                                style={{
                                    display: "inline-flex",
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 10,
                                    fontWeight: 800,
                                    color: "#fff",
                                    background:
                                        f === "W" ? "var(--accent-green)"
                                            : f === "D" ? "var(--accent-gold)"
                                                : "var(--accent-red)",
                                }}
                            >
                                {f}
                            </span>
                        ))}
                        {currentStreak && (
                            <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 8 }}>
                                Streak: <strong>{currentStreak}</strong>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* ── Charts Row ─────────────────────────────── */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card animate-fade-in" style={{ animationDelay: "0.05s" }}>
                    <div className="analytics-card-header" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
                        <span className="analytics-card-icon">🎯</span>
                        <span className="analytics-card-title">W/D/L</span>
                    </div>
                    <div style={{ padding: 16, display: "flex", justifyContent: "center" }}>
                        <div style={{ width: 140 }}>
                            <WDLCharts players={[{
                                playerName: player.name,
                                wins: c.totalWins,
                                draws: c.totalDraws,
                                losses: c.totalLosses,
                            }]} />
                        </div>
                    </div>
                </div>

                <div className="card animate-fade-in" style={{ animationDelay: "0.1s" }}>
                    <div className="analytics-card-header" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
                        <span className="analytics-card-icon">🕸️</span>
                        <span className="analytics-card-title">Performance Profile</span>
                    </div>
                    <div style={{ padding: 16 }}>
                        <RadarChart players={radarPlayers} />
                    </div>
                </div>
            </div>

            {/* ── Tournament History ──────────────────────── */}
            {breakdowns.length > 0 && (
                <div className="card animate-fade-in" style={{ marginBottom: 24, animationDelay: "0.15s" }}>
                    <div className="analytics-card-header" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
                        <span className="analytics-card-icon">🏆</span>
                        <span className="analytics-card-title">Tournament History</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table className="table" style={{ fontSize: 13 }}>
                            <thead>
                                <tr>
                                    <th>Tournament</th>
                                    <th style={{ textAlign: "center" }}>Pos</th>
                                    <th style={{ textAlign: "center" }}>P</th>
                                    <th style={{ textAlign: "center" }}>W</th>
                                    <th style={{ textAlign: "center" }}>D</th>
                                    <th style={{ textAlign: "center" }}>L</th>
                                    <th style={{ textAlign: "center" }}>GF</th>
                                    <th style={{ textAlign: "center" }}>GA</th>
                                    <th style={{ textAlign: "center" }}>Rtg</th>
                                    <th style={{ textAlign: "center" }}>⭐</th>
                                </tr>
                            </thead>
                            <tbody>
                                {breakdowns.map((bd) => (
                                    <tr key={bd.tournamentId}>
                                        <td>
                                            <Link
                                                href={`/tournament/${bd.tournamentId}`}
                                                style={{ color: "var(--accent-cyan)", fontWeight: 600, textDecoration: "none" }}
                                            >
                                                {bd.tournamentName}
                                            </Link>
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <span style={{
                                                fontWeight: 700,
                                                color: bd.position === 1 ? "var(--accent-gold)" : "var(--text-primary)",
                                            }}>
                                                {bd.position === 1 ? "🥇" : bd.position === 2 ? "🥈" : bd.position === 3 ? "🥉" : `#${bd.position}`}
                                            </span>
                                            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>/{bd.totalPlayers}</span>
                                        </td>
                                        <td style={{ textAlign: "center" }}>{bd.played}</td>
                                        <td style={{ textAlign: "center", color: "var(--accent-green)" }}>{bd.wins}</td>
                                        <td style={{ textAlign: "center", color: "var(--accent-gold)" }}>{bd.draws}</td>
                                        <td style={{ textAlign: "center", color: "var(--accent-red)" }}>{bd.losses}</td>
                                        <td style={{ textAlign: "center" }}>{bd.goals}</td>
                                        <td style={{ textAlign: "center" }}>{bd.conceded}</td>
                                        <td style={{ textAlign: "center", fontWeight: 600 }}>
                                            {bd.avgRating !== null ? bd.avgRating.toFixed(1) : "—"}
                                        </td>
                                        <td style={{ textAlign: "center", color: "var(--accent-purple)" }}>{bd.motmCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Match History ───────────────────────────── */}
            <div className="card animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <div className="analytics-card-header" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
                    <span className="analytics-card-icon">📋</span>
                    <span className="analytics-card-title">Match History ({matches.length} matches)</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table className="table" style={{ fontSize: 13 }}>
                        <thead>
                            <tr>
                                <th>Tournament</th>
                                <th>R</th>
                                <th>Opponent</th>
                                <th style={{ textAlign: "center" }}>Score</th>
                                <th style={{ textAlign: "center" }}>Result</th>
                                <th style={{ textAlign: "center" }}>Rtg</th>
                                <th style={{ textAlign: "center" }}>Poss</th>
                                <th style={{ textAlign: "center" }}>xG</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map((m, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {m.tournamentName}
                                    </td>
                                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>R{m.roundNumber}</td>
                                    <td style={{ fontWeight: 600 }}>
                                        {m.opponentName}
                                        <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>{m.opponentTeam}</span>
                                    </td>
                                    <td style={{ textAlign: "center", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                                        {m.goalsFor}–{m.goalsAgainst}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <span style={{
                                            display: "inline-flex",
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 11,
                                            fontWeight: 800,
                                            color: "#fff",
                                            background:
                                                m.result === "W" ? "var(--accent-green)"
                                                    : m.result === "D" ? "var(--accent-gold)"
                                                        : "var(--accent-red)",
                                        }}>
                                            {m.result}
                                        </span>
                                        {m.isMotm && <span style={{ marginLeft: 4 }}>⭐</span>}
                                    </td>
                                    <td style={{
                                        textAlign: "center",
                                        fontWeight: 600,
                                        color: m.rating !== null && m.rating >= 7.5 ? "var(--accent-green)" : m.rating !== null && m.rating < 6 ? "var(--accent-red)" : "var(--text-primary)",
                                    }}>
                                        {m.rating !== null ? m.rating.toFixed(1) : "—"}
                                    </td>
                                    <td style={{ textAlign: "center", fontSize: 12 }}>
                                        {m.possession !== null ? `${m.possession}%` : "—"}
                                    </td>
                                    <td style={{ textAlign: "center", fontSize: 12 }}>
                                        {m.xg !== null ? m.xg.toFixed(1) : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
