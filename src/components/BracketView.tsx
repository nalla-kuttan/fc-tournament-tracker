"use client";

import React from "react";
import { Match, Player } from "@/lib/types";
import Link from "next/link";

interface BracketViewProps {
    matches: Match[];
    players: Player[];
    tournamentId: string;
    isAdmin: boolean;
}

export default function BracketView({
    matches,
    players,
    tournamentId,
    isAdmin,
}: BracketViewProps) {
    const getPlayer = (id: string) => players.find((p) => p.id === id);

    // Group matches by round number
    const roundNumbers = Array.from(new Set(matches.map((m) => m.roundNumber))).sort((a, b) => a - b);
    const rounds = roundNumbers.map((rn) => matches.filter((m) => m.roundNumber === rn));

    return (
        <div className="bracket-container" style={{
            display: "flex",
            gap: "40px",
            overflowX: "auto",
            padding: "20px 0",
            minHeight: "400px"
        }}>
            {rounds.map((roundMatches, roundIdx) => (
                <div key={roundIdx} className="bracket-round" style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-around",
                    gap: "20px",
                    minWidth: "200px"
                }}>
                    <h3 style={{
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "var(--text-muted)",
                        textAlign: "center",
                        marginBottom: "10px"
                    }}>
                        {roundMatches[0].stage || `Round ${roundMatches[0].roundNumber}`}
                    </h3>
                    {roundMatches.map((match) => {
                        const home = getPlayer(match.homePlayerId);
                        const away = getPlayer(match.awayPlayerId);

                        return (
                            <Link
                                key={match.id}
                                href={isAdmin ? `/tournament/${tournamentId}/match/${match.id}` : "#"}
                                className={`card bracket-match ${match.isPlayed ? "played" : ""}`}
                                style={{
                                    padding: "12px",
                                    fontSize: "13px",
                                    cursor: isAdmin ? "pointer" : "default",
                                    transition: "transform 0.2s, border-color 0.2s",
                                    borderLeft: match.isPlayed ? "4px solid var(--accent-cyan)" : "1px solid var(--border-color)"
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                    <span style={{
                                        fontWeight: (match.isPlayed && (match.homeScore || 0) > (match.awayScore || 0)) ? "800" : "400",
                                        color: (match.homePlayerId === "BYE") ? "var(--text-muted)" : "inherit"
                                    }}>
                                        {home?.name || (match.homePlayerId === "BYE" ? "BYE" : "TBD")}
                                    </span>
                                    <span style={{ fontWeight: 800 }}>{match.homeScore !== null ? match.homeScore : "-"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{
                                        fontWeight: (match.isPlayed && (match.awayScore || 0) > (match.homeScore || 0)) ? "800" : "400",
                                        color: (match.awayPlayerId === "BYE") ? "var(--text-muted)" : "inherit"
                                    }}>
                                        {away?.name || (match.awayPlayerId === "BYE" ? "BYE" : "TBD")}
                                    </span>
                                    <span style={{ fontWeight: 800 }}>{match.awayScore !== null ? match.awayScore : "-"}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
