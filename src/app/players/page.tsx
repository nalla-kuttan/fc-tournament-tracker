'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import PlayerCard from '@/components/player/PlayerCard';
import EmptyState from '@/components/shared/EmptyState';
import { calculateEloRatings, getRecentForm } from '@/lib/player-insights';
import type { CareerStats, Match, RegisteredPlayer } from '@/lib/types';

type SortMode = 'name' | 'winRate' | 'goals' | 'matches' | 'form' | 'elo';

interface GlobalAnalyticsData {
  career_stats: CareerStats[];
  all_matches: Match[];
  registered_players: { id: string; name: string; base_team: string }[];
  player_instances: { id: string; registered_player_id: string; name: string; team: string }[];
}

export default function PlayersPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const { data: players = [], isLoading: loadingPlayers } = useSWR<RegisteredPlayer[]>('/api/players', fetcher);
  const { data: analytics } = useSWR<GlobalAnalyticsData>('/api/analytics/global', fetcher, { revalidateOnFocus: false });

  const statsByPlayerId = useMemo(
    () => new Map((analytics?.career_stats ?? []).map((stats) => [stats.registered_player_id, stats])),
    [analytics?.career_stats]
  );

  const eloByPlayerId = useMemo(
    () => calculateEloRatings(players, analytics?.player_instances ?? [], analytics?.all_matches ?? []),
    [analytics?.all_matches, analytics?.player_instances, players]
  );

  const playerIdsByRegisteredId = useMemo(() => {
    const grouped = new Map<string, Set<string>>();
    for (const instance of analytics?.player_instances ?? []) {
      const current = grouped.get(instance.registered_player_id) ?? new Set<string>();
      current.add(instance.id);
      grouped.set(instance.registered_player_id, current);
    }
    return grouped;
  }, [analytics?.player_instances]);

  const leaderIds = useMemo(() => {
    const stats = analytics?.career_stats ?? [];
    return {
      goals: [...stats].sort((a, b) => b.total_goals - a.total_goals)[0]?.registered_player_id,
      winRate: [...stats].filter((s) => s.total_matches >= 3).sort((a, b) => b.win_rate - a.win_rate)[0]?.registered_player_id,
      motm: [...stats].sort((a, b) => b.motm_awards - a.motm_awards)[0]?.registered_player_id,
    };
  }, [analytics?.career_stats]);

  const visiblePlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return players
      .filter((player) => {
        if (!normalizedQuery) return true;
        return `${player.name} ${player.base_team}`.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => {
        const aStats = statsByPlayerId.get(a.id);
        const bStats = statsByPlayerId.get(b.id);
        const aForm = getRecentForm(analytics?.all_matches ?? [], playerIdsByRegisteredId.get(a.id) ?? new Set()).filter((r) => r === 'W').length;
        const bForm = getRecentForm(analytics?.all_matches ?? [], playerIdsByRegisteredId.get(b.id) ?? new Set()).filter((r) => r === 'W').length;

        switch (sortMode) {
          case 'winRate':
            return (bStats?.win_rate ?? 0) - (aStats?.win_rate ?? 0);
          case 'goals':
            return (bStats?.total_goals ?? 0) - (aStats?.total_goals ?? 0);
          case 'matches':
            return (bStats?.total_matches ?? 0) - (aStats?.total_matches ?? 0);
          case 'form':
            return bForm - aForm;
          case 'elo':
            return (eloByPlayerId.get(b.id) ?? 1000) - (eloByPlayerId.get(a.id) ?? 1000);
          case 'name':
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [analytics?.all_matches, eloByPlayerId, playerIdsByRegisteredId, players, query, sortMode, statsByPlayerId]);

  const loading = loadingPlayers;

  const getBadges = (playerId: string) => {
    const badges: string[] = [];
    if (leaderIds.goals === playerId) badges.push('#1 Goals');
    if (leaderIds.winRate === playerId) badges.push('Best WR');
    if (leaderIds.motm === playerId) badges.push('MOTM King');
    return badges;
  };

  return (
    <Box>
      <Box className="animate-section" sx={{ mb: 3, mt: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <PeopleIcon aria-hidden="true" sx={{ fontSize: 34, color: '#4ADE80' }} />
        <Box>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>Players</Typography>
          <Typography color="text.secondary">Profiles, form, ratings, and tournament history.</Typography>
        </Box>
      </Box>

      {/* Section header */}
      <Box className="animate-section" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, mb: 1.5 }}>
        <Typography
          variant="body2"
          sx={{
            color: '#94A3B8',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
          }}
        >
          Registered Players
        </Typography>
        <Button
          variant="text"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => router.push('/players/new')}
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
          Add
        </Button>
      </Box>

      {players.length > 0 && (
        <Box className="animate-section" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 180px' }, gap: 1.5, mb: 2 }}>
          <TextField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search players or teams"
            size="small"
            fullWidth
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Sort</InputLabel>
            <Select value={sortMode} label="Sort" onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="elo">Power Rating</MenuItem>
              <MenuItem value="winRate">Win Rate</MenuItem>
              <MenuItem value="goals">Goals</MenuItem>
              <MenuItem value="matches">Matches</MenuItem>
              <MenuItem value="form">Recent Form</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {players.length > 0 && (
        <Box className="animate-section" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, px: 0.5 }}>
          <Chip size="small" label={`${players.length} players`} />
          {analytics && <Chip size="small" label={`${analytics.all_matches.length} played matches`} />}
          {leaderIds.goals && <Chip size="small" label="Live rankings" sx={{ color: '#22C55E', borderColor: 'rgba(34,197,94,0.25)' }} variant="outlined" />}
        </Box>
      )}

      {loading ? (
        <Box sx={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.08)',
          borderRadius: '16px',
          p: 2,
        }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2, mb: i < 4 ? 1 : 0, bgcolor: 'rgba(148, 163, 184, 0.05)' }} />
          ))}
        </Box>
      ) : players.length === 0 ? (
        <EmptyState
          icon={<PeopleIcon sx={{ fontSize: 64 }} />}
          title="No players registered"
          description="Register players to add them to tournaments."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/players/new')}>
              Register Player
            </Button>
          }
        />
      ) : (
        <Box
          className="animate-section"
          sx={{
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(148, 163, 184, 0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          {visiblePlayers.map((p, index) => (
            <PlayerCard
              key={p.id}
              player={p}
              stats={statsByPlayerId.get(p.id)}
              badges={getBadges(p.id)}
              elo={eloByPlayerId.get(p.id)}
              form={getRecentForm(analytics?.all_matches ?? [], playerIdsByRegisteredId.get(p.id) ?? new Set())}
              showDivider={index < visiblePlayers.length - 1}
              index={index}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
