'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Link from 'next/link';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GlassCard from '@/components/shared/GlassCard';
import ShareImageButton from '@/components/shared/ShareImageButton';
import SectionTitle from '@/components/shared/SectionTitle';
import { fetcher } from '@/lib/fetcher';
import type { TournamentRecap as Recap } from '@/lib/tournament-recap';

const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`;
const PODIUM_COLORS = ['#F59E0B', '#C9B9BE', '#B7794A'];

export default function TournamentRecap({ tournamentId }: { tournamentId: string }) {
  const { data, isLoading, error } = useSWR<Recap>(`/api/tournaments/${tournamentId}/recap`, fetcher, {
    onError: () => undefined,
    revalidateOnFocus: false,
  });
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');

  if (error) return null;
  if (isLoading || !data) return <Skeleton variant="rounded" height={180} sx={{ mb: 3, bgcolor: 'rgba(201, 185, 190, 0.05)' }} />;
  if (data.matchesPlayed === 0) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.shareText);
      setCopied('done');
    } catch {
      setCopied('failed');
    }
    window.setTimeout(() => setCopied('idle'), 2500);
  };

  const facts = [
    ...data.awards.map((award) => ({ label: award.label, value: `${award.winners.join(' & ')} · ${award.value}` })),
    data.biggestWin && { label: 'Biggest win', value: `${data.biggestWin.winner} ${data.biggestWin.score} ${data.biggestWin.loser}` },
    data.biggestRiser && { label: 'Biggest riser', value: `${data.biggestRiser.name} ${signed(data.biggestRiser.change)} rating (${data.biggestRiser.from} → ${data.biggestRiser.to})` },
    data.biggestFaller && { label: 'Biggest faller', value: `${data.biggestFaller.name} ${signed(data.biggestFaller.change)} rating (${data.biggestFaller.from} → ${data.biggestFaller.to})` },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  return (
    <Box sx={{ mb: 3 }}>
      <SectionTitle
        title={data.decided ? 'Tournament recap' : 'Recap so far'}
        sx={{ flexWrap: 'wrap' }}
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {data.decided && (
              <Button size="small" variant="contained" startIcon={<AutoAwesomeIcon />} component={Link} href={`/tournaments/${tournamentId}/wrapped`}>
                Wrapped
              </Button>
            )}
            <ShareImageButton src={`/api/og/recap/${tournamentId}`} fileName={`${data.tournament.name.toLowerCase().replace(/\s+/g, '-')}-recap.png`} title={`${data.tournament.name} recap`} />
            <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => void copy()} aria-live="polite">
              {copied === 'done' ? 'Copied' : copied === 'failed' ? 'Copy failed' : 'Copy text'}
            </Button>
          </Box>
        }
      />
      <GlassCard>
        <CardContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 0.8fr) minmax(0, 1.2fr)' }, gap: { xs: 2, md: 3 } }}>
          <Box component="ol" aria-label="Podium" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
            {data.podium.map((row, index) => (
              <Box component="li" key={row.player_name} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box aria-hidden sx={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: `${PODIUM_COLORS[index]}22`, color: PODIUM_COLORS[index], fontWeight: 700, fontSize: '0.875rem' }}>
                  {index === 0 && data.decided ? <EmojiEventsIcon sx={{ fontSize: 18 }} /> : index + 1}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>
                    {row.player_name}{index === 0 && <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}> · {data.decided ? 'Champion' : 'Leader'}</Box>}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                    {row.points} pts · {row.wins}W {row.draws}D {row.losses}L · {signed(row.goal_difference)}
                  </Typography>
                </Box>
              </Box>
            ))}
            <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', mt: 0.5 }}>
              {data.matchesPlayed} matches · {data.goals} goals
            </Typography>
          </Box>
          <Box component="dl" sx={{ m: 0, display: 'grid', gap: 1 }}>
            {facts.map((fact) => (
              <Box key={fact.label} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '160px minmax(0, 1fr)' }, columnGap: 2 }}>
                <Typography component="dt" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{fact.label}</Typography>
                <Typography component="dd" sx={{ m: 0, fontWeight: 600, fontSize: '0.9375rem' }}>{fact.value}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </GlassCard>
    </Box>
  );
}
