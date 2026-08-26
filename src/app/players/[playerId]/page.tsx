'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import CardContent from '@mui/material/CardContent';
import PersonIcon from '@mui/icons-material/Person';
import GlassCard from '@/components/shared/GlassCard';
import Button from '@mui/material/Button';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Divider from '@mui/material/Divider';
import PlayerStatsGrid from '@/components/player/PlayerStatsGrid';
import ArchetypeIcon, { getArchetypeMeta } from '@/components/player/ArchetypeIcon';
import AIScoutModal from '@/components/ai/AIScoutModal';
import BackButton from '@/components/shared/BackButton';
import type { CareerStats, Match, RegisteredPlayer } from '@/lib/types';
import type { CompetitiveRatingRow, CompetitiveRecords } from '@/lib/competitive';
import { TEAMS } from '@/lib/constants';
import { getPlayerImagePath } from '@/lib/player-images';
import {
  getAvatarColor,
  getInitials,
  getPlayerHighlights,
  getPlayerMatchInsights,
  getPlayerTags,
  getRecentForm,
  getTeamHistory,
} from '@/lib/player-insights';
import dynamic from 'next/dynamic';

const WDLDoughnut = dynamic(() => import('@/components/analytics/WDLDoughnut'), { ssr: false, loading: () => <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} /> });
const SingleRadarChart = dynamic(() => import('@/components/analytics/SingleRadarChart'), { ssr: false, loading: () => <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} /> });
const FormMomentumChart = dynamic(() => import('@/components/analytics/FormMomentumChart'), { ssr: false, loading: () => <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} /> });

