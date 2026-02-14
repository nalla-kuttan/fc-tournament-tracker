"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Player, Tournament, TournamentFormat, RegisteredPlayer } from "@/lib/types";
import { generateSchedule } from "@/lib/scheduler";
import { saveTournament } from "@/lib/storage";
import { getOrCreatePlayer, loadRegistry } from "@/lib/playerRegistry";

function generateId(): string {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

const DEFAULT_PLAYERS: { name: string; team: string }[] = [
    { name: "Ruban", team: "" },
    { name: "Basil", team: "" },
    { name: "Alex", team: "" },
    { name: "Arshad", team: "" },
    { name: "Moamen", team: "" },
];

// ─── Autocomplete PlayerRow ──────────────────────────

function PlayerRow({
    idx,
    player,
    updatePlayer,
    removePlayer,
    canRemove,
}: {
    idx: number;
    player: { name: string; team: string };
    updatePlayer: (idx: number, field: "name" | "team", value: string) => void;
    removePlayer: (idx: number) => void;
    canRemove: boolean;
}) {
    const [suggestions, setSuggestions] = useState<RegisteredPlayer[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleNameChange = (value: string) => {
        updatePlayer(idx, "name", value);
        if (value.trim().length >= 1) {
            const registry = loadRegistry();
            const matches = registry.filter((p) =>
                p.name.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(matches.slice(0, 5));
            setShowSuggestions(matches.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };

    const selectPlayer = (rp: RegisteredPlayer) => {
        updatePlayer(idx, "name", rp.name);
        updatePlayer(idx, "team", rp.team);
        setShowSuggestions(false);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div
            className="player-row"
            style={{ animationDelay: `${idx * 40}ms`, position: "relative" }}
            ref={wrapperRef}
        >
            <div className="form-group" style={{ position: "relative" }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder={`Player ${idx + 1}`}
                    value={player.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => {
                        if (suggestions.length > 0 && player.name.trim().length >= 1) {
                            setShowSuggestions(true);
                        }
                    }}
                />
                {showSuggestions && (
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 20,
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-sm)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                            maxHeight: 180,
                            overflowY: "auto",
                        }}
                    >
                        {suggestions.map((rp) => (
                            <button
                                type="button"
                                key={rp.id}
                                onClick={() => selectPlayer(rp)}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: "8px 12px",
                                    textAlign: "left",
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: "1px solid var(--border-color)",
                                    color: "var(--text-primary)",
                                    cursor: "pointer",
                                    fontSize: 13,
                                }}
                                onMouseEnter={(e) => {
                                    (e.target as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.target as HTMLElement).style.background = "transparent";
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>{rp.name}</span>
                                <span style={{ color: "var(--text-muted)", marginLeft: 8, fontSize: 11 }}>
                                    {rp.team} · {rp.career.totalMatches} matches
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="form-group">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Team (optional)"
                    value={player.team}
                    onChange={(e) => updatePlayer(idx, "team", e.target.value)}
                />
            </div>
            <button
                type="button"
                className="btn btn-danger btn-icon"
                onClick={() => removePlayer(idx)}
                title="Remove player"
                disabled={!canRemove}
                style={{ opacity: canRemove ? 1 : 0.3 }}
            >
                ✕
            </button>
        </div>
    );
}

// ─── Main Create Page ────────────────────────────────

export default function CreatePage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [format, setFormat] = useState<TournamentFormat>("single");
    const [pin, setPin] = useState("1234");
    const [players, setPlayers] = useState<{ name: string; team: string }[]>(DEFAULT_PLAYERS);

    const addPlayer = () => {
        setPlayers([...players, { name: "", team: "" }]);
    };

    const removePlayer = (idx: number) => {
        if (players.length <= 2) return;
        setPlayers(players.filter((_, i) => i !== idx));
    };

    const updatePlayer = (idx: number, field: "name" | "team", value: string) => {
        const updated = [...players];
        updated[idx] = { ...updated[idx], [field]: value };
        setPlayers(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validPlayers = players.filter((p) => p.name.trim());
        if (validPlayers.length < 2) {
            alert("Need at least 2 players.");
            return;
        }
        if (!name.trim()) {
            alert("Enter a tournament name.");
            return;
        }

        const tournamentId = generateId();

        const playerObjs: Player[] = validPlayers.map((p) => ({
            id: generateId(),
            name: p.name.trim(),
            team: p.team.trim() || "TBD",
        }));

        const matches = generateSchedule(playerObjs, tournamentId, format);

        const tournament: Tournament = {
            id: tournamentId,
            name: name.trim(),
            format,
            status: "active",
            players: playerObjs,
            matches,
            createdAt: new Date().toISOString(),
            adminPin: pin || "1234",
        };

        // Register all players in the global player registry
        for (const p of playerObjs) {
            getOrCreatePlayer(p.name, p.team, p.id);
        }

        saveTournament(tournament);
        router.push(`/tournament/${tournamentId}`);
    };

    return (
        <div className="container page">
            <div style={{ marginBottom: 24 }}>
                <Link href="/" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    ← Back to Home
                </Link>
            </div>

            <div className="card animate-slide-up" style={{ maxWidth: 700, margin: "0 auto" }}>
                <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                    Create Tournament
                </h1>
                <p style={{ color: "var(--text-secondary)", marginBottom: 28, fontSize: 15 }}>
                    Set up a new round-robin tournament for your FIFA session.
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Tournament name */}
                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label className="form-label">Tournament Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. FC 26 Season 1"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Format + PIN */}
                    <div className="grid-2" style={{ marginBottom: 24 }}>
                        <div className="form-group">
                            <label className="form-label">Format</label>
                            <select
                                className="form-select"
                                value={format}
                                onChange={(e) => setFormat(e.target.value as TournamentFormat)}
                            >
                                <option value="single">Single Leg (play everyone once)</option>
                                <option value="double">Double Leg (home &amp; away)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Admin PIN</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="1234"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Players */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <label className="form-label" style={{ margin: 0 }}>Players</label>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={addPlayer}>
                                ＋ Add Player
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {players.map((p, idx) => (
                                <PlayerRow
                                    key={idx}
                                    idx={idx}
                                    player={p}
                                    updatePlayer={updatePlayer}
                                    removePlayer={removePlayer}
                                    canRemove={players.length > 2}
                                />
                            ))}
                        </div>
                        {players.length % 2 !== 0 && (
                            <p style={{ marginTop: 8, fontSize: 12, color: "var(--accent-orange)" }}>
                                ⚠️ Odd number of players — one player will have a Bye each round.
                            </p>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "14px 24px", fontSize: 16 }}>
                        🎮 Generate Schedule &amp; Create
                    </button>
                </form>
            </div>
        </div>
    );
}
