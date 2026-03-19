'use client';

import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { motion } from 'framer-motion';
import type { RegisteredPlayer } from '@/lib/types';

const MotionBox = motion.create(Box);

export default function PlayerCard({ player, showDivider = true, index = 0 }: { player: RegisteredPlayer; showDivider?: boolean; index?: number }) {
  const router = useRouter();

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
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
    </MotionBox>
  );
}
