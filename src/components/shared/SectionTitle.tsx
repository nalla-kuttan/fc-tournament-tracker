import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

// The one section heading style: a real heading in sentence case, not a tiny
// all-caps label, so sections read as structure to people and screen readers.
export default function SectionTitle({
  title,
  action,
  component = 'h2',
  sx,
}: {
  title: ReactNode;
  action?: ReactNode;
  component?: 'h2' | 'h3';
  sx?: SxProps<Theme>;
}) {
  return (
    <Box sx={[{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 1.5 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Typography component={component} sx={{ fontSize: component === 'h2' ? '1.05rem' : '0.95rem', fontWeight: 700, color: 'text.primary' }}>
        {title}
      </Typography>
      {action}
    </Box>
  );
}
