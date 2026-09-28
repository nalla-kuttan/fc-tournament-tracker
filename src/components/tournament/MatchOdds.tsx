'use client';

import useSWR from 'swr';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { BRAND_COLORS } from '@/design-tokens';
import { fetcher } from '@/lib/fetcher';
import type { FixtureOdds, OddsTrackRecord } from '@/lib/match-odds';

const percent = (value: number) => `${Math.round(value * 100)}%`;

// Win / draw / loss chances for a fixture, from the players' ratings going in.
// Percentages are written out so the bar never relies on colour alone.
export default function MatchOdds({ matchId, homeName, awayName, compact = false }: {
  matchId: string;
  homeName: string;
  awayName: string;
  compact?: boolean;
}) {
  const { data, error, isLoading } = useSWR<FixtureOdds & { trackRecord: OddsTrackRecord }>(
    `/api/matches/${matchId}/odds`,
    fetcher,
    { onError: () => undefined, revalidateOnFocus: false }
  );

  if (error) return null;
  if (isLoading || !data) return <Skeleton variant="rounded" height={compact ? 40 : 64} sx={{ bgcolor: 'rgba(201, 185, 190, 0.05)' }} />;

  const { odds, trackRecord, preMatch } = data;
  const segments = [
    { key: 'home', label: homeName, value: odds.home, color: BRAND_COLORS.coral },
    { key: 'draw', label: 'Draw', value: odds.draw, color: 'rgba(201, 185, 190, 0.45)' },
    { key: 'away', label: awayName, value: odds.away, color: BRAND_COLORS.frenchBlueLight },
  ];

  return (
    <Box aria-label={`${preMatch ? 'Pre-match odds' : 'Odds'}: ${segments.map((s) => `${s.label} ${percent(s.value)}`).join(', ')}`} role="group">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
        {segments.map((segment) => (
          <Typography key={segment.key} sx={{ fontSize: compact ? '0.8125rem' : '0.875rem', fontWeight: 700, textAlign: segment.key === 'home' ? 'left' : segment.key === 'draw' ? 'center' : 'right', flex: 1, minWidth: 0 }} noWrap>
            {segment.key === 'draw' ? `Draw ${percent(segment.value)}` : `${segment.label} ${percent(segment.value)}`}
          </Typography>
        ))}
      </Box>
      <Box aria-hidden sx={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', gap: '2px' }}>
        {segments.map((segment) => (
          <Box key={segment.key} sx={{ width: `${segment.value * 100}%`, bgcolor: segment.color }} />
        ))}
      </Box>
      {!compact && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', mt: 0.75 }}>
          {preMatch ? 'What the ratings said before kick-off. ' : 'From current ratings. '}
          {trackRecord.matches > 0 && `The favourite has won ${percent(trackRecord.accuracy)} of ${trackRecord.matches} past matches.`}
        </Typography>
      )}
    </Box>
  );
}
