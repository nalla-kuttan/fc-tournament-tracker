'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TournamentCard from '@/components/tournament/TournamentCard';
import EmptyState from '@/components/shared/EmptyState';
import FunFactsSection from '@/components/analytics/FunFactsSection';
import type { Tournament, Match } from '@/lib/types';

interface HallOfFameEntry {
  tournament_id: string;
  tournament_name: string;
  tournament_format: string;
  completed_at: string;
  winner_name: string;
  winner_team: string;
  registered_player_id: string | null;
  stats: Record<string, number | string>;
}

interface AnalyticsData {
  all_matches: Match[];
  all_goals: { player_id: string; minute: number | null; match_id: string }[];
  registered_players: { id: string; name: string; base_team: string }[];
  player_instances: { id: string; registered_player_id: string; name: string; team: string }[];
}

export default function HomePage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/tournaments').then((r) => r.json()),
      fetch('/api/analytics/hall-of-fame').then((r) => r.json()),
      fetch('/api/analytics/global').then((r) => r.json()).catch(() => null),
    ])
      .then(([t, hof, globalData]) => {
        setTournaments(t);
        setHallOfFame(hof);
        if (globalData) setAnalytics(globalData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box>
      {/* iOS Large Title */}
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          letterSpacing: '-0.5px',
          mb: 3,
          mt: 1,
        }}
      >
        Tournaments
      </Typography>

      {/* Hall of Fame - iOS Grouped Section */}
      {hallOfFame.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="body2"
            sx={{
              color: '#8E8E93',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              px: 2,
              mb: 1,
            }}
          >
            Hall of Fame
          </Typography>
          <Box
            sx={{
              background: '#1C1C1E',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {hallOfFame.map((entry, index) => (
              <Box
                key={entry.tournament_id}
                onClick={() => router.push(`/tournaments/${entry.tournament_id}`)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  borderBottom: index < hallOfFame.length - 1 ? '0.5px solid rgba(255,255,255,0.08)' : 'none',
                  '&:active': { background: 'rgba(255,255,255,0.05)' },
                }}
              >
                <EmojiEventsIcon sx={{ fontSize: 32, color: '#FF9F0A', mr: 1.5 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" fontWeight={600} noWrap>
                    {entry.winner_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8E8E93' }}>
                    {entry.tournament_name} &middot; {entry.winner_team}
                  </Typography>
                </Box>
                {entry.stats.points != null && (
                  <Chip
                    label={`${entry.stats.points} pts`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,159,10,0.15)',
                      color: '#FF9F0A',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      mr: 0.5,
                    }}
                  />
                )}
                <ChevronRightIcon sx={{ color: '#48484A', fontSize: 20 }} />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Records & Milestones */}
      {analytics && (
        <FunFactsSection
          matches={analytics.all_matches}
          goals={analytics.all_goals}
          registeredPlayers={analytics.registered_players}
          playerInstances={analytics.player_instances}
        />
      )}

      {/* Tournaments - iOS Grouped Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mb: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: '#8E8E93',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            Your Tournaments
          </Typography>
          <Button
            variant="text"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => router.push('/tournaments/new')}
            sx={{
              color: '#0A84FF',
              fontWeight: 600,
              fontSize: '0.9rem',
              textTransform: 'none',
              p: 0,
              minWidth: 'auto',
            }}
          >
            New
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ background: '#1C1C1E', borderRadius: '12px', p: 2 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2, mb: i < 3 ? 1 : 0, bgcolor: 'rgba(255,255,255,0.05)' }} />
            ))}
          </Box>
        ) : tournaments.length === 0 ? (
          <EmptyState
            icon={<EmojiEventsIcon sx={{ fontSize: 64 }} />}
            title="No tournaments yet"
            description="Create your first tournament to get started tracking matches and stats."
            action={
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/tournaments/new')}>
                Create Tournament
              </Button>
            }
          />
        ) : (
          <Box
            sx={{
              background: '#1C1C1E',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {tournaments.map((t, index) => (
              <TournamentCard key={t.id} tournament={t} showDivider={index < tournaments.length - 1} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
