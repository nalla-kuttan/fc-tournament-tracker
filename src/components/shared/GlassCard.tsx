'use client';

import Card from '@mui/material/Card';
import type { CardProps } from '@mui/material/Card';

export default function GlassCard({ sx, children, ...props }: CardProps) {
  return (
    <Card
      sx={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: 'rgba(34, 197, 94, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.08)',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
