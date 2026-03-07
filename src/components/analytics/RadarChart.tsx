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
  player1Stats: CareerStats;
  player2Stats: CareerStats;
}

export default function RadarChartComponent({ player1Stats, player2Stats }: Props) {
  const p1 = normalizeForRadar(player1Stats);
  const p2 = normalizeForRadar(player2Stats);

  const data = {
    labels: ['Goals/Match', 'Clean Sheets', 'Win Rate', 'Avg Rating', 'Possession'],
    datasets: [
      {
        label: player1Stats.player_name,
        data: [p1.goals, p1.cleanSheets, p1.winRate, p1.avgRating, p1.possession],
        backgroundColor: 'rgba(10, 132, 255, 0.2)',
        borderColor: '#22C55E',
        borderWidth: 2,
        pointBackgroundColor: '#22C55E',
      },
      {
        label: player2Stats.player_name,
        data: [p2.goals, p2.cleanSheets, p2.winRate, p2.avgRating, p2.possession],
        backgroundColor: 'rgba(191, 90, 242, 0.2)',
        borderColor: '#BF5AF2',
        borderWidth: 2,
        pointBackgroundColor: '#BF5AF2',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#FFFFFF' },
      },
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(148, 163, 184, 0.08)' },
        grid: { color: 'rgba(148, 163, 184, 0.06)' },
        pointLabels: { color: '#64748B', font: { size: 12 } },
        ticks: { display: false },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  return <Radar data={data} options={options} />;
}
