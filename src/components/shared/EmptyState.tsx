import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 3,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.06)',
        borderRadius: '20px',
      }}
    >
      <Box
        sx={{
          fontSize: 64,
          mb: 2,
          opacity: 0.3,
          filter: 'grayscale(0.3)',
        }}
      >
        {icon}
      </Box>
      <Typography variant="h5" sx={{ color: '#94A3B8', fontWeight: 600 }} gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" sx={{ color: '#64748B', mb: 3, maxWidth: 400, mx: 'auto' }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
