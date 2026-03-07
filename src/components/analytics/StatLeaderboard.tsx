'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';

interface LeaderboardEntry {
  rank: number;
  name: string;
  team: string;
  value: string;
}

interface Props {
  title: string;
  entries: LeaderboardEntry[];
  valueLabel?: string;
  accentColor?: string;
}

const MEDAL_COLORS = ['#FF9F0A', '#c0c0c0', '#cd7f32'];

export default function StatLeaderboard({ title, entries, valueLabel, accentColor = '#22C55E' }: Props) {
  if (entries.length === 0) return null;

  return (
    <GlassCard sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          {title}
        </Typography>
        {valueLabel && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5, mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Player</Typography>
            <Typography variant="caption" color="text.secondary">{valueLabel}</Typography>
          </Box>
        )}
        {entries.map((entry) => (
          <Box
            key={`${entry.rank}-${entry.name}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              py: 1,
              px: 0.5,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{
                width: 28,
                color: entry.rank <= 3 ? MEDAL_COLORS[entry.rank - 1] : 'text.secondary',
                fontFamily: 'monospace',
              }}
            >
              {entry.rank}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {entry.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {entry.team}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ color: accentColor, fontFamily: 'monospace', ml: 1 }}
            >
              {entry.value}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </GlassCard>
  );
}
