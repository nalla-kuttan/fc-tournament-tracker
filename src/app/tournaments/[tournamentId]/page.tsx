'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MatchCard from '@/components/tournament/MatchCard';
import StandingsTable from '@/components/tournament/StandingsTable';
import BracketView from '@/components/tournament/BracketView';
import AdminGate from '@/components/auth/AdminGate';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';
import { useAdmin } from '@/contexts/AdminContext';
import type { Match, StandingRow } from '@/lib/types';

export default function TournamentDashboard() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const { getPinForTournament } = useAdmin();

  const [tournament, setTournament] = useState<{
    format: string;
    status: string;
    matches: Match[];
    players: { id: string; name: string; team: string }[];
  } | null>(null);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    Promise.all([
      fetch(`/api/tournaments/${tournamentId}`).then((r) => r.json()),
      fetch(`/api/tournaments/${tournamentId}/standings`).then((r) => r.json()),
    ])
      .then(([t, s]) => {
        setTournament(t);
        setStandings(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const handleGenerateSchedule = async () => {
    const pin = getPinForTournament(tournamentId);
    if (!pin) return;
    setGenerating(true);
    setError('');

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/generate-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate schedule');
      }
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tournament) return null;

  const hasMatches = tournament.matches && tournament.matches.length > 0;
  const recentMatches = (tournament.matches ?? [])
    .filter((m) => m.is_played && !m.is_bye)
    .sort((a, b) => (b.played_at ?? '').localeCompare(a.played_at ?? ''))
    .slice(0, 3);
  const upcomingMatches = (tournament.matches ?? [])
    .filter((m) => !m.is_played && !m.is_bye)
    .slice(0, 3);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!hasMatches && (
        <GlassCard sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Ready to start?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {tournament.players?.length ?? 0} players registered. Generate the schedule to begin.
            </Typography>
            <AdminGate tournamentId={tournamentId}>
              <Button
                variant="contained"
                size="large"
                startIcon={generating ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                onClick={handleGenerateSchedule}
                disabled={generating || (tournament.players?.length ?? 0) < 2}
              >
                Generate Schedule
              </Button>
            </AdminGate>
          </CardContent>
        </GlassCard>
      )}

      {hasMatches && (
        <Grid container spacing={3}>
          {/* Standings / Bracket Preview */}
          <Grid size={{ xs: 12, md: 8 }}>
            {tournament.format !== 'knockout' ? (
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Standings
                </Typography>
                <StandingsTable standings={standings} />
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Bracket
                </Typography>
                <BracketView
                  matches={tournament.matches as never[]}
                  onMatchClick={(id) => router.push(`/tournaments/${tournamentId}/matches/${id}`)}
                />
              </Box>
            )}
          </Grid>

          {/* Recent & Upcoming */}
          <Grid size={{ xs: 12, md: 4 }}>
            {upcomingMatches.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Upcoming
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {upcomingMatches.map((m) => (
                    <MatchCard key={m.id} match={m as never} />
                  ))}
                </Box>
              </Box>
            )}

            {recentMatches.length > 0 && (
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Recent Results
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {recentMatches.map((m) => (
                    <MatchCard key={m.id} match={m as never} />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
