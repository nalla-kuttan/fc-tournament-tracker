"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Tournament, HallOfFameEntry } from "@/lib/types";
import { listTournaments, deleteTournament, getHallOfFame } from "@/lib/storage";
import { useAdmin } from "@/lib/AdminContext";
import { loadRegistry } from "@/lib/playerRegistry";

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { isAdmin, openPinModal } = useAdmin();
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    async function init() {
      const ts = await listTournaments();
      const hof = await getHallOfFame();
      const registry = await loadRegistry();
      setTournaments(ts);
      setHallOfFame(hof);
      setTotalPlayers(registry.length);
      setLoaded(true);
    }
    init();
  }, []);

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteTournament(deleteTarget.id);
      const ts = await listTournaments();
      setTournaments(ts);
      setDeleteTarget(null);
    }
  };

  // Quick stats
  const totalMatches = tournaments.reduce(
    (sum, t) => sum + t.matches.filter((m) => m.isPlayed && m.homePlayerId !== "BYE" && m.awayPlayerId !== "BYE").length,
    0
  );
  const totalGoals = tournaments.reduce((sum, t) => {
    return sum + t.matches.filter((m) => m.isPlayed).reduce((ms, m) => ms + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  }, 0);

  return (
    <>
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div className="modal-title">Delete Tournament?</div>
            <p style={{ color: "var(--text-secondary)", textAlign: "center", marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text-primary)" }}>{deleteTarget.name}</strong> and all its match data will be
              permanently deleted. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={confirmDelete}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="hero">
        <div className="container" style={{ position: "relative" }}>
          <div className="animate-fade-in" style={{ marginBottom: 20 }}>
            <span style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "var(--accent-cyan)",
              background: "rgba(0, 229, 255, 0.08)",
              padding: "6px 16px",
              borderRadius: 20,
              border: "1px solid rgba(0, 229, 255, 0.15)",
            }}>
              ⚽ FC Tracker v2.0
            </span>
          </div>
          <h1 className="hero-title animate-fade-in" style={{ animationDelay: "0.05s" }}>
            FC <span>Tournament</span> Tracker
          </h1>
          <p className="hero-subtitle animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Round-robin scheduling, live standings, and deep analytics for your FIFA sessions.
          </p>

          {/* Hero Stats */}
          {loaded && totalMatches > 0 && (
            <div
              className="animate-fade-in hero-stats-row"
              style={{ animationDelay: "0.15s" }}
            >
              {[
                { label: "Tournaments", value: tournaments.length, icon: "🏆" },
                { label: "Matches", value: totalMatches, icon: "⚔️" },
                { label: "Goals", value: totalGoals, icon: "⚽" },
                { label: "Players", value: totalPlayers, icon: "👤" },
              ].map((stat) => (
                <div key={stat.label} className="hero-stat-item">
                  <div style={{ fontSize: 12, marginBottom: 4 }}>{stat.icon}</div>
                  <div className="hero-stat-value">
                    {stat.value}
                  </div>
                  <div className="hero-stat-label">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="animate-fade-in hero-actions" style={{ animationDelay: "0.2s" }}>
            <Link href="/create" className="btn btn-primary">
              ＋ New Tournament
            </Link>
            <Link href="/players" className="btn btn-secondary">
              👤 Players
            </Link>
            {!isAdmin && (
              <button className="btn btn-secondary" onClick={openPinModal}>
                🔒 Admin
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Hall of Fame */}
      {loaded && hallOfFame.length > 0 && (
        <div className="container page" style={{ paddingBottom: 0 }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">🏆 Hall of Fame</h2>
              <p className="section-subtitle">Champions of internal tournaments</p>
            </div>
          </div>
          <div className="grid-3">
            {hallOfFame.map((entry, i) => (
              <div key={entry.id} className="card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 32 }}>👑</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-gold)" }}>{entry.winnerName}</div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{entry.winnerTeam}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>
                  Won <strong>{entry.tournamentName}</strong>
                  <div style={{ fontSize: 11, marginTop: 4 }}>{new Date(entry.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tournaments list */}
      <div className="container page">
        {!loaded ? null : tournaments.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">🏟️</div>
            <div className="empty-state-title">No tournaments yet</div>
            <p>Create your first tournament to get started.</p>
          </div>
        ) : (
          <div>
            <div className="section-header">
              <div>
                <h2 className="section-title">Your Tournaments</h2>
                <p className="section-subtitle">{tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {tournaments.map((t, i) => {
                const playedCount = t.matches.filter((m) => m.isPlayed).length;
                const totalReal = t.matches.filter(
                  (m) => m.homePlayerId !== "BYE" && m.awayPlayerId !== "BYE"
                ).length;
                const progress = totalReal > 0 ? (playedCount / totalReal) * 100 : 0;
                return (
                  <div
                    key={t.id}
                    className="card card-interactive animate-fade-in tournament-card-row"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <Link
                      href={`/tournament/${t.id}`}
                      style={{ textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}
                    >
                      <div className="tournament-card-info">
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                          <h3 className="tournament-card-name">
                            {t.name}
                          </h3>
                          <span className={`badge ${t.status === "active" ? "badge-win" : "badge-bye"}`}>
                            {t.status === "active" ? "Active" : "Done"}
                          </span>
                        </div>
                        <p className="tournament-card-meta">
                          {t.players.length} players · {t.format === "double" ? "Double" : "Single"} leg
                        </p>
                        {/* Progress bar */}
                        <div style={{
                          height: 4,
                          borderRadius: 2,
                          background: "rgba(255,255,255,0.04)",
                          overflow: "hidden",
                          maxWidth: 200,
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${progress}%`,
                            borderRadius: 2,
                            background: progress === 100
                              ? "var(--accent-green)"
                              : "var(--gradient-accent)",
                            transition: "width 0.8s ease-out",
                            boxShadow: progress === 100
                              ? "0 0 8px rgba(0, 230, 118, 0.3)"
                              : "0 0 8px rgba(0, 229, 255, 0.2)",
                          }} />
                        </div>
                      </div>
                    </Link>
                    <div className="tournament-card-actions">
                      <div style={{ textAlign: "right" }}>
                        <div className="stat-value" style={{ fontSize: 22 }}>
                          {playedCount}/{totalReal}
                        </div>
                        <div className="stat-label">Matches</div>
                      </div>
                      <button
                        className="btn btn-danger btn-icon"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(t);
                        }}
                        title="Delete"
                        aria-label="Delete tournament"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
