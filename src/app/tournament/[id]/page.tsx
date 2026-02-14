"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Tournament, Match, Player } from "@/lib/types";
import { loadTournament, deleteTournament } from "@/lib/storage";
import { computeStandings, getNextMatch } from "@/lib/standings";
import StandingsTable from "@/components/StandingsTable";
import { useAdmin } from "@/lib/AdminContext";

function getPlayer(players: Player[], id: string): Player | undefined {
    return players.find((p) => p.id === id);
}

export default function DashboardPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const { isAdmin } = useAdmin();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const refresh = useCallback(() => {
        setTournament(loadTournament(id));
    }, [id]);

    useEffect(() => {
        refresh();
        const handler = () => refresh();
        window.addEventListener("storage", handler);
        window.addEventListener("fc-update", handler);
        return () => {
            window.removeEventListener("storage", handler);
            window.removeEventListener("fc-update", handler);
        };
    }, [refresh]);

    const handleDelete = () => {
        deleteTournament(id);
        router.push("/");
    };

    if (!tournament) return null;

    const standings = computeStandings(tournament.players, tournament.matches);
    const nextMatch = getNextMatch(tournament.matches);
    const recentMatches = tournament.matches
        .filter((m) => m.isPlayed && m.homePlayerId !== "BYE" && m.awayPlayerId !== "BYE")
        .sort((a, b) => b.roundNumber - a.roundNumber)
        .slice(0, 5);

    const playedCount = tournament.matches.filter((m) => m.isPlayed).length;
    const totalReal = tournament.matches.filter(
        (m) => m.homePlayerId !== "BYE" && m.awayPlayerId !== "BYE"
    ).length;

    return (
        <div className="container page">
            {/* Delete modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: "center", fontSize: 40, marginBottom: 12 }}>🗑️</div>
                        <div className="modal-title">Delete Tournament?</div>
                        <p style={{ color: "var(--text-secondary)", textAlign: "center", marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
                            <strong style={{ color: "var(--text-primary)" }}>{tournament.name}</strong> and all its match data will be permanently deleted. This cannot be undone.
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats bar */}
            <div className="grid-4 dashboard-stats" style={{ marginBottom: 28 }}>
                <div className="card" style={{ textAlign: "center" }}>
                    <div className="stat-value">{tournament.players.length}</div>
                    <div className="stat-label">Players</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div className="stat-value">{playedCount}/{totalReal}</div>
                    <div className="stat-label">Matches Played</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div className="stat-value">{tournament.format === "double" ? "2×" : "1×"}</div>
                    <div className="stat-label">Legs</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div className="stat-value" style={{ color: tournament.status === "active" ? "var(--accent-green)" : "var(--text-muted)" }}>
                        {tournament.status === "active" ? "Live" : "Done"}
                    </div>
                    <div className="stat-label">Status</div>
                </div>
            </div>

            {/* Next Match */}
            {nextMatch && (
                <div className="card next-match-card" style={{ marginBottom: 28, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--gradient-accent)" }} />
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--accent-cyan)", marginBottom: 12 }}>
                        🔥 Next Match · Round {nextMatch.roundNumber}
                    </div>
                    <div className="score-display">
                        <div className="score-team">
                            <div className="score-team-name">{getPlayer(tournament.players, nextMatch.homePlayerId)?.name ?? "?"}</div>
                            <div className="score-team-player">{getPlayer(tournament.players, nextMatch.homePlayerId)?.team}</div>
                        </div>
                        <div className="score-vs">VS</div>
                        <div className="score-team">
                            <div className="score-team-name">{getPlayer(tournament.players, nextMatch.awayPlayerId)?.name ?? "?"}</div>
                            <div className="score-team-player">{getPlayer(tournament.players, nextMatch.awayPlayerId)?.team}</div>
                        </div>
                    </div>
                    {isAdmin && (
                        <div style={{ textAlign: "center", marginTop: 16 }}>
                            <Link href={`/tournament/${tournament.id}/match/${nextMatch.id}`} className="btn btn-primary btn-sm">
                                Enter Result
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* Standings */}
            <div style={{ marginBottom: 28 }}>
                <div className="section-header">
                    <div>
                        <h2 className="section-title">🏆 Standings</h2>
                    </div>
                </div>
                <StandingsTable rows={standings} />
            </div>

            {/* Recent Results */}
            {recentMatches.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                    <div className="section-header">
                        <h2 className="section-title">Recent Results</h2>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {recentMatches.map((m) => {
                            const hp = getPlayer(tournament.players, m.homePlayerId);
                            const ap = getPlayer(tournament.players, m.awayPlayerId);
                            return (
                                <div key={m.id} className="fixture card" style={{ padding: "12px 20px" }}>
                                    <div className="fixture-teams">
                                        <div className="fixture-player home">
                                            <div>{hp?.name}</div>
                                            <div className="fixture-team">{hp?.team}</div>
                                        </div>
                                        <div className={`fixture-score ${m.isPlayed ? "played" : ""}`}>
                                            {m.homeScore} – {m.awayScore}
                                        </div>
                                        <div className="fixture-player">
                                            <div>{ap?.name}</div>
                                            <div className="fixture-team">{ap?.team}</div>
                                        </div>
                                    </div>
                                    <span className="badge badge-bye" style={{ fontSize: 10 }}>R{m.roundNumber}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Danger Zone */}
            <div className="card" style={{
                borderColor: "rgba(255, 82, 82, 0.15)",
                background: "rgba(255, 82, 82, 0.03)",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--accent-red)", marginBottom: 4 }}>
                            ⚠️ Danger Zone
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                            Permanently delete this tournament and all match data.
                        </div>
                    </div>
                    <button
                        className="btn btn-danger"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        🗑️ Delete Tournament
                    </button>
                </div>
            </div>
        </div>
    );
}
