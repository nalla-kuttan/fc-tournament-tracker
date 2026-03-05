'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface Props {
  emoji: string;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

export default function FunFactCard({ emoji, title, value, subtitle, color }: Props) {
  return (
    <Box
      sx={{
        minWidth: 150,
        maxWidth: 170,
        background: '#1C1C1E',
        borderRadius: '12px',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        flexShrink: 0,
      }}
    >
      <Typography sx={{ fontSize: '1.6rem', lineHeight: 1 }}>{emoji}</Typography>
      <Typography
        variant="caption"
        sx={{
          color: '#8E8E93',
          fontWeight: 600,
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          mt: 0.5,
        }}
      >
        {title}
      </Typography>
      <Typography variant="body1" fontWeight={700} sx={{ color, lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: '#8E8E93', lineHeight: 1.2 }} noWrap>
        {subtitle}
      </Typography>
    </Box>
  );
}
