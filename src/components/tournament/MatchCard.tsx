'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import GlassCard from '@/components/shared/GlassCard';
import CardContent from '@mui/material/CardContent';

interface MatchCardProps {
  match: {
    id: string;
    tournament_id: string;
    home_player?: { id: string; name: string; team: string } | null;
    away_player?: { id: string; name: string; team: string } | null;
    home_score: number | null;
    away_score: number | null;
    is_played: boolean;
    is_bye: boolean;
    round_number: number;
    stage: string | null;
  };
}

export default function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();

  if (match.is_bye) {
    return (
      <GlassCard sx={{ opacity: 0.5 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {match.home_player?.name ?? 'TBD'} — BYE
            </Typography>
          </Box>
        </CardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      sx={{
        cursor: 'pointer',
        '&:hover': { borderColor: 'rgba(0, 212, 255, 0.3)' },
        ...(match.is_played
          ? {}
          : { animation: 'glowPulse 2s infinite' }),
      }}
      onClick={() => router.push(`/tournaments/${match.tournament_id}/matches/${match.id}`)}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Home */}
          <Box sx={{ flex: 1, textAlign: 'right', pr: 2 }}>
            <Typography variant="body1" fontWeight={600}>
              {match.home_player?.name ?? 'TBD'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {match.home_player?.team ?? ''}
            </Typography>
          </Box>

          {/* Score */}
          <Box
            sx={{
              minWidth: 80,
              textAlign: 'center',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              bgcolor: match.is_played ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
            }}
          >
            {match.is_played ? (
              <Typography variant="h5" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                {match.home_score} - {match.away_score}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                vs
              </Typography>
            )}
          </Box>

          {/* Away */}
          <Box sx={{ flex: 1, textAlign: 'left', pl: 2 }}>
            <Typography variant="body1" fontWeight={600}>
              {match.away_player?.name ?? 'TBD'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {match.away_player?.team ?? ''}
            </Typography>
          </Box>
        </Box>

        {match.stage && (
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Chip label={match.stage} size="small" color="secondary" variant="outlined" />
          </Box>
        )}
      </CardContent>
    </GlassCard>
  );
}
