'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltIcon from '@mui/icons-material/Bolt';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import StarsIcon from '@mui/icons-material/Stars';
import TableChartIcon from '@mui/icons-material/TableChart';
import TournamentCard from '@/components/tournament/TournamentCard';
import EmptyState from '@/components/shared/EmptyState';
import GlassCard from '@/components/shared/GlassCard';
import { getPowerRankings } from '@/lib/analytics-insights';
import { getPlayerImagePath } from '@/lib/player-images';
import type { CareerStats, Match, Player, Tournament } from '@/lib/types';
import { fetcher } from '@/lib/fetcher';

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
  career_stats: CareerStats[];
  top_scorers: CareerStats[];
  rating_rankings: CareerStats[];
  motm_rankings: CareerStats[];
  all_matches: Match[];
  all_goals: { player_id: string; minute: number | null; match_id: string }[];
  registered_players: { id: string; name: string; base_team: string }[];
  player_instances: { id: string; registered_player_id: string; name: string; team: string }[];
}

interface TournamentDetails extends Tournament {
  players: Player[];
  matches: Match[];
  goals: { id: string; match_id: string; player_id: string; minute: number | null; player?: Pick<Player, 'id' | 'name'> }[];
}

const COLORS = {
  pitchBlack: '#020617',
  panelSlate: '#0F172A',
  textIce: '#F8FAFC',
  textSteel: '#94A3B8',
  textMuted: '#94A3B8',
  green: '#22C55E',
  greenLight: '#4ADE80',
  greenDark: '#16A34A',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  blueDark: '#2563EB',
  amber: '#F59E0B',
  red: '#EF4444',
};

const panelSx = {
  background: 'rgba(3, 12, 24, 0.68)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  boxShadow: '0 4px 24px rgba(2, 6, 23, 0.3)',
  borderRadius: '16px',
  overflow: 'hidden',
};

const quietPanelSx = {
  background: 'rgba(15, 23, 42, 0.46)',
  border: '1px solid rgba(148, 163, 184, 0.08)',
  boxShadow: 'none',
  borderRadius: '16px',
  overflow: 'hidden',
};

function StatCard({
  icon,
  label,
  value,
  delta,
  accent = '#22C55E',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delta?: string;
  accent?: string;
}) {
  return (
    <GlassCard sx={{ ...panelSx, minHeight: 100 }}>
      <CardContent sx={{ p: 1.6, display: 'flex', alignItems: 'center', gap: 1.15, '&:last-child': { pb: 1.6 } }}>
        <Box
          sx={{
            width: { xs: 48, sm: 52 },
            height: { xs: 48, sm: 52 },
            borderRadius: '12px',
            display: 'grid',
            placeItems: 'center',
            color: accent,
            background: `linear-gradient(135deg, ${accent}28, rgba(15, 23, 42, 0.75))`,
            border: `1px solid ${accent}38`,
            boxShadow: `0 0 24px ${accent}22`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: '#B6C3D5', fontSize: { xs: '0.74rem', sm: '0.8rem' }, fontWeight: 700, lineHeight: 1.12 }}>
            {label}
          </Typography>
          <Typography sx={{ color: '#F8FAFC', fontSize: '1.65rem', lineHeight: 1.05, fontWeight: 950 }}>
            {value}
          </Typography>
          {delta && (
            <Typography sx={{ color: '#4ADE80', fontSize: '0.74rem', fontWeight: 800, mt: 0.25 }} noWrap>
              {delta}
            </Typography>
          )}
        </Box>
      </CardContent>
    </GlassCard>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.25 }}>
      <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: '#F8FAFC' }}>{title}</Typography>
      {action}
    </Box>
  );
}

function SpotlightMetric({ label, value, color = '#F8FAFC' }: { label: string; value: string | number; color?: string }) {
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: '10px',
        bgcolor: 'rgba(2, 6, 23, 0.32)',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        minWidth: 0,
      }}
    >
      <Typography sx={{ color: COLORS.textMuted, fontSize: '0.65rem', fontWeight: 850, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography sx={{ color, fontWeight: 950, fontSize: '1rem', lineHeight: 1.15 }} noWrap>
        {value}
      </Typography>
    </Box>
  );
}

