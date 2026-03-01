'use client';

import Card from '@mui/material/Card';
import type { CardProps } from '@mui/material/Card';

export default function GlassCard({ sx, children, ...props }: CardProps) {
  return (
    <Card
      sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
