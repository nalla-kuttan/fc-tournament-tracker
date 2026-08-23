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
import BackButton from '@/components/shared/BackButton';
import AIH2HModal from '@/components/ai/AIH2HModal';
import GlassCard from '@/components/shared/GlassCard';
import { getRivalries, type GoalLite, type RivalrySummary } from '@/lib/analytics-insights';
import { fetcher } from '@/lib/fetcher';
import { getPlayerImagePath } from '@/lib/player-images';
import type { RegisteredPlayer, H2HData, CareerStats, Match } from '@/lib/types';

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
  const { data: h2hData, error, isLoading: loading } = useSWR<H2HData>(
    comparisonKey ?? requestedComparisonKey,
    fetcher
  );
  const players = globalData?.registered_players ?? EMPTY_PLAYERS;
  const player1 = players.find((player) => player.id === (player1Id ?? requestedPlayer1Id)) ?? null;
  const player2 = players.find((player) => player.id === (player2Id ?? requestedPlayer2Id)) ?? null;
  const rivalries = useMemo(
    () => globalData
      ? getRivalries(globalData.registered_players, globalData.player_instances, globalData.all_matches)
      : [],
    [globalData]
  );

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
      <BackButton />
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography component="h1" variant="h4" fontWeight={700} gutterBottom>
            Head-to-Head
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compare career stats and direct encounters between two players
          </Typography>
        </Box>
        {h2hData && player1 && player2 && (
          <Button
            variant="outlined"
            onClick={() => setH2hModalOpen(true)}
            startIcon={<AutoAwesomeIcon />}
            sx={{ color: '#22C55E', borderColor: 'rgba(34,197,94,0.5)', '&:hover': { borderColor: '#22C55E', bgcolor: 'rgba(34,197,94,0.1)' } }}
          >
            AI Analyst
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error ? error.message : 'Something went wrong'}
        </Alert>
      )}

      {/* Player Selection */}
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Grid size={{ xs: 12, sm: 5 }}>
          <PlayerSelector
            label="Player 1"
            value={player1}
            onChange={(player) => setPlayer1Id(player?.id ?? '')}
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
            onChange={(player) => setPlayer2Id(player?.id ?? '')}
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

      {/* Results */}
      {h2hData && <H2HComparison data={h2hData} />}

      {!h2hData && rivalries.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Rivalry Discovery
          </Typography>
          <Grid container spacing={2}>
            {rivalries.slice(0, 6).map((rivalry) => (
              <Grid key={`${rivalry.p1Id}-${rivalry.p2Id}`} size={{ xs: 12, md: 6 }}>
                <GlassCard sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => chooseRivalry(rivalry)} aria-label={`Compare ${rivalry.p1Name} and ${rivalry.p2Name}`} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Avatar
                          src={getPlayerImagePath(rivalry.p1Name)}
                          sx={{ width: 46, height: 46, border: '1px solid rgba(34, 197, 94, 0.45)' }}
                        >
                          {rivalry.p1Name.slice(0, 1)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={900} noWrap>{rivalry.p1Name}</Typography>
                          <Typography variant="caption" color="text.secondary">Home</Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 900 }}>VS</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, minWidth: 0 }}>
                        <Box sx={{ minWidth: 0, textAlign: 'right' }}>
                          <Typography fontWeight={900} noWrap>{rivalry.p2Name}</Typography>
                          <Typography variant="caption" color="text.secondary">Away</Typography>
                        </Box>
                        <Avatar
                          src={getPlayerImagePath(rivalry.p2Name)}
                          sx={{ width: 46, height: 46, border: '1px solid rgba(96, 165, 250, 0.45)' }}
                        >
                          {rivalry.p2Name.slice(0, 1)}
                        </Avatar>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {rivalry.p1Wins}-{rivalry.draws}-{rivalry.p2Wins} record · {rivalry.totalGoals} goals
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#22C55E', fontWeight: 800 }}>
                        {rivalry.matches.length}x
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Avg margin {(rivalry.closeness / Math.max(rivalry.matches.length, 1)).toFixed(1)}
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
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
      <H2HPageContent />
    </Suspense>
  );
}
