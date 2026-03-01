'use client';

import Card from '@mui/material/Card';
import type { CardProps } from '@mui/material/Card';

export default function GlassCard({ sx, children, ...props }: CardProps) {
  return (
    <Card
      sx={{
        background: '#1C1C1E',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        borderRadius: '12px',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
