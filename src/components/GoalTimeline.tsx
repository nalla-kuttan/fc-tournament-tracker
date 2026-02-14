"use client";

import React from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const LINE_COLORS = [
    "rgba(0, 229, 255, 1)",
    "rgba(176, 136, 255, 1)",
    "rgba(255, 215, 0, 1)",
    "rgba(0, 230, 118, 1)",
    "rgba(255, 82, 82, 1)",
];

const LINE_BG_COLORS = [
    "rgba(0, 229, 255, 0.08)",
    "rgba(176, 136, 255, 0.08)",
    "rgba(255, 215, 0, 0.08)",
    "rgba(0, 230, 118, 0.08)",
    "rgba(255, 82, 82, 0.08)",
];

interface PlayerGoalData {
    playerName: string;
    goalsPerRound: number[]; // cumulative goals after each round
}

interface Props {
    players: PlayerGoalData[];
    roundLabels: string[];
}

export default function GoalTimeline({ players, roundLabels }: Props) {
    const data = {
        labels: roundLabels,
        datasets: players.map((p, i) => ({
            label: p.playerName,
            data: p.goalsPerRound,
            borderColor: LINE_COLORS[i % LINE_COLORS.length],
            backgroundColor: LINE_BG_COLORS[i % LINE_BG_COLORS.length],
            tension: 0.35,
            borderWidth: 2.5,
            pointBackgroundColor: LINE_COLORS[i % LINE_COLORS.length],
            pointBorderColor: "#0a0f1e",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
        })),
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index" as const,
            intersect: false,
        },
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
            x: {
                grid: { color: "rgba(255,255,255,0.05)" },
                ticks: {
                    color: "rgba(255,255,255,0.5)",
                    font: { size: 12, family: "'Inter', sans-serif" },
                },
            },
            y: {
                beginAtZero: true,
                grid: { color: "rgba(255,255,255,0.05)" },
                ticks: {
                    stepSize: 1,
                    color: "rgba(255,255,255,0.5)",
                    font: { size: 11, family: "'Inter', sans-serif" },
                },
            },
        },
    };

    return (
        <div style={{ height: 300, position: "relative" }}>
            <Line data={data} options={options} />
        </div>
    );
}
