"use client";

import React from "react";
import { StandingsRow } from "@/lib/types";
import FormGuide from "./FormGuide";

interface StandingsTableProps {
    rows: StandingsRow[];
}

export default function StandingsTable({ rows }: StandingsTableProps) {
    return (
        <div className="table-wrap">
            <table className="table">
                <thead>
                    <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Player</th>
                        <th>Team</th>
                        <th>P</th>
                        <th>W</th>
                        <th>D</th>
                        <th>L</th>
                        <th>GF</th>
                        <th>GA</th>
                        <th>GD</th>
                        <th>Pts</th>
                        <th>Form</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === rows.length - 1 && rows.length > 1;
                        return (
                            <tr
                                key={row.playerId}
                                className={`${isFirst ? "rank-1" : ""} ${isLast ? "rank-last" : ""}`}
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <td>
                                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        {isFirst && "🏆"}
                                        {isLast && "🔻"}
                                        {!isFirst && !isLast && (idx + 1)}
                                    </span>
                                </td>
                                <td style={{ fontWeight: 600 }}>{row.playerName}</td>
                                <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{row.team}</td>
                                <td>{row.played}</td>
                                <td>{row.won}</td>
                                <td>{row.drawn}</td>
                                <td>{row.lost}</td>
                                <td>{row.goalsFor}</td>
                                <td>{row.goalsAgainst}</td>
                                <td
                                    style={{
                                        color:
                                            row.goalDifference > 0
                                                ? "var(--accent-green)"
                                                : row.goalDifference < 0
                                                    ? "var(--accent-red)"
                                                    : "var(--text-secondary)",
                                        fontWeight: 600,
                                    }}
                                >
                                    {row.goalDifference > 0 ? "+" : ""}
                                    {row.goalDifference}
                                </td>
                                <td>
                                    <span
                                        style={{
                                            fontFamily: "var(--font-heading)",
                                            fontWeight: 800,
                                            fontSize: 16,
                                        }}
                                    >
                                        {row.points}
                                    </span>
                                </td>
                                <td>
                                    <FormGuide form={row.form} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
