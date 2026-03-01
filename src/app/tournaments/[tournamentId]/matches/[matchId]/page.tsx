'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import AdminGate from '@/components/auth/AdminGate';
import MatchResultForm from '@/components/tournament/MatchResultForm';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';
import type { MatchStats } from '@/lib/types';

interface MatchDetail {
  id: string;
  tournament_id: string;
  home_player: { id: string; name: string; team: string } | null;
  away_player: { id: string; name: string; team: string } | null;
  home_score: number | null;
  away_score: number | null;
  is_played: boolean;
  is_bye: boolean;
  round_number: number;
  stage: string | null;
  stats: MatchStats;
  played_at: string | null;
  goals: { id: string; player: { id: string; name: string } | null; minute: number | null }[];
}

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const tournamentId = params.tournamentId as string;
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/matches/${matchId}`)
      .then((r) => r.json())
      .then((data) => {
        setMatch(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [matchId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!match) {
    return <Typography color="error">Match not found</Typography>;
  }

  // If match is not played yet, show the result entry form
  if (!match.is_played) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Round {match.round_number} {match.stage && `- ${match.stage}`}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {match.home_player?.name} vs {match.away_player?.name}
        </Typography>
        <AdminGate tournamentId={tournamentId}>
          <MatchResultForm match={match as never} />
        </AdminGate>
      </Box>
    );
  }

  // Show match result details
  const stats = match.stats || {};

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Round {match.round_number} {match.stage && `- ${match.stage}`}
      </Typography>

      {/* Score */}
      <GlassCard sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, py: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {match.home_player?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {match.home_player?.team}
              </Typography>
            </Box>
            <Box
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                bgcolor: 'rgba(0,212,255,0.1)',
                border: '1px solid rgba(0,212,255,0.2)',
              }}
            >
              <Typography variant="h3" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                {match.home_score} - {match.away_score}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {match.away_player?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {match.away_player?.team}
              </Typography>
            </Box>
          </Box>

          {/* Goals */}
          {match.goals && match.goals.length > 0 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {match.goals.map((g) => (
                  <Chip
                    key={g.id}
                    label={`${g.player?.name ?? 'Unknown'} ${g.minute ? `${g.minute}'` : ''}`}
                    size="small"
                    icon={<span>&#9917;</span>}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </GlassCard>

      {/* Stats */}
      {(stats.home_xg != null || stats.home_possession != null) && (
        <GlassCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Match Stats
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stats.home_xg != null && (
                <StatRow label="xG" home={stats.home_xg?.toFixed(1)} away={stats.away_xg?.toFixed(1)} />
              )}
              {stats.home_possession != null && (
                <StatRow label="Possession" home={`${stats.home_possession}%`} away={`${stats.away_possession}%`} />
              )}
              {stats.home_tackles != null && (
                <StatRow label="Tackles" home={stats.home_tackles} away={stats.away_tackles} />
              )}
              {stats.home_interceptions != null && (
                <StatRow label="Interceptions" home={stats.home_interceptions} away={stats.away_interceptions} />
              )}
              {stats.home_rating != null && (
                <StatRow label="Rating" home={stats.home_rating?.toFixed(1)} away={stats.away_rating?.toFixed(1)} />
              )}
            </Box>

            {stats.motm_player_id && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Divider sx={{ mb: 2 }} />
                <Chip
                  label={`Man of the Match${stats.motm_rating ? ` (${stats.motm_rating})` : ''}`}
                  color="warning"
                  variant="outlined"
                />
              </Box>
            )}
          </CardContent>
        </GlassCard>
      )}
    </Box>
  );
}

function StatRow({
  label,
  home,
  away,
}: {
  label: string;
  home: string | number | undefined;
  away: string | number | undefined;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography variant="body2" fontWeight={600} sx={{ flex: 1, textAlign: 'right', pr: 2 }}>
        {home ?? '-'}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ width: 120, textAlign: 'center' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ flex: 1, textAlign: 'left', pl: 2 }}>
        {away ?? '-'}
      </Typography>
    </Box>
  );
}
