"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Tournament, Match, Player } from "@/lib/types";
import { loadTournament, saveTournament } from "@/lib/storage";
import { useAdmin } from "@/lib/AdminContext";

function getPlayer(players: Player[], id: string | null | undefined): Player | undefined {
    if (!id) return undefined;
    return players.find((p) => p.id === id);
}

export default function SchedulePage() {
    const params = useParams();
    const id = params.id as string;
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const { isAdmin } = useAdmin();
    const dragRound = useRef<number | null>(null);
    const [dragOverRound, setDragOverRound] = useState<number | null>(null);

    const refresh = useCallback(async () => {
        const t = await loadTournament(id);
        setTournament(t);
    }, [id]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    if (!tournament) return null;

    // Group matches by round
    const roundMap = new Map<number, Match[]>();
    for (const m of tournament.matches) {
        const arr = roundMap.get(m.roundNumber) ?? [];
        arr.push(m);
        roundMap.set(m.roundNumber, arr);
    }
    const roundNumbers = Array.from(roundMap.keys()).sort((a, b) => a - b);

    // Drag handlers for round reordering
    const handleDragStart = (roundNum: number) => {
        dragRound.current = roundNum;
    };

    const handleDragOver = (e: React.DragEvent, roundNum: number) => {
        e.preventDefault();
        setDragOverRound(roundNum);
    };

    const handleDrop = async (targetRound: number) => {
        const sourceRound = dragRound.current;
        if (sourceRound === null || sourceRound === targetRound) {
            setDragOverRound(null);
            return;
        }

        // Swap round numbers
        const updated = { ...tournament };
        updated.matches = updated.matches.map((m) => {
            if (m.roundNumber === sourceRound) return { ...m, roundNumber: targetRound };
            if (m.roundNumber === targetRound) return { ...m, roundNumber: sourceRound };
            return m;
        });

        await saveTournament(updated as Tournament);
        await refresh();
        setDragOverRound(null);
        dragRound.current = null;
    };

    return (
        <div className="container page">
            <div className="section-header">
                <div>
                    <h2 className="section-title">📅 Schedule</h2>
                    <p className="section-subtitle">
                        {roundNumbers.length} rounds · {isAdmin ? "Drag rounds to reorder" : "View fixtures"}
                    </p>
                </div>
            </div>

            {roundNumbers.map((roundNum) => {
                const matches = roundMap.get(roundNum) ?? [];
                return (
                    <div
                        key={roundNum}
                        className={`card round-card animate-fade-in ${isAdmin ? "draggable" : ""
                            } ${dragOverRound === roundNum ? "drag-over" : ""}`}
                        draggable={isAdmin}
                        onDragStart={() => handleDragStart(roundNum)}
                        onDragOver={(e) => handleDragOver(e, roundNum)}
                        onDrop={() => handleDrop(roundNum)}
                        onDragEnd={() => setDragOverRound(null)}
                    >
                        <div className="round-header">
                            {isAdmin && <span style={{ cursor: "grab", fontSize: 14, color: "var(--text-muted)" }}>⠿</span>}
                            <span className="round-number">Round {roundNum}</span>
                            <div className="round-line" />
                        </div>
                        {matches.map((m) => {
                            const isBye = m.homePlayerId === "BYE" || m.awayPlayerId === "BYE";
                            if (isBye) {
                                const restingId = m.homePlayerId === "BYE" ? m.awayPlayerId : m.homePlayerId;
                                const resting = getPlayer(tournament.players, restingId);
                                return (
                                    <div key={m.id} className="fixture" style={{ opacity: 0.5 }}>
                                        <div className="fixture-teams">
                                            <div className="fixture-player" style={{ flex: "unset" }}>
                                                {resting?.name}
                                            </div>
                                            <span className="badge badge-bye" style={{ marginLeft: 8 }}>BYE</span>
                                        </div>
                                    </div>
                                );
                            }
                            const hp = getPlayer(tournament.players, m.homePlayerId);
                            const ap = getPlayer(tournament.players, m.awayPlayerId);
                            return (
                                <div key={m.id} className="fixture">
                                    <div className="fixture-teams">
                                        <div className="fixture-player home">
                                            <div>{hp?.name}</div>
                                            <div className="fixture-team">{hp?.team}</div>
                                        </div>
                                        <div className={`fixture-score ${m.isPlayed ? "played" : ""}`}>
                                            {m.isPlayed ? `${m.homeScore} – ${m.awayScore}` : "vs"}
                                        </div>
                                        <div className="fixture-player">
                                            <div>{ap?.name}</div>
                                            <div className="fixture-team">{ap?.team}</div>
                                        </div>
                                    </div>
                                    {isAdmin && !m.isPlayed && (
                                        <Link
                                            href={`/tournament/${tournament.id}/match/${m.id}`}
                                            className="btn btn-secondary btn-sm"
                                            style={{ marginLeft: 12, flexShrink: 0 }}
                                        >
                                            Enter
                                        </Link>
                                    )}
                                    {isAdmin && m.isPlayed && (
                                        <Link
                                            href={`/tournament/${tournament.id}/match/${m.id}`}
                                            className="btn btn-secondary btn-sm"
                                            style={{ marginLeft: 12, flexShrink: 0, opacity: 0.6 }}
                                        >
                                            Edit
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
