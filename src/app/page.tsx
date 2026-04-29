'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import CardContent from '@mui/material/CardContent';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BoltIcon from '@mui/icons-material/Bolt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TournamentCard from '@/components/tournament/TournamentCard';
import EmptyState from '@/components/shared/EmptyState';
import GlassCard from '@/components/shared/GlassCard';
import { getPowerRankings } from '@/lib/analytics-insights';
import type { Tournament, Match } from '@/lib/types';

const FunFactsSection = dynamic(() => import('@/components/analytics/FunFactsSection'), {
  ssr: false,
});

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
  const [loadAnalytics, setLoadAnalytics] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const { data: tournaments = [], isLoading: loadingTournaments } = useSWR<Tournament[]>('/api/tournaments', fetcher);
  const { data: hallOfFame = [] } = useSWR<HallOfFameEntry[]>('/api/analytics/hall-of-fame', fetcher);
  const { data: analytics = null } = useSWR<AnalyticsData>(
    loadAnalytics ? '/api/analytics/global' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const loading = loadingTournaments;
  const champions = useMemo(
    () => Object.values(
      hallOfFame.reduce((acc, entry) => {
        if (!acc[entry.winner_name]) {
          acc[entry.winner_name] = {
            name: entry.winner_name,
            team: entry.winner_team,
            tournaments: [],
            points: 0,
            latestTitle: entry.tournament_name,
            latestCompletedAt: entry.completed_at,
          };
        }
        acc[entry.winner_name].tournaments.push(entry.tournament_name);
        acc[entry.winner_name].points += Number(entry.stats.points || 0);
        if (!acc[entry.winner_name].latestCompletedAt || entry.completed_at > acc[entry.winner_name].latestCompletedAt) {
          acc[entry.winner_name].latestTitle = entry.tournament_name;
          acc[entry.winner_name].latestCompletedAt = entry.completed_at;
        }
        return acc;
      }, {} as Record<string, { name: string; team: string; tournaments: string[]; points: number; latestTitle: string; latestCompletedAt: string }>)
    ).sort((a, b) => b.tournaments.length - a.tournaments.length || b.points - a.points),
    [hallOfFame]
  );
  const powerRankings = useMemo(
    () => analytics ? getPowerRankings(analytics.registered_players, analytics.player_instances, analytics.all_matches).slice(0, 3) : [],
    [analytics]
  );

  useEffect(() => {
    const scheduleIdle = window.requestIdleCallback;
    const idleCallback =
      typeof scheduleIdle === 'function'
        ? scheduleIdle(() => setLoadAnalytics(true), { timeout: 1800 })
        : window.setTimeout(() => setLoadAnalytics(true), 800);

    return () => {
      if (typeof scheduleIdle === 'function') {
        window.cancelIdleCallback(idleCallback);
      } else {
        window.clearTimeout(idleCallback);
      }
    };
  }, []);

  return (
    <Box>
      {/* Spatial Info Panel instead of flat floating text */}
      <Box className="animate-section" sx={{ mb: 4, mt: 1, perspective: 1000 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '16px',
              padding: '12px 24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              transformStyle: 'preserve-3d',
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 32, color: '#22C55E', filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.5))' }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: '#F8FAFC',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              Tournaments
            </Typography>
          </Box>
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
          <GlassCard>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 1,
                  p: 1.5,
                  alignItems: 'end',
                }}
              >
                {champions.slice(0, 3).map((champion, index) => {
                  const rankColors = ['#F59E0B', '#94A3B8', '#B45309'];
                  return (
                    <Box
                      key={champion.name}
                      sx={{
                        border: `1px solid ${rankColors[index]}35`,
                        bgcolor: `${rankColors[index]}12`,
                        borderRadius: '14px',
                        p: 1.5,
                        minHeight: { xs: 'auto', sm: index === 0 ? 132 : 112 },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        order: { xs: index, sm: index === 0 ? 2 : index === 1 ? 1 : 3 },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: rankColors[index], fontWeight: 900 }}>
                          #{index + 1}
                        </Typography>
                        <EmojiEventsIcon sx={{ color: rankColors[index], fontSize: index === 0 ? 26 : 20 }} />
                      </Box>
                      <Typography fontWeight={900} noWrap>
                        {champion.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {champion.team}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Chip size="small" label={`${champion.tournaments.length} titles`} sx={{ bgcolor: `${rankColors[index]}20`, color: rankColors[index], fontWeight: 800 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 1 }}>
                        Latest: {champion.latestTitle}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {champions.slice(3).map((groupedEntry, index, arr) => (
                <Box
                  key={groupedEntry.name}
                  className="list-row"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1.5,
                    borderBottom: index < arr.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
                    borderTop: index === 0 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
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
            </CardContent>
          </GlassCard>
        </Box>
      )}

      {/* Power Rankings Preview */}
      {powerRankings.length > 0 && (
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
            <BoltIcon sx={{ fontSize: 16, color: '#A855F7' }} />
            Live Power Ranking
          </Typography>
          <GlassCard>
            <CardContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.25 }}>
              {powerRankings.map((row) => (
                <Box
                  key={row.player.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    p: 1.25,
                    borderRadius: '12px',
                    bgcolor: row.rank === 1 ? 'rgba(168, 85, 247, 0.12)' : 'rgba(148, 163, 184, 0.04)',
                    border: row.rank === 1 ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid rgba(148, 163, 184, 0.06)',
                  }}
                >
                  <Typography fontWeight={900} sx={{ color: row.rank === 1 ? '#A855F7' : '#64748B', width: 26 }}>
                    #{row.rank}
                  </Typography>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography fontWeight={800} noWrap>{row.player.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{row.player.base_team}</Typography>
                  </Box>
                  <Chip size="small" label={row.rating} sx={{ color: '#A855F7', bgcolor: 'rgba(168, 85, 247, 0.12)', fontWeight: 800 }} />
                </Box>
              ))}
            </CardContent>
          </GlassCard>
        </Box>
      )}

      {/* Records & Milestones */}
      {analytics && analytics.all_matches.length > 0 && (
        <Box className="animate-section" sx={{ mb: showRecords ? 0 : 4 }}>
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
              Records & Milestones
            </Typography>
            <Button
              variant="text"
              size="small"
              endIcon={showRecords ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowRecords((value) => !value)}
              sx={{ color: '#22C55E', textTransform: 'none', fontWeight: 700 }}
            >
              {showRecords ? 'Hide' : 'Show'}
            </Button>
          </Box>
          {showRecords && (
            <FunFactsSection
              matches={analytics.all_matches}
              goals={analytics.all_goals}
              registeredPlayers={analytics.registered_players}
              playerInstances={analytics.player_instances}
            />
          )}
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
              <TournamentCard key={t.id} tournament={t} showDivider={index < tournaments.length - 1} index={index} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
