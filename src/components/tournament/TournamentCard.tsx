'use client';

import Link from 'next/link';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StadiumIcon from '@mui/icons-material/Stadium';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import { TOURNAMENT_STATUSES } from '@/lib/constants';
import type { Tournament } from '@/lib/types';

const FORMAT_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  league: {
    icon: <StadiumIcon sx={{ fontSize: 22, color: '#3B82F6' }} />,
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.1)',
  },
  knockout: {
    icon: <EmojiEventsIcon sx={{ fontSize: 22, color: '#F59E0B' }} />,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  cup: {
    icon: <MilitaryTechIcon sx={{ fontSize: 22, color: '#3B82F6' }} />,
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.1)',
  },
};

export default function TournamentCard({ tournament, showDivider = true }: { tournament: Tournament; showDivider?: boolean; index?: number }) {
  const statusConfig = TOURNAMENT_STATUSES[tournament.status];
  const formatConfig = FORMAT_CONFIG[tournament.format] || FORMAT_CONFIG.league;

  return (
      <Box
        component={Link}
        href={`/tournaments/${tournament.id}`}
        aria-label={`Open ${tournament.name}`}
        className="list-row"
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 2,
          cursor: 'pointer',
          color: 'inherit',
          textDecoration: 'none',
          borderBottom: showDivider ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
          transition: 'background 150ms ease, transform 150ms ease',
          '&:hover': {
            transform: 'translateX(2px)',
          },
          '&:active': {
            transform: 'scale(0.99)',
          },
          '&:focus-visible': { outline: '3px solid rgba(74, 222, 128, 0.7)', outlineOffset: -3 },
        }}
      >
      {/* Format icon - SVG instead of emoji */}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          background: formatConfig.bg,
          border: `1px solid ${formatConfig.color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2,
          flexShrink: 0,
          transition: 'all 200ms ease',
        }}
      >
        {formatConfig.icon}
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600} noWrap sx={{ letterSpacing: '0.01em' }}>
          {tournament.name}
        </Typography>
        <Typography variant="caption" sx={{ color: '#B6C3D5', fontSize: '0.875rem' }}>
          {tournament.format.charAt(0).toUpperCase() + tournament.format.slice(1)} &middot; {new Date(tournament.created_at).toLocaleDateString()}
        </Typography>
      </Box>

      {/* Status chip */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Chip
          label={statusConfig.label}
          size="small"
          sx={{
            bgcolor: `${statusConfig.color}12`,
            color: statusConfig.color,
            fontWeight: 600,
            fontSize: '0.875rem',
            height: 30,
            mr: 1,
            border: `1px solid ${statusConfig.color}25`,
            letterSpacing: '0.02em',
          }}
        />

        <ChevronRightIcon aria-hidden="true" sx={{ color: '#94A3B8', fontSize: 20 }} />
      </Box>
    </Box>
  );
}
