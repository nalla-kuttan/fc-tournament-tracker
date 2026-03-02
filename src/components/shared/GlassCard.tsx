'use client';

import Card from '@mui/material/Card';
import type { CardProps } from '@mui/material/Card';

export default function GlassCard({ sx, children, ...props }: CardProps) {
  return (
    <Card
      sx={{
        background: '#1C1C1E',
        border: 'none',
        boxShadow: 'none',
        borderRadius: '12px',
        overflow: 'hidden',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