function SpotlightBar({ label, value, color }: { label: string; value: number; color: string }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.45 }}>
        <Typography sx={{ color: '#B6C3D5', fontSize: '0.72rem', fontWeight: 800 }}>{label}</Typography>
        <Typography sx={{ color, fontSize: '0.72rem', fontWeight: 900 }}>{Math.round(clamped)}</Typography>
      </Box>
      <Box sx={{ height: 7, borderRadius: 999, bgcolor: 'rgba(148, 163, 184, 0.1)', overflow: 'hidden' }}>
        <Box
          sx={{
            width: `${clamped}%`,
            height: '100%',
            borderRadius: 999,
            bgcolor: color,
            boxShadow: `0 0 18px ${color}55`,
          }}
        />
      </Box>
    </Box>
  );
}

function MatchNightCommand({
  featuredTournament,
  nextMatch,
  loadingTournaments,
  tournamentCount,
  onPrimary,
  onSecondary,
}: {
  featuredTournament: Tournament | null;
  nextMatch: Match | null;
  loadingTournaments: boolean;
  tournamentCount: number;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  const hasTournament = Boolean(featuredTournament);
  const primaryLabel = nextMatch ? 'Enter Next Result' : hasTournament ? 'Open Active Tournament' : 'Create Tournament';
  const secondaryLabel = hasTournament ? 'View Standings' : 'Register Players';
  const statusLabel = loadingTournaments
    ? 'Loading command center'
    : nextMatch
      ? `Round ${nextMatch.round_number} ready`
      : hasTournament
        ? `${featuredTournament?.status} tournament`
        : 'No tournament yet';

  return (
    <GlassCard
      className="animate-section"
      sx={{
        ...panelSx,
        mb: 1.75,
        background:
          'linear-gradient(135deg, rgba(34, 197, 94, 0.16), rgba(15, 23, 42, 0.86) 42%, rgba(59, 130, 246, 0.12))',
        borderColor: 'rgba(34, 197, 94, 0.22)',
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2, md: 2.5 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)' },
          gap: { xs: 2, md: 3 },
          alignItems: 'center',
          '&:last-child': { pb: { xs: 2, md: 2.5 } },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Chip
            size="small"
            label={statusLabel}
            sx={{
              mb: 1.25,
              color: nextMatch ? COLORS.greenLight : COLORS.blueLight,
              bgcolor: nextMatch ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.12)',
              border: `1px solid ${nextMatch ? 'rgba(34, 197, 94, 0.24)' : 'rgba(59, 130, 246, 0.24)'}`,
              fontWeight: 900,
            }}
          />
          <Typography component="h1" sx={{ color: COLORS.textIce, fontSize: { xs: '1.55rem', sm: '2rem' }, lineHeight: 1.05, fontWeight: 950, letterSpacing: '-0.02em' }}>
            {nextMatch
              ? `${nextMatch.home_player?.name ?? 'Home'} vs ${nextMatch.away_player?.name ?? 'Away'}`
              : hasTournament
                ? featuredTournament?.name
                : 'Start the next FC night'}
          </Typography>
          <Typography sx={{ color: COLORS.textSteel, mt: 1, maxWidth: 620, lineHeight: 1.55 }}>
            {nextMatch
              ? `The next fixture is ready. Jump straight into the match flow, then let standings, rivalries, and player records update around it.`
              : hasTournament
                ? 'Pick up the active tournament, check standings, or move into setup before the next result lands.'
                : 'Create a tournament, add players, and turn the first kickoff into a tracked season.'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            <Button variant="contained" onClick={onPrimary} startIcon={nextMatch ? <SportsSoccerIcon /> : <AddIcon />}>
              {primaryLabel}
            </Button>
            <Button variant="outlined" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 1,
            p: 1,
            borderRadius: '16px',
            bgcolor: 'rgba(2, 6, 23, 0.34)',
            border: '1px solid rgba(148, 163, 184, 0.08)',
          }}
        >
          <SpotlightMetric label="Tournaments" value={loadingTournaments ? '-' : tournamentCount} color={COLORS.amber} />
          <SpotlightMetric label="Status" value={featuredTournament?.status ?? 'Setup'} color={nextMatch ? COLORS.greenLight : COLORS.blueLight} />
          <SpotlightMetric label="Next" value={nextMatch ? `R${nextMatch.round_number}` : 'Queue'} color={COLORS.textIce} />
        </Box>
      </CardContent>
    </GlassCard>
  );
}

