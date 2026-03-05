'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface GoalData {
  player_id: string;
  minute: number | null;
  match_id: string;
}

const BUCKETS = [
  { label: "0-15'", min: 0, max: 15 },
  { label: "16-30'", min: 16, max: 30 },
  { label: "31-45'", min: 31, max: 45 },
  { label: "46-60'", min: 46, max: 60 },
  { label: "61-75'", min: 61, max: 75 },
  { label: "76-90'", min: 76, max: 90 },
];

export default function GoalDistributionChart({ goals }: { goals: GoalData[] }) {
  // Only count goals that have a minute value
  const goalsWithMinute = goals.filter((g) => g.minute != null);

  if (goalsWithMinute.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center">
        No goal timing data available
      </Typography>
    );
  }

  const bucketCounts = BUCKETS.map((bucket) =>
    goalsWithMinute.filter((g) => g.minute! >= bucket.min && g.minute! <= bucket.max).length
  );

  const data = {
    labels: BUCKETS.map((b) => b.label),
    datasets: [
      {
        label: 'Goals',
        data: bucketCounts,
        backgroundColor: 'rgba(10, 132, 255, 0.6)',
        borderColor: '#0A84FF',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => `${ctx.parsed.x ?? 0} goals`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#8E8E93', stepSize: 1 },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#8E8E93', font: { weight: 600 as const } },
      },
    },
  };

  return (
    <Box>
      <Bar data={data} options={options} />
    </Box>
  );
}
