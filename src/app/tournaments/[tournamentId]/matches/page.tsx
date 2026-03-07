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
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Matches
      </Typography>

      {/* iOS-style segmented filter */}
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
            bgcolor: selectedRound === null ? '#636366' : 'transparent',
            color: selectedRound === null ? '#FFFFFF' : '#64748B',
            fontWeight: 600,
            fontSize: '0.85rem',
            borderRadius: '8px',
            border: 'none',
            '&:hover': { bgcolor: selectedRound === null ? '#636366' : 'rgba(148, 163, 184, 0.04)' },
          }}
        />
        {rounds.map((r) => (
          <Chip
            key={r}
            label={`Round ${r}`}
            onClick={() => setSelectedRound(r)}
            sx={{
              bgcolor: selectedRound === r ? '#636366' : 'transparent',
              color: selectedRound === r ? '#FFFFFF' : '#64748B',
              fontWeight: 600,
              fontSize: '0.85rem',
              borderRadius: '8px',
              border: 'none',
              '&:hover': { bgcolor: selectedRound === r ? '#636366' : 'rgba(148, 163, 184, 0.04)' },
            }}
          />
        ))}
      </Box>

      {/* Matches by Round - iOS Grouped List */}
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
