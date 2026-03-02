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
      {/* Avatar */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(10,132,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 1.5,
          flexShrink: 0,
        }}
      >
        <PersonIcon sx={{ color: '#0A84FF', fontSize: 22 }} />
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600} noWrap>
          {player.name}
        </Typography>
        <Typography variant="caption" sx={{ color: '#8E8E93' }}>
          {player.base_team}
        </Typography>
      </Box>

      <ChevronRightIcon sx={{ color: '#48484A', fontSize: 20 }} />
    </Box>
  );
}
