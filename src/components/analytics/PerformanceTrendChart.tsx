'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import type { Match, MatchStats } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const PLAYER_COLORS = [
  '#22C55E',
  '#BF5AF2',
  '#FF9F0A',
  '#34C759',
  '#FF3B30',
  '#5AC8FA',
];

interface PlayerInstance {
  id: string;
  registered_player_id: string;
  name: string;
  team: string;
}

interface RegisteredPlayer {
  id: string;
  name: string;
  base_team: string;
}

interface Props {
  matches: Match[];
  registeredPlayers: RegisteredPlayer[];
  playerInstances: PlayerInstance[];
}

export default function PerformanceTrendChart({ matches, registeredPlayers, playerInstances }: Props) {
  // Build registered player → instance ids
  const rpToInstances = new Map<string, Set<string>>();
  for (const pi of playerInstances) {
    if (!rpToInstances.has(pi.registered_player_id)) {
      rpToInstances.set(pi.registered_player_id, new Set());
    }
    rpToInstances.get(pi.registered_player_id)!.add(pi.id);
  }

  // Sort matches chronologically
  const sortedMatches = [...matches].sort((a, b) => (a.played_at ?? '').localeCompare(b.played_at ?? ''));

  // Build unique labels (match dates)
  const labels = sortedMatches.map((m, i) =>
    m.played_at ? dayjs(m.played_at).format('MMM D') : `M${i + 1}`
  );

  // Filter to players who have rating data
  const playersWithRatings = registeredPlayers.filter((rp) => {
    const instanceIds = rpToInstances.get(rp.id);
    if (!instanceIds) return false;
    return sortedMatches.some((m) => {
      const isHome = instanceIds.has(m.home_player_id!);
      const isAway = instanceIds.has(m.away_player_id!);
      if (!isHome && !isAway) return false;
      const stats = m.stats as MatchStats;
      if (!stats) return false;
      const rating = isHome ? stats.home_rating : stats.away_rating;
      return rating != null;
    });
  });

  if (playersWithRatings.length === 0 || sortedMatches.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center">
        No performance data available
      </Typography>
    );
  }

  // Build datasets — one per player
  const datasets = playersWithRatings.map((rp, idx) => {
    const instanceIds = rpToInstances.get(rp.id)!;
    const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];

    const data = sortedMatches.map((m) => {
      const isHome = instanceIds.has(m.home_player_id!);
      const isAway = instanceIds.has(m.away_player_id!);
      if (!isHome && !isAway) return null;
      const stats = m.stats as MatchStats;
      if (!stats) return null;
      return isHome ? (stats.home_rating ?? null) : (stats.away_rating ?? null);
    });

    return {
      label: rp.name,
      data,
      borderColor: color,
      backgroundColor: `${color}20`,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: color,
      spanGaps: true,
    };
  });

  const chartData = { labels, datasets };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#FFFFFF',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#64748B' },
        title: {
          display: true,
          text: 'Rating',
          color: '#64748B',
        },
      },
      x: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#64748B', maxRotation: 45 },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <Box>
      <Line data={chartData} options={options} />
    </Box>
  );
}
