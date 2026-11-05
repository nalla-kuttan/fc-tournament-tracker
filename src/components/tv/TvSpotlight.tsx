'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { MatchPreviewData } from '@/components/tournament/MatchPreview';
import { fetcher } from '@/lib/fetcher';
import type { PunditRow } from '@/lib/predictions';
import type { TournamentLeader } from '@/lib/tv-mode';

const ROTATE_MS = 12000;

interface Fixture {
  id: string;
  homeName: string;
  awayName: string;
}

interface Props {
  tournamentId: string;
  // The match being played, or the next one up.
  fixture: Fixture | null;
  // A match is being scored right now: hold on the matchup.
  live: boolean;
  leaders: TournamentLeader[];
  later: Fixture[];
}

const label = { fontSize: '1rem', fontWeight: 700, letterSpacing: '0.24em' } as const;

function Matchup({ fixture }: { fixture: Fixture }) {
  const { data } = useSWR<MatchPreviewData>(`/api/matches/${fixture.id}/preview`, fetcher, { revalidateOnFocus: false, refreshInterval: 30000, onError: () => undefined });
  if (!data) return null;
  const { h2h } = data;
  const picks = { home: [] as string[], draw: [] as string[], away: [] as string[] };
  for (const prediction of data.predictions) picks[prediction.pick].push(prediction.name);
  const pickLabel = { home: fixture.homeName, draw: 'Draw', away: fixture.awayName };
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {h2h.meetings > 0 ? (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'baseline', gap: 2 }}>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 700 }} noWrap>{fixture.homeName}</Typography>
            <Typography sx={{ fontSize: '2.4rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{h2h.homeWins}–{h2h.draws}–{h2h.awayWins}</Typography>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, textAlign: 'right' }} noWrap>{fixture.awayName}</Typography>
          </Box>
          <Box aria-hidden sx={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', mt: 1, bgcolor: 'rgba(201, 185, 190, 0.15)' }}>
            <Box sx={{ flex: h2h.homeWins, bgcolor: '#EA6C56' }} />
            <Box sx={{ flex: h2h.draws, bgcolor: 'rgba(201, 185, 190, 0.45)' }} />
            <Box sx={{ flex: h2h.awayWins, bgcolor: '#7E8CC2' }} />
          </Box>
          <Typography sx={{ color: 'text.secondary', fontSize: '1rem', mt: 0.75, textAlign: 'center' }}>Wins – draws – wins in {h2h.meetings} {h2h.meetings === 1 ? 'meeting' : 'meetings'}</Typography>
        </Box>
      ) : (
        <Typography sx={{ fontSize: '1.6rem', fontWeight: 700 }}>{fixture.homeName} and {fixture.awayName} have never met.</Typography>
      )}
      {data.hype.filter((line) => line.kind !== 'first-meeting').slice(0, 2).map((line) => (
        <Typography key={line.text} sx={{ fontSize: '1.35rem', lineHeight: 1.3 }}>{line.text}</Typography>
      ))}
      {data.predictions.length > 0 && (
        <Box sx={{ display: 'grid', gap: 0.5 }}>
          <Typography sx={{ ...label, fontSize: '0.875rem', color: 'text.secondary' }}>THE GROUP&apos;S PICKS</Typography>
          {(['home', 'draw', 'away'] as const).filter((pick) => picks[pick].length > 0).map((pick) => (
            <Typography key={pick} sx={{ fontSize: '1.25rem' }}>
              <Box component="span" sx={{ fontWeight: 700 }}>{pickLabel[pick]}</Box>
              <Box component="span" sx={{ color: 'text.secondary' }}> · {picks[pick].join(', ')}</Box>
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}

function Leaders({ leaders }: { leaders: TournamentLeader[] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      {leaders.map((leader) => (
        <Box key={leader.label} sx={{ minWidth: 0 }}>
          <Typography sx={{ ...label, fontSize: '0.875rem', color: 'text.secondary' }}>{leader.label.toUpperCase()}</Typography>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.15 }} noWrap>{leader.name}</Typography>
          <Typography sx={{ fontSize: '1.1rem', color: '#FF8A73' }}>{leader.value}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function Pundits({ table }: { table: PunditRow[] }) {
  return (
    <Box sx={{ display: 'grid', gap: 0.75 }}>
      {table.slice(0, 5).map((row, index) => (
        <Box key={row.predictorId} sx={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'baseline', gap: 1.5 }}>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: index === 0 ? '#F59E0B' : 'text.secondary' }}>{index + 1}</Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, fontStyle: row.model ? 'italic' : 'normal' }} noWrap>{row.name}</Typography>
          <Typography sx={{ fontSize: '1.25rem', fontVariantNumeric: 'tabular-nums' }}>{row.correct}<Box component="span" sx={{ color: 'text.secondary' }}>/{row.picks}</Box></Typography>
        </Box>
      ))}
    </Box>
  );
}

function Later({ fixtures }: { fixtures: Fixture[] }) {
  return (
    <Box>
      {fixtures.slice(0, 4).map((fixture) => (
        <Typography key={fixture.id} sx={{ fontSize: '1.35rem', py: 0.5 }}>
          {fixture.homeName} <Box component="span" sx={{ color: 'text.secondary' }}>vs</Box> {fixture.awayName}
        </Typography>
      ))}
    </Box>
  );
}

// One panel that cycles between talking points while there's no match on:
// the next matchup, tournament leaders, the prediction league and what's
// coming up later.
export default function TvSpotlight({ tournamentId, fixture, live, leaders, later }: Props) {
  const reduceMotion = useReducedMotion();
  const { data: pundits } = useSWR<{ available: boolean; table: PunditRow[] }>(`/api/tournaments/${tournamentId}/pundits`, fetcher, { revalidateOnFocus: false, refreshInterval: 60000, onError: () => undefined });
  const panels = useMemo(() => {
    const list: Array<{ key: string; title: string; render: () => React.ReactNode }> = [];
    if (fixture) list.push({ key: `matchup-${fixture.id}`, title: live ? 'HEAD TO HEAD' : 'TALE OF THE TAPE', render: () => <Matchup fixture={fixture} /> });
    if (live) return list;
    if (leaders.length > 0) list.push({ key: 'leaders', title: 'TOURNAMENT LEADERS', render: () => <Leaders leaders={leaders} /> });
    if (pundits?.available && pundits.table.length > 0) list.push({ key: 'pundits', title: 'PREDICTION LEAGUE', render: () => <Pundits table={pundits.table} /> });
    if (later.length > 0) list.push({ key: 'later', title: 'LATER', render: () => <Later fixtures={later} /> });
    return list;
  }, [fixture, live, leaders, pundits, later]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (panels.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => current + 1), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [panels.length]);

  if (panels.length === 0) return null;
  const panel = panels[index % panels.length];
  return (
    <Box component="section" aria-label="Spotlight" sx={{ borderRadius: '20px', p: { xs: 2, md: 3 }, bgcolor: 'rgba(36, 16, 25, 0.75)', border: '1px solid rgba(201, 185, 190, 0.1)', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Typography sx={{ ...label, color: '#FF8A73' }}>{panel.title}</Typography>
        {panels.length > 1 && (
          <Box aria-hidden sx={{ display: 'flex', gap: 0.75, ml: 'auto' }}>
            {panels.map((entry, i) => (
              <Box key={entry.key} sx={{ width: i === index % panels.length ? 22 : 8, height: 8, borderRadius: 999, bgcolor: i === index % panels.length ? '#FF8A73' : 'rgba(201, 185, 190, 0.3)', transition: 'width 300ms ease' }} />
            ))}
          </Box>
        )}
      </Box>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={panel.key}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.35 }}
        >
          {panel.render()}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}
