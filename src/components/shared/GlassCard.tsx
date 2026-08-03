'use client';

import Card from '@mui/material/Card';
import type { CardProps } from '@mui/material/Card';

export default function GlassCard({ sx, children, ...props }: CardProps) {
  return (
    <Card
      sx={{
        background: '#0F172A',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        boxShadow: 'none',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'background-color 180ms ease, border-color 180ms ease',
        '&:hover': {
          borderColor: 'rgba(148, 163, 184, 0.2)',
          background: '#111C31',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
