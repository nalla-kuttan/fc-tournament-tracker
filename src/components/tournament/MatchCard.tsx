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
          borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
        }}
      >
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          {match.home_player?.name ?? 'TBD'} — BYE
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      onClick={() => router.push(`/tournaments/${match.tournament_id}/matches/${match.id}`)}
      className="list-row"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 2,
        cursor: 'pointer',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
        background: 'rgba(15, 23, 42, 0.4)',
        borderRadius: '12px',
        border: '1px solid rgba(148, 163, 184, 0.06)',
        transition: 'all 200ms ease',
        '&:hover': {
          borderColor: 'rgba(34, 197, 94, 0.15)',
          background: 'rgba(15, 23, 42, 0.6)',
        },
      }}
    >
      {/* Home */}
      <Box sx={{ flex: 1, textAlign: 'right', pr: 1.5, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600} noWrap sx={{ letterSpacing: '0.01em' }}>
          {match.home_player?.name ?? 'TBD'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }} noWrap>
          {match.home_player?.team ?? ''}
        </Typography>
      </Box>

      {/* Score */}
      <Box
        sx={{
          minWidth: 76,
          textAlign: 'center',
          py: 0.75,
          px: 2,
          borderRadius: '10px',
          bgcolor: match.is_played ? 'rgba(34, 197, 94, 0.08)' : 'rgba(148, 163, 184, 0.04)',
          border: match.is_played ? '1px solid rgba(34, 197, 94, 0.12)' : '1px solid rgba(148, 163, 184, 0.06)',
        }}
      >
        {match.is_played ? (
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '3px',
              color: '#F8FAFC',
            }}
          >
            {match.home_score} – {match.away_score}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
            vs
          </Typography>
        )}
      </Box>

      {/* Away */}
      <Box sx={{ flex: 1, textAlign: 'left', pl: 1.5, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600} noWrap sx={{ letterSpacing: '0.01em' }}>
          {match.away_player?.name ?? 'TBD'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }} noWrap>
          {match.away_player?.team ?? ''}
        </Typography>
      </Box>

      {match.stage && (
        <Chip
          label={match.stage}
          size="small"
          sx={{
            bgcolor: 'rgba(59, 130, 246, 0.1)',
            color: '#3B82F6',
            fontWeight: 600,
            fontSize: '0.65rem',
            height: 22,
            ml: 1,
            border: '1px solid rgba(59, 130, 246, 0.15)',
            letterSpacing: '0.02em',
          }}
        />
      )}
    </Box>
  );
}
