'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { STAGE_LABELS } from '@/lib/constants';

interface BracketMatch {
  id: string;
  match_number: number;
  round_number: number;
  stage: string | null;
  home_player?: { id: string; name: string; team: string } | null;
  away_player?: { id: string; name: string; team: string } | null;
  home_score: number | null;
  away_score: number | null;
  is_played: boolean;
  is_bye: boolean;
}

interface Props {
  matches: BracketMatch[];
  onMatchClick?: (matchId: string) => void;
}

function MatchSlot({
  match,
  onClick,
}: {
  match: BracketMatch;
  onClick?: () => void;
}) {
  const homeWin = match.is_played && match.home_score! > match.away_score!;
  const awayWin = match.is_played && match.away_score! > match.home_score!;

  if (match.is_bye) {
    return (
      <Box
        sx={{
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 1,
          p: 1,
          opacity: 0.4,
          minWidth: 180,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {match.home_player?.name ?? 'TBD'} — BYE
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 1,
        minWidth: 200,
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        '&:hover': onClick ? { borderColor: 'rgba(0,212,255,0.5)' } : {},
      }}
    >
      {/* Home player */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1.5,
          py: 0.75,
          bgcolor: homeWin ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Typography
          variant="body2"
          fontWeight={homeWin ? 700 : 400}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 130,
          }}
        >
          {match.home_player?.name ?? 'TBD'}
        </Typography>
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', ml: 1 }}>
          {match.is_played ? match.home_score : ''}
        </Typography>
      </Box>

      {/* Away player */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1.5,
          py: 0.75,
          bgcolor: awayWin ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
        }}
      >
        <Typography
          variant="body2"
          fontWeight={awayWin ? 700 : 400}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 130,
          }}
        >
          {match.away_player?.name ?? 'TBD'}
        </Typography>
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', ml: 1 }}>
          {match.is_played ? match.away_score : ''}
        </Typography>
      </Box>
    </Box>
  );
}

export default function BracketView({ matches, onMatchClick }: Props) {
  const rounds = useMemo(() => {
    const roundMap = new Map<number, BracketMatch[]>();
    for (const m of matches) {
      const existing = roundMap.get(m.round_number) ?? [];
      existing.push(m);
      roundMap.set(m.round_number, existing);
    }
    return Array.from(roundMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([roundNum, roundMatches]) => ({
        roundNumber: roundNum,
        stage: roundMatches[0]?.stage,
        matches: roundMatches.sort((a, b) => a.match_number - b.match_number),
      }));
  }, [matches]);

  if (rounds.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center">
        No bracket data available
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 4,
        overflowX: 'auto',
        py: 2,
        px: 1,
      }}
    >
      {rounds.map((round) => {
        const stageLabel = round.stage ? STAGE_LABELS[round.stage] || round.stage : `Round ${round.roundNumber}`;

        return (
          <Box
            key={round.roundNumber}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 220,
            }}
          >
            <Typography
              variant="caption"
              color="primary.main"
              fontWeight={700}
              sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              {stageLabel}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around',
                flex: 1,
                gap: 2,
                width: '100%',
              }}
            >
              {round.matches.map((match) => (
                <MatchSlot
                  key={match.id}
                  match={match}
                  onClick={onMatchClick ? () => onMatchClick(match.id) : undefined}
                />
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
