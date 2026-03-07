'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { FORM_COLORS } from '@/lib/constants';
import type { Match, MatchStats } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface Props {
  matches: Match[];
  playerIds: Set<string>;
  title?: string;
}

export default function FormMomentumChart({ matches, playerIds, title }: Props) {
  const playerMatches = matches
    .filter(
      (m) =>
        m.is_played && !m.is_bye && (playerIds.has(m.home_player_id!) || playerIds.has(m.away_player_id!))
    )
    .sort((a, b) => (a.played_at ?? '').localeCompare(b.played_at ?? ''));

  // Compute per-match data
  const labels: string[] = [];
  const ratings: (number | null)[] = [];
  const results: ('W' | 'D' | 'L')[] = [];
  const pointColors: string[] = [];

  playerMatches.forEach((m, i) => {
    const stats = m.stats as MatchStats;
    const isHome = playerIds.has(m.home_player_id!);
    const rating = isHome ? (stats?.home_rating ?? null) : (stats?.away_rating ?? null);
    const myScore = isHome ? m.home_score! : m.away_score!;
    const oppScore = isHome ? m.away_score! : m.home_score!;

    const result: 'W' | 'D' | 'L' = myScore > oppScore ? 'W' : myScore < oppScore ? 'L' : 'D';

    labels.push(m.played_at ? dayjs(m.played_at).format('MMM D') : `Match ${i + 1}`);
    ratings.push(rating);
    results.push(result);
    pointColors.push(FORM_COLORS[result]);
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Match Rating',
        data: ratings,
        borderColor: '#22C55E',
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        pointRadius: 6,
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
          label: (ctx: TooltipItem<'line'>) => {
            const idx = ctx.dataIndex;
            const match = playerMatches[idx];
            const result = results[idx];
            const rating = ctx.parsed.y;
            const tournamentName = match.tournament?.name ?? '';
            return [
              `Rating: ${rating?.toFixed(1) ?? 'N/A'}`,
              `Result: ${result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}`,
              ...(tournamentName ? [`Tournament: ${tournamentName}`] : []),
            ];
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#64748B' },
      },
      x: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#64748B', maxRotation: 45 },
      },
    },
  };

  if (playerMatches.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center">
        No match data available
      </Typography>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
      )}
      <Line data={data} options={options} />
    </Box>
  );
}
