'use client';

import Card from '@mui/material/Card';
import type { CardProps } from '@mui/material/Card';

type GlassCardProps = CardProps & {
  interactive?: boolean;
};

export default function GlassCard({ sx, children, interactive = false, ...props }: GlassCardProps) {
  return (
    <Card
      sx={{
        background: '#241019',
        border: '1px solid rgba(201, 185, 190, 0.12)',
        boxShadow: 'none',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'background-color 180ms ease, border-color 180ms ease',
        ...(interactive && {
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'rgba(201, 185, 190, 0.28)',
            background: '#2D1620',
          },
          '&:active': {
            background: '#1D0D14',
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
