'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import RefreshIcon from '@mui/icons-material/Refresh';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import TournamentCard from '@/components/tournament/TournamentCard';
import GlassCard from '@/components/shared/GlassCard';
import { getPowerRankings } from '@/lib/analytics-insights';
import { getPlayerImagePath } from '@/lib/player-images';
import type { CareerStats, Match, Player, RegisteredPlayer, Tournament } from '@/lib/types';
import { fetcher } from '@/lib/fetcher';

const FunFactsSection = dynamic(() => import('@/components/analytics/FunFactsSection'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={160} />,
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
  registered_players: RegisteredPlayer[];
  player_instances: { id: string; registered_player_id: string; name: string; team: string }[];
}

interface TournamentDetails extends Tournament {
  players: Player[];
  matches: Match[];
  goals: { id: string; match_id: string; player_id: string; minute: number | null; player?: Pick<Player, 'id' | 'name'> }[];
}

const COLORS = {
  pitchBlack: '#020617',
  textIce: '#F8FAFC',
  textSteel: '#B6C3D5',
  green: '#22C55E',
  greenLight: '#4ADE80',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  amber: '#F59E0B',
};

const surfaceSx = {
  background: '#0F172A',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  boxShadow: 'none',
  borderRadius: '16px',
};

const localErrorHandling = { onError: () => undefined };

function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 1.5 }}>
      <Typography component="h2" sx={{ fontSize: '1.05rem', fontWeight: 700, color: COLORS.textIce }}>
        {title}
      </Typography>
      {action}
    </Box>
  );
}

function DataErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
          Retry
        </Button>
      }
      sx={{ mb: 1.5, alignItems: 'center', '& .MuiAlert-message': { minWidth: 0 } }}
    >
      {message}
    </Alert>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function LoadingHome() {
  return (
    <GlassCard sx={surfaceSx} aria-label="Loading tournament dashboard">
      <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
        <Skeleton width={150} height={28} />
        <Skeleton width="min(520px, 92%)" height={52} sx={{ mt: 1 }} />
        <Skeleton width="min(680px, 96%)" height={26} />
        <Skeleton width={190} height={48} sx={{ mt: 2 }} />
      </CardContent>
    </GlassCard>
  );
}

function KickoffFlow({
  players,
  loadingPlayers,
  playersError,
  onRetryPlayers,
  onNavigate,
}: {
  players: RegisteredPlayer[];
  loadingPlayers: boolean;
  playersError: unknown;
  onRetryPlayers: () => void;
  onNavigate: (path: string) => void;
}) {
  const rosterReady = players.length >= 2;
  const primaryPath = rosterReady ? '/tournaments/new' : '/players';
  const primaryLabel = rosterReady ? 'Create Tournament' : 'Register Players';

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', pt: { xs: 1, lg: 4 } }}>
      {Boolean(playersError) && (
        <DataErrorPanel
          message={getErrorMessage(playersError, 'The roster could not be loaded.')}
          onRetry={onRetryPlayers}
        />
      )}

      <GlassCard sx={{ ...surfaceSx, borderColor: 'rgba(34, 197, 94, 0.24)' }}>
        <CardContent sx={{ p: { xs: 2.25, sm: 3.5 }, '&:last-child': { pb: { xs: 2.25, sm: 3.5 } } }}>
          <Chip
            icon={<SportsSoccerIcon />}
            label="New match night"
            sx={{ color: COLORS.greenLight, bgcolor: 'rgba(34, 197, 94, 0.1)', mb: 1.5 }}
          />
          <Typography component="h1" sx={{ fontSize: { xs: '1.75rem', sm: '2.35rem' }, lineHeight: 1.08, fontWeight: 700 }}>
            Set up tonight’s tournament
          </Typography>
          <Typography sx={{ color: COLORS.textSteel, mt: 1, maxWidth: 680, lineHeight: 1.6 }}>
            Build the roster, choose a format, and generate the first fixture. The dashboard will unlock once the competition starts.
          </Typography>

          <Box
            component="ol"
            sx={{
              listStyle: 'none',
              p: 0,
              my: 3,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              borderTop: '1px solid rgba(148, 163, 184, 0.12)',
              borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
            }}
          >
            {[
              {
                title: 'Roster',
                detail: loadingPlayers ? 'Checking registered players…' : playersError ? 'Roster unavailable' : `${players.length} player${players.length === 1 ? '' : 's'} ready`,
                complete: rosterReady,
              },
              { title: 'Format', detail: 'League, knockout, or cup', complete: false },
              { title: 'First fixture', detail: 'Generated after creation', complete: false },
            ].map((step, index) => (
              <Box
                component="li"
                key={step.title}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr',
                  gap: 1.25,
                  alignItems: 'center',
                  py: 2,
                  px: { xs: 0, md: 2 },
                  borderTop: { xs: index === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.1)', md: 'none' },
                  borderLeft: { xs: 'none', md: index === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.1)' },
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: step.complete ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.1)',
                    color: step.complete ? COLORS.greenLight : COLORS.blueLight,
                    fontWeight: 700,
                  }}
                >
                  {step.complete ? <CheckCircleOutlineIcon fontSize="small" /> : index + 1}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{step.title}</Typography>
                  <Typography sx={{ color: COLORS.textSteel, fontSize: '0.875rem' }}>{step.detail}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button variant="contained" startIcon={rosterReady ? <AddIcon /> : <GroupsIcon />} onClick={() => onNavigate(primaryPath)}>
              {primaryLabel}
            </Button>
            <Button variant="outlined" onClick={() => onNavigate(rosterReady ? '/players' : '/tournaments/new')}>
              {rosterReady ? 'Review Roster' : 'Create Without Roster'}
            </Button>
          </Box>
        </CardContent>
      </GlassCard>
    </Box>
  );
}

