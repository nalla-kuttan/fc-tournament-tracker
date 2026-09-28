'use client';

import { CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { BRAND_COLORS } from '@/design-tokens';
import { fetcher } from '@/lib/fetcher';
import type { RatingHistoryPoint } from '@/lib/tournament-results';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

interface RatingHistoryResponse {
  points: Array<RatingHistoryPoint & { tournamentName: string; titleWon: boolean }>;
  current: number;
  peak: number;
  lowest: number;
  titles: number;
}

const TITLE_COLOR = '#F59E0B';

// Rating after every match, with each title win marked. The headline numbers
// are also written out above the chart.
export default function RatingHistoryChart({ playerId }: { playerId: string }) {
  const { data, isLoading, error } = useSWR<RatingHistoryResponse>(`/api/players/${playerId}/rating-history`, fetcher, {
    onError: () => undefined,
    revalidateOnFocus: false,
  });

  if (error) return null;
  if (isLoading || !data) return <Skeleton variant="rounded" height={260} sx={{ bgcolor: 'rgba(201, 185, 190, 0.05)' }} />;
  if (data.points.length < 2) {
    return <Typography color="text.secondary">Play a couple of matches to start a rating history.</Typography>;
  }

  const { points } = data;
  const titleMatches = points.filter((point) => point.titleWon).length;

  return (
    <Box>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mb: 1.5 }}>
        Now <strong>{data.current}</strong> · Peak <strong>{data.peak}</strong> · Low <strong>{data.lowest}</strong>
        {titleMatches > 0 && <> · <Box component="span" sx={{ color: TITLE_COLOR, fontWeight: 700 }}>●</Box> {data.titles} {data.titles === 1 ? 'title' : 'titles'}</>}
      </Typography>
      <Box sx={{ height: 240 }} role="img" aria-label={`Rating over ${points.length} matches, from ${points[0].ratingBefore} to ${data.current}; peak ${data.peak}, low ${data.lowest}.`}>
        <Line
          data={{
            labels: points.map((_, index) => index + 1),
            datasets: [{
              data: points.map((point) => point.ratingAfter),
              borderColor: BRAND_COLORS.coral,
              borderWidth: 2,
              tension: 0.25,
              pointRadius: points.map((point) => (point.titleWon ? 5 : 0)),
              pointHoverRadius: 5,
              pointBackgroundColor: points.map((point) => (point.titleWon ? TITLE_COLOR : BRAND_COLORS.coral)),
              pointBorderColor: points.map((point) => (point.titleWon ? TITLE_COLOR : BRAND_COLORS.coral)),
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: (items) => {
                    const point = points[items[0].dataIndex];
                    return `${point.result} vs ${point.opponentName} · ${point.tournamentName}`;
                  },
                  label: (item) => {
                    const point = points[item.dataIndex];
                    const change = point.ratingAfter - point.ratingBefore;
                    return `${point.ratingAfter} (${change >= 0 ? '+' : ''}${change})${point.titleWon ? ' · won the title' : ''}`;
                  },
                },
              },
            },
            scales: {
              x: { title: { display: true, text: 'Match', color: BRAND_COLORS.textSecondary }, ticks: { color: BRAND_COLORS.textSecondary, maxTicksLimit: 8 }, grid: { display: false } },
              y: { ticks: { color: BRAND_COLORS.textSecondary }, grid: { color: 'rgba(201, 185, 190, 0.08)' } },
            },
          }}
        />
      </Box>
    </Box>
  );
}
