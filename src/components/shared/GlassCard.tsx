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
        background: '#0F172A',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        boxShadow: 'none',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'background-color 180ms ease, border-color 180ms ease',
        ...(interactive && {
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'rgba(148, 163, 184, 0.28)',
            background: '#111C31',
          },
          '&:active': {
            background: '#0D1729',
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
