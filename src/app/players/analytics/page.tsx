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
    getGlobalH2H,
    getGlobalRecentMatches,
} from "@/lib/standings";
import dynamic from "next/dynamic";

const RadarChart = dynamic(() => import("@/components/RadarChart"), { ssr: false });
const WDLCharts = dynamic(() => import("@/components/DoughnutChart"), { ssr: false });

export default function GlobalAnalyticsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [registry, setRegistry] = useState<any[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function init() {
            const ts = await listTournaments();
            await syncCareerStats(ts);
            const reg = await getCareerLeaderboard();
            setTournaments(ts);
            setRegistry(reg);
            setLoaded(true);
        }
        init();
    }, []);

    if (!loaded) return null;

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
        const avgPoss = p.career.totalPossessionMatches > 0 ? Math.round(p.career.totalPossessionSum / p.career.totalPossessionMatches) : 50;
        return {
            playerName: p.name,
            color: "",
            goals: (p.career.totalGoals / maxGoals) * 100,
            cleanSheets: (p.career.totalCleanSheets / Math.max(maxCS, 1)) * 100,
            winRate: wr,
            avgRating: (avgRtg / 10) * 100,
            possession: avgPoss,
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

    // Global H2H
    const allPlayerNames = registry.map(p => p.name);
    const globalH2h = getGlobalH2H(allPlayerNames, tournaments);

    // Global Recent Matches
    const recentMatches = getGlobalRecentMatches(tournaments, 10);

    // Career Awards logic
    const awards = [
        {
            title: "Iron Man",
            description: "Most matches played",
            winner: registry.sort((a, b) => b.career.totalMatches - a.career.totalMatches)[0],
            value: (p: any) => `${p.career.totalMatches} matches`,
            icon: "🦾",
        },
        {
            title: "Clinical Finisher",
            description: "Best Goals per Match (min 5 matches)",
            winner: registry
                .filter(p => p.career.totalMatches >= 5)
                .sort((a, b) => (b.career.totalGoals / b.career.totalMatches) - (a.career.totalGoals / a.career.totalMatches))[0],
            value: (p: any) => `${(p.career.totalGoals / p.career.totalMatches).toFixed(2)} G/M`,
            icon: "🎯",
        },
        {
            title: "The Wall",
            description: "Clean Sheet percentage (min 5 matches)",
            winner: registry
                .filter(p => p.career.totalMatches >= 5)
                .sort((a, b) => (b.career.totalCleanSheets / b.career.totalMatches) - (a.career.totalCleanSheets / a.career.totalMatches))[0],
            value: (p: any) => `${Math.round((p.career.totalCleanSheets / p.career.totalMatches) * 100)}% CS`,
            icon: "🧱",
        },
        {
            title: "Creative Maestro",
            description: "Highest Expected Goals (xG) per match",
            winner: registry
                .filter(p => p.career.totalMatches >= 5)
                .sort((a, b) => (b.career.totalXg / b.career.totalMatches) - (a.career.totalXg / a.career.totalMatches))[0],
            value: (p: any) => `${(p.career.totalXg / p.career.totalMatches).toFixed(2)} xG/M`,
            icon: "🪄",
        },
    ];

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
                        })),
                    };
                });

                const titleCount: Record<string, number> = {};
                podiums.forEach(p => {
                    const champ = p.top3[0]?.playerName;
                    if (champ) titleCount[champ] = (titleCount[champ] || 0) + 1;
                });

                const medalEmoji = ["🥇", "🥈", "🥉"];
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
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                        }}>
                                            {season.name}
                                        </div>
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            {season.top3.map((p, idx) => (
                                                <div key={idx} style={{
                                                    flex: idx === 0 ? "1.3" : "1",
                                                    minWidth: 160,
                                                    background: idx === 0 ? "rgba(255,215,0,0.06)" : idx === 1 ? "rgba(192,192,192,0.04)" : "rgba(205,127,50,0.04)",
                                                    border: `1px solid ${idx === 0 ? "rgba(255,215,0,0.2)" : idx === 1 ? "rgba(192,192,192,0.15)" : "rgba(205,127,50,0.12)"}`,
                                                    borderRadius: 10,
                                                    padding: "12px 14px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    boxShadow: medalGlow[idx],
                                                }}>
                                                    <div style={{ fontSize: idx === 0 ? 28 : 22 }}>
                                                        {medalEmoji[idx]}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 800, fontSize: idx === 0 ? 15 : 13, color: idx === 0 ? "var(--accent-gold)" : "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {p.playerName}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {p.team}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <div style={{ fontWeight: 800, fontSize: idx === 0 ? 16 : 14 }}>{p.pts} pts</div>
                                                        <div style={{ fontSize: 10, color: p.gd > 0 ? "var(--accent-green)" : p.gd < 0 ? "var(--accent-red)" : "var(--text-muted)" }}>{p.gd > 0 ? "+" : ""}{p.gd} GD</div>
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

            {/* Career Awards */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                {awards.map((award, i) => (
                    <div key={i} className="card animate-fade-in" style={{
                        padding: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        animationDelay: `${i * 0.05}s`,
                        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                    }}>
                        <div style={{ fontSize: 32 }}>{award.icon}</div>
                        <div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>{award.title}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--accent-gold)" }}>{award.winner?.name || "—"}</div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{award.winner ? award.value(award.winner) : "—"}</div>
                        </div>
                    </div>
                ))}
            </div>

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

            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* WDL */}
                <div className="card animate-fade-in">
                    <div className="analytics-card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                        <span className="analytics-card-icon">🎯</span>
                        <span className="analytics-card-title">All-Time W / D / L</span>
                    </div>
                    <div style={{ padding: 20 }}>
                        <WDLCharts players={wdlPlayers} />
                    </div>
                </div>

                {/* Recent Matches Feed */}
                <div className="card animate-fade-in">
                    <div className="analytics-card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                        <span className="analytics-card-icon">⚽</span>
                        <span className="analytics-card-title">Recent Global Matches</span>
                    </div>
                    <div style={{ padding: "10px 20px" }}>
                        {recentMatches.length === 0 ? (
                            <p style={{ color: "var(--text-muted)", fontSize: 13, padding: 10 }}>No matches played yet.</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {recentMatches.map((m, i) => (
                                    <li key={i} style={{
                                        padding: "12px 0",
                                        borderBottom: i === recentMatches.length - 1 ? "none" : "1px solid var(--border-color)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700 }}>
                                                {m.homePlayerName} <span style={{ color: "var(--accent-cyan)" }}>{m.homeScore} – {m.awayScore}</span> {m.awayPlayerName}
                                            </div>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.tournamentName}</div>
                                        </div>
                                        <Link href={`/tournament/${m.tournamentId}`} style={{ fontSize: 18, textDecoration: "none" }}>🏟️</Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Global H2H Matrix */}
            <div className="card animate-fade-in" style={{ marginBottom: 24, overflow: "hidden" }}>
                <div className="analytics-card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                    <span className="analytics-card-icon">⚔️</span>
                    <span className="analytics-card-title">All-Time Global Head-to-Head</span>
                </div>
                <div style={{ overflowX: "auto", padding: 20 }}>
                    <table className="table" style={{ fontSize: 12 }}>
                        <thead>
                            <tr>
                                <th style={{ position: "sticky", left: 0, background: "var(--bg-secondary)", zIndex: 1 }}>vs</th>
                                {allPlayerNames.map((name) => (
                                    <th key={name} style={{ textAlign: "center", minWidth: 80 }}>{name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {allPlayerNames.map((rowName) => (
                                <tr key={rowName}>
                                    <td style={{ fontWeight: 600, position: "sticky", left: 0, background: "var(--bg-card)", zIndex: 1 }}>
                                        {rowName}
                                    </td>
                                    {allPlayerNames.map((colName) => {
                                        if (rowName === colName) {
                                            return <td key={colName} style={{ textAlign: "center", background: "rgba(255,255,255,0.02)", color: "var(--text-muted)" }}>—</td>;
                                        }
                                        const cell = globalH2h.get(rowName.toLowerCase())?.get(colName.toLowerCase());
                                        if (!cell || (cell.wins === 0 && cell.draws === 0 && cell.losses === 0)) {
                                            return <td key={colName} style={{ textAlign: "center", color: "var(--text-muted)" }}>—</td>;
                                        }
                                        return (
                                            <td key={colName} style={{ textAlign: "center" }}>
                                                <div style={{ fontWeight: 700, fontSize: 13 }}>
                                                    <span style={{ color: "var(--accent-green)" }}>{cell.wins}W</span>
                                                    {" "}
                                                    <span style={{ color: "var(--accent-gold)" }}>{cell.draws}D</span>
                                                    {" "}
                                                    <span style={{ color: "var(--accent-red)" }}>{cell.losses}L</span>
                                                </div>
                                                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                                                    {cell.goalsFor}–{cell.goalsAgainst}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* All-Time Leaderboards */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Golden Boot */}
                <div className="card analytics-card animate-fade-in">
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
                <div className="card analytics-card animate-fade-in">
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
            <div className="card analytics-card animate-fade-in" style={{ marginBottom: 24 }}>
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
            <div className="card animate-fade-in" style={{ overflow: "auto" }}>
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
                            <th style={{ textAlign: "center" }}>Poss%</th>
                            <th style={{ textAlign: "center" }}>CS</th>
                            <th style={{ textAlign: "center" }}>Rtg</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registry.map((p, idx) => {
                            const cc = p.career;
                            const wp = cc.totalMatches > 0 ? Math.round((cc.totalWins / cc.totalMatches) * 100) : 0;
                            const ar = cc.totalRatedMatches > 0 ? (cc.totalRatingSum / cc.totalRatedMatches).toFixed(1) : "—";
                            const gpm = cc.totalMatches > 0 ? (cc.totalGoals / cc.totalMatches).toFixed(1) : "0";
                            const ap = cc.totalPossessionMatches > 0 ? Math.round(cc.totalPossessionSum / cc.totalPossessionMatches) : "—";
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
                                    <td style={{ textAlign: "center", fontSize: 12 }}>{ap}{ap !== "—" ? "%" : ""}</td>
                                    <td style={{ textAlign: "center" }}>{cc.totalCleanSheets}</td>
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
