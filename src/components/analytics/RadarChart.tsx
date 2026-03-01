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
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
        borderColor: '#00d4ff',
        borderWidth: 2,
        pointBackgroundColor: '#00d4ff',
      },
      {
        label: player2Stats.player_name,
        data: [p2.goals, p2.cleanSheets, p2.winRate, p2.avgRating, p2.possession],
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: '#a855f7',
        borderWidth: 2,
        pointBackgroundColor: '#a855f7',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#e4e4e7' },
      },
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        grid: { color: 'rgba(255,255,255,0.08)' },
        pointLabels: { color: '#a1a1aa', font: { size: 12 } },
        ticks: { display: false },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  return <Radar data={data} options={options} />;
}
