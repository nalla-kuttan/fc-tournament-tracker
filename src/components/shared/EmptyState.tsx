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
        py: { xs: 5, sm: 7 },
        px: 3,
        background: '#241019',
        border: '1px solid rgba(201, 185, 190, 0.12)',
        borderRadius: '16px',
      }}
    >
      <Box
        sx={{
          fontSize: 64,
          mb: 2,
          color: '#7E8CC2',
          opacity: 0.8,
        }}
      >
        {icon}
      </Box>
      <Typography component="h2" variant="h5" sx={{ color: '#FFF7F6', fontWeight: 700 }} gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" sx={{ color: '#D7C6CB', mb: 3, maxWidth: 480, mx: 'auto' }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
