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
        px: 2,
      }}
    >
      <Box sx={{ fontSize: 64, mb: 2, opacity: 0.5 }}>{icon}</Box>
      <Typography variant="h5" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