interface CompetitiveOverviewLite {
  allTimeRatings: CompetitiveRatingRow[];
  seasonRatings: CompetitiveRatingRow[];
  records: CompetitiveRecords;
}

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;
  const [scoutOpen, setScoutOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [rivalId, setRivalId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: player, isLoading: loadingPlayer, mutate: mutatePlayer } = useSWR<RegisteredPlayer & { participations?: { tournament: { id: string; name: string; format: string; status: string } }[] }>(`/api/players/${playerId}`, fetcher);
  const { data: statsData, isLoading: loadingStats } = useSWR<{ stats: CareerStats, matches: Match[], playerIds: string[] }>(`/api/players/${playerId}/stats`, fetcher);
  const { data: players = [] } = useSWR<RegisteredPlayer[]>('/api/players', fetcher);
  const { data: competitive } = useSWR<CompetitiveOverviewLite>('/api/competitive/overview', fetcher);

  const loading = loadingPlayer || loadingStats;
  const stats = statsData?.stats || null;
  const matches = useMemo(() => statsData?.matches ?? [], [statsData?.matches]);
  const playerIds = useMemo(() => statsData?.playerIds ?? [], [statsData?.playerIds]);
  const playerIdSet = useMemo(() => new Set(playerIds), [playerIds]);
  const form = useMemo(() => getRecentForm(matches, playerIdSet), [matches, playerIdSet]);
  const highlights = useMemo(() => (stats ? getPlayerHighlights(stats, matches, playerIdSet) : []), [matches, playerIdSet, stats]);
  const matchInsights = useMemo(() => getPlayerMatchInsights(matches, playerIdSet), [matches, playerIdSet]);
  const teamHistory = useMemo(() => getTeamHistory(matches, playerIdSet), [matches, playerIdSet]);
  const allTimeRating = competitive?.allTimeRatings.find((row) => row.player.id === playerId);
  const seasonRating = competitive?.seasonRatings.find((row) => row.player.id === playerId);
  const trophyRow = competitive?.records.trophyCabinet.find((row) => row.player.id === playerId);
  const rivals = players.filter((p) => p.id !== playerId);

  const openEdit = () => {
    if (!player) return;
    setEditName(player.name);
    setEditTeam(player.base_team);
    setError('');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editName.trim() || !editTeam.trim()) {
      setError('Name and team are required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), base_team: editTeam.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update player');
      }

      await mutatePlayer();
      setEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!player) {
    return <Typography color="error">Player not found</Typography>;
  }

  const avatarColor = getAvatarColor(player.id);
  const imagePath = getPlayerImagePath(player.name);
  const archetypeHighlight = highlights.find((highlight) => highlight.label === 'Archetype');
  const playerTags = stats ? getPlayerTags(stats) : [];

  return (
    <Box>
      <BackButton />
      {/* Player command header */}
      <GlassCard sx={{ mb: 4, overflow: 'hidden' }}>
        <CardContent
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '230px 1fr' },
            gap: { xs: 2, md: 3 },
            p: { xs: 2, sm: 2.5 },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: { xs: 360, md: 'none' },
              mx: { xs: 'auto', md: 0 },
              aspectRatio: { xs: '4 / 3', md: '4 / 5' },
              borderRadius: '16px',
              overflow: 'hidden',
              bgcolor: `${avatarColor}18`,
              border: `1px solid ${avatarColor}35`,
              boxShadow: `0 20px 60px ${avatarColor}20`,
            }}
          >
            {imagePath ? (
              <Box
                component="img"
                src={imagePath}
                alt={`${player.name} profile`}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                }}
              />
            ) : stats && stats.total_matches > 0 ? (
              <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                <Typography fontWeight={900} sx={{ color: avatarColor, fontSize: '3rem' }}>
                  {getInitials(player.name)}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                <PersonIcon sx={{ fontSize: 74, color: avatarColor }} />
              </Box>
            )}
            {archetypeHighlight && (
              <Box sx={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.75, borderRadius: '12px', bgcolor: 'rgba(2, 6, 23, 0.78)', backdropFilter: 'blur(16px)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
                <ArchetypeIcon archetype={archetypeHighlight.value} size={32} showTooltip={false} />
                <Typography variant="caption" fontWeight={800} sx={{ color: getArchetypeMeta(archetypeHighlight.value).color }}>
                  {archetypeHighlight.value}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography component="h1" variant="h3" fontWeight={900} noWrap sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}>
                    {player.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats?.total_matches ? `${stats.total_matches} career matches` : 'Ready for first match'}
                  </Typography>
                </Box>
                <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={openEdit}>
                  Edit
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                <Chip label={player.base_team} variant="outlined" />
                {playerTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{
                      color: '#93C5FD',
                      borderColor: 'rgba(96, 165, 250, 0.32)',
                      bgcolor: 'rgba(59, 130, 246, 0.08)',
                      fontWeight: 700,
                    }}
                  />
                ))}
                {form.map((result, index) => (
                  <Chip
                    key={`${result}-${index}`}
                    label={result}
                    size="small"
                    sx={{
                      bgcolor: result === 'W' ? '#22C55E' : result === 'D' ? '#94A3B8' : '#EF4444',
                      color: '#020617',
                      fontWeight: 900,
                      minWidth: 32,
                    }}
                  />
                ))}
              </Box>
            </Box>

            {stats && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1,
                }}
              >
                {[
                  { label: 'Win Rate', value: `${stats.win_rate.toFixed(0)}%`, color: '#22C55E' },
                  { label: 'Goals', value: stats.total_goals, color: '#F59E0B' },
                  { label: 'G/M', value: stats.goals_per_match.toFixed(2), color: '#3B82F6' },
                  { label: 'MOTM', value: stats.motm_awards, color: '#3B82F6' },
                ].map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      p: 1.25,
                      borderRadius: '12px',
                      bgcolor: `${item.color}12`,
                      border: `1px solid ${item.color}22`,
                    }}
                  >
                    <Typography variant="h6" fontWeight={900} sx={{ color: item.color, lineHeight: 1 }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DescriptionIcon />}
                onClick={() => setScoutOpen(true)}
                disabled={!stats}
                sx={{ color: '#22C55E', borderColor: 'rgba(34,197,94,0.35)' }}
              >
                AI Scout Report
              </Button>
              {rivals.length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CompareArrowsIcon />}
                  onClick={() => {
                    const firstRival = rivals[0];
                    if (firstRival) router.push(`/analytics/h2h?p1=${playerId}&p2=${firstRival.id}`);
                  }}
                >
                  Compare
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </GlassCard>

      {/* Career Stats */}
      {stats && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Career Stats
          </Typography>
          <PlayerStatsGrid stats={stats} />
        </Box>
      )}

      {/* Career Highlights */}
      {highlights.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Career Highlights
          </Typography>
          <Grid container spacing={2}>
            {highlights.map((highlight) => (
              <Grid key={highlight.label} size={{ xs: 6, md: 4 }}>
                <GlassCard sx={{ height: '100%' }}>
                  <CardContent sx={{ py: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    {highlight.label === 'Archetype' && (
                      <ArchetypeIcon archetype={highlight.value} size={42} showTooltip={false} />
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
                        {highlight.label}
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        sx={{ mt: 0.5, color: highlight.label === 'Archetype' ? getArchetypeMeta(highlight.value).color : undefined }}
                        noWrap
                      >
                        {highlight.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {highlight.detail}
                      </Typography>
                    </Box>
                  </CardContent>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Competitive Legacy */}
      {(allTimeRating || seasonRating || trophyRow) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Competitive Legacy
          </Typography>
          <Grid container spacing={2}>
            {allTimeRating && (
              <Grid size={{ xs: 12, md: 4 }}>
                <GlassCard sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <ShowChartIcon sx={{ color: '#4ADE80', fontSize: 36 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                        All-Time Rating
                      </Typography>
                      <Typography variant="h5" fontWeight={900}>{allTimeRating.rating}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rank #{allTimeRating.rank} · peak {allTimeRating.peakRating}
                      </Typography>
                    </Box>
                  </CardContent>
                </GlassCard>
              </Grid>
            )}
            {seasonRating && (
              <Grid size={{ xs: 12, md: 4 }}>
                <GlassCard sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <ShowChartIcon sx={{ color: '#60A5FA', fontSize: 36 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                        Season Rating
                      </Typography>
                      <Typography variant="h5" fontWeight={900}>{seasonRating.rating}</Typography>
                      <Typography variant="caption" color={seasonRating.movement >= 0 ? '#4ADE80' : '#EF4444'}>
                        {seasonRating.movement >= 0 ? '+' : ''}{seasonRating.movement} latest movement
                      </Typography>
                    </Box>
                  </CardContent>
                </GlassCard>
              </Grid>
            )}
            {trophyRow && (
              <Grid size={{ xs: 12, md: 4 }}>
                <GlassCard sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <EmojiEventsIcon sx={{ color: '#F59E0B', fontSize: 36 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                        Trophy Cabinet
                      </Typography>
                      <Typography variant="h5" fontWeight={900}>{trophyRow.titles} titles</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {trophyRow.finals} finals · {trophyRow.runnerUps} runner-up
                      </Typography>
                    </Box>
                  </CardContent>
                </GlassCard>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Performance Overview Charts */}
      {stats && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Performance Overview
          </Typography>
          <Grid container spacing={3}>
            {/* WDL Doughnut */}
            <Grid size={{ xs: 12, md: 4 }}>
              <GlassCard sx={{ height: '100%' }}>
                <CardContent>
                  <WDLDoughnut stats={stats} title="Win/Draw/Loss" />
                </CardContent>
              </GlassCard>
            </Grid>

            {/* Attribute Radar */}
            <Grid size={{ xs: 12, md: 4 }}>
              <GlassCard sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Attribute Overview
                  </Typography>
                  <SingleRadarChart stats={stats} />
                </CardContent>
              </GlassCard>
            </Grid>

            {/* Form Momentum */}
            <Grid size={{ xs: 12, md: 4 }}>
              <GlassCard sx={{ height: '100%' }}>
                <CardContent>
                  <FormMomentumChart
                    matches={matches}
                    playerIds={new Set(playerIds)}
                    title="Form Momentum"
                  />
                </CardContent>
              </GlassCard>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tournament History */}
      {player.participations && player.participations.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Tournament History
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {player.participations.map((p, idx) => (
              <Chip
                key={idx}
                label={p.tournament?.name ?? 'Unknown'}
                clickable
                color={p.tournament?.status === 'active' ? 'primary' : 'default'}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Team History */}
      {teamHistory.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Team History
          </Typography>
          <GlassCard>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {teamHistory.slice(0, 6).map((team, index) => (
                <Box key={team.team}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr auto', sm: '1fr repeat(4, auto)' }, gap: 1.5, alignItems: 'center', px: 2, py: 1.5 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>{team.team}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {team.goalsFor}-{team.goalsAgainst} goals
                      </Typography>
                    </Box>
                    <Typography variant="body2">{team.matches} MP</Typography>
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: '#22C55E' }}>{team.wins}W</Typography>
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>{team.draws}D</Typography>
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: '#EF4444' }}>{team.losses}L</Typography>
                  </Box>
                  {index < teamHistory.slice(0, 6).length - 1 && <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.06)' }} />}
                </Box>
              ))}
            </CardContent>
          </GlassCard>
        </Box>
      )}

      {/* Rival Picker */}
      {rivals.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Rivalry Shortcut
          </Typography>
          <GlassCard>
            <CardContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1.5 }}>
              <Autocomplete
                options={rivals}
                value={rivals.find((p) => p.id === rivalId) ?? null}
                onChange={(_, value) => setRivalId(value?.id ?? '')}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => <TextField {...params} label="Compare against" size="small" />}
              />
              <Button
                variant="contained"
                startIcon={<CompareArrowsIcon />}
                disabled={!rivalId}
                onClick={() => router.push(`/analytics/h2h?p1=${playerId}&p2=${rivalId}`)}
              >
                Compare
              </Button>
            </CardContent>
          </GlassCard>
        </Box>
      )}

      {/* Match History */}
      {matchInsights.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Recent Matches
          </Typography>
          <GlassCard>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {matchInsights.slice(0, 10).map((entry, index) => (
                <Box key={entry.match.id}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'auto 1fr auto', sm: 'auto 1fr auto auto' }, gap: 1.5, alignItems: 'center', px: 2, py: 1.5 }}>
                    <Chip
                      label={entry.result}
                      size="small"
                      sx={{
                        bgcolor: entry.result === 'W' ? '#22C55E' : entry.result === 'D' ? '#94A3B8' : '#EF4444',
                        color: '#020617',
                        fontWeight: 900,
                      }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>
                        vs {entry.opponentName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {entry.match.tournament?.name ?? 'Tournament'} · {entry.team}
                      </Typography>
                    </Box>
                    <Typography fontWeight={800}>
                      {entry.goalsFor}-{entry.goalsAgainst}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 82, textAlign: 'right' }}>
                      {entry.match.played_at ? new Date(entry.match.played_at).toLocaleDateString() : ''}
                    </Typography>
                  </Box>
                  {index < matchInsights.slice(0, 10).length - 1 && <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.06)' }} />}
                </Box>
              ))}
            </CardContent>
          </GlassCard>
        </Box>
      )}

      {/* AI Scout Modal */}
      {player && stats && (
        <AIScoutModal
          open={scoutOpen}
          onClose={() => setScoutOpen(false)}
          player={player}
          stats={stats}
        />
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Player</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Player Name"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
          <Autocomplete
            freeSolo
            options={TEAMS}
            value={editTeam}
            onInputChange={(_, value) => setEditTeam(value)}
            onChange={(_, value) => {
              if (value) setEditTeam(value);
            }}
            renderInput={(params) => <TextField {...params} label="Base Team" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit} disabled={saving || !editName.trim() || !editTeam.trim()}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
