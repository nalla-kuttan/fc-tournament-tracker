'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface Props {
  emoji: string;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

export default function FunFactCard({ emoji, title, value, subtitle, color }: Props) {
  return (
    <Box
      className="stat-card"
      sx={{
        minWidth: 160,
        maxWidth: 180,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        borderRadius: '16px',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: `${color}30`,
          boxShadow: `0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px ${color}15`,
        },
        // Subtle top accent line
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '20%',
          right: '20%',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: 0.5,
          borderRadius: '0 0 2px 2px',
        },
      }}
    >
      <Typography sx={{ fontSize: '1.4rem', lineHeight: 1, filter: 'saturate(0.8)' }}>{emoji}</Typography>
      <Typography
        variant="caption"
        sx={{
          color: '#475569',
          fontWeight: 700,
          fontSize: '0.6rem',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          mt: 0.5,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        fontWeight={700}
        sx={{
          color,
          lineHeight: 1.2,
          textShadow: `0 0 10px ${color}30`,
        }}
      >
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.2, fontSize: '0.75rem' }} noWrap>
        {subtitle}
      </Typography>
    </Box>
  );
}
