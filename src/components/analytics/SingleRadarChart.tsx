'use client';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { normalizeForRadar } from '@/lib/algorithms/stats';
import type { CareerStats } from '@/lib/types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  stats: CareerStats;
  color?: string;
}

export default function SingleRadarChart({ stats, color = '#EA6C56' }: Props) {
  const normalized = normalizeForRadar(stats);

  const data = {
    labels: ['Goals/Match', 'Clean Sheets', 'Win Rate', 'Avg Rating', 'Possession'],
    datasets: [
      {
        label: stats.player_name,
        data: [
          normalized.goals,
          normalized.cleanSheets,
          normalized.winRate,
          normalized.avgRating,
          normalized.possession,
        ],
        backgroundColor: `${color}33`,
        borderColor: color,
        borderWidth: 2,
        pointBackgroundColor: color,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { r: number }; label: string }) =>
            `${ctx.label}: ${ctx.parsed.r.toFixed(0)}`,
        },
      },
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(201, 185, 190, 0.08)' },
        grid: { color: 'rgba(201, 185, 190, 0.06)' },
        pointLabels: { color: '#A18A93', font: { size: 11 } },
        ticks: { display: false },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  return <Radar data={data} options={options} />;
}
