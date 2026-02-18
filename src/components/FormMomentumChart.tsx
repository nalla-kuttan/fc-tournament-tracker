"use client";

import React from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface FormMomentumChartProps {
    data: {
        date: string;
        tournamentName: string;
        rating: number;
        result: string;
    }[];
}

export default function FormMomentumChart({ data }: FormMomentumChartProps) {
    const chartData = {
        labels: data.map((d, i) => `Match ${i + 1}`),
        datasets: [
            {
                label: "Performance Rating",
                data: data.map((d) => d.rating),
                borderColor: "rgba(0, 243, 255, 1)",
                backgroundColor: "rgba(0, 243, 255, 0.1)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: data.map((d) =>
                    d.result === "W" ? "#00ff88" : d.result === "L" ? "#ff5252" : "#ffbb00"
                ),
                pointRadius: 5,
                pointHoverRadius: 8,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const item = data[context.dataIndex];
                        return [`Rating: ${item.rating}`, `Match: ${item.result} in ${item.tournamentName}`];
                    },
                },
            },
        },
        scales: {
            y: {
                min: 0,
                max: 10,
                grid: {
                    color: "rgba(255, 255, 255, 0.05)",
                },
                ticks: {
                    color: "var(--text-muted)",
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: "var(--text-muted)",
                },
            },
        },
    };

    return (
        <div style={{ height: "300px", width: "100%" }}>
            <Line data={chartData} options={options} />
        </div>
    );
}
