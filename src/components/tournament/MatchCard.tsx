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
      <Box sx={{ display: 'flex', justifyContent: 'center', px: 2, py: 2, borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>
        <Typography variant="body2" sx={{ color: '#C9B9BE' }}>
          {match.home_player?.name ?? 'TBD'} — BYE
        </Typography>
      </Box>
    );
  }

  const href = `/tournaments/${match.tournament_id}/matches/${match.id}`;
  const homeWon = match.is_played && (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWon = match.is_played && (match.away_score ?? 0) > (match.home_score ?? 0);
  const nameSx = (won: boolean, lost: boolean) => ({
    fontWeight: won ? 700 : lost ? 500 : 600,
    color: lost ? '#C9B9BE' : '#FFF7F6',
  });
  const hasTags = Boolean(match.stage || intelligenceLabel);

  return (
    <Box
      component={Link}
      href={href}
      aria-label={`Open match ${match.home_player?.name ?? 'TBD'} versus ${match.away_player?.name ?? 'TBD'}`}
      className="list-row"
      sx={{
        display: 'block',
        containerType: 'inline-size',
        px: 2,
        py: 1.75,
        color: 'inherit',
        textDecoration: 'none',
        background: '#241019',
        borderRadius: '12px',
        border: '1px solid rgba(201, 185, 190, 0.12)',
        transition: 'background-color 180ms ease, border-color 180ms ease',
        '&:hover': { borderColor: 'rgba(201, 185, 190, 0.24)', background: '#2D1620' },
        '&:focus-visible': { outline: '3px solid rgba(255, 138, 115, 0.7)', outlineOffset: 2 },
      }}
    >
      {/* Narrow columns (dashboard sidebar) put the tags on their own row;
          wide lists keep them inline so rows stay one line tall. */}
      <Box
        sx={{
          display: 'grid',
          alignItems: 'center',
          gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
          gridTemplateAreas: hasTags ? '"home score away" "tags tags tags"' : '"home score away"',
          rowGap: 1,
          '@container (min-width: 520px)': {
            gridTemplateColumns: hasTags ? 'minmax(0, 1fr) auto minmax(0, 1fr) auto' : 'minmax(0, 1fr) auto minmax(0, 1fr)',
            gridTemplateAreas: hasTags ? '"home score away tags"' : '"home score away"',
          },
        }}
      >
        <Box sx={{ gridArea: 'home', textAlign: 'right', pr: 1.5, minWidth: 0 }}>
          <Typography variant="body1" noWrap sx={nameSx(homeWon, awayWon)}>{match.home_player?.name ?? 'TBD'}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block', color: '#C9B9BE' }}>{match.home_player?.team ?? ''}</Typography>
        </Box>

        <Box sx={{ gridArea: 'score', minWidth: 76, textAlign: 'center', py: 0.75, px: 2, borderRadius: '10px', bgcolor: match.is_played ? 'rgba(234, 108, 86, 0.1)' : 'rgba(201, 185, 190, 0.06)' }}>
          <Typography variant={match.is_played ? 'h6' : 'body2'} fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: match.is_played ? '#FFF7F6' : '#C9B9BE' }}>
            {match.is_played ? `${match.home_score} – ${match.away_score}` : 'vs'}
          </Typography>
        </Box>

        <Box sx={{ gridArea: 'away', textAlign: 'left', pl: 1.5, minWidth: 0 }}>
          <Typography variant="body1" noWrap sx={nameSx(awayWon, homeWon)}>{match.away_player?.name ?? 'TBD'}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block', color: '#C9B9BE' }}>{match.away_player?.team ?? ''}</Typography>
        </Box>

        {hasTags && (
          <Box
            sx={{
              gridArea: 'tags',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.75,
              justifyContent: 'center',
              '@container (min-width: 520px)': { justifyContent: 'flex-end', pl: 1 },
            }}
          >
            {match.stage && <Chip label={match.stage} size="small" sx={{ color: '#7E8CC2' }} />}
            {intelligenceLabel && <Chip label={intelligenceLabel.label} size="small" sx={{ color: '#F59E0B' }} />}
          </Box>
        )}
      </Box>
    </Box>
  );
}
