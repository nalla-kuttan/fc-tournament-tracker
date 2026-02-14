"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Tournament } from "@/lib/types";
import { listTournaments } from "@/lib/storage";
import { loadRegistry, syncCareerStats, getCareerLeaderboard } from "@/lib/playerRegistry";
import {
    computeStandings,
    getGoldenBoot,
    getGoldenGlove,
    getMvpLeaderboard,
    getWinRates,
    getAvgGoals,
    getBiggestWins,
    getH2HMatrix,
    getPossessionKings,
} from "@/lib/standings";
import dynamic from "next/dynamic";

const RadarChart = dynamic(() => import("@/components/RadarChart"), { ssr: false });
const WDLCharts = dynamic(() => import("@/components/DoughnutChart"), { ssr: false });

export default function GlobalAnalyticsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const ts = listTournaments();
        syncCareerStats(ts);
        setTournaments(ts);
        setLoaded(true);
    }, []);

    if (!loaded) return null;

    // Merge all players & matches across tournaments into a unified view
    // We need a unique player list (by name, merging across tournaments)
    const playerMap = new Map<string, { id: string; name: string; team: string }>();
    const allMatches: Tournament["matches"] = [];

    for (const t of tournaments) {
        for (const p of t.players) {
            if (!playerMap.has(p.name.toLowerCase())) {
                playerMap.set(p.name.toLowerCase(), { id: p.id, name: p.name, team: p.team });
            }
        }
        allMatches.push(...t.matches);
    }

    // For per-tournament analytics with consistent IDs, we need to use the career registry instead
    const registry = getCareerLeaderboard();

    // Aggregate per-player stats from the registry for charts
    const hasData = registry.length > 0 && registry.some(p => p.career.totalMatches > 0);

    if (!hasData) {
        return (
            <div className="container page">
                <div style={{ marginBottom: 24 }}>
                    <Link href="/players" style={{ fontSize: 14, color: "var(--text-secondary)" }}>← Back to Players</Link>
                </div>
                <div className="empty-state card">
                    <div className="empty-state-icon">📊</div>
                    <div className="empty-state-title">No data yet</div>
                    <p>Play some matches to see global analytics.</p>
                </div>
            </div>
        );
    }

    // Build per-tournament Golden Boot and Biggest Wins
    const allTimeBoot: { playerName: string; team: string; goals: number }[] = registry.map(p => ({
        playerName: p.name,
        team: p.team,
        goals: p.career.totalGoals,
    })).sort((a, b) => b.goals - a.goals);

    const allTimeMvp: { playerName: string; team: string; avgRating: number; motm: number; matches: number }[] = registry
        .filter(p => p.career.totalRatedMatches > 0)
        .map(p => ({
            playerName: p.name,
            team: p.team,
            avgRating: p.career.totalRatingSum / p.career.totalRatedMatches,
            motm: p.career.totalMotm,
            matches: p.career.totalRatedMatches,
        }))
        .sort((a, b) => b.avgRating - a.avgRating);

    // Radar data from career stats
    const maxGoals = Math.max(...registry.map(p => p.career.totalGoals), 1);
    const maxCS = Math.max(...registry.map(p => p.career.totalCleanSheets), 1);

    const radarPlayers = registry.map(p => {
        const wr = p.career.totalMatches > 0 ? Math.round((p.career.totalWins / p.career.totalMatches) * 100) : 0;
        const avgRtg = p.career.totalRatedMatches > 0 ? (p.career.totalRatingSum / p.career.totalRatedMatches) : 0;
        return {
            playerName: p.name,
            color: "",
            goals: (p.career.totalGoals / maxGoals) * 100,
            cleanSheets: (p.career.totalCleanSheets / Math.max(maxCS, 1)) * 100,
            winRate: wr,
            avgRating: (avgRtg / 10) * 100,
            possession: 50, // not tracked globally, use 50 as baseline
        };
    });

    // WDL for all players
    const wdlPlayers = registry.map(p => ({
        playerName: p.name,
        wins: p.career.totalWins,
        draws: p.career.totalDraws,
        losses: p.career.totalLosses,
    }));

    // Aggregate biggest wins across all tournaments
    const allBiggestWins: { homePlayerName: string; awayPlayerName: string; homeScore: number; awayScore: number; margin: number; tournament: string }[] = [];
    for (const t of tournaments) {
        const bw = getBiggestWins(t.players, t.matches);
        for (const w of bw) {
            allBiggestWins.push({ ...w, tournament: t.name });
        }
    }
    allBiggestWins.sort((a, b) => b.margin - a.margin);
    const topBiggestWins = allBiggestWins.slice(0, 5);

    // H2H across all tournaments
    // Build a merged H2H from career data
    const allPlayerNames = registry.map(p => p.name);

    return (
        <div className="container page">
            <div style={{ marginBottom: 24 }}>
                <Link href="/players" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    ← Back to Players
                </Link>
            </div>

            <div className="section-header">
                <h2 className="section-title">🌍 Global Analytics</h2>
                <p className="section-subtitle">
                    {tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""} ·{" "}
                    {registry.reduce((sum, p) => sum + p.career.totalMatches, 0) / 2} total matches
                </p>
            </div>

            {/* ═══ Hall of Fame — Title Winners ═══ */}
            {(() => {
                const completedTs = tournaments.filter(t => t.status === "completed");
                if (completedTs.length === 0) return null;

                // Compute podiums
                const podiums = completedTs.map(t => {
                    const standings = computeStandings(t.players, t.matches);
                    return {
                        name: t.name,
                        top3: standings.slice(0, 3).map((s, i) => ({
                            rank: i + 1,
                            playerName: s.playerName,
                            team: s.team,
                            pts: s.points,
                            gd: s.goalDifference,
                            gf: s.goalsFor,
                            w: s.won,
                            d: s.drawn,
                            l: s.lost,
                        })),
                    };
                });

                // Count total titles per player
                const titleCount: Record<string, number> = {};
                podiums.forEach(p => {
                    const champ = p.top3[0]?.playerName;
                    if (champ) titleCount[champ] = (titleCount[champ] || 0) + 1;
                });

                const medalEmoji = ["🥇", "🥈", "🥉"];
                const medalColors = [
                    "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                    "linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)",
                    "linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)",
                ];
                const medalGlow = [
                    "0 0 20px rgba(255,215,0,0.25)",
                    "0 0 20px rgba(192,192,192,0.15)",
                    "0 0 20px rgba(205,127,50,0.15)",
                ];

                return (
                    <div className="card animate-fade-in" style={{ marginBottom: 24 }}>
                        <div className="analytics-card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                            <span className="analytics-card-icon">🏆</span>
                            <span className="analytics-card-title">Hall of Fame</span>
                        </div>
                        <div style={{ padding: 20 }}>
                            {/* Title count summary */}
                            {Object.keys(titleCount).length > 0 && (
                                <div style={{
                                    display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20,
                                    padding: "12px 16px",
                                    background: "rgba(255,215,0,0.04)",
                                    border: "1px solid rgba(255,215,0,0.12)",
                                    borderRadius: 10,
                                }}>
                                    {Object.entries(titleCount)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([name, count]) => (
                                            <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span style={{ fontSize: 18 }}>🏆</span>
                                                <span style={{ fontWeight: 800, color: "var(--accent-gold)", fontSize: 14 }}>{name}</span>
                                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>× {count} title{count > 1 ? "s" : ""}</span>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* Season-by-season podiums */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {podiums.map((season, si) => (
                                    <div key={si} style={{
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: 12,
                                        padding: 16,
                                    }}>
                                        <div style={{
                                            fontSize: 13, fontWeight: 700,
                                            color: "var(--text-secondary)",
                                            marginBottom: 12,
                                            fontFamily: "var(--font-heading)",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}>
                                            {season.name}
                                        </div>
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            {season.top3.map((p, idx) => (
                                                <div key={idx} style={{
                                                    flex: idx === 0 ? "1.3" : "1",
                                                    minWidth: 160,
                                                    background: idx === 0
                                                        ? "rgba(255,215,0,0.06)"
                                                        : idx === 1
                                                            ? "rgba(192,192,192,0.04)"
                                                            : "rgba(205,127,50,0.04)",
                                                    border: `1px solid ${idx === 0 ? "rgba(255,215,0,0.2)" : idx === 1 ? "rgba(192,192,192,0.15)" : "rgba(205,127,50,0.12)"}`,
                                                    borderRadius: 10,
                                                    padding: "12px 14px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    boxShadow: medalGlow[idx],
                                                    transition: "transform 0.2s",
                                                }}>
                                                    <div style={{
                                                        fontSize: idx === 0 ? 28 : 22,
                                                        lineHeight: 1,
                                                        filter: idx === 0 ? "drop-shadow(0 0 6px rgba(255,215,0,0.4))" : "none",
                                                    }}>
                                                        {medalEmoji[idx]}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontWeight: 800,
                                                            fontSize: idx === 0 ? 15 : 13,
                                                            color: idx === 0 ? "var(--accent-gold)" : "var(--text-primary)",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }}>
                                                            {p.playerName}
                                                        </div>
                                                        <div style={{
                                                            fontSize: 11,
                                                            color: "var(--text-muted)",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }}>
                                                            {p.team}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <div style={{
                                                            fontWeight: 800,
                                                            fontSize: idx === 0 ? 16 : 14,
                                                            color: idx === 0 ? "var(--accent-gold)" : "var(--text-primary)",
                                                        }}>
                                                            {p.pts} pts
                                                        </div>
                                                        <div style={{
                                                            fontSize: 10,
                                                            color: p.gd > 0 ? "var(--accent-green)" : p.gd < 0 ? "var(--accent-red)" : "var(--text-muted)",
                                                        }}>
                                                            {p.gd > 0 ? "+" : ""}{p.gd} GD
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Radar */}
            <div className="card animate-fade-in" style={{ marginBottom: 24 }}>
                <div className="analytics-card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                    <span className="analytics-card-icon">🕸️</span>
                    <span className="analytics-card-title">All-Time Player Comparison</span>
                </div>
                <div style={{ padding: 20 }}>
                    <RadarChart players={radarPlayers} />
                </div>
            </div>

            {/* WDL */}
            <div className="card animate-fade-in" style={{ marginBottom: 24, animationDelay: "0.05s" }}>
                <div className="analytics-card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                    <span className="analytics-card-icon">🎯</span>
                    <span className="analytics-card-title">All-Time W / D / L</span>
                </div>
                <div style={{ padding: 20 }}>
                    <WDLCharts players={wdlPlayers} />
                </div>
            </div>

            {/* All-Time Leaderboards */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Golden Boot */}
                <div className="card analytics-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
                    <div className="analytics-card-header">
                        <span className="analytics-card-icon">👟</span>
                        <span className="analytics-card-title">All-Time Top Scorers</span>
                    </div>
                    <ul className="analytics-list">
                        {allTimeBoot.map((entry, idx) => (
                            <li className="analytics-list-item" key={entry.playerName}>
                                <span className={`analytics-rank ${idx === 0 ? "top" : ""}`}>{idx === 0 ? "🥇" : idx + 1}</span>
                                <div className="analytics-player-info">
                                    <Link href={`/players/${encodeURIComponent(entry.playerName)}`} style={{ textDecoration: "none" }}>
                                        <div className="analytics-player-name" style={{ color: "var(--accent-cyan)" }}>{entry.playerName}</div>
                                    </Link>
                                    <div className="analytics-player-team">{entry.team}</div>
                                </div>
                                <span className="analytics-stat">{entry.goals}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* MVP */}
                <div className="card analytics-card animate-fade-in" style={{ animationDelay: "0.15s" }}>
                    <div className="analytics-card-header">
                        <span className="analytics-card-icon">⭐</span>
                        <span className="analytics-card-title">All-Time MVP</span>
                    </div>
                    <ul className="analytics-list">
                        {allTimeMvp.map((entry, idx) => (
                            <li className="analytics-list-item" key={entry.playerName}>
                                <span className={`analytics-rank ${idx === 0 ? "top" : ""}`}>{idx === 0 ? "🥇" : idx + 1}</span>
                                <div className="analytics-player-info">
                                    <Link href={`/players/${encodeURIComponent(entry.playerName)}`} style={{ textDecoration: "none" }}>
                                        <div className="analytics-player-name" style={{ color: "var(--accent-cyan)" }}>{entry.playerName}</div>
                                    </Link>
                                    <div className="analytics-player-team">{entry.matches} matches · {entry.motm} MOTM</div>
                                </div>
                                <span className="analytics-stat">{entry.avgRating.toFixed(1)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Biggest Wins All-Time */}
            <div className="card analytics-card animate-fade-in" style={{ marginBottom: 24, animationDelay: "0.2s" }}>
                <div className="analytics-card-header">
                    <span className="analytics-card-icon">💥</span>
                    <span className="analytics-card-title">All-Time Biggest Wins</span>
                </div>
                <ul className="analytics-list">
                    {topBiggestWins.length === 0 ? (
                        <li className="analytics-list-item"><span style={{ color: "var(--text-muted)" }}>No results yet</span></li>
                    ) : topBiggestWins.map((entry, idx) => (
                        <li className="analytics-list-item" key={idx}>
                            <span className={`analytics-rank ${idx === 0 ? "top" : ""}`}>{idx + 1}</span>
                            <div className="analytics-player-info">
                                <div className="analytics-player-name">
                                    {entry.homePlayerName} vs {entry.awayPlayerName}
                                </div>
                                <div className="analytics-player-team">{entry.tournament}</div>
                            </div>
                            <span className="analytics-stat" style={{ fontSize: 16 }}>
                                {entry.homeScore} – {entry.awayScore}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Career Table */}
            <div className="card animate-fade-in" style={{ animationDelay: "0.25s", overflow: "auto" }}>
                <div className="analytics-card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                    <span className="analytics-card-icon">📊</span>
                    <span className="analytics-card-title">All-Time Career Stats</span>
                </div>
                <table className="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th style={{ textAlign: "center" }}>T</th>
                            <th style={{ textAlign: "center" }}>P</th>
                            <th style={{ textAlign: "center" }}>W</th>
                            <th style={{ textAlign: "center" }}>D</th>
                            <th style={{ textAlign: "center" }}>L</th>
                            <th style={{ textAlign: "center" }}>Win%</th>
                            <th style={{ textAlign: "center" }}>Goals</th>
                            <th style={{ textAlign: "center" }}>G/M</th>
                            <th style={{ textAlign: "center" }}>CS</th>
                            <th style={{ textAlign: "center" }}>MOTM</th>
                            <th style={{ textAlign: "center" }}>Rtg</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registry.map((p, idx) => {
                            const cc = p.career;
                            const wp = cc.totalMatches > 0 ? Math.round((cc.totalWins / cc.totalMatches) * 100) : 0;
                            const ar = cc.totalRatedMatches > 0 ? (cc.totalRatingSum / cc.totalRatedMatches).toFixed(1) : "—";
                            const gpm = cc.totalMatches > 0 ? (cc.totalGoals / cc.totalMatches).toFixed(1) : "0";
                            return (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: idx === 0 ? 800 : 600, color: idx === 0 ? "var(--accent-gold)" : "var(--text-secondary)" }}>
                                        {idx === 0 ? "🏆" : idx + 1}
                                    </td>
                                    <td>
                                        <Link href={`/players/${encodeURIComponent(p.name)}`} style={{ fontWeight: 700, color: "var(--accent-cyan)", textDecoration: "none" }}>
                                            {p.name}
                                        </Link>
                                        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>{p.team}</span>
                                    </td>
                                    <td style={{ textAlign: "center" }}>{cc.tournamentsPlayed.length}</td>
                                    <td style={{ textAlign: "center" }}>{cc.totalMatches}</td>
                                    <td style={{ textAlign: "center", color: "var(--accent-green)" }}>{cc.totalWins}</td>
                                    <td style={{ textAlign: "center", color: "var(--accent-gold)" }}>{cc.totalDraws}</td>
                                    <td style={{ textAlign: "center", color: "var(--accent-red)" }}>{cc.totalLosses}</td>
                                    <td style={{ textAlign: "center", fontWeight: 700 }}>{wp}%</td>
                                    <td style={{ textAlign: "center", fontWeight: 700, color: "var(--accent-cyan)" }}>{cc.totalGoals}</td>
                                    <td style={{ textAlign: "center", fontSize: 12 }}>{gpm}</td>
                                    <td style={{ textAlign: "center" }}>{cc.totalCleanSheets}</td>
                                    <td style={{ textAlign: "center", color: "var(--accent-purple)" }}>{cc.totalMotm}</td>
                                    <td style={{
                                        textAlign: "center",
                                        fontWeight: 700,
                                        color: Number(ar) >= 7.5 ? "var(--accent-green)" : Number(ar) >= 6 ? "var(--text-primary)" : "var(--accent-red)",
                                    }}>{ar}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
