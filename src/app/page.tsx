'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
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
  const { data: tournaments = [], isLoading: loadingTournaments } = useSWR<Tournament[]>('/api/tournaments', fetcher);
  const { data: hallOfFame = [] } = useSWR<HallOfFameEntry[]>('/api/analytics/hall-of-fame', fetcher);
  const { data: analytics = null } = useSWR<AnalyticsData>('/api/analytics/global', fetcher, { revalidateOnFocus: false });

  const loading = loadingTournaments;

  return (
    <Box>
      {/* Hero Title with gradient */}
      <Box className="animate-section" sx={{ mb: 4, mt: 1 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Tournaments
        </Typography>
      </Box>

      {/* Hall of Fame */}
      {hallOfFame.length > 0 && (
        <Box className="animate-section" sx={{ mb: 4 }}>
          <Typography
            variant="body2"
            sx={{
              color: '#64748B',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              px: 1,
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
            Hall of Fame
          </Typography>
          <Box
            sx={{
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(148, 163, 184, 0.08)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            {Object.values(
              hallOfFame.reduce((acc, entry) => {
                if (!acc[entry.winner_name]) {
                  acc[entry.winner_name] = {
                    name: entry.winner_name,
                    team: entry.winner_team,
                    tournaments: [],
                    points: 0,
                  };
                }
                acc[entry.winner_name].tournaments.push(entry.tournament_name);
                acc[entry.winner_name].points += Number(entry.stats.points || 0);
                return acc;
              }, {} as Record<string, { name: string; team: string; tournaments: string[]; points: number }>)
            )
              .sort((a, b) => b.tournaments.length - a.tournaments.length || b.points - a.points)
              .map((groupedEntry, index, arr) => (
                <Box
                  key={groupedEntry.name}
                  className="list-row"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 2,
                    borderBottom: index < arr.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
                    transition: 'background 150ms ease',
                  }}
                >
                  {/* Trophy with glow */}
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      flexShrink: 0,
                    }}
                  >
                    <EmojiEventsIcon sx={{ fontSize: 24, color: '#F59E0B', filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.3))' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" fontWeight={600} noWrap sx={{ letterSpacing: '0.01em' }}>
                      {groupedEntry.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.8rem' }}>
                      {groupedEntry.tournaments.length} {groupedEntry.tournaments.length === 1 ? 'Win' : 'Wins'} &mdash; {
                        (() => {
                          const isAllSeasons = groupedEntry.tournaments.every((t: string) => /Season\s*\d+/i.test(t));
                          if (isAllSeasons) {
                            const numbers = groupedEntry.tournaments.map((t: string) => {
                              const match = t.match(/Season\s*(\d+)/i);
                              return match ? match[1] : t;
                            });
                            return groupedEntry.tournaments.length === 1 ? `Season ${numbers[0]}` : `Seasons ${numbers.join(', ')}`;
                          }
                          return groupedEntry.tournaments.join(', ');
                        })()
                      }
                    </Typography>
                  </Box>
                  <Chip
                    label={`${groupedEntry.tournaments.length}`}
                    icon={<EmojiEventsIcon sx={{ fontSize: 14, color: '#F59E0B !important' }} />}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(245, 158, 11, 0.12)',
                      color: '#F59E0B',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      mr: 0.5,
                      '& .MuiChip-icon': { ml: 0.5 },
                    }}
                  />
                </Box>
              ))}
          </Box>
        </Box>
      )}

      {/* Records & Milestones */}
      {analytics && (
        <Box className="animate-section">
          <FunFactsSection
            matches={analytics.all_matches}
            goals={analytics.all_goals}
            registeredPlayers={analytics.registered_players}
            playerInstances={analytics.player_instances}
          />
        </Box>
      )}

      {/* Tournaments Section */}
      <Box className="animate-section" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, mb: 1.5 }}>
          <Typography
            variant="body2"
            sx={{
              color: '#64748B',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
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
              color: '#22C55E',
              fontWeight: 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              p: 0,
              minWidth: 'auto',
              '&:hover': {
                background: 'rgba(34, 197, 94, 0.08)',
              },
            }}
          >
            New
          </Button>
        </Box>

        {loading ? (
          <Box sx={{
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(148, 163, 184, 0.08)',
            borderRadius: '16px',
            p: 2,
          }}>
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={64}
                sx={{
                  borderRadius: 2,
                  mb: i < 3 ? 1 : 0,
                  bgcolor: 'rgba(148, 163, 184, 0.05)',
                }}
              />
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
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(148, 163, 184, 0.08)',
              borderRadius: '16px',
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
