'use client';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';
import type { CareerStats } from '@/lib/types';

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <GlassCard sx={{ textAlign: 'center' }}>
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ color: color ?? 'primary.main', fontFamily: 'monospace' }}
        >
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
          {label}
        </Typography>
      </CardContent>
    </GlassCard>
  );
}

export default function PlayerStatsGrid({ stats }: { stats: CareerStats }) {
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard label="Matches" value={stats.total_matches} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard label="Wins" value={stats.wins} color="#22c55e" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard label="Draws" value={stats.draws} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard label="Losses" value={stats.losses} color="#ef4444" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard label="Goals" value={stats.total_goals} color="#ffd700" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard label="Clean Sheets" value={stats.clean_sheets} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard label="Win Rate" value={`${stats.win_rate.toFixed(0)}%`} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard label="Goals/Match" value={stats.goals_per_match.toFixed(1)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard label="Avg xG" value={stats.avg_xg.toFixed(2)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard label="Avg Rating" value={stats.avg_rating.toFixed(1)} color="#a855f7" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard label="Avg Possession" value={`${stats.avg_possession.toFixed(0)}%`} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard label="MOTM Awards" value={stats.motm_awards} color="#ffd700" />
        </Grid>
      </Grid>
    </Box>
  );
}
