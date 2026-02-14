"use client";

import React from "react";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PlayerWDL {
    playerName: string;
    wins: number;
    draws: number;
    losses: number;
}

interface Props {
    players: PlayerWDL[];
}

export default function WDLCharts({ players }: Props) {
    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, minmax(90px, 1fr))`,
            gap: 12,
            maxWidth: "100%",
        }}>
            {players.map((p) => {
                const total = p.wins + p.draws + p.losses;
                if (total === 0) return null;

                const data = {
                    labels: ["Wins", "Draws", "Losses"],
                    datasets: [{
                        data: [p.wins, p.draws, p.losses],
                        backgroundColor: [
                            "rgba(0, 230, 118, 0.8)",
                            "rgba(255, 215, 0, 0.8)",
                            "rgba(255, 82, 82, 0.8)",
                        ],
                        borderColor: [
                            "rgba(0, 230, 118, 1)",
                            "rgba(255, 215, 0, 1)",
                            "rgba(255, 82, 82, 1)",
                        ],
                        borderWidth: 1,
                        hoverOffset: 4,
                    }],
                };

                const options = {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "50%",
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: "rgba(10, 15, 30, 0.95)",
                            borderColor: "rgba(255,255,255,0.1)",
                            borderWidth: 1,
                            titleFont: { size: 12 },
                            bodyFont: { size: 11 },
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                                label: (ctx: { label: string; parsed: number }) => {
                                    const pct = Math.round((ctx.parsed / total) * 100);
                                    return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
                                },
                            },
                        },
                    },
                };

                return (
                    <div key={p.playerName} style={{ textAlign: "center" }}>
                        <div style={{ height: 80, position: "relative" }}>
                            <Doughnut data={data} options={options} />
                        </div>
                        <div style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            marginTop: 8,
                        }}>
                            {p.playerName}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                            <span style={{ color: "rgba(0, 230, 118, 0.9)" }}>{p.wins}W</span>
                            {" "}
                            <span style={{ color: "rgba(255, 215, 0, 0.9)" }}>{p.draws}D</span>
                            {" "}
                            <span style={{ color: "rgba(255, 82, 82, 0.9)" }}>{p.losses}L</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
