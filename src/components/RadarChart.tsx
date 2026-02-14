"use client";

import React from "react";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface PlayerRadarData {
    playerName: string;
    color: string;
    goals: number;       // normalized 0-100
    cleanSheets: number;
    winRate: number;
    avgRating: number;   // normalized 0-100 (from 0-10 scale)
    possession: number;
}

const RADAR_COLORS = [
    "rgba(0, 229, 255, 0.7)",   // cyan
    "rgba(176, 136, 255, 0.7)", // purple
    "rgba(255, 215, 0, 0.7)",   // gold
    "rgba(0, 230, 118, 0.7)",   // green
    "rgba(255, 82, 82, 0.7)",   // red
];

const RADAR_BG_COLORS = [
    "rgba(0, 229, 255, 0.15)",
    "rgba(176, 136, 255, 0.15)",
    "rgba(255, 215, 0, 0.15)",
    "rgba(0, 230, 118, 0.15)",
    "rgba(255, 82, 82, 0.15)",
];

interface Props {
    players: PlayerRadarData[];
}

export default function RadarChart({ players }: Props) {
    const data = {
        labels: ["Goals", "Clean Sheets", "Win Rate", "Avg Rating", "Possession"],
        datasets: players.map((p, i) => ({
            label: p.playerName,
            data: [p.goals, p.cleanSheets, p.winRate, p.avgRating, p.possession],
            borderColor: RADAR_COLORS[i % RADAR_COLORS.length],
            backgroundColor: RADAR_BG_COLORS[i % RADAR_BG_COLORS.length],
            borderWidth: 2,
            pointBackgroundColor: RADAR_COLORS[i % RADAR_COLORS.length],
            pointBorderColor: "#0a0f1e",
            pointRadius: 4,
        })),
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom" as const,
                labels: {
                    color: "rgba(255,255,255,0.7)",
                    font: { size: 12, family: "'Inter', sans-serif" },
                    padding: 16,
                    usePointStyle: true,
                    pointStyle: "circle",
                },
            },
            tooltip: {
                backgroundColor: "rgba(10, 15, 30, 0.95)",
                borderColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
                titleFont: { size: 13, family: "'Inter', sans-serif" },
                bodyFont: { size: 12, family: "'Inter', sans-serif" },
                padding: 12,
                cornerRadius: 8,
            },
        },
        scales: {
            r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    stepSize: 25,
                    color: "rgba(255,255,255,0.3)",
                    backdropColor: "transparent",
                    font: { size: 10 },
                },
                grid: {
                    color: "rgba(255,255,255,0.08)",
                },
                angleLines: {
                    color: "rgba(255,255,255,0.08)",
                },
                pointLabels: {
                    color: "rgba(255,255,255,0.65)",
                    font: { size: 12, family: "'Inter', sans-serif", weight: 600 as const },
                },
            },
        },
    };

    return (
        <div style={{ height: 340, position: "relative" }}>
            <Radar data={data} options={options} />
        </div>
    );
}
