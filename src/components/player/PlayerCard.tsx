'use client';

import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { RegisteredPlayer } from '@/lib/types';

export default function PlayerCard({ player, showDivider = true }: { player: RegisteredPlayer; showDivider?: boolean }) {
  const router = useRouter();

  return (
    <Box
      onClick={() => router.push(`/players/${player.id}`)}
      className="list-row"
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 2,
        cursor: 'pointer',
        borderBottom: showDivider ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
        transition: 'background 150ms ease',
      }}
    >
      {/* Avatar */}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2,
          flexShrink: 0,
          transition: 'all 200ms ease',
        }}
      >
        <PersonIcon sx={{ color: '#22C55E', fontSize: 22 }} />
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600} noWrap sx={{ letterSpacing: '0.01em' }}>
          {player.name}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.8rem' }}>
          {player.base_team}
        </Typography>
      </Box>

      <ChevronRightIcon sx={{ color: '#334155', fontSize: 20 }} />
    </Box>
  );
}
