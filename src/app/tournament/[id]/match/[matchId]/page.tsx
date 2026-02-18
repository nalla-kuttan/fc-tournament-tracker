"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Tournament, Match, MatchStats, Player, GoalEntry } from "@/lib/types";
import { loadTournament, saveTournament, listTournaments } from "@/lib/storage";
import { syncCareerStats } from "@/lib/playerRegistry";

function getPlayer(players: Player[], id: string | null): Player | undefined {
    if (!id || id === "BYE") return undefined;
    return players.find((p) => p.id === id);
}

const emptyStats = (): MatchStats => ({
    xg: 0,
    possession: 50,
    tackles: 0,
    interceptions: 0,
    motmPlayerId: null,
    rating: 6.0,
});

export default function MatchEntryPage() {
    const params = useParams();
    const router = useRouter();
    const tournamentId = params.id as string;
    const matchId = params.matchId as string;

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [match, setMatch] = useState<Match | null>(null);

    const [homeStats, setHomeStats] = useState<MatchStats>(emptyStats());
    const [awayStats, setAwayStats] = useState<MatchStats>(emptyStats());
    const [homeScorers, setHomeScorers] = useState<GoalEntry[]>([]);
    const [awayScorers, setAwayScorers] = useState<GoalEntry[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Score is now DERIVED from goalscorers count
    const homeScore = homeScorers.length;
    const awayScore = awayScorers.length;

    const refresh = useCallback(async () => {
        const t = await loadTournament(tournamentId);
        if (!t) return;
        setTournament(t);
        const m = t.matches.find((m) => m.id === matchId);
        if (m) {
            setMatch(m);
            if (m.isPlayed) {
                setHomeStats(m.homeStats ?? emptyStats());
                setAwayStats(m.awayStats ?? emptyStats());
                setHomeScorers(
                    m.homeGoalscorers.map((g) =>
                        typeof g === "string" ? { playerId: g } : g
                    )
                );
                setAwayScorers(
                    m.awayGoalscorers.map((g) =>
                        typeof g === "string" ? { playerId: g } : g
                    )
                );
                if (m.homeStats || m.awayStats) setShowAdvanced(true);
            }
        }
    }, [tournamentId, matchId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    if (!tournament || !match) return null;

    const homePlayer = getPlayer(tournament.players, match.homePlayerId);
    const awayPlayer = getPlayer(tournament.players, match.awayPlayerId);

    const handleSave = async () => {
        const updated: Tournament = {
            ...tournament,
            matches: tournament.matches.map((m) => {
                if (m.id !== matchId) return m;
                return {
                    ...m,
                    homeScore,
                    awayScore,
                    isPlayed: true,
                    homeStats: showAdvanced ? homeStats : null,
                    awayStats: showAdvanced ? awayStats : null,
                    homeGoalscorers: homeScorers,
                    awayGoalscorers: awayScorers,
                };
            }),
        };
        await saveTournament(updated);
        const ts = await listTournaments();
        await syncCareerStats(ts);
        window.dispatchEvent(new Event("fc-update"));
        router.push(`/tournament/${tournamentId}`);
    };

    const addGoal = (side: "home" | "away") => {
        const playerId = side === "home" ? match.homePlayerId : match.awayPlayerId;
        if (!playerId || playerId === "BYE") return;
        const entry: GoalEntry = { playerId };
        if (side === "home") {
            setHomeScorers([...homeScorers, entry]);
        } else {
            setAwayScorers([...awayScorers, entry]);
        }
    };

    const removeGoal = (side: "home" | "away", idx: number) => {
        if (side === "home") {
            setHomeScorers(homeScorers.filter((_, i) => i !== idx));
        } else {
            setAwayScorers(awayScorers.filter((_, i) => i !== idx));
        }
    };

    const updateGoalMinute = (side: "home" | "away", idx: number, minute: number | undefined) => {
        if (side === "home") {
            const updated = [...homeScorers];
            updated[idx] = { ...updated[idx], minute };
            setHomeScorers(updated);
        } else {
            const updated = [...awayScorers];
            updated[idx] = { ...updated[idx], minute };
            setAwayScorers(updated);
        }
    };

    const updateStat = (
        side: "home" | "away",
        field: keyof MatchStats,
        value: number | string | null
    ) => {
        if (side === "home") {
            setHomeStats({ ...homeStats, [field]: value });
        } else {
            setAwayStats({ ...awayStats, [field]: value });
        }
    };

    // Merge all goals and sort by minute for the timeline
    const allGoals = [
        ...homeScorers.map((g, i) => ({ ...g, side: "home" as const, idx: i, playerName: homePlayer?.name ?? "?" })),
        ...awayScorers.map((g, i) => ({ ...g, side: "away" as const, idx: i, playerName: awayPlayer?.name ?? "?" })),
    ].sort((a, b) => {
        if (a.minute && b.minute) return a.minute - b.minute;
        if (a.minute) return -1;
        if (b.minute) return 1;
        return 0;
    });

    const GoalRow = ({ side, idx, entry }: { side: "home" | "away"; idx: number; entry: GoalEntry }) => {
        const playerName = side === "home" ? homePlayer?.name : awayPlayer?.name;
        const ordinal = idx + 1;
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border-color)",
                    animation: "fadeIn 0.3s ease-out",
                }}
            >
                <span style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--accent-gold)",
                    minWidth: 24,
                }}>
                    {ordinal}.
                </span>
                <span style={{ fontSize: 16 }}>⚽</span>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{playerName}</span>
                <input
                    type="number"
                    min={1}
                    max={120}
                    placeholder="min"
                    value={entry.minute ?? ""}
                    onChange={(e) => {
                        const v = e.target.value ? parseInt(e.target.value) : undefined;
                        updateGoalMinute(side, idx, v);
                    }}
                    className="form-input"
                    style={{
                        width: 60,
                        padding: "4px 6px",
                        fontSize: 12,
                        textAlign: "center",
                    }}
                />
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{"'"}</span>
                <button
                    className="btn btn-danger btn-icon"
                    style={{ width: 24, height: 24, padding: 0, fontSize: 10 }}
                    onClick={() => removeGoal(side, idx)}
                >
                    ✕
                </button>
            </div>
        );
    };

    return (
        <div className="container page">
            <div style={{ marginBottom: 20 }}>
                <Link href={`/tournament/${tournamentId}/schedule`} style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    ← Back to Schedule
                </Link>
            </div>

            <div className="card animate-slide-up">
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--accent-cyan)", marginBottom: 16 }}>
                    Round {match.roundNumber} · {match.isPlayed ? "Edit Result" : "Enter Result"}
                </div>

                {/* Live score display — auto-computed from goals */}
                <div className="score-display" style={{ marginBottom: 12 }}>
                    <div className="score-team">
                        <div className="score-team-name">{homePlayer?.name}</div>
                        <div className="score-team-player">{homePlayer?.team}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: 42,
                            fontWeight: 800,
                            background: homeScore > awayScore ? "var(--gradient-accent)" : undefined,
                            WebkitBackgroundClip: homeScore > awayScore ? "text" : undefined,
                            WebkitTextFillColor: homeScore > awayScore ? "transparent" : "var(--text-primary)",
                            backgroundClip: homeScore > awayScore ? "text" : undefined,
                            minWidth: 40,
                            textAlign: "center",
                        }}>
                            {homeScore}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 18 }}>–</span>
                        <span style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: 42,
                            fontWeight: 800,
                            background: awayScore > homeScore ? "var(--gradient-accent)" : undefined,
                            WebkitBackgroundClip: awayScore > homeScore ? "text" : undefined,
                            WebkitTextFillColor: awayScore > homeScore ? "transparent" : "var(--text-primary)",
                            backgroundClip: awayScore > homeScore ? "text" : undefined,
                            minWidth: 40,
                            textAlign: "center",
                        }}>
                            {awayScore}
                        </span>
                    </div>
                    <div className="score-team">
                        <div className="score-team-name">{awayPlayer?.name}</div>
                        <div className="score-team-player">{awayPlayer?.team}</div>
                    </div>
                </div>

                <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginBottom: 24 }}>
                    Score updates automatically as you add goals below
                </p>

                {/* Goals entry — two columns */}
                <div className="grid-2" style={{ marginBottom: 24 }}>
                    {/* Home goals */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <span className="form-label" style={{ margin: 0 }}>⚽ {homePlayer?.name}&apos;s Goals ({homeScore})</span>
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => addGoal("home")} style={{ padding: "5px 12px", fontSize: 12 }}>
                                + Goal
                            </button>
                        </div>
                        {homeScorers.length === 0 && (
                            <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>No goals yet</p>
                        )}
                        {homeScorers.map((entry, idx) => (
                            <GoalRow key={idx} side="home" idx={idx} entry={entry} />
                        ))}
                    </div>

                    {/* Away goals */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <span className="form-label" style={{ margin: 0 }}>⚽ {awayPlayer?.name}&apos;s Goals ({awayScore})</span>
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => addGoal("away")} style={{ padding: "5px 12px", fontSize: 12 }}>
                                + Goal
                            </button>
                        </div>
                        {awayScorers.length === 0 && (
                            <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>No goals yet</p>
                        )}
                        {awayScorers.map((entry, idx) => (
                            <GoalRow key={idx} side="away" idx={idx} entry={entry} />
                        ))}
                    </div>
                </div>

                {/* Goal timeline */}
                {allGoals.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <div className="form-label" style={{ marginBottom: 8 }}>📋 Goal Timeline</div>
                        <div style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-md)",
                            padding: "12px 16px",
                        }}>
                            {allGoals.map((g, i) => (
                                <div key={i} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "6px 0",
                                    borderBottom: i < allGoals.length - 1 ? "1px solid var(--border-color)" : "none",
                                }}>
                                    <span style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: "var(--accent-cyan)",
                                        minWidth: 30,
                                        textAlign: "right",
                                    }}>
                                        {g.minute ? `${g.minute}'` : "—"}
                                    </span>
                                    <span style={{ fontSize: 14 }}>⚽</span>
                                    <span style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: g.side === "home" ? "var(--text-primary)" : "var(--accent-purple)",
                                    }}>
                                        {g.playerName}
                                    </span>
                                    <span style={{
                                        fontSize: 11,
                                        color: "var(--text-muted)",
                                        marginLeft: "auto",
                                    }}>
                                        {g.side === "home" ? "HOME" : "AWAY"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Advanced stats toggle */}
                <div style={{ marginBottom: 20 }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        style={{ width: "100%" }}
                    >
                        {showAdvanced ? "▾ Hide" : "▸ Show"} Advanced Stats (xG, Possession, MOTM)
                    </button>
                </div>

                {showAdvanced && (
                    <div className="match-entry-grid" style={{ marginBottom: 24 }}>
                        {/* Home stats */}
                        <div className="match-entry-side">
                            <h4 style={{ fontSize: 14, color: "var(--accent-cyan)", marginBottom: 4 }}>{homePlayer?.name}</h4>
                            <div className="form-group">
                                <label className="form-label">xG</label>
                                <input type="number" step={0.1} min={0} className="form-input" value={homeStats.xg} onChange={(e) => updateStat("home", "xg", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Possession %</label>
                                <input type="number" min={0} max={100} className="form-input" value={homeStats.possession} onChange={(e) => updateStat("home", "possession", parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tackles</label>
                                <input type="number" min={0} className="form-input" value={homeStats.tackles} onChange={(e) => updateStat("home", "tackles", parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Interceptions</label>
                                <input type="number" min={0} className="form-input" value={homeStats.interceptions} onChange={(e) => updateStat("home", "interceptions", parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Rating (0-10)</label>
                                <input type="number" step={0.1} min={0} max={10} className="form-input" value={homeStats.rating} onChange={(e) => updateStat("home", "rating", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Man of the Match?</label>
                                <select className="form-select" value={homeStats.motmPlayerId ?? ""} onChange={(e) => updateStat("home", "motmPlayerId", e.target.value || null)}>
                                    <option value="">None</option>
                                    {match.homePlayerId && match.homePlayerId !== "BYE" && (
                                        <option value={match.homePlayerId}>{homePlayer?.name}</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="match-entry-divider" />

                        {/* Away stats */}
                        <div className="match-entry-side">
                            <h4 style={{ fontSize: 14, color: "var(--accent-cyan)", marginBottom: 4 }}>{awayPlayer?.name}</h4>
                            <div className="form-group">
                                <label className="form-label">xG</label>
                                <input type="number" step={0.1} min={0} className="form-input" value={awayStats.xg} onChange={(e) => updateStat("away", "xg", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Possession %</label>
                                <input type="number" min={0} max={100} className="form-input" value={awayStats.possession} onChange={(e) => updateStat("away", "possession", parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tackles</label>
                                <input type="number" min={0} className="form-input" value={awayStats.tackles} onChange={(e) => updateStat("away", "tackles", parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Interceptions</label>
                                <input type="number" min={0} className="form-input" value={awayStats.interceptions} onChange={(e) => updateStat("away", "interceptions", parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Rating (0-10)</label>
                                <input type="number" step={0.1} min={0} max={10} className="form-input" value={awayStats.rating} onChange={(e) => updateStat("away", "rating", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Man of the Match?</label>
                                <select className="form-select" value={awayStats.motmPlayerId ?? ""} onChange={(e) => updateStat("away", "motmPlayerId", e.target.value || null)}>
                                    <option value="">None</option>
                                    {match.awayPlayerId && match.awayPlayerId !== "BYE" && (
                                        <option value={match.awayPlayerId}>{awayPlayer?.name}</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Save */}
                <button className="btn btn-primary" style={{ width: "100%", padding: "14px 24px", fontSize: 16 }} onClick={handleSave}>
                    ✅ Save Result
                </button>
            </div>
        </div>
    );
}
