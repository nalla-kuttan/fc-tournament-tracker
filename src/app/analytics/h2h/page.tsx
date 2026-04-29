'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CardContent from '@mui/material/CardContent';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayerSelector from '@/components/analytics/PlayerSelector';
import H2HComparison from '@/components/analytics/H2HComparison';
import BackButton from '@/components/shared/BackButton';
import AIH2HModal from '@/components/ai/AIH2HModal';
import GlassCard from '@/components/shared/GlassCard';
import { getRivalries, type GoalLite, type RivalrySummary } from '@/lib/analytics-insights';
import type { RegisteredPlayer, H2HData, CareerStats, Match } from '@/lib/types';

interface GlobalData {
  career_stats: CareerStats[];
  all_matches: Match[];
  all_goals: GoalLite[];
  registered_players: RegisteredPlayer[];
  player_instances: { id: string; registered_player_id: string; name: string; team: string }[];
}

function H2HPageContent() {
  const searchParams = useSearchParams();
  const [player1, setPlayer1] = useState<RegisteredPlayer | null>(null);
  const [player2, setPlayer2] = useState<RegisteredPlayer | null>(null);
  const [h2hData, setH2hData] = useState<H2HData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [h2hModalOpen, setH2hModalOpen] = useState(false);
  const [rivalries, setRivalries] = useState<RivalrySummary[]>([]);

  const loadComparison = useCallback(async (first: RegisteredPlayer | null, second: RegisteredPlayer | null) => {
    if (!first || !second) return;

    setLoading(true);
    setError('');
    setH2hData(null);

    try {
      const res = await fetch(`/api/analytics/h2h?p1=${first.id}&p2=${second.id}`);
      if (!res.ok) {
        throw new Error('Failed to load H2H data');
      }
      const data = await res.json();
      setH2hData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCompare = () => {
    void loadComparison(player1, player2);
  };

  useEffect(() => {
    const p1 = searchParams.get('p1');
    const p2 = searchParams.get('p2');
    if (!p1 || !p2) return;

    fetch('/api/players')
      .then((response) => response.json())
      .then((players: RegisteredPlayer[]) => {
        const first = players.find((player) => player.id === p1) ?? null;
        const second = players.find((player) => player.id === p2) ?? null;
        setPlayer1(first);
        setPlayer2(second);
        if (first && second) {
          void loadComparison(first, second);
        }
      })
      .catch(() => {});
  }, [loadComparison, searchParams]);

  useEffect(() => {
    fetch('/api/analytics/global')
      .then((response) => response.json())
      .then((data: GlobalData) => {
        setRivalries(getRivalries(data.registered_players, data.player_instances, data.all_matches));
      })
      .catch(() => {});
  }, []);

  const chooseRivalry = (rivalry: RivalrySummary) => {
    fetch('/api/players')
      .then((response) => response.json())
      .then((players: RegisteredPlayer[]) => {
        const first = players.find((player) => player.id === rivalry.p1Id) ?? null;
        const second = players.find((player) => player.id === rivalry.p2Id) ?? null;
        setPlayer1(first);
        setPlayer2(second);
        if (first && second) void loadComparison(first, second);
      })
      .catch(() => {});
  };

  return (
    <Box>
      <BackButton />
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
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
            sx={{ color: '#34C759', borderColor: 'rgba(52,199,89,0.5)', '&:hover': { borderColor: '#34C759', bgcolor: 'rgba(52,199,89,0.1)' } }}
          >
            AI Analyst
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Player Selection */}
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Grid size={{ xs: 12, sm: 5 }}>
          <PlayerSelector
            label="Player 1"
            value={player1}
            onChange={setPlayer1}
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
            onChange={setPlayer2}
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
                <GlassCard sx={{ height: '100%', cursor: 'pointer' }}>
                  <CardContent onClick={() => chooseRivalry(rivalry)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                      <Typography fontWeight={800} noWrap>
                        {rivalry.p1Name} vs {rivalry.p2Name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#22C55E', fontWeight: 800 }}>
                        {rivalry.matches.length}x
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {rivalry.p1Wins}-{rivalry.draws}-{rivalry.p2Wins} · {rivalry.totalGoals} goals
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg margin {(rivalry.closeness / Math.max(rivalry.matches.length, 1)).toFixed(1)}
                    </Typography>
                  </CardContent>
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
