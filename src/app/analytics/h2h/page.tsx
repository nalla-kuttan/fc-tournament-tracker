'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayerSelector from '@/components/analytics/PlayerSelector';
import H2HComparison from '@/components/analytics/H2HComparison';
import AIH2HModal from '@/components/ai/AIH2HModal';
import GlassCard from '@/components/shared/GlassCard';
import { getRivalries, type GoalLite, type RivalrySummary } from '@/lib/analytics-insights';
import { fetcher } from '@/lib/fetcher';
import { getPlayerImagePath } from '@/lib/player-images';
import type { RegisteredPlayer, H2HData, CareerStats, Match } from '@/lib/types';
import PageSkeleton from '@/components/shared/PageSkeleton';
import { userFacingError } from '@/lib/user-error';
import SectionTitle from '@/components/shared/SectionTitle';

interface GlobalData {
  career_stats: CareerStats[];
  all_matches: Match[];
  all_goals: GoalLite[];
  registered_players: RegisteredPlayer[];
  player_instances: { id: string; registered_player_id: string; name: string; team: string }[];
}

const EMPTY_PLAYERS: RegisteredPlayer[] = [];

function H2HPageContent() {
  const searchParams = useSearchParams();
  const requestedPlayer1Id = searchParams.get('p1') ?? '';
  const requestedPlayer2Id = searchParams.get('p2') ?? '';
  const requestedComparisonKey = requestedPlayer1Id && requestedPlayer2Id
    ? `/api/analytics/h2h?p1=${requestedPlayer1Id}&p2=${requestedPlayer2Id}`
    : null;
  const [player1Id, setPlayer1Id] = useState<string | null>(null);
  const [player2Id, setPlayer2Id] = useState<string | null>(null);
  const [comparisonKey, setComparisonKey] = useState<string | null>(null);
  const [h2hModalOpen, setH2hModalOpen] = useState(false);
  const { data: globalData } = useSWR<GlobalData>('/api/analytics/global', fetcher);
  const rivalries = useMemo(
    () => globalData
      ? getRivalries(globalData.registered_players, globalData.player_instances, globalData.all_matches)
      : [],
    [globalData]
  );
  // With nothing picked yet, open on the most-played rivalry instead of two empty pickers.
  const busiest = rivalries[0];
  const showingDefault = player1Id === null && player2Id === null && !requestedComparisonKey && Boolean(busiest);
  const defaultKey = showingDefault && busiest ? `/api/analytics/h2h?p1=${busiest.p1Id}&p2=${busiest.p2Id}` : null;
  const { data: h2hData, error, isLoading: loading } = useSWR<H2HData>(
    comparisonKey ?? requestedComparisonKey ?? defaultKey,
    fetcher
  );
  const players = globalData?.registered_players ?? EMPTY_PLAYERS;
  const player1 = players.find((player) => player.id === (player1Id ?? (requestedPlayer1Id || (showingDefault ? busiest?.p1Id : '')))) ?? null;
  const player2 = players.find((player) => player.id === (player2Id ?? (requestedPlayer2Id || (showingDefault ? busiest?.p2Id : '')))) ?? null;
  const otherRivalries = rivalries.filter((rivalry) => {
    const pair = [rivalry.p1Id, rivalry.p2Id];
    return !(player1 && player2 && pair.includes(player1.id) && pair.includes(player2.id));
  });

  const handleCompare = () => {
    if (!player1 || !player2) return;
    setComparisonKey(`/api/analytics/h2h?p1=${player1.id}&p2=${player2.id}`);
  };

  const chooseRivalry = (rivalry: RivalrySummary) => {
    const first = players.find((player) => player.id === rivalry.p1Id) ?? null;
    const second = players.find((player) => player.id === rivalry.p2Id) ?? null;
    setPlayer1Id(first?.id ?? '');
    setPlayer2Id(second?.id ?? '');
    if (first && second) {
      setComparisonKey(`/api/analytics/h2h?p1=${first.id}&p2=${second.id}`);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography component="h1" variant="h4" fontWeight={700} gutterBottom>
            Rivalries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pick two players to compare their meetings and careers.
          </Typography>
        </Box>
        {h2hData && player1 && player2 && (
          <Button
            variant="outlined"
            onClick={() => setH2hModalOpen(true)}
            startIcon={<AutoAwesomeIcon />}
            sx={{ color: '#EA6C56', borderColor: 'rgba(234, 108, 86,0.5)', '&:hover': { borderColor: '#EA6C56', bgcolor: 'rgba(234, 108, 86,0.1)' } }}
          >
            AI Analyst
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {userFacingError(error, 'This comparison', 'loaded')}
        </Alert>
      )}

      {showingDefault && busiest && (
        <Typography aria-live="polite" color="text.secondary" sx={{ mb: 2, maxWidth: '65ch' }}>
          Showing your most-played rivalry, {busiest.p1Name} vs {busiest.p2Name} ({busiest.matches.length} meetings). Pick any two players to compare others.
        </Typography>
      )}

      {/* Player Selection */}
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Grid size={{ xs: 12, sm: 5 }}>
          <PlayerSelector
            label="Player 1"
            value={player1}
            onChange={(player) => { setPlayer1Id(player?.id ?? ''); if (player2Id === null) setPlayer2Id(player2?.id ?? ''); }}
            excludeId={player2?.id}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }} sx={{ textAlign: 'center' }}>
          <CompareArrowsIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <PlayerSelector
            label="Player 2"
            value={player2}
            onChange={(player) => { setPlayer2Id(player?.id ?? ''); if (player1Id === null) setPlayer1Id(player1?.id ?? ''); }}
            excludeId={player1?.id}
          />
        </Grid>
      </Grid>

      <Button
        variant="contained"
        onClick={handleCompare}
        disabled={!player1 || !player2 || loading}
        fullWidth
        sx={{ mb: 4 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Compare'}
      </Button>

      {!globalData && <PageSkeleton rows={2} label="Loading rivalries" />}

      {/* Results */}
      {h2hData && <H2HComparison data={h2hData} />}

      {otherRivalries.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <SectionTitle title={h2hData ? 'Other rivalries' : 'Busiest rivalries'} />
          <Grid container spacing={2}>
            {otherRivalries.slice(0, 6).map((rivalry) => (
              <Grid key={`${rivalry.p1Id}-${rivalry.p2Id}`} size={{ xs: 12, md: 6 }}>
                <GlassCard sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => chooseRivalry(rivalry)} aria-label={`Compare ${rivalry.p1Name} and ${rivalry.p2Name}`} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Avatar
                          src={getPlayerImagePath(rivalry.p1Name)}
                          sx={{ width: 46, height: 46, border: '1px solid rgba(234, 108, 86, 0.45)' }}
                        >
                          {rivalry.p1Name.slice(0, 1)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={900} noWrap>{rivalry.p1Name}</Typography>
                          <Typography variant="caption" color="text.secondary">{rivalry.p1Wins} {rivalry.p1Wins === 1 ? 'win' : 'wins'}</Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ color: '#C9B9BE', fontSize: '0.72rem', fontWeight: 900 }}>VS</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, minWidth: 0 }}>
                        <Box sx={{ minWidth: 0, textAlign: 'right' }}>
                          <Typography fontWeight={900} noWrap>{rivalry.p2Name}</Typography>
                          <Typography variant="caption" color="text.secondary">{rivalry.p2Wins} {rivalry.p2Wins === 1 ? 'win' : 'wins'}</Typography>
                        </Box>
                        <Avatar
                          src={getPlayerImagePath(rivalry.p2Name)}
                          sx={{ width: 46, height: 46, border: '1px solid rgba(126, 140, 194, 0.45)' }}
                        >
                          {rivalry.p2Name.slice(0, 1)}
                        </Avatar>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {rivalry.draws} {rivalry.draws === 1 ? 'draw' : 'draws'} · {rivalry.totalGoals} goals
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#EA6C56', fontWeight: 800 }}>
                        {rivalry.matches.length} meetings
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Average margin {(rivalry.closeness / Math.max(rivalry.matches.length, 1)).toFixed(1)} goals
                    </Typography>
                  </CardContent>
                  </CardActionArea>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* AI Analyst Modal */}
      {player1 && player2 && h2hData && (
        <AIH2HModal
          open={h2hModalOpen}
          onClose={() => setH2hModalOpen(false)}
          player1={player1}
          player2={player2}
          h2hData={h2hData}
        />
      )}
    </Box>
  );
}

export default function H2HPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <H2HPageContent />
    </Suspense>
  );
}
