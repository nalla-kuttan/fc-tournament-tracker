'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { getMatchIntelligenceLabels } from '@/lib/competitive';
import type { Match, MatchStats } from '@/lib/types';

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
    stats?: MatchStats;
  };
  index?: number;
}

export default function MatchCard({ match }: MatchCardProps) {
  const intelligenceMatch: Match = {
    id: match.id,
    tournament_id: match.tournament_id,
    home_player_id: match.home_player?.id ?? null,
    away_player_id: match.away_player?.id ?? null,
    home_score: match.home_score,
    away_score: match.away_score,
    round_number: match.round_number,
    match_number: 0,
    stage: match.stage,
    is_played: match.is_played,
    is_bye: match.is_bye,
    stats: match.stats ?? {},
    match_order: null,
    played_at: null,
    created_at: '',
  };
  const intelligenceLabel = match.is_played ? getMatchIntelligenceLabels(intelligenceMatch)[0] : null;

  if (match.is_bye) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', px: 2, py: 2, borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
          {match.home_player?.name ?? 'TBD'} — BYE
        </Typography>
      </Box>
    );
  }

  const href = `/tournaments/${match.tournament_id}/matches/${match.id}`;
  return (
    <Box
      component={Link}
      href={href}
      aria-label={`Open match ${match.home_player?.name ?? 'TBD'} versus ${match.away_player?.name ?? 'TBD'}`}
      className="list-row"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 2,
        color: 'inherit',
        textDecoration: 'none',
        background: '#0F172A',
        borderRadius: '12px',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        transition: 'background-color 180ms ease, border-color 180ms ease',
        '&:hover': { borderColor: 'rgba(148, 163, 184, 0.24)', background: '#111C31' },
        '&:focus-visible': { outline: '3px solid rgba(74, 222, 128, 0.7)', outlineOffset: 2 },
      }}
    >
      <Box sx={{ flex: 1, textAlign: 'right', pr: 1.5, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600} noWrap>{match.home_player?.name ?? 'TBD'}</Typography>
        <Typography variant="caption" sx={{ color: '#94A3B8' }} noWrap>{match.home_player?.team ?? ''}</Typography>
      </Box>

      <Box sx={{ minWidth: 76, textAlign: 'center', py: 0.75, px: 2, borderRadius: '10px', bgcolor: match.is_played ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.06)' }}>
        <Typography variant={match.is_played ? 'h6' : 'body2'} fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', color: match.is_played ? '#F8FAFC' : '#94A3B8' }}>
          {match.is_played ? `${match.home_score} – ${match.away_score}` : 'vs'}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, textAlign: 'left', pl: 1.5, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600} noWrap>{match.away_player?.name ?? 'TBD'}</Typography>
        <Typography variant="caption" sx={{ color: '#94A3B8' }} noWrap>{match.away_player?.team ?? ''}</Typography>
      </Box>

      {match.stage && <Chip label={match.stage} size="small" sx={{ color: '#60A5FA', ml: 1 }} />}
      {intelligenceLabel && <Chip label={intelligenceLabel.label} size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: '#F59E0B', ml: 1 }} />}
    </Box>
  );
}
