'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 2,
          opacity: 0.4,
          borderBottom: '0.5px solid rgba(255,255,255,0.08)',
        }}
      >
        <Typography variant="body2" sx={{ color: '#8E8E93' }}>
          {match.home_player?.name ?? 'TBD'} — BYE
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      onClick={() => router.push(`/tournaments/${match.tournament_id}/matches/${match.id}`)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        '&:active': { background: 'rgba(255,255,255,0.05)' },
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Home */}
      <Box sx={{ flex: 1, textAlign: 'right', pr: 1.5, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600} noWrap>
          {match.home_player?.name ?? 'TBD'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#8E8E93' }} noWrap>
          {match.home_player?.team ?? ''}
        </Typography>
      </Box>

      {/* Score */}
      <Box
        sx={{
          minWidth: 72,
          textAlign: 'center',
          py: 0.5,
          px: 1.5,
          borderRadius: '8px',
          bgcolor: match.is_played ? 'rgba(10,132,255,0.1)' : 'rgba(255,255,255,0.03)',
        }}
      >
        {match.is_played ? (
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '2px' }}
          >
            {match.home_score} – {match.away_score}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: '#8E8E93' }}>
            vs
          </Typography>
        )}
      </Box>

      {/* Away */}
      <Box sx={{ flex: 1, textAlign: 'left', pl: 1.5, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600} noWrap>
          {match.away_player?.name ?? 'TBD'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#8E8E93' }} noWrap>
          {match.away_player?.team ?? ''}
        </Typography>
      </Box>

      {match.stage && (
        <Chip
          label={match.stage}
          size="small"
          sx={{
            bgcolor: 'rgba(10,132,255,0.1)',
            color: '#0A84FF',
            fontWeight: 500,
            fontSize: '0.65rem',
            height: 22,
            ml: 1,
          }}
        />
      )}
    </Box>
  );
}
