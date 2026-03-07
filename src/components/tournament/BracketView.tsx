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
          border: '1px solid rgba(148, 163, 184, 0.06)',
          borderRadius: '10px',
          p: 1,
          opacity: 0.4,
          minWidth: 200,
          background: 'rgba(15, 23, 42, 0.3)',
        }}
      >
        <Typography variant="caption" sx={{ color: '#64748B' }}>
          {match.home_player?.name ?? 'TBD'} — BYE
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        border: '1px solid rgba(148, 163, 184, 0.08)',
        borderRadius: '12px',
        minWidth: 210,
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(8px)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? {
          borderColor: 'rgba(34, 197, 94, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        } : {},
      }}
    >
      {/* Home player */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1.5,
          py: 1,
          bgcolor: homeWin ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
          borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
          borderLeft: homeWin ? '3px solid #22C55E' : '3px solid transparent',
        }}
      >
        <Typography
          variant="body2"
          fontWeight={homeWin ? 700 : 400}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 140,
            color: homeWin ? '#F8FAFC' : '#94A3B8',
          }}
        >
          {match.home_player?.name ?? 'TBD'}
        </Typography>
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{
            fontFamily: '"Chakra Petch", monospace',
            ml: 1,
            color: homeWin ? '#22C55E' : '#64748B',
          }}
        >
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
          py: 1,
          bgcolor: awayWin ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
          borderLeft: awayWin ? '3px solid #22C55E' : '3px solid transparent',
        }}
      >
        <Typography
          variant="body2"
          fontWeight={awayWin ? 700 : 400}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 140,
            color: awayWin ? '#F8FAFC' : '#94A3B8',
          }}
        >
          {match.away_player?.name ?? 'TBD'}
        </Typography>
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{
            fontFamily: '"Chakra Petch", monospace',
            ml: 1,
            color: awayWin ? '#22C55E' : '#64748B',
          }}
        >
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
      <Typography sx={{ color: '#64748B' }} textAlign="center">
        No bracket data available
      </Typography>
    );
  }

  return (
    <Box
      className="hide-scrollbar"
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
              minWidth: 230,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{
                mb: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#22C55E',
                textShadow: '0 0 8px rgba(34, 197, 94, 0.2)',
              }}
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
