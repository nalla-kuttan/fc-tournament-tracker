'use client';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import SvgIcon from '@mui/material/SvgIcon';

const ARCHETYPE_META: Record<string, { color: string; label: string; path: string }> = {
  'New Prospect': {
    color: '#60A5FA',
    label: 'New Prospect',
    path: 'M12 2 7.5 8.5 3 10l3.2 2.5L5 17l4.5-1.2L12 21l2.5-5.2L19 17l-1.2-4.5L21 10l-4.5-1.5L12 2Zm0 4.1 2.5 3.7 3 .9-2.4 1.9.8 3.1-3.1-.9L12 17.4l-1.8-2.6-3.1.9.8-3.1-2.4-1.9 3-.9L12 6.1Z',
  },
  Finisher: {
    color: '#F59E0B',
    label: 'Finisher',
    path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2.2 2.2 1.6-.8 2.6h-2.8l-.8-2.6L12 4.2ZM5.1 10.3l2.5-1.8 2.2 1.6-.9 2.7H6.2l-1.1-2.5Zm3.2 7.1.9-2.7h2.8l1.6 2.2-1.6 2.2a7.8 7.8 0 0 1-3.7-1.7Zm7.4 0L14 15.2l.9-2.7h2.8l1.1 2.5a7.8 7.8 0 0 1-3.1 2.4Zm2.1-4.6h-2.8l-.9-2.7 2.2-1.6 2.5 1.8-1 2.5Z',
  },
  'Defensive Wall': {
    color: '#22C55E',
    label: 'Defensive Wall',
    path: 'M12 2 4 5v6.2c0 5 3.4 8.5 8 10.8 4.6-2.3 8-5.8 8-10.8V5l-8-3Zm0 2.4 5.8 2.2v4.6c0 3.7-2.3 6.4-5.8 8.3-3.5-1.9-5.8-4.6-5.8-8.3V6.6L12 4.4Zm-3 5.1h6v2H9v-2Zm0 3.5h6v2H9v-2Z',
  },
  'Possession Controller': {
    color: '#3B82F6',
    label: 'Possession Controller',
    path: 'M7 5a5 5 0 0 0-5 5h2.2A2.8 2.8 0 0 1 7 7.2h2.6L7.8 9 9.2 10.4 13.4 6 9.2 1.6 7.8 3 9.6 5H7Zm10 14a5 5 0 0 0 5-5h-2.2A2.8 2.8 0 0 1 17 16.8h-2.6l1.8-1.8-1.4-1.4L10.6 18l4.2 4.4 1.4-1.4-1.8-2H17ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  },
  'Big Game Player': {
    color: '#3B82F6',
    label: 'Big Game Player',
    path: 'M7 3h10v3h4v3c0 3.1-2.1 5.4-5 6.2A5.8 5.8 0 0 1 13 17v2h3v2H8v-2h3v-2a5.8 5.8 0 0 1-3-1.8C5.1 14.4 3 12.1 3 9V6h4V3Zm2 2v6c0 2 1.3 4 3 4s3-2 3-4V5H9Zm-4 3v1c0 1.6.8 2.9 2.1 3.6A8.7 8.7 0 0 1 7 11V8H5Zm12 0v3c0 .5 0 1.1-.1 1.6A4 4 0 0 0 19 9V8h-2Z',
  },
  'Serial Winner': {
    color: '#F59E0B',
    label: 'Serial Winner',
    path: 'M12 2 9.7 7.2 4 7.8l4.3 3.8L7 17.2l5-2.9 5 2.9-1.3-5.6L20 7.8l-5.7-.6L12 2Zm0 5 1 2.2 2.4.3-1.8 1.6.5 2.3-2.1-1.2-2.1 1.2.5-2.3-1.8-1.6 2.4-.3L12 7Zm-7 13h14v2H5v-2Z',
  },
  'Chaos Ball': {
    color: '#EF4444',
    label: 'Chaos Ball',
    path: 'M12 2a10 10 0 0 0-3.3 19.4l.8-2.1A7.8 7.8 0 0 1 4.2 12c0-1.3.3-2.5.9-3.5L8 11H5v2h6V7H9v2.4L6.3 6.7A7.8 7.8 0 0 1 19.8 12c0 1.3-.3 2.5-.9 3.5L16 13h3v-2h-6v6h2v-2.4l2.7 2.7A10 10 0 0 0 12 2Z',
  },
  'Clinical Finisher': {
    color: '#F97316',
    label: 'Clinical Finisher',
    path: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 2a8 8 0 0 1 7.7 6H16.9a5 5 0 0 0-2.9-2.9V4.3A8 8 0 0 1 12 4Zm0 5a3 3 0 1 1-3 3 3 3 0 0 1 3-3Zm-2-4.7v2.8A5 5 0 0 0 7.1 10H4.3A8 8 0 0 1 10 4.3ZM4.3 14h2.8a5 5 0 0 0 2.9 2.9v2.8A8 8 0 0 1 4.3 14Zm9.7 5.7v-2.8a5 5 0 0 0 2.9-2.9h2.8a8 8 0 0 1-5.7 5.7Z',
  },
  Counterpuncher: {
    color: '#A78BFA',
    label: 'Counterpuncher',
    path: 'M4 4h8v2H7.4l3.3 3.3-1.4 1.4L6 7.4V12H4V4Zm16 16h-8v-2h4.6l-3.3-3.3 1.4-1.4 3.3 3.3V12h2v8ZM8.5 13.5l5-5 2 2-5 5h-2v-2Zm-3 3 2-2v2h2l-2 2h-2v-2Z',
  },
  'Iron Curtain': {
    color: '#14B8A6',
    label: 'Iron Curtain',
    path: 'M3 3h18v18H3V3Zm2 2v4h4V5H5Zm6 0v4h4V5h-4Zm6 0v4h2V5h-2ZM5 11v4h4v-4H5Zm6 0v4h4v-4h-4Zm6 0v4h2v-4h-2ZM5 17v2h4v-2H5Zm6 0v2h4v-2h-4Zm6 0v2h2v-2h-2Z',
  },
  'Rating Machine': {
    color: '#EAB308',
    label: 'Rating Machine',
    path: 'M12 2 15 8l6.5.9-4.7 4.6 1.1 6.5-5.9-3.1L6.1 20l1.1-6.5-4.7-4.6L9 8l3-6Zm0 4.5-1.7 3.4-3.8.5 2.8 2.7-.7 3.8 3.4-1.8 3.4 1.8-.7-3.8 2.8-2.7-3.8-.5L12 6.5Z',
  },
  'Relentless Attacker': {
    color: '#EF4444',
    label: 'Relentless Attacker',
    path: 'm13 2-1 7h5l-8 13 1-8H5l8-12Zm-1.6 9-.4 3h2.5l-1 2.8L15.2 11h-3.8Z',
  },
  'Balanced Operator': {
    color: '#60A5FA',
    label: 'Balanced Operator',
    path: 'M11 3h2v3h5v2H6V6h5V3Zm-5.5 7h13L16 17H8l-2.5-7Zm2.8 2 1.1 3h5.2l1.1-3H8.3ZM5 19h14v2H5v-2Z',
  },
};

export function getArchetypeMeta(archetype: string) {
  return ARCHETYPE_META[archetype] ?? ARCHETYPE_META['Balanced Operator'];
}

export default function ArchetypeIcon({
  archetype,
  size = 34,
  showTooltip = true,
}: {
  archetype: string;
  size?: number;
  showTooltip?: boolean;
}) {
  const meta = getArchetypeMeta(archetype);
  const icon = (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: `${Math.max(8, size * 0.28)}px`,
        display: 'grid',
        placeItems: 'center',
        color: meta.color,
        bgcolor: `${meta.color}18`,
        border: `1px solid ${meta.color}35`,
        flexShrink: 0,
      }}
    >
      <SvgIcon sx={{ fontSize: size * 0.58 }}>
        <path d={meta.path} />
      </SvgIcon>
    </Box>
  );

  return showTooltip ? <Tooltip title={meta.label}>{icon}</Tooltip> : icon;
}
