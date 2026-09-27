'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { fetcher } from '@/lib/fetcher';
import { getRivalries } from '@/lib/analytics-insights';
import { getStatsOverview, type StatsPeriod } from '@/lib/stats-overview';
import type { CareerStats, Match, RegisteredPlayer } from '@/lib/types';

const AIStatQuery = dynamic(() => import('@/components/ai/AIStatQuery'), { loading: () => <Skeleton variant="rounded" height={160} /> });

interface GlobalData {
  career_stats: CareerStats[];
  all_matches: Match[];
  registered_players: RegisteredPlayer[];
  player_instances: { id: string; registered_player_id: string; name: string; team: string }[];
}
const periods = { all: 'All time', '30': 'Last 30 days', '90': 'Last 90 days' };

export default function AnalyticsPage() {
  const [analystOpen, setAnalystOpen] = useState(false);
  const [period, setPeriod] = useState<StatsPeriod>('all');
  const { data, error, isLoading, mutate } = useSWR<GlobalData>('/api/analytics/global', fetcher, { onError: () => undefined, revalidateOnFocus: false });
  const overview = data ? getStatsOverview(data.all_matches, data.registered_players, data.player_instances, period) : null;
  const rivalry = data && overview ? getRivalries(data.registered_players, data.player_instances, overview.games)[0] : null;
  const scorer = overview?.scorers[0];
  const improving = overview?.improving[0];
  const tiedForm = (overview?.improving.length ?? 0) > 1;
  const tiedGoals = (overview?.scorers.length ?? 0) > 1;
  const stories = [
    {
      question: 'Who’s improving?',
      answer: improving ? `${improving.name}${tiedForm ? ' shares the biggest improvement' : ' is gaining momentum'}` : 'No clear improvement yet',
      detail: improving ? `${improving.latestPoints} points in the latest five matches, up from ${improving.previousPoints} in the previous five. ${tiedForm ? overview!.improving.map((p) => p.name).join(', ') + ' are tied.' : ''}` : 'A player needs ten dated matches in this period. We compare points from their latest five against the previous five and only highlight a positive change.',
      evidence: 'Form uses 3 points for a win, 1 for a draw. Ten matches per comparison.',
      href: improving ? `/players/${improving.id}` : '/analytics/global', action: improving ? 'View player form' : 'View player rankings',
    },
    {
      question: 'Who leads the busiest rivalry?',
      answer: rivalry ? rivalry.p1Wins === rivalry.p2Wins ? `${rivalry.p1Name} and ${rivalry.p2Name} are level` : `${rivalry.p1Wins > rivalry.p2Wins ? rivalry.p1Name : rivalry.p2Name} leads ${Math.max(rivalry.p1Wins, rivalry.p2Wins)}–${Math.min(rivalry.p1Wins, rivalry.p2Wins)}` : 'Your next rivalry starts on the pitch',
      detail: rivalry ? `${rivalry.p1Name} vs ${rivalry.p2Name} · ${rivalry.matches.length} meetings · ${rivalry.draws} draws.` : 'Record a match between two registered players to start their head-to-head story.',
      evidence: 'Selected by most meetings in this period. Lead is measured in wins.',
      href: '/analytics/h2h', action: 'Compare players',
    },
    {
      question: 'Who’s scoring the most?',
      answer: scorer ? `${scorer.name}${tiedGoals ? ' shares the scoring lead' : ' leads the scoring'}` : 'No scoring record yet',
      detail: scorer ? `${scorer.goals} goals in ${scorer.played} matches (${(scorer.goals / scorer.played).toFixed(1)} per match). ${tiedGoals ? overview!.scorers.map((p) => p.name).join(', ') + ' are tied on goals.' : ''}` : 'Completed match scorelines will build the scoring table here.',
      evidence: 'Goals come from final scores. Total goals determine the lead.',
      href: scorer ? `/players/${scorer.id}` : '/analytics/global', action: scorer ? 'View player record' : 'View player rankings',
    },
  ];

  return <Box sx={{ maxWidth: 1120 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 3 }}>
      <Box><Typography component="h1" variant="h4" fontWeight={700}>The story so far</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>Form, rivalries, and the numbers behind them.</Typography></Box>
      <TextField select label="Time range" value={period} onChange={(e) => setPeriod(e.target.value as StatsPeriod)} size="small" sx={{ minWidth: 170 }}>
        {Object.entries(periods).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
      </TextField>
    </Box>
    {error && <Alert severity="error" action={<Button color="inherit" onClick={() => void mutate()}>Retry</Button>} sx={{ mb: 2 }}>Stats could not be refreshed. {data ? 'Showing the last loaded data.' : 'Try again to load the match record.'}</Alert>}
    {isLoading && <Box aria-label="Loading stats">{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={160} sx={{ mb: 2 }} />)}</Box>}
    {overview && <>
      <Typography color="text.secondary" sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>{periods[period]} · {overview.games.length} completed matches · {overview.goals} goals · {overview.rows.filter((p) => p.played > 0).length} players</Typography>
      {overview.undated > 0 && <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: '65ch' }}>{overview.undated} undated matches count only toward all-time totals; form comparisons require recorded dates.</Typography>}
      {overview.games.length === 0 && <Alert severity="info" sx={{ mt: 2 }}>No completed matches in this period. Choose another time range or record a result from Play.</Alert>}
      <Box aria-live="polite">
        {stories.map((story) => <Box component="section" key={story.question} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr)' }, gap: { xs: 1, md: 4 }, py: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography component="h2" variant="body1" fontWeight={600} color="text.secondary">{story.question}</Typography>
          <Box><Typography component="h3" variant="h5" fontWeight={700}>{story.answer}</Typography>
            <Typography sx={{ mt: 1, maxWidth: '65ch' }}>{story.detail}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: '65ch' }}>{story.evidence}</Typography>
            <Button component={Link} href={story.href} endIcon={<ArrowForwardIcon />} sx={{ mt: 1, px: 0, color: 'secondary.light' }}>{story.action}</Button>
          </Box>
        </Box>)}
      </Box>
    </>}
    <Box sx={{ mt: 3, p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', borderRadius: '12px' }}>
      <Typography component="h2" variant="h6">Explore the bigger picture</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>Explore a tournament’s story, or ask AI about the all-time record below.</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button component={Link} href="/analytics/league" variant="outlined">Tournament stories</Button>
        <Button component={Link} href="/analytics/ai" sx={{ color: 'secondary.light' }}>Ask AI about the record</Button>
      </Box>
    </Box>
    {data && <Accordion expanded={analystOpen} onChange={(_, expanded) => setAnalystOpen(expanded)} sx={{ mt: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="stats-analyst-content" id="stats-analyst-heading">
        <Typography fontWeight={600}>Ask AI about these players · all-time record</Typography>
      </AccordionSummary>
      <AccordionDetails id="stats-analyst-content">
        <Typography color="text.secondary" sx={{ mb: 2, maxWidth: '65ch' }}>AI interpretation uses the full record, not the selected time range. Check its claims against the supporting match stats.</Typography>
        {analystOpen && <AIStatQuery careerStats={data.career_stats} />}
      </AccordionDetails>
    </Accordion>}
  </Box>;
}
