import { memo } from 'react';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GlassCard from '@/components/shared/GlassCard';

export interface RecordBoardRow {
  playerId?: string;
  playerName: string;
  value: number | string;
  detail: string;
}

interface RecordBoardProps {
  title: string;
  rows: RecordBoardRow[];
  suffix?: string;
  emptyMessage?: string;
}

function RecordBoard({ title, rows, suffix = '', emptyMessage = 'No qualified records yet' }: RecordBoardProps) {
  return (
    <GlassCard sx={{ height: '100%' }}>
      <CardContent>
        <Typography component="h4" sx={{ fontWeight: 700, mb: 1.25 }}>{title}</Typography>
        {rows.length === 0 ? (
          <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem' }}>{emptyMessage}</Typography>
        ) : (
          <Stack component="ol" aria-label={`${title} leaderboard`} spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {rows.slice(0, 5).map((row, index) => (
              <Box component="li" key={`${row.playerId ?? row.playerName}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Typography aria-label={`Rank ${index + 1}`} sx={{ width: 26, color: '#4ADE80', fontWeight: 700 }}>#{index + 1}</Typography>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>{row.playerName}</Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem' }} noWrap>{row.detail}</Typography>
                </Box>
                <Chip label={`${row.value}${suffix}`} size="small" color={index === 0 ? 'primary' : 'default'} />
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </GlassCard>
  );
}

export default memo(RecordBoard);
