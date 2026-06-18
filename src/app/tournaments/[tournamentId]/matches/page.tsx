'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import MatchCard from '@/components/tournament/MatchCard';
import type { Match } from '@/lib/types';

export default function MatchesPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}`)
      .then((r) => r.json())
      .then((data) => {
        setMatches(data.matches ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const rounds = Array.from(new Set(matches.map((m) => m.round_number))).sort((a, b) => a - b);
  const filtered = selectedRound ? matches.filter((m) => m.round_number === selectedRound) : matches;

  // Group by round
  const grouped = filtered.reduce(
    (acc, m) => {
      const key = m.round_number;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    },
    {} as Record<number, Match[]>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Match Queue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {matches.filter((m) => !m.is_played && !m.is_bye).length} pending · {matches.filter((m) => m.is_played && !m.is_bye).length} recorded
          </Typography>
        </Box>
        <Chip size="small" label={selectedRound ? `Round ${selectedRound}` : 'All rounds'} sx={{ color: '#22C55E', borderColor: 'rgba(34, 197, 94, 0.24)' }} />
      </Box>

      {/* Round filter */}
      <Box sx={{
        display: 'flex',
        gap: 0.5,
        mb: 3,
        flexWrap: 'wrap',
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '10px',
        p: 0.5,
      }}>
        <Chip
          label="All"
          onClick={() => setSelectedRound(null)}
          sx={{
            bgcolor: selectedRound === null ? '#64748B' : 'transparent',
            color: selectedRound === null ? '#F8FAFC' : '#64748B',
            fontWeight: 600,
            fontSize: '0.85rem',
            borderRadius: '10px',
            border: 'none',
            '&:hover': { bgcolor: selectedRound === null ? '#64748B' : 'rgba(148, 163, 184, 0.04)' },
          }}
        />
        {rounds.map((r) => (
          <Chip
            key={r}
            label={`Round ${r}`}
            onClick={() => setSelectedRound(r)}
            sx={{
              bgcolor: selectedRound === r ? '#64748B' : 'transparent',
              color: selectedRound === r ? '#F8FAFC' : '#64748B',
              fontWeight: 600,
              fontSize: '0.85rem',
              borderRadius: '10px',
              border: 'none',
              '&:hover': { bgcolor: selectedRound === r ? '#64748B' : 'rgba(148, 163, 184, 0.04)' },
            }}
          />
        ))}
      </Box>

      {/* Matches by round */}
      {Object.entries(grouped)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([round, roundMatches]) => (
          <Box key={round} sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                color: '#64748B',
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                px: 2,
                mb: 1,
              }}
            >
              Round {round}
            </Typography>
            <Box
              sx={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              {roundMatches
                .sort((a, b) => a.match_number - b.match_number)
                .map((m) => (
                  <MatchCard key={m.id} match={m as never} />
                ))}
            </Box>
          </Box>
        ))}

      {matches.length === 0 && (
        <Typography sx={{ color: '#64748B', textAlign: 'center', py: 4 }}>
          No matches scheduled yet. Generate the schedule from the dashboard.
        </Typography>
      )}
    </Box>
  );
}
