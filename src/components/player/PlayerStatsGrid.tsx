'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import GlassCard from '@/components/shared/GlassCard';
import type { CareerStats } from '@/lib/types';

// The career numbers the profile header doesn't already show (win rate,
// goals, goals per match and Man of the Match live there), as a compact
// label/value list rather than a wall of equal cards.
export default function PlayerStatsGrid({ stats }: { stats: CareerStats }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Record', value: `${stats.wins}W · ${stats.draws}D · ${stats.losses}L from ${stats.total_matches}` },
    { label: 'Goals conceded', value: String(stats.total_conceded) },
    { label: 'Clean sheets', value: String(stats.clean_sheets) },
    { label: 'Average xG', value: stats.avg_xg > 0 ? stats.avg_xg.toFixed(2) : 'Not recorded' },
    { label: 'Average rating', value: stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : 'Not recorded' },
    { label: 'Average possession', value: stats.avg_possession > 0 ? `${stats.avg_possession.toFixed(0)}%` : 'Not recorded' },
  ];

  return (
    <GlassCard>
      <Box
        component="dl"
        sx={{
          m: 0,
          px: 2,
          py: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          columnGap: 4,
        }}
      >
        {rows.map((row) => (
          <Box
            key={row.label}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 2,
              py: 1.25,
              borderBottom: '1px solid rgba(201, 185, 190, 0.08)',
            }}
          >
            <Typography component="dt" sx={{ color: 'text.secondary', fontSize: '0.9375rem' }}>{row.label}</Typography>
            <Typography component="dd" sx={{ m: 0, fontWeight: 700, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{row.value}</Typography>
          </Box>
        ))}
      </Box>
    </GlassCard>
  );
}