function MatchNightCommand({
  featuredTournament,
  nextMatch,
  refreshing,
  dataAvailable,
  onPrimary,
  onSecondary,
}: {
  featuredTournament: Tournament;
  nextMatch: Match | null;
  refreshing: boolean;
  dataAvailable: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  const primaryLabel = nextMatch ? 'Enter Next Result' : 'Open Tournament';
  const secondaryLabel = 'View Standings';

  return (
    <GlassCard sx={{ ...surfaceSx, mb: 1.75, borderColor: nextMatch ? 'rgba(34, 197, 94, 0.32)' : 'rgba(59, 130, 246, 0.24)' }}>
      <CardContent
        sx={{
          p: { xs: 2.25, md: 3 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.25fr) minmax(280px, 0.75fr)' },
          gap: { xs: 2.5, md: 4 },
          alignItems: 'center',
          '&:last-child': { pb: { xs: 2.25, md: 3 } },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Chip
            icon={dataAvailable ? <CheckCircleOutlineIcon /> : <RefreshIcon />}
            label={refreshing ? 'Refreshing live data' : dataAvailable ? 'Live data connected' : 'Live data unavailable'}
            sx={{
              mb: 1.5,
              color: dataAvailable ? COLORS.greenLight : COLORS.amber,
              bgcolor: dataAvailable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            }}
          />
          <Typography component="h1" sx={{ color: COLORS.textIce, fontSize: { xs: '1.7rem', sm: '2.25rem' }, lineHeight: 1.08, fontWeight: 700 }}>
            {nextMatch
              ? `${nextMatch.home_player?.name ?? 'Home'} vs ${nextMatch.away_player?.name ?? 'Away'}`
              : featuredTournament.name}
          </Typography>
          <Typography sx={{ color: COLORS.textSteel, mt: 1, maxWidth: 680, lineHeight: 1.6 }}>
            {nextMatch
              ? `Round ${nextMatch.round_number} is ready. Enter the score and the standings will update around it.`
              : 'The tournament is active. Review the table or open tournament control before the next fixture.'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            <Button variant="contained" onClick={onPrimary} startIcon={<SportsSoccerIcon />}>
              {primaryLabel}
            </Button>
            <Button variant="outlined" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          </Box>
        </Box>

        <Box
          aria-label="Active tournament context"
          sx={{
            py: 2,
            px: { xs: 0, md: 2.5 },
            borderTop: { xs: '1px solid rgba(148, 163, 184, 0.12)', md: 'none' },
            borderLeft: { xs: 'none', md: '1px solid rgba(148, 163, 184, 0.12)' },
          }}
        >
          <Typography sx={{ color: COLORS.textSteel, fontSize: '0.875rem' }}>Active tournament</Typography>
          <Typography sx={{ color: COLORS.textIce, fontWeight: 700, fontSize: '1.2rem', mt: 0.25 }} noWrap>
            {featuredTournament.name}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.25 }}>
            <Chip size="small" label={featuredTournament.format} />
            <Chip size="small" label={featuredTournament.status} color={featuredTournament.status === 'active' ? 'success' : 'default'} />
            {nextMatch && <Chip size="small" label={`Round ${nextMatch.round_number}`} />}
          </Box>
        </Box>
      </CardContent>
    </GlassCard>
  );
}

function SignalStrip({
  players,
  matches,
  goals,
  loading,
  unavailable,
}: {
  players: number;
  matches: number;
  goals: number;
  loading: boolean;
  unavailable: boolean;
}) {
  const signals = [
    { label: 'Registered players', value: players, color: COLORS.blueLight },
    { label: 'Played matches', value: matches, color: COLORS.greenLight },
    { label: 'Recorded goals', value: goals, color: COLORS.amber },
  ];

  return (
    <GlassCard sx={{ ...surfaceSx, mb: 1.75 }}>
      <Box role="list" aria-label="Competition summary" sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {signals.map((signal, index) => (
          <Box
            role="listitem"
            key={signal.label}
            sx={{
              px: { xs: 1.25, sm: 2.25 },
              py: 1.75,
              borderLeft: index === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.1)',
            }}
          >
            <Typography sx={{ color: COLORS.textSteel, fontSize: '0.875rem' }}>{signal.label}</Typography>
            {loading ? (
              <Skeleton width={54} height={34} />
            ) : (
              <Typography sx={{ color: unavailable ? COLORS.textSteel : signal.color, fontWeight: 700, fontSize: { xs: '1.35rem', sm: '1.65rem' }, lineHeight: 1.15 }}>
                {unavailable ? '—' : signal.value}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </GlassCard>
  );
}

export default function HomePage() {
  const router = useRouter();
  const {
    data: tournaments = [],
    error: tournamentsError,
    isLoading: loadingTournaments,
    isValidating: validatingTournaments,
    mutate: retryTournaments,
  } = useSWR<Tournament[]>('/api/tournaments', fetcher, localErrorHandling);
  const {
    data: players = [],
    error: playersError,
    isLoading: loadingPlayers,
    mutate: retryPlayers,
  } = useSWR<RegisteredPlayer[]>('/api/players', fetcher, { ...localErrorHandling, revalidateOnFocus: false });

  const hasTournament = tournaments.length > 0;
  const {
    data: analytics,
    error: analyticsError,
    isLoading: loadingAnalytics,
    mutate: retryAnalytics,
  } = useSWR<AnalyticsData>(hasTournament ? '/api/analytics/global' : null, fetcher, { ...localErrorHandling, revalidateOnFocus: false });
  const {
    data: hallOfFame = [],
    error: hallOfFameError,
    mutate: retryHallOfFame,
  } = useSWR<HallOfFameEntry[]>(hasTournament ? '/api/analytics/hall-of-fame' : null, fetcher, { ...localErrorHandling, revalidateOnFocus: false });

  const featuredTournament = useMemo(
    () => tournaments.find((tournament) => tournament.status === 'active') ?? tournaments[0] ?? null,
    [tournaments]
  );
  const {
    data: tournamentDetails,
    error: tournamentDetailsError,
    isValidating: validatingTournamentDetails,
    mutate: retryTournamentDetails,
  } = useSWR<TournamentDetails>(featuredTournament ? `/api/tournaments/${featuredTournament.id}` : null, fetcher, localErrorHandling);

  const nextMatch = useMemo(
    () => tournamentDetails?.matches.find((match) => !match.is_played && !match.is_bye && match.home_player && match.away_player) ?? null,
    [tournamentDetails?.matches]
  );
  const recentMatches = useMemo(
    () => (analytics?.all_matches ?? []).filter((match) => match.is_played && !match.is_bye).slice(0, 4),
    [analytics?.all_matches]
  );
  const powerRankings = useMemo(
    () => analytics ? getPowerRankings(analytics.registered_players, analytics.player_instances, analytics.all_matches).slice(0, 5) : [],
    [analytics]
  );
  const champions = useMemo(
    () => Object.values(
      hallOfFame.reduce((acc, entry) => {
        const current = acc[entry.winner_name] ?? {
          name: entry.winner_name,
          team: entry.winner_team,
          titles: 0,
          latestTitle: entry.tournament_name,
          completedAt: entry.completed_at,
        };
        current.titles += 1;
        if (!current.completedAt || entry.completed_at > current.completedAt) {
          current.latestTitle = entry.tournament_name;
          current.completedAt = entry.completed_at;
        }
        acc[entry.winner_name] = current;
        return acc;
      }, {} as Record<string, { name: string; team: string; titles: number; latestTitle: string; completedAt: string }>)
    ).sort((a, b) => b.titles - a.titles),
    [hallOfFame]
  );

  if (loadingTournaments) return <LoadingHome />;

  if (tournamentsError && tournaments.length === 0) {
    return (
      <Box sx={{ maxWidth: 760, mx: 'auto', pt: { xs: 1, lg: 4 } }}>
        <DataErrorPanel
          message={getErrorMessage(tournamentsError, 'Tournament data could not be loaded.')}
          onRetry={() => void retryTournaments()}
        />
        <GlassCard sx={surfaceSx}>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>Match-night data is unavailable</Typography>
            <Typography sx={{ color: COLORS.textSteel, mt: 1, mb: 2 }}>
              Check the deployment configuration or connection, then retry. No tournament data has been replaced with zero values.
            </Typography>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => void retryTournaments()}>
              Retry Connection
            </Button>
          </CardContent>
        </GlassCard>
      </Box>
    );
  }

  if (!hasTournament) {
    return (
      <KickoffFlow
        players={players}
        loadingPlayers={loadingPlayers}
        playersError={playersError}
        onRetryPlayers={() => void retryPlayers()}
        onNavigate={(path) => router.push(path)}
      />
    );
  }

  if (!featuredTournament) return null;

  const commandPrimaryPath = nextMatch
    ? `/tournaments/${nextMatch.tournament_id}/matches/${nextMatch.id}`
    : `/tournaments/${featuredTournament.id}`;
  const commandSecondaryPath = `/tournaments/${featuredTournament.id}/standings`;
  const dataAvailable = !tournamentsError && !tournamentDetailsError;
  const refreshing = validatingTournaments || validatingTournamentDetails;

  return (
    <Box>
      {(tournamentsError || tournamentDetailsError) && (
        <DataErrorPanel
          message={getErrorMessage(tournamentsError ?? tournamentDetailsError, 'Live tournament data could not be refreshed. Previously loaded data remains visible.')}
          onRetry={() => {
            void retryTournaments();
            void retryTournamentDetails();
          }}
        />
      )}
      {playersError && (
        <DataErrorPanel message={getErrorMessage(playersError, 'Player data could not be refreshed.')} onRetry={() => void retryPlayers()} />
      )}
      {analyticsError && (
        <DataErrorPanel message={getErrorMessage(analyticsError, 'Analytics could not be refreshed.')} onRetry={() => void retryAnalytics()} />
      )}
      {hallOfFameError && (
        <DataErrorPanel message={getErrorMessage(hallOfFameError, 'Hall of Fame data could not be refreshed.')} onRetry={() => void retryHallOfFame()} />
      )}

      <MatchNightCommand
        featuredTournament={featuredTournament}
        nextMatch={nextMatch}
        refreshing={refreshing}
        dataAvailable={dataAvailable}
        onPrimary={() => router.push(commandPrimaryPath)}
        onSecondary={() => router.push(commandSecondaryPath)}
      />

      <SignalStrip
        players={players.length}
        matches={analytics?.all_matches.length ?? 0}
        goals={analytics?.all_goals.length ?? 0}
        loading={loadingPlayers || loadingAnalytics}
        unavailable={Boolean(playersError || analyticsError)}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.2fr) minmax(340px, 0.8fr)' }, gap: 1.5, alignItems: 'start' }}>
        <Box sx={{ display: 'grid', gap: 1.5, minWidth: 0 }}>
          <GlassCard sx={surfaceSx}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Box sx={{ px: 2, pt: 2 }}>
                <SectionHeading
                  title="Your tournaments"
                  action={
                    <Button size="small" startIcon={<AddIcon />} onClick={() => router.push('/tournaments/new')}>
                      New tournament
                    </Button>
                  }
                />
              </Box>
              {tournaments.slice(0, 4).map((tournament, index) => (
                <TournamentCard key={tournament.id} tournament={tournament} showDivider={index < Math.min(tournaments.length, 4) - 1} index={index} />
              ))}
            </CardContent>
          </GlassCard>

          {analytics && analytics.all_matches.length > 0 && (
            <GlassCard sx={surfaceSx}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <SectionHeading title="Records and milestones" />
                <FunFactsSection
                  matches={analytics.all_matches}
                  goals={analytics.all_goals}
                  registeredPlayers={analytics.registered_players}
                  playerInstances={analytics.player_instances}
                />
              </CardContent>
            </GlassCard>
          )}
        </Box>

        <Box sx={{ display: 'grid', gap: 1.5, minWidth: 0 }}>
          {loadingAnalytics && (
            <GlassCard sx={surfaceSx}>
              <CardContent>
                <Skeleton width={150} height={28} />
                {[1, 2, 3].map((row) => <Skeleton key={row} height={48} />)}
              </CardContent>
            </GlassCard>
          )}

          {powerRankings.length > 0 && (
            <GlassCard sx={surfaceSx}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <SectionHeading
                  title="Power table"
                  action={<Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => router.push('/analytics/global')}>Full stats</Button>}
                />
                {powerRankings.map((row, index) => (
                  <Box
                    component={Link}
                    href={`/players/${row.player.id}`}
                    key={row.player.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr auto',
                      alignItems: 'center',
                      gap: 1,
                      py: 1,
                      color: 'inherit',
                      textDecoration: 'none',
                      borderTop: index === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.08)',
                    }}
                  >
                    <Typography sx={{ color: index === 0 ? COLORS.greenLight : COLORS.textSteel, fontWeight: 700 }}>#{row.rank}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Avatar src={getPlayerImagePath(row.player.name)} sx={{ width: 36, height: 36 }}>{row.player.name.slice(0, 1)}</Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700 }} noWrap>{row.player.name}</Typography>
                        <Typography sx={{ color: COLORS.textSteel, fontSize: '0.875rem' }} noWrap>{row.player.base_team}</Typography>
                      </Box>
                    </Box>
                    <Chip size="small" label={`${row.rating} rating`} color={index === 0 ? 'success' : 'default'} />
                  </Box>
                ))}
              </CardContent>
            </GlassCard>
          )}

          {champions.length > 0 && (
            <GlassCard sx={surfaceSx}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <SectionHeading title="Hall of Fame" />
                {champions.slice(0, 4).map((champion, index) => (
                  <Box key={champion.name} sx={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', gap: 1, py: 1, borderTop: index === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.08)' }}>
                    <MilitaryTechIcon aria-hidden="true" sx={{ color: index === 0 ? COLORS.amber : COLORS.textSteel }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700 }} noWrap>{champion.name}</Typography>
                      <Typography sx={{ color: COLORS.textSteel, fontSize: '0.875rem' }} noWrap>{champion.latestTitle} · {champion.team}</Typography>
                    </Box>
                    <Chip size="small" label={`${champion.titles} title${champion.titles === 1 ? '' : 's'}`} />
                  </Box>
                ))}
              </CardContent>
            </GlassCard>
          )}

          {recentMatches.length > 0 && (
            <GlassCard sx={surfaceSx}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <SectionHeading title="Recent results" />
                {recentMatches.map((match, index) => (
                  <Box
                    component={Link}
                    href={`/tournaments/${match.tournament_id}`}
                    key={match.id}
                    sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, py: 1, color: 'inherit', textDecoration: 'none', borderTop: index === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.08)' }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700 }} noWrap>
                        {match.home_player?.name} {match.home_score}–{match.away_score} {match.away_player?.name}
                      </Typography>
                      <Typography sx={{ color: COLORS.textSteel, fontSize: '0.875rem' }} noWrap>{match.tournament?.name ?? 'Tournament'}</Typography>
                    </Box>
                    <Chip size="small" label={`Round ${match.round_number}`} />
                  </Box>
                ))}
              </CardContent>
            </GlassCard>
          )}

          {!loadingAnalytics && powerRankings.length === 0 && !analyticsError && (
            <GlassCard sx={surfaceSx}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <EmojiEventsIcon aria-hidden="true" sx={{ color: COLORS.amber, mb: 1 }} />
                <Typography component="h2" sx={{ fontWeight: 700 }}>The story starts with the first result</Typography>
                <Typography sx={{ color: COLORS.textSteel, mt: 0.5 }}>
                  Play the next fixture to unlock the power table, rivalries, records, and player form.
                </Typography>
                <Button sx={{ mt: 1.5 }} endIcon={<ArrowForwardIcon />} onClick={() => router.push(commandPrimaryPath)}>
                  Open next fixture
                </Button>
              </CardContent>
            </GlassCard>
          )}
        </Box>
      </Box>
    </Box>
  );
}
