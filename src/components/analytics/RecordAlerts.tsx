'use client';

import useSWR from 'swr';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FlagIcon from '@mui/icons-material/Flag';
import { fetcher } from '@/lib/fetcher';
import type { RecordAlert } from '@/lib/record-alerts';

// "On the line": records and milestones the next results could set.
export default function RecordAlerts({ limit = 4, size = 'normal', playerIds }: { limit?: number; size?: 'normal' | 'tv'; playerIds?: string[] }) {
  const { data } = useSWR<{ alerts: RecordAlert[] }>('/api/analytics/alerts', fetcher, { revalidateOnFocus: false, onError: () => undefined, refreshInterval: size === 'tv' ? 30000 : 0 });
  const alerts = (data?.alerts ?? []).filter((alert) => !playerIds || playerIds.includes(alert.playerId)).slice(0, limit);
  if (alerts.length === 0) return null;
  const tv = size === 'tv';

  return (
    <Box
      component="section"
      aria-label="On the line"
      sx={{
        borderRadius: tv ? '20px' : '16px',
        p: tv ? { xs: 2, md: 3 } : 2,
        mb: tv ? 0 : 1.5,
        background: 'linear-gradient(120deg, rgba(245, 158, 11, 0.12), rgba(36, 16, 25, 0.8) 60%)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
      }}
    >
      <Typography sx={{ fontSize: tv ? '1rem' : '0.8125rem', fontWeight: 700, letterSpacing: tv ? '0.24em' : '0.12em', color: '#F59E0B', mb: 1.25, textTransform: 'uppercase' }}>
        On the line
      </Typography>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: tv ? 1.25 : 0.75 }}>
        {alerts.map((alert) => (
          <Box component="li" key={`${alert.kind}-${alert.playerId}-${alert.text}`} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            {alert.kind === 'milestone'
              ? <FlagIcon aria-hidden sx={{ fontSize: tv ? 26 : 18, color: '#FCE7A8', mt: '2px' }} />
              : <LocalFireDepartmentIcon aria-hidden sx={{ fontSize: tv ? 26 : 18, color: alert.away === 0 ? '#F59E0B' : '#FF8A73', mt: '2px' }} />}
            <Typography sx={{ fontWeight: alert.away === 0 ? 700 : 600, fontSize: tv ? '1.35rem' : '0.9375rem' }}>{alert.text}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
