"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Tournament } from "@/lib/types";
import { loadTournament } from "@/lib/storage";
import {
    getGoldenBoot,
    getGoldenGlove,
    getUnluckyIndex,
    getMvpLeaderboard,
    getWinRates,
    getAvgGoals,
    getBiggestWins,
    getH2HMatrix,
    getPossessionKings,
    getCumulativeGoalsPerRound,
    computeStandings,
} from "@/lib/standings";
import dynamic from "next/dynamic";

// Dynamic imports for Chart.js components (CSR only)
const RadarChart = dynamic(() => import("@/components/RadarChart"), { ssr: false });
const WDLCharts = dynamic(() => import("@/components/DoughnutChart"), { ssr: false });
const GoalTimelineChart = dynamic(() => import("@/components/GoalTimeline"), { ssr: false });

export default function AnalyticsPage() {
    const params = useParams();
    const id = params.id as string;
    const [tournament, setTournament] = useState<Tournament | null>(null);

    const refresh = useCallback(() => {
        setTournament(loadTournament(id));
    }, [id]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    if (!tournament) return null;

    const goldenBoot = getGoldenBoot(tournament.players, tournament.matches);
    const goldenGlove = getGoldenGlove(tournament.players, tournament.matches);
    const unlucky = getUnluckyIndex(tournament.players, tournament.matches);
    const mvp = getMvpLeaderboard(tournament.players, tournament.matches);
    const winRates = getWinRates(tournament.players, tournament.matches);
    const avgGoals = getAvgGoals(tournament.players, tournament.matches);
    const biggestWins = getBiggestWins(tournament.players, tournament.matches);
    const h2hMatrix = getH2HMatrix(tournament.players, tournament.matches);
    const possessionKings = getPossessionKings(tournament.players, tournament.matches);
    const cumulativeGoals = getCumulativeGoalsPerRound(tournament.players, tournament.matches);
    const standings = computeStandings(tournament.players, tournament.matches);

    const maxGoals = Math.max(...goldenBoot.map((e) => e.goals), 1);
    const maxCS = Math.max(...goldenGlove.map((e) => e.cleanSheets), 1);
    const maxWinRate = Math.max(...winRates.map((e) => e.winRate), 1);
    const maxAvg = Math.max(...avgGoals.map((e) => e.avgGoals), 1);

    const hasData = tournament.matches.some((m) => m.isPlayed);

    // Prepare radar data (normalize to 0-100 scale)
    const radarMaxGoals = Math.max(...goldenBoot.map((e) => e.goals), 1);
    const radarMaxCS = Math.max(...goldenGlove.map((e) => e.cleanSheets), 1);
    const radarPlayers = tournament.players.map((p) => {
        const boot = goldenBoot.find((e) => e.playerId === p.id);
        const glove = goldenGlove.find((e) => e.playerId === p.id);
        const wr = winRates.find((e) => e.playerId === p.id);
        const mvpEntry = mvp.find((e) => e.playerId === p.id);
        const poss = possessionKings.find((e) => e.playerId === p.id);

        return {
            playerName: p.name,
            color: "",
            goals: ((boot?.goals ?? 0) / radarMaxGoals) * 100,
            cleanSheets: ((glove?.cleanSheets ?? 0) / radarMaxCS) * 100,
            winRate: wr?.winRate ?? 0,
            avgRating: ((mvpEntry?.avgRating ?? 0) / 10) * 100,
            possession: poss?.avgPossession ?? 0,
        };
    });

    // Prepare W/D/L data
    const wdlPlayers = tournament.players.map((p) => {
        const row = standings.find((r) => r.playerId === p.id);
        return {
            playerName: p.name,
            wins: row?.won ?? 0,
            draws: row?.drawn ?? 0,
            losses: row?.lost ?? 0,
        };
    });

    if (!hasData) {
        return (
            <div className="container page">
                <div className="empty-state card">
                    <div className="empty-state-icon">📊</div>
                    <div className="empty-state-title">No matches played yet</div>
                    <p>Enter some match results to see analytics.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container page">
            <div className="section-header">
                <h2 className="section-title">📊 Analytics</h2>
            </div>

            {/* ── Visualizers ────────────────────────────── */}

            {/* Radar: Player Comparison */}
            <div className="card animate-fade-in" style={{ marginBottom: 24 }}>
                <div className="analytics-card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                    <span className="analytics-card-icon">🕸️</span>
                    <span className="analytics-card-title">Player Comparison Radar</span>
                </div>
                <div style={{ padding: 20 }}>
                    <RadarChart players={radarPlayers} />
                </div>
            </div>

            {/* Line: Cumulative Goals */}
            <div className="card animate-fade-in" style={{ marginBottom: 24, animationDelay: "0.05s" }}>
                <div className="analytics-card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                    <span className="analytics-card-icon">📈</span>
                    <span className="analytics-card-title">Goal Progression</span>
                </div>
                <div style={{ padding: 20 }}>
                    <GoalTimelineChart
                        players={cumulativeGoals.players}
                        roundLabels={cumulativeGoals.roundLabels}
                    />
                </div>
            </div>

            {/* Doughnut: Win/Draw/Loss */}
            <div className="card animate-fade-in" style={{ marginBottom: 24, animationDelay: "0.1s" }}>
                <div className="analytics-card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                    <span className="analytics-card-icon">🎯</span>
                    <span className="analytics-card-title">Win / Draw / Loss Distribution</span>
                </div>
                <div style={{ padding: 20 }}>
                    <WDLCharts players={wdlPlayers} />
                </div>
            </div>

            {/* ── Leaderboard Cards ──────────────────────── */}

            {/* Row 1: Golden Boot + Golden Glove */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card analytics-card animate-fade-in" style={{ animationDelay: "0.15s" }}>
                    <div className="analytics-card-header">
                        <span className="analytics-card-icon">👟</span>
                        <span className="analytics-card-title">Golden Boot</span>
                    </div>
                    <div className="bar-chart">
                        {goldenBoot.map((entry) => (
                            <div className="bar-row" key={entry.playerId}>
                                <span className="bar-label">{entry.playerName}</span>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{ width: `${(entry.goals / maxGoals) * 100}%` }} />
                                </div>
                                <span className="bar-value">{entry.goals}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card analytics-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
                    <div className="analytics-card-header">
                        <span className="analytics-card-icon">🧤</span>
                        <span className="analytics-card-title">Golden Glove</span>
                    </div>
                    <div className="bar-chart">
                        {goldenGlove.map((entry) => (
                            <div className="bar-row" key={entry.playerId}>
                                <span className="bar-label">{entry.playerName}</span>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{ width: `${(entry.cleanSheets / maxCS) * 100}%`, background: "linear-gradient(135deg, #00e676, #00e5ff)" }} />
                                </div>
                                <span className="bar-value">{entry.cleanSheets}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 2: Win Rate + Avg Goals Per Match */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card analytics-card animate-fade-in" style={{ animationDelay: "0.25s" }}>
                    <div className="analytics-card-header">
                        <span className="analytics-card-icon">🏅</span>
                        <span className="analytics-card-title">Win Rate</span>
                    </div>
                    <div className="bar-chart">
                        {winRates.map((entry) => (
                            <div className="bar-row" key={entry.playerId}>
                                <span className="bar-label">{entry.playerName}</span>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{ width: `${(entry.winRate / maxWinRate) * 100}%`, background: "linear-gradient(135deg, #ffd700, #ff9100)" }} />
                                </div>
                                <span className="bar-value">{entry.winRate}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card analytics-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
                    <div className="analytics-card-header">
                        <span className="analytics-card-icon">⚽</span>
                        <span className="analytics-card-title">Avg Goals Per Match</span>
                    </div>
                    <div className="bar-chart">
                        {avgGoals.map((entry) => (
                            <div className="bar-row" key={entry.playerId}>
                                <span className="bar-label">{entry.playerName}</span>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{ width: `${(entry.avgGoals / maxAvg) * 100}%`, background: "linear-gradient(135deg, #b388ff, #00e5ff)" }} />
                                </div>
                                <span className="bar-value">{entry.avgGoals.toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 3: Unlucky Index + MVP */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card analytics-card animate-fade-in" style={{ animationDelay: "0.35s" }}>
                    <div className="analytics-card-header">
                        <span className="analytics-card-icon">🍀</span>
                        <span className="analytics-card-title">&ldquo;Unlucky&rdquo; Index</span>
                    </div>
                    <ul className="analytics-list">
                        {unlucky.map((entry, idx) => (
                            <li className="analytics-list-item" key={entry.playerId}>
                                <span className={`analytics-rank ${idx === 0 ? "top" : ""}`}>{idx + 1}</span>
                                <div className="analytics-player-info">
                                    <div className="analytics-player-name">{entry.playerName}</div>
                                    <div className="analytics-player-team">{entry.actualGoals} goals vs {entry.totalXg} xG</div>
                                </div>
                                <span className="analytics-stat" style={{
                                    color: entry.diff < 0 ? "var(--accent-red)" : entry.diff > 0 ? "var(--accent-green)" : "var(--text-secondary)",
                                    fontSize: 16,
                                }}>
                                    {entry.diff > 0 ? "+" : ""}{entry.diff}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="card analytics-card animate-fade-in" style={{ animationDelay: "0.4s" }}>
                    <div className="analytics-card-header">
                        <span className="analytics-card-icon">⭐</span>
                        <span className="analytics-card-title">MVP Leaderboard</span>
                    </div>
                    <ul className="analytics-list">
                        {mvp.map((entry, idx) => (
                            <li className="analytics-list-item" key={entry.playerId}>
                                <span className={`analytics-rank ${idx === 0 ? "top" : ""}`}>{idx + 1}</span>
                                <div className="analytics-player-info">
                                    <div className="analytics-player-name">{entry.playerName}</div>
                                    <div className="analytics-player-team">{entry.matchesRated} matches · {entry.motmCount} MOTM</div>
                                </div>
                                <span className="analytics-stat">{entry.avgRating.toFixed(1)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Row 4: Possession Kings + Biggest Wins */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card analytics-card animate-fade-in" style={{ animationDelay: "0.45s" }}>
                    <div className="analytics-card-header">
                        <span className="analytics-card-icon">🎮</span>
                        <span className="analytics-card-title">Possession Kings</span>
                    </div>
                    <ul className="analytics-list">
                        {possessionKings.map((entry, idx) => (
                            <li className="analytics-list-item" key={entry.playerId}>
                                <span className={`analytics-rank ${idx === 0 ? "top" : ""}`}>{idx + 1}</span>
                                <div className="analytics-player-info">
                                    <div className="analytics-player-name">{entry.playerName}</div>
                                    <div className="analytics-player-team">{entry.matchesTracked} matches tracked</div>
                                </div>
                                <span className="analytics-stat">{entry.avgPossession}%</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="card analytics-card animate-fade-in" style={{ animationDelay: "0.5s" }}>
                    <div className="analytics-card-header">
                        <span className="analytics-card-icon">💥</span>
                        <span className="analytics-card-title">Biggest Wins</span>
                    </div>
                    <ul className="analytics-list">
                        {biggestWins.length === 0 ? (
                            <li className="analytics-list-item"><span style={{ color: "var(--text-muted)", fontSize: 13 }}>No results yet</span></li>
                        ) : biggestWins.map((entry, idx) => (
                            <li className="analytics-list-item" key={idx}>
                                <span className={`analytics-rank ${idx === 0 ? "top" : ""}`}>{idx + 1}</span>
                                <div className="analytics-player-info">
                                    <div className="analytics-player-name">
                                        {entry.homePlayerName} vs {entry.awayPlayerName}
                                    </div>
                                    <div className="analytics-player-team">Round {entry.roundNumber}</div>
                                </div>
                                <span className="analytics-stat" style={{ fontSize: 16 }}>
                                    {entry.homeScore} – {entry.awayScore}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Row 5: Head-to-Head Matrix */}
            <div className="card animate-fade-in" style={{ animationDelay: "0.55s" }}>
                <div className="analytics-card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                    <span className="analytics-card-icon">⚔️</span>
                    <span className="analytics-card-title">Head-to-Head</span>
                </div>
                <div style={{ overflowX: "auto", padding: 20 }}>
                    <table className="table" style={{ fontSize: 12 }}>
                        <thead>
                            <tr>
                                <th style={{ position: "sticky", left: 0, background: "var(--bg-secondary)", zIndex: 1 }}>vs</th>
                                {tournament.players.map((p) => (
                                    <th key={p.id} style={{ textAlign: "center", minWidth: 80 }}>{p.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tournament.players.map((row) => (
                                <tr key={row.id}>
                                    <td style={{ fontWeight: 600, position: "sticky", left: 0, background: "var(--bg-card)", zIndex: 1 }}>
                                        {row.name}
                                    </td>
                                    {tournament.players.map((col) => {
                                        if (row.id === col.id) {
                                            return (
                                                <td key={col.id} style={{ textAlign: "center", background: "rgba(255,255,255,0.02)", color: "var(--text-muted)" }}>
                                                    —
                                                </td>
                                            );
                                        }
                                        const cell = h2hMatrix.get(row.id)?.get(col.id);
                                        if (!cell || (cell.wins === 0 && cell.draws === 0 && cell.losses === 0)) {
                                            return <td key={col.id} style={{ textAlign: "center", color: "var(--text-muted)" }}>—</td>;
                                        }
                                        return (
                                            <td key={col.id} style={{ textAlign: "center" }}>
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
        </div>
    );
}
