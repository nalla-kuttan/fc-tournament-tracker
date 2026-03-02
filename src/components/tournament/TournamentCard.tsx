'use client';

import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TOURNAMENT_STATUSES } from '@/lib/constants';
import type { Tournament } from '@/lib/types';

const FORMAT_ICONS: Record<string, string> = {
  league: '🏟️',
  knockout: '🏆',
  cup: '🏅',
};

export default function TournamentCard({ tournament, showDivider = true }: { tournament: Tournament; showDivider?: boolean }) {
  const router = useRouter();
  const statusConfig = TOURNAMENT_STATUSES[tournament.status];

  return (
    <Box
      onClick={() => router.push(`/tournaments/${tournament.id}`)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        borderBottom: showDivider ? '0.5px solid rgba(255,255,255,0.08)' : 'none',
        '&:active': { background: 'rgba(255,255,255,0.05)' },
      }}
    >
      {/* Format icon */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 1.5,
          fontSize: '1.25rem',
          flexShrink: 0,
        }}
      >
        {FORMAT_ICONS[tournament.format] || '🏟️'}
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600} noWrap>
          {tournament.name}
        </Typography>
        <Typography variant="caption" sx={{ color: '#8E8E93' }}>
          {tournament.format.charAt(0).toUpperCase() + tournament.format.slice(1)} &middot; {new Date(tournament.created_at).toLocaleDateString()}
        </Typography>
      </Box>

      {/* Status chip */}
      <Chip
        label={statusConfig.label}
        size="small"
        sx={{
          bgcolor: `${statusConfig.color}15`,
          color: statusConfig.color,
          fontWeight: 600,
          fontSize: '0.7rem',
          height: 24,
          mr: 0.5,
        }}
      />

      <ChevronRightIcon sx={{ color: '#48484A', fontSize: 20 }} />
    </Box>
  );
}
