"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Tournament } from "@/lib/types";
import { listTournaments } from "@/lib/storage";
import { loadRegistry, syncCareerStats, getCareerLeaderboard } from "@/lib/playerRegistry";
import {
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