function FirstRunReadyCheck({
  hasTournaments,
  registeredPlayers,
  analyticsLoaded,
  onNavigate,
}: {
  hasTournaments: boolean;
  registeredPlayers: number;
  analyticsLoaded: boolean;
  onNavigate: (path: string) => void;
}) {
  if (hasTournaments) return null;

  const steps = [
    {
      label: 'Register players',
      detail: analyticsLoaded && registeredPlayers > 0 ? `${registeredPlayers} ready` : 'Build the roster first',
      complete: analyticsLoaded && registeredPlayers > 0,
      action: 'Players',
      path: '/players',
      icon: <GroupsIcon />,
    },
    {
      label: 'Create tournament',
      detail: 'Choose league, cup, or knockout',
      complete: false,
      action: 'Create',
      path: '/tournaments/new',
      icon: <EmojiEventsIcon />,
    },
    {
      label: 'Enter first result',
      detail: 'The tracker becomes useful after kickoff',
      complete: false,
      action: 'Next',
      path: '/tournaments/new',
      icon: <SportsSoccerIcon />,
    },
  ];

  return (
    <GlassCard
      className="animate-section"
      sx={{
        ...quietPanelSx,
        mb: 1.75,
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 1.5, mb: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Box>
            <Typography sx={{ color: COLORS.textIce, fontWeight: 950, fontSize: '1rem' }}>
              Quick setup path
            </Typography>
            <Typography sx={{ color: COLORS.textSteel, fontSize: '0.84rem', mt: 0.25 }}>
              Optional for repeat users. Follow these once to get to the first tracked match.
            </Typography>
          </Box>
          <Button size="small" variant="outlined" onClick={() => onNavigate('/tournaments/new')}>
            Skip to create
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
          {steps.map((step, index) => (
            <Box
              key={step.label}
              sx={{
                display: 'grid',
                gridTemplateColumns: '38px 1fr auto',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: '12px',
                bgcolor: step.complete ? 'rgba(34, 197, 94, 0.1)' : 'rgba(2, 6, 23, 0.26)',
                border: step.complete ? '1px solid rgba(34, 197, 94, 0.22)' : '1px solid rgba(148, 163, 184, 0.08)',
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  display: 'grid',
                  placeItems: 'center',
                  color: step.complete ? COLORS.greenLight : COLORS.blueLight,
                  bgcolor: step.complete ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.1)',
                }}
              >
                {step.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: COLORS.textIce, fontWeight: 850, fontSize: '0.9rem' }} noWrap>
                  {index + 1}. {step.label}
                </Typography>
                <Typography sx={{ color: COLORS.textSteel, fontSize: '0.74rem' }} noWrap>
                  {step.detail}
                </Typography>
              </Box>
              <Button size="small" onClick={() => onNavigate(step.path)} sx={{ color: step.complete ? COLORS.greenLight : COLORS.blueLight, minWidth: 0 }}>
                {step.complete ? 'Done' : step.action}
              </Button>
            </Box>
          ))}
        </Box>
      </CardContent>
    </GlassCard>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [loadAnalytics, setLoadAnalytics] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [spotlightPaused, setSpotlightPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { data: tournaments = [], isLoading: loadingTournaments } = useSWR<Tournament[]>('/api/tournaments', fetcher);
  const { data: hallOfFame = [] } = useSWR<HallOfFameEntry[]>('/api/analytics/hall-of-fame', fetcher);
  const { data: analytics = null } = useSWR<AnalyticsData>(
    loadAnalytics ? '/api/analytics/global' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const featuredTournament = useMemo(
    () => tournaments.find((t) => t.status === 'active') ?? tournaments[0] ?? null,
    [tournaments]
  );
  const { data: tournamentDetails = null } = useSWR<TournamentDetails>(
    featuredTournament ? `/api/tournaments/${featuredTournament.id}` : null,
    fetcher
  );

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
    () => analytics ? getPowerRankings(analytics.registered_players, analytics.player_instances, analytics.all_matches).slice(0, 5) : [],
    [analytics]
  );

  const spotlightPlayers = useMemo(() => {
    if (!analytics || powerRankings.length === 0) return [];
    return powerRankings.map((row) => ({
      ...row,
      stats: analytics.career_stats.find((statsRow) => statsRow.registered_player_id === row.player.id) ?? null,
    }));
  }, [analytics, powerRankings]);

  const effectiveSpotlightIndex = spotlightPlayers.length > 0 ? spotlightIndex % spotlightPlayers.length : 0;
  const spotlight = spotlightPlayers[effectiveSpotlightIndex] ?? null;

  const nextMatch = useMemo(
    () => tournamentDetails?.matches.find((match) => !match.is_played && !match.is_bye && match.home_player && match.away_player) ?? null,
    [tournamentDetails?.matches]
  );

  const recentMatches = useMemo(() => analytics?.all_matches.slice(0, 4) ?? [], [analytics?.all_matches]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const scheduleIdle = window.requestIdleCallback;
    const idleCallback =
      typeof scheduleIdle === 'function'
        ? scheduleIdle(() => setLoadAnalytics(true), { timeout: 1200 })
        : window.setTimeout(() => setLoadAnalytics(true), 450);

    return () => {
      if (typeof scheduleIdle === 'function') {
        window.cancelIdleCallback(idleCallback);
      } else {
        window.clearTimeout(idleCallback);
      }
    };
  }, []);

  useEffect(() => {
    if (spotlightPlayers.length <= 1 || spotlightPaused || prefersReducedMotion) return undefined;

    const interval = window.setInterval(() => {
      setSpotlightIndex((index) => (index + 1) % spotlightPlayers.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [prefersReducedMotion, spotlightPaused, spotlightPlayers.length]);

  const playedMatches = analytics?.all_matches.length ?? 0;
  const totalGoals = analytics?.all_goals.length ?? 0;
  const motmAwards = analytics?.motm_rankings.reduce((sum, row) => sum + row.motm_awards, 0) ?? 0;
  const registeredPlayers = analytics?.registered_players.length ?? 0;
  const commandPrimaryPath = nextMatch
    ? `/tournaments/${nextMatch.tournament_id}/matches/${nextMatch.id}`
    : featuredTournament
      ? `/tournaments/${featuredTournament.id}`
      : '/tournaments/new';
  const commandSecondaryPath = featuredTournament ? `/tournaments/${featuredTournament.id}/standings` : '/players';

  return (
    <Box>
      <MatchNightCommand
        featuredTournament={featuredTournament}
        nextMatch={nextMatch}
        loadingTournaments={loadingTournaments}
        tournamentCount={tournaments.length}
        onPrimary={() => router.push(commandPrimaryPath)}
        onSecondary={() => router.push(commandSecondaryPath)}
      />

      <FirstRunReadyCheck
        hasTournaments={tournaments.length > 0}
        registeredPlayers={registeredPlayers}
        analyticsLoaded={Boolean(analytics)}
        onNavigate={(path) => router.push(path)}
      />

      <Box
        className="animate-section"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' },
          gap: 1.25,
          mb: 1.75,
        }}
      >
        <StatCard icon={<EmojiEventsIcon />} label="Tournaments" value={loadingTournaments ? '-' : tournaments.length} delta={featuredTournament ? featuredTournament.status : 'Create one'} accent={COLORS.amber} />
        <StatCard icon={<GroupsIcon />} label="Players" value={registeredPlayers || '-'} delta={registeredPlayers ? 'registered' : 'loading'} accent={COLORS.blueLight} />
        <StatCard icon={<SportsSoccerIcon />} label="Matches Played" value={playedMatches || '-'} delta={playedMatches ? 'recorded' : 'loading'} accent={COLORS.textSteel} />
        <StatCard icon={<BoltIcon />} label="Goals Scored" value={totalGoals || '-'} delta={totalGoals ? 'all-time' : 'loading'} accent={COLORS.red} />
        <StatCard icon={<StarsIcon />} label="MOTM Awards" value={motmAwards || '-'} delta={motmAwards ? 'given out' : 'loading'} accent={COLORS.amber} />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.25fr) minmax(360px, 0.75fr)' },
          gap: 1.5,
          alignItems: 'start',
        }}
      >
        <Box sx={{ display: 'grid', gap: 1.5, minWidth: 0 }}>
          <GlassCard className="animate-section" sx={quietPanelSx}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <SectionTitle
                title="Hall of Fame"
                action={
                  hallOfFame.length > 0 && (
                    <Button
                      size="small"
                      onClick={() => router.push('/analytics')}
                      sx={{ color: COLORS.blueLight, py: 0.5, px: 1, fontSize: '0.78rem' }}
                    >
                      View Full
                    </Button>
                  )
                }
              />
              {hallOfFame.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: '#94A3B8' }}>
                  <Typography fontWeight={850}>No champions crowned yet</Typography>
                  <Typography variant="body2">Complete a tournament and the trophy table will live here.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gap: 1 }}>
                  {champions.slice(0, 5).map((champion, index) => (
                    <Box
                      key={champion.name}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '34px 1fr auto',
                        gap: 1.25,
                        alignItems: 'center',
                        p: 1.25,
                        borderRadius: '12px',
                        bgcolor: index === 0 ? 'rgba(245, 158, 11, 0.14)' : 'rgba(148, 163, 184, 0.05)',
                        border: index === 0 ? '1px solid rgba(245, 158, 11, 0.26)' : '1px solid rgba(148, 163, 184, 0.08)',
                      }}
                    >
                      <Box sx={{ width: 34, height: 34, borderRadius: '10px', display: 'grid', placeItems: 'center', color: index === 0 ? COLORS.amber : COLORS.textSteel, bgcolor: index === 0 ? 'rgba(245, 158, 11, 0.13)' : 'rgba(148, 163, 184, 0.08)' }}>
                        <MilitaryTechIcon sx={{ fontSize: 21 }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 950 }} noWrap>{champion.name}</Typography>
                        <Typography sx={{ color: '#8FA2B9', fontSize: '0.74rem' }} noWrap>
                          {champion.latestTitle} - {champion.team}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={`${champion.tournaments.length} titles`}
                        sx={{ color: index === 0 ? COLORS.amber : COLORS.greenLight, bgcolor: index === 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)', fontWeight: 900 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </GlassCard>

          {analytics && analytics.all_matches.length > 0 && (
            <GlassCard className="animate-section" sx={quietPanelSx}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <SectionTitle title="Records & Milestones" />
                <FunFactsSection
                  matches={analytics.all_matches}
                  goals={analytics.all_goals}
                  registeredPlayers={analytics.registered_players}
                  playerInstances={analytics.player_instances}
                />
              </CardContent>
            </GlassCard>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
            <GlassCard className="animate-section" sx={quietPanelSx}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <SectionTitle title="Top Scorers" action={<Button size="small" onClick={() => router.push('/analytics/global')} sx={{ color: COLORS.blueLight, py: 0.25 }}>View All</Button>} />
                {(analytics?.top_scorers ?? []).slice(0, 5).map((row, index) => (
                  <Box component={Link} href={`/players/${row.registered_player_id}`} key={row.registered_player_id} sx={{ display: 'grid', gridTemplateColumns: '26px 1fr auto', alignItems: 'center', gap: 1, py: 0.8, color: 'inherit', textDecoration: 'none', '&:focus-visible': { outline: '2px solid #4ADE80', outlineOffset: 2 } }}>
                    <Typography sx={{ fontWeight: 950 }}>{index + 1}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Avatar src={getPlayerImagePath(row.player_name)} sx={{ width: 34, height: 34 }}>{row.player_name.slice(0, 1)}</Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 850, fontSize: '0.9rem' }} noWrap>{row.player_name}</Typography>
                        <Typography sx={{ color: '#8FA2B9', fontSize: '0.74rem' }} noWrap>{row.base_team}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 950, fontSize: '1.05rem' }}>{row.total_goals}</Typography>
                      <Typography sx={{ color: '#8FA2B9', fontSize: '0.68rem' }}>Goals</Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </GlassCard>

            <GlassCard className="animate-section" sx={panelSx}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <SectionTitle title="Top Performers" action={<Button size="small" onClick={() => router.push('/analytics/global')} sx={{ color: COLORS.blueLight, py: 0.25 }}>View All</Button>} />
                {powerRankings.slice(0, 5).map((row) => (
                  <Box component={Link} href={`/players/${row.player.id}`} key={row.player.id} sx={{ display: 'grid', gridTemplateColumns: '26px 1fr auto', alignItems: 'center', gap: 1, py: 0.8, color: 'inherit', textDecoration: 'none', '&:focus-visible': { outline: '2px solid #4ADE80', outlineOffset: 2 } }}>
                    <Typography sx={{ fontWeight: 950 }}>{row.rank}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Avatar src={getPlayerImagePath(row.player.name)} sx={{ width: 34, height: 34 }}>{row.player.name.slice(0, 1)}</Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 850, fontSize: '0.9rem' }} noWrap>{row.player.name}</Typography>
                        <Typography sx={{ color: '#8FA2B9', fontSize: '0.74rem' }} noWrap>{row.player.base_team}</Typography>
                      </Box>
                    </Box>
                    <Chip size="small" label={row.rating} sx={{ color: COLORS.greenLight, bgcolor: 'rgba(34, 197, 94, 0.14)', fontWeight: 900 }} />
                  </Box>
                ))}
              </CardContent>
            </GlassCard>
          </Box>

          <GlassCard className="animate-section" sx={panelSx}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <SectionTitle
                title="Your Tournaments"
                action={
                  <Button size="small" startIcon={<AddIcon />} onClick={() => router.push('/tournaments/new')} sx={{ color: '#4ADE80', py: 0.25 }}>
                    New
                  </Button>
                }
              />
              {loadingTournaments ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 2, mb: i < 3 ? 1 : 0, bgcolor: 'rgba(148, 163, 184, 0.05)' }} />
                  ))}
                </Box>
              ) : tournaments.length === 0 ? (
                <EmptyState
                  icon={<EmojiEventsIcon sx={{ fontSize: 64 }} />}
                  title="No tournaments yet"
                  description="Create your first tournament to get started tracking matches and stats."
                  action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/tournaments/new')}>Create Tournament</Button>}
                />
              ) : (
                <Box sx={{ mx: -2, mb: -2 }}>
                  {tournaments.slice(0, 5).map((t, index) => (
                    <TournamentCard key={t.id} tournament={t} showDivider={index < Math.min(tournaments.length, 5) - 1} index={index} />
                  ))}
                </Box>
              )}
            </CardContent>
          </GlassCard>
        </Box>

        <Box sx={{ display: 'grid', gap: 1.5, minWidth: 0 }}>
          <GlassCard className="animate-section" sx={panelSx}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <SectionTitle
                title="Next Up"
                action={featuredTournament && <Button size="small" onClick={() => router.push(`/tournaments/${featuredTournament.id}`)} sx={{ color: COLORS.blueLight, py: 0.25 }}>Fixtures</Button>}
              />
              {nextMatch ? (
                <Box
                  component={Link}
                  href={`/tournaments/${nextMatch.tournament_id}`}
                  aria-label="Open the next tournament fixture"
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.13), rgba(15, 23, 42, 0.72))',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                    cursor: 'pointer',
                    color: 'inherit',
                    textDecoration: 'none',
                    '&:focus-visible': { outline: '3px solid #4ADE80', outlineOffset: 2 },
                  }}
                >
                  <Typography sx={{ color: COLORS.textIce, textAlign: 'center', fontWeight: 800, mb: 0.5 }}>Round {nextMatch.round_number}</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 54px 1fr', alignItems: 'center', gap: 1.5, py: 1 }}>
                    {[nextMatch.home_player, nextMatch.away_player].map((player) => (
                      <Box key={player?.id} sx={{ textAlign: 'center', minWidth: 0 }}>
                        <Avatar src={getPlayerImagePath(player?.name ?? '')} sx={{ width: 70, height: 70, mx: 'auto', mb: 1, border: '2px solid rgba(74, 222, 128, 0.28)' }}>
                          {player?.name?.slice(0, 1)}
                        </Avatar>
                        <Typography sx={{ fontWeight: 900 }} noWrap>{player?.name}</Typography>
                        <Typography sx={{ color: '#8FA2B9', fontSize: '0.74rem' }} noWrap>{player?.team}</Typography>
                      </Box>
                    ))}
                    <Typography sx={{ textAlign: 'center', color: COLORS.textIce, fontWeight: 950, fontSize: '1.9rem' }}>VS</Typography>
                  </Box>
                  <Typography sx={{ color: '#8FA2B9', textAlign: 'center', fontSize: '0.78rem', mt: 0.75 }}>
                    Estadio de FC
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center', color: '#94A3B8' }}>
                  <Typography fontWeight={850}>No upcoming fixture</Typography>
                  <Typography variant="body2">Create or start a tournament to queue up the next match.</Typography>
                </Box>
              )}
            </CardContent>
          </GlassCard>

          <GlassCard
            className="animate-section"
            onMouseEnter={() => setSpotlightPaused(true)}
            onMouseLeave={() => setSpotlightPaused(false)}
            onFocus={() => setSpotlightPaused(true)}
            onBlur={() => setSpotlightPaused(false)}
            sx={panelSx}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <SectionTitle
                title="Player Spotlight"
                action={
                  spotlightPlayers.length > 1 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        aria-label="Previous spotlight player"
                        size="small"
                        onClick={() => setSpotlightIndex((index) => (index - 1 + spotlightPlayers.length) % spotlightPlayers.length)}
                        sx={{ color: COLORS.blueLight, border: '1px solid rgba(59, 130, 246, 0.16)', width: 30, height: 30 }}
                      >
                        <ChevronLeftIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ color: '#8FA2B9', fontSize: '0.72rem', fontWeight: 800, minWidth: 34, textAlign: 'center' }}>
                        {effectiveSpotlightIndex + 1}/{spotlightPlayers.length}
                      </Typography>
                      <IconButton
                        aria-label="Next spotlight player"
                        size="small"
                        onClick={() => setSpotlightIndex((index) => (index + 1) % spotlightPlayers.length)}
                        sx={{ color: COLORS.blueLight, border: '1px solid rgba(59, 130, 246, 0.16)', width: 30, height: 30 }}
                      >
                        <ChevronRightIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )
                }
              />
              {spotlight ? (
                <Box>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      mb: 1.5,
                      minHeight: 188,
                      background:
                        'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(15, 23, 42, 0.84) 52%, rgba(59, 130, 246, 0.16))',
                      border: '1px solid rgba(34, 197, 94, 0.18)',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.18,
                        background: `url(${getPlayerImagePath(spotlight.player.name)}) center 18% / cover no-repeat`,
                        filter: 'blur(14px) saturate(1.15)',
                        transform: 'scale(1.08)',
                      }}
                    />
                    <Box sx={{ position: 'relative', display: 'grid', gridTemplateColumns: { xs: '104px 1fr', sm: '128px 1fr' }, gap: 1.5, p: 1.5, alignItems: 'center' }}>
                      <Avatar
                        src={getPlayerImagePath(spotlight.player.name)}
                        sx={{
                          width: { xs: 104, sm: 128 },
                          height: { xs: 104, sm: 128 },
                          border: '2px solid rgba(74, 222, 128, 0.72)',
                          boxShadow: '0 0 34px rgba(34, 197, 94, 0.22)',
                        }}
                      >
                        {spotlight.player.name.slice(0, 1)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.75 }}>
                          <Chip size="small" label={`#${spotlight.rank} Power`} sx={{ color: COLORS.greenLight, bgcolor: 'rgba(34, 197, 94, 0.16)', fontWeight: 950 }} />
                          <Chip size="small" label={`${spotlight.rating} PR`} sx={{ color: COLORS.blueLight, bgcolor: 'rgba(59, 130, 246, 0.15)', fontWeight: 950 }} />
                        </Box>
                        <Typography sx={{ fontWeight: 950, fontSize: { xs: '1.25rem', sm: '1.5rem' }, lineHeight: 1.05 }} noWrap>
                          {spotlight.player.name}
                        </Typography>
                        <Typography sx={{ color: '#B6C3D5', fontSize: '0.86rem', fontWeight: 750 }} noWrap>
                          {spotlight.player.base_team}
                        </Typography>
                        <Typography sx={{ color: '#8FA2B9', fontSize: '0.76rem', mt: 1.1, lineHeight: 1.45 }}>
                          {spotlight.stats && spotlight.stats.total_matches > 0
                            ? `${spotlight.stats.goals_per_match.toFixed(2)} goals per match with ${spotlight.stats.win_rate.toFixed(1)}% win rate.`
                            : 'Ready to build a profile once more matches are played.'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {spotlightPlayers.length > 1 && (
                    <Box className="hide-scrollbar" sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', pb: 0.5, mb: 1.5 }}>
                      {spotlightPlayers.map((row, index) => (
                        <Chip
                          key={row.player.id}
                          avatar={<Avatar src={getPlayerImagePath(row.player.name)}>{row.player.name.slice(0, 1)}</Avatar>}
                          label={row.player.name}
                          onClick={() => setSpotlightIndex(index)}
                          sx={{
                            flexShrink: 0,
                            color: spotlight.player.id === row.player.id ? COLORS.textIce : '#B7C4D6',
                            bgcolor: spotlight.player.id === row.player.id ? 'rgba(34, 197, 94, 0.22)' : 'rgba(148, 163, 184, 0.07)',
                            borderColor: spotlight.player.id === row.player.id ? 'rgba(34, 197, 94, 0.42)' : 'rgba(148, 163, 184, 0.1)',
                            fontWeight: 850,
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0.8, mb: 1.5 }}>
                    <SpotlightMetric label="Matches" value={spotlight.stats?.total_matches ?? 0} />
                    <SpotlightMetric label="Goals" value={spotlight.stats?.total_goals ?? 0} color={COLORS.amber} />
                    <SpotlightMetric label="MOTM" value={spotlight.stats?.motm_awards ?? 0} color={COLORS.blueLight} />
                    <SpotlightMetric label="Rating" value={spotlight.stats?.avg_rating.toFixed(2) ?? '0.00'} color={COLORS.greenLight} />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1.5, alignItems: 'end' }}>
                    <Box sx={{ display: 'grid', gap: 1 }}>
                      <SpotlightBar label="Win Rate" value={spotlight.stats?.win_rate ?? 0} color="#22C55E" />
                      <SpotlightBar label="Avg Rating" value={(spotlight.stats?.avg_rating ?? 0) * 10} color={COLORS.blue} />
                      <SpotlightBar label="Goal Threat" value={Math.min((spotlight.stats?.goals_per_match ?? 0) * 28, 100)} color={COLORS.amber} />
                    </Box>
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push(`/players/${spotlight.player.id}`)}
                      sx={{
                        color: COLORS.blueLight,
                        border: '1px solid rgba(59, 130, 246, 0.18)',
                        bgcolor: 'rgba(59, 130, 246, 0.06)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      View Profile
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center', color: '#94A3B8' }}>
                  <Typography fontWeight={850}>Spotlight warming up</Typography>
                  <Typography variant="body2">Once matches are played, the top performer appears here.</Typography>
                </Box>
              )}
            </CardContent>
          </GlassCard>

          <GlassCard className="animate-section" sx={quietPanelSx}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <SectionTitle title="Recent Activity" />
              {recentMatches.length > 0 ? recentMatches.map((match, index) => (
                <Box component={Link} href={`/tournaments/${match.tournament_id}`} key={match.id} sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, py: 1, alignItems: 'center', color: 'inherit', textDecoration: 'none', borderTop: index === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.07)', '&:focus-visible': { outline: '2px solid #4ADE80', outlineOffset: 2 } }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 850, fontSize: '0.86rem' }} noWrap>
                      {match.home_player?.name} {match.home_score} - {match.away_score} {match.away_player?.name}
                    </Typography>
                    <Typography sx={{ color: '#8FA2B9', fontSize: '0.72rem' }} noWrap>{match.tournament?.name ?? 'Tournament'}</Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={match.round_number ? `R${match.round_number}` : 'Match'}
                    sx={{ color: COLORS.greenLight, bgcolor: 'rgba(34, 197, 94, 0.11)', fontWeight: 850 }}
                  />
                </Box>
              )) : (
                <Typography sx={{ color: '#94A3B8', py: 2 }}>Recent match results will appear here.</Typography>
              )}
            </CardContent>
          </GlassCard>

          <GlassCard className="animate-section" sx={quietPanelSx}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <SectionTitle title="Command Shortcuts" />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
                {[
                  { label: 'New Tournament', icon: <AddIcon />, path: '/tournaments/new', color: COLORS.green },
                  { label: 'Players', icon: <GroupsIcon />, path: '/players', color: '#60A5FA' },
                  { label: 'Rivalry', icon: <SportsSoccerIcon />, path: '/analytics/h2h', color: COLORS.blue },
                  { label: 'Analytics', icon: <LeaderboardIcon />, path: '/analytics/global', color: '#F59E0B' },
                  { label: 'Leagues', icon: <TableChartIcon />, path: '/analytics/league', color: COLORS.green },
                  { label: 'AI Analyst', icon: <AutoAwesomeIcon />, path: '/analytics/ai', color: COLORS.blueLight },
                ].map((action) => (
                  <Button
                    key={action.label}
                    onClick={() => router.push(action.path)}
                    sx={{
                      minWidth: 0,
                      flexDirection: 'column',
                      gap: 0.75,
                      px: 0.5,
                      py: 1.25,
                      color: '#F8FAFC',
                      border: `1px solid ${action.color}30`,
                      background: `${action.color}12`,
                      borderRadius: '12px',
                      '& .MuiSvgIcon-root': { color: action.color },
                    }}
                  >
                    {action.icon}
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 850 }}>{action.label}</Typography>
                  </Button>
                ))}
              </Box>
            </CardContent>
          </GlassCard>
        </Box>
      </Box>

    </Box>
  );
}
