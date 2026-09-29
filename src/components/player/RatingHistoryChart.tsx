'use client';

import { useCallback, useRef, useState } from 'react';
import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip, type Plugin } from 'chart.js';
import { Line } from 'react-chartjs-2';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { BRAND_COLORS } from '@/design-tokens';
import { fetcher } from '@/lib/fetcher';
import type { RatingHistoryPoint } from '@/lib/tournament-results';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const DRAW_MS = 1600;

// Title wins get a glowing trophy-gold dot drawn over the line.
const titleGlow: Plugin<'line'> = {
  id: 'titleGlow',
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0);
    const flags = (chart.data.datasets[0] as { titleFlags?: boolean[] }).titleFlags ?? [];
    const { ctx } = chart;
    ctx.save();
    meta.data.forEach((point, index) => {
      if (!flags[index]) return;
      const { x, y } = point.getProps(['x', 'y'], true) as { x: number; y: number };
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#FCE7A8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    ctx.restore();
  },
};

type AnimationContext = { type: string; index: number; chart: ChartJS; xStarted?: boolean; yStarted?: boolean };

// Chart.js's progressive-line recipe: each point waits its turn, and starts
// from the previous point's height so the line draws itself left to right.
function drawIn(count: number, startRating: number) {
  const step = DRAW_MS / Math.max(count, 1);
  const previousY = (context: AnimationContext) => (context.index === 0
    ? context.chart.scales.y.getPixelForValue(startRating)
    : (context.chart.getDatasetMeta(0).data[context.index - 1]?.getProps(['y'], true) as { y: number } | undefined)?.y);
  return {
    x: {
      type: 'number', easing: 'linear', duration: step, from: NaN,
      delay: (context: AnimationContext) => {
        if (context.type !== 'data' || context.xStarted) return 0;
        context.xStarted = true;
        return context.index * step;
      },
    },
    y: {
      type: 'number', easing: 'linear', duration: step, from: previousY,
      delay: (context: AnimationContext) => {
        if (context.type !== 'data' || context.yStarted) return 0;
        context.yStarted = true;
        return context.index * step;
      },
    },
  } as never;
}

// Starts drawing only once the chart scrolls into view. A callback ref, as
// the chart box only exists once data has loaded.
function useInView() {
  const [inView, setInView] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const ref = useCallback((node: HTMLDivElement | null) => {
    observer.current?.disconnect();
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    observer.current = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setInView(true);
        observer.current?.disconnect();
      }
    }, { threshold: 0.3 });
    observer.current.observe(node);
  }, []);
  return [ref, inView] as const;
}

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
  const [viewRef, inView] = useInView();
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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
      <Box ref={viewRef} sx={{ height: 240 }} role="img" aria-label={`Rating over ${points.length} matches, from ${points[0].ratingBefore} to ${data.current}; peak ${data.peak}, low ${data.lowest}.`}>
        {inView && <Line
          plugins={[titleGlow]}
          data={{
            labels: points.map((_, index) => index + 1),
            datasets: [{
              data: points.map((point) => point.ratingAfter),
              titleFlags: points.map((point) => point.titleWon),
              borderColor: BRAND_COLORS.coral,
              borderWidth: 2.5,
              tension: 0.25,
              fill: 'start',
              backgroundColor: (context: { chart: ChartJS }) => {
                const { ctx, chartArea } = context.chart;
                if (!chartArea) return 'rgba(234, 108, 86, 0.1)';
                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'rgba(234, 108, 86, 0.32)');
                gradient.addColorStop(1, 'rgba(234, 108, 86, 0)');
                return gradient;
              },
              pointRadius: 0,
              pointHoverRadius: 5,
              pointBackgroundColor: points.map((point) => (point.titleWon ? TITLE_COLOR : BRAND_COLORS.coral)),
              pointBorderColor: points.map((point) => (point.titleWon ? TITLE_COLOR : BRAND_COLORS.coral)),
            } as never],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            // The line draws itself left to right, point by point.
            animation: reduceMotion ? false : drawIn(points.length, points[0].ratingBefore),
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
        />}
      </Box>
    </Box>
  );
}
