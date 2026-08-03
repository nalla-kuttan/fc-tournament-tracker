'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import GlassCard from '@/components/shared/GlassCard';
import EmptyState from '@/components/shared/EmptyState';
import { fetcher } from '@/lib/fetcher';
import type { CompetitiveRatingRow, CompetitiveRecords, MatchIntelligenceLabel } from '@/lib/competitive';
import type { Match, Season } from '@/lib/types';

interface CompetitiveOverview {
  activeSeason: Season | null;
  seasons: Season[];
  seasonRatings: CompetitiveRatingRow[];
  allTimeRatings: CompetitiveRatingRow[];
  records: CompetitiveRecords;
  latestIntelligence: Array<{ match: Match; labels: MatchIntelligenceLabel[] }>;
}

interface RatingsResponse {
  ratings: CompetitiveRatingRow[];
}

interface RecordsResponse {
  records: CompetitiveRecords;
}

const tabLabels = ['Season', 'Ratings', 'Records', 'Trophy Cabinet'];
const ALL_TIME_VALUE = 'all-time';

function CompetitiveSignals({ signals }: { signals: Array<{ label: string; value: string | number; detail: string }> }) {
  return (
    <GlassCard sx={{ mb: 3 }}>
      <Box role="list" aria-label="Competitive summary" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' } }}>
        {signals.map((signal, index) => (
          <Box
            role="listitem"
            key={signal.label}
            sx={{
              p: 2,
              borderTop: { xs: index === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.1)', sm: 'none' },
              borderLeft: { xs: 'none', sm: index === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.1)' },
            }}
          >
            <Typography sx={{ color: '#B6C3D5', fontSize: '0.875rem' }}>{signal.label}</Typography>
            <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.2 }} noWrap>
              {signal.value}
            </Typography>
            <Typography sx={{ color: '#B6C3D5', fontSize: '0.875rem' }}>{signal.detail}</Typography>
          </Box>
        ))}
      </Box>
    </GlassCard>
  );
}

function RatingTable({ rows }: { rows: CompetitiveRatingRow[] }) {
  if (rows.length === 0) {
    return <EmptyState icon={<ShowChartIcon fontSize="inherit" />} title="No ratings yet" description="Played matches will appear here." />;
  }

  return (
    <Stack spacing={1}>
      {rows.slice(0, 10).map((row) => (
        <GlassCard key={row.player.id}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography sx={{ width: 34, color: '#4ADE80', fontWeight: 700 }}>#{row.rank}</Typography>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 700 }} noWrap>{row.player.name}</Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem' }} noWrap>
                {row.player.base_team} · {row.matches} matches · peak {row.peakRating}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', sm: 'flex' } }}>
              {row.recentForm.map((form, index) => (
                <Chip
                  key={`${row.player.id}-${index}`}
                  label={form}
                  size="small"
                  color={form === 'W' ? 'success' : form === 'L' ? 'error' : 'default'}
                />
              ))}
            </Stack>
            <Box sx={{ textAlign: 'right', minWidth: 78 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.2rem' }}>{row.rating}</Typography>
              <Typography sx={{ color: row.movement >= 0 ? '#4ADE80' : '#EF4444', fontSize: '0.875rem', fontWeight: 700 }}>
                {row.movement >= 0 ? '+' : ''}{row.movement}
              </Typography>
            </Box>
          </CardContent>
        </GlassCard>
      ))}
    </Stack>
  );
}

function RecordBoard({
  title,
  rows,
  suffix = '',
}: {
  title: string;
  rows: Array<{ playerName: string; value: number | string; detail: string }>;
  suffix?: string;
}) {
  return (
    <GlassCard sx={{ height: '100%' }}>
      <CardContent>
        <Typography sx={{ fontWeight: 700, mb: 1.25 }}>{title}</Typography>
        {rows.length === 0 ? (
          <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem' }}>No records yet</Typography>
        ) : (
          <Stack spacing={1}>
            {rows.slice(0, 5).map((row, index) => (
              <Box key={`${title}-${row.playerName}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Typography sx={{ width: 26, color: '#4ADE80', fontWeight: 700 }}>#{index + 1}</Typography>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>{row.playerName}</Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem' }} noWrap>{row.detail}</Typography>
                </Box>
                <Chip label={`${row.value}${suffix}`} size="small" color={index === 0 ? 'primary' : 'default'} />
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </GlassCard>
  );
}

export default function CompetitivePage() {
  const [tab, setTab] = useState(0);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const { data, error, isLoading, mutate } = useSWR<CompetitiveOverview>('/api/competitive/overview', fetcher, { onError: () => undefined });
  const defaultSeason = data?.activeSeason ?? data?.seasons[0] ?? null;
  const effectiveSeasonId = selectedSeasonId || ALL_TIME_VALUE;
  const isAllTimeLens = effectiveSeasonId === ALL_TIME_VALUE;
  const { data: selectedRatingsData, error: ratingsError, mutate: retryRatings } = useSWR<RatingsResponse>(
    effectiveSeasonId && !isAllTimeLens ? `/api/competitive/ratings?scope=season&seasonId=${effectiveSeasonId}` : null,
    fetcher,
    { onError: () => undefined }
  );
  const { data: selectedRecordsData, error: recordsError, mutate: retryRecords } = useSWR<RecordsResponse>(
    effectiveSeasonId && !isAllTimeLens ? `/api/competitive/records?scope=season&seasonId=${effectiveSeasonId}` : null,
    fetcher,
    { onError: () => undefined }
  );
  const selectedSeason = data?.seasons.find((season) => season.id === effectiveSeasonId) ?? defaultSeason;
  const selectedSeasonRatings = isAllTimeLens
    ? data?.allTimeRatings ?? []
    : selectedRatingsData?.ratings ?? (effectiveSeasonId === data?.activeSeason?.id ? data?.seasonRatings ?? [] : []);
  const selectedSeasonRecords = isAllTimeLens ? data?.records ?? null : selectedRecordsData?.records ?? null;
  const selectedSeasonIntelligence = useMemo(
    () => data?.latestIntelligence.filter((row) => isAllTimeLens || !effectiveSeasonId || row.match.season_id === effectiveSeasonId) ?? [],
    [data?.latestIntelligence, effectiveSeasonId, isAllTimeLens]
  );
  const topSeason = selectedSeasonRatings[0] ?? null;
  const topWin = selectedSeasonRecords?.biggestWins[0] ?? null;
  const intelligenceCount = selectedSeasonIntelligence.reduce((sum, row) => sum + row.labels.length, 0);
  const activeTabLabel = useMemo(() => tabLabels[tab] ?? tabLabels[0], [tab]);
  const hasCompetitiveHistory = Boolean(
    data && (data.seasons.length > 0 || data.allTimeRatings.length > 0 || data.latestIntelligence.length > 0)
  );

  return (
    <Box>
      <Box sx={{ mb: 3, maxWidth: 760 }}>
        <Typography component="h1" sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', sm: '2.35rem' }, lineHeight: 1.1 }}>
          Season Race
        </Typography>
        <Typography sx={{ color: '#B6C3D5', mt: 0.75 }}>
          Ratings, records, trophies, and match intelligence across every season.
        </Typography>
      </Box>

      {isLoading && (
        <Box aria-label="Loading competitive history">
          <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={260} />
        </Box>
      )}

      {!isLoading && error && !data && (
        <Alert
          severity="error"
          action={<Button color="inherit" startIcon={<RefreshIcon />} onClick={() => void mutate()}>Retry</Button>}
        >
          {error instanceof Error ? error.message : 'Competitive history could not be loaded.'}
        </Alert>
      )}

      {!isLoading && data && !hasCompetitiveHistory && (
        <EmptyState
          icon={<SportsSoccerIcon fontSize="inherit" />}
          title="Build your competitive history"
          description="Record the first tournament result to unlock ratings, records, trophies, and season storylines."
          action={<Button component={Link} href="/tournaments/new" variant="contained">Create Tournament</Button>}
        />
      )}

      {!isLoading && data && hasCompetitiveHistory && (
        <>
          {(ratingsError || recordsError) && (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    void retryRatings();
                    void retryRecords();
                  }}
                >
                  Retry
                </Button>
              }
              sx={{ mb: 2 }}
            >
              The selected season could not be refreshed. Previously loaded competitive data remains visible.
            </Alert>
          )}
          <GlassCard sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 2, alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                  Season Lens
                </Typography>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                  Choose all-time or any current/previous season to update the race, records, trophies, and match intelligence below.
                </Typography>
              </Box>
              <TextField
                select
                label="Lens"
                value={effectiveSeasonId}
                onChange={(event) => setSelectedSeasonId(event.target.value)}
                sx={{ minWidth: { xs: '100%', md: 280 } }}
              >
                <MenuItem value={ALL_TIME_VALUE}>All-time</MenuItem>
                {data.seasons.length === 0 && <MenuItem value="">No seasons yet</MenuItem>}
                {data.seasons.map((season) => (
                  <MenuItem key={season.id} value={season.id}>
                    {season.name} ({season.status})
                  </MenuItem>
                ))}
              </TextField>
            </CardContent>
          </GlassCard>

          <CompetitiveSignals
            signals={[
              {
                label: isAllTimeLens ? 'Current view' : 'Selected season',
                value: isAllTimeLens ? 'All-time' : selectedSeason?.name ?? 'None',
                detail: isAllTimeLens ? 'Every recorded tournament' : selectedSeason ? `${selectedSeason.status} campaign` : 'No season selected',
              },
              {
                label: isAllTimeLens ? 'All-time leader' : 'Season leader',
                value: topSeason?.player.name ?? 'Not ranked',
                detail: topSeason ? `${topSeason.rating} rating` : 'Play a match to rank players',
              },
              {
                label: 'Match storylines',
                value: intelligenceCount,
                detail: 'Recent competitive signals',
              },
            ]}
          />

          <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ mb: 2 }}>
            {tabLabels.map((label) => <Tab key={label} label={label} />)}
          </Tabs>

          <Typography sx={{ mb: 1.5, fontWeight: 700, color: '#F8FAFC' }}>{activeTabLabel}</Typography>

          {tab === 0 && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <RatingTable rows={selectedSeasonRatings} />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={1.25}>
                  {selectedSeasonIntelligence.length === 0 && (
                    <EmptyState icon={<WhatshotIcon fontSize="inherit" />} title="No match intel yet" description={isAllTimeLens ? 'Played matches will appear here.' : 'Played matches from this season will appear here.'} />
                  )}
                  {selectedSeasonIntelligence.slice(0, 5).map((row) => (
                    <GlassCard key={row.match.id}>
                      <CardContent>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <WhatshotIcon sx={{ color: '#F59E0B' }} />
                          <Typography sx={{ fontWeight: 700 }}>
                            {row.match.home_player?.name ?? 'Home'} {row.match.home_score}-{row.match.away_score} {row.match.away_player?.name ?? 'Away'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {row.labels.map((label) => <Chip key={label.kind} label={label.label} size="small" />)}
                        </Stack>
                      </CardContent>
                    </GlassCard>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          )}

          {tab === 1 && <RatingTable rows={data.allTimeRatings} />}

          {tab === 2 && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <CompetitiveSignals
                  signals={[
                    {
                      label: 'Biggest win',
                      value: topWin?.scoreline ?? 'No result',
                      detail: topWin ? `${topWin.playerName} vs ${topWin.opponentName}` : 'No wins yet',
                    },
                    {
                      label: 'Longest streak',
                      value: selectedSeasonRecords?.longestWinStreaks[0]?.streak ?? 'No streak',
                      detail: selectedSeasonRecords?.longestWinStreaks[0]?.playerName ?? 'No streaks yet',
                    },
                  ]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <RecordBoard title="Top Scorers" rows={selectedSeasonRecords?.topScorers ?? []} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <RecordBoard title="Most Wins" rows={selectedSeasonRecords?.mostWins ?? []} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <RecordBoard title="Best Win Rate" rows={selectedSeasonRecords?.bestWinRates ?? []} suffix="%" />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <RecordBoard title="Most Matches" rows={selectedSeasonRecords?.mostMatches ?? []} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <RecordBoard title="Best Attack" rows={selectedSeasonRecords?.bestAttacks ?? []} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <RecordBoard title="Best Defense" rows={selectedSeasonRecords?.bestDefenses ?? []} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <RecordBoard title="Clean Sheet Kings" rows={selectedSeasonRecords?.cleanSheetKings ?? []} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <RecordBoard title="Clutch Wins" rows={selectedSeasonRecords?.clutchWins ?? []} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <RecordBoard title="Longest Clean Sheets" rows={selectedSeasonRecords?.longestCleanSheetStreaks ?? []} />
              </Grid>
              {isAllTimeLens && (
                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ mt: 1, mb: 0.5, fontWeight: 700, color: '#F8FAFC' }}>
                    Best Individual Seasons
                  </Typography>
                </Grid>
              )}
              {isAllTimeLens && (
                <>
                  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                    <RecordBoard
                      title="Single-Season Goals"
                      rows={(selectedSeasonRecords?.bestIndividualSeasons.mostGoals ?? []).map((row) => ({
                        playerName: row.playerName,
                        value: row.value,
                        detail: row.detail,
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                    <RecordBoard
                      title="Single-Season Wins"
                      rows={(selectedSeasonRecords?.bestIndividualSeasons.mostWins ?? []).map((row) => ({
                        playerName: row.playerName,
                        value: row.value,
                        detail: row.detail,
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                    <RecordBoard
                      title="Single-Season Win Rate"
                      suffix="%"
                      rows={(selectedSeasonRecords?.bestIndividualSeasons.bestWinRates ?? []).map((row) => ({
                        playerName: row.playerName,
                        value: row.value,
                        detail: row.detail,
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                    <RecordBoard
                      title="Single-Season Attack"
                      rows={(selectedSeasonRecords?.bestIndividualSeasons.bestAttacks ?? []).map((row) => ({
                        playerName: row.playerName,
                        value: row.value,
                        detail: row.detail,
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                    <RecordBoard
                      title="Single-Season Defense"
                      rows={(selectedSeasonRecords?.bestIndividualSeasons.bestDefenses ?? []).map((row) => ({
                        playerName: row.playerName,
                        value: row.value,
                        detail: row.detail,
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                    <RecordBoard
                      title="Single-Season Clean Sheets"
                      rows={(selectedSeasonRecords?.bestIndividualSeasons.cleanSheets ?? []).map((row) => ({
                        playerName: row.playerName,
                        value: row.value,
                        detail: row.detail,
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                    <RecordBoard
                      title="Single-Season Clutch Wins"
                      rows={(selectedSeasonRecords?.bestIndividualSeasons.clutchWins ?? []).map((row) => ({
                        playerName: row.playerName,
                        value: row.value,
                        detail: row.detail,
                      }))}
                    />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12, md: 6 }}>
                <GlassCard sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography sx={{ fontWeight: 700, mb: 1.25 }}>Biggest Losses</Typography>
                    <Stack spacing={1}>
                      {(selectedSeasonRecords?.biggestLosses ?? []).slice(0, 5).map((row, index) => (
                        <Box key={`${row.matchId}-${row.playerId}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Typography sx={{ width: 26, color: '#EF4444', fontWeight: 700 }}>#{index + 1}</Typography>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontWeight: 700 }} noWrap>{row.playerName} vs {row.opponentName}</Typography>
                            <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem' }} noWrap>{row.goalDifference} goal margin</Typography>
                          </Box>
                          <Chip label={row.scoreline} size="small" />
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </GlassCard>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <GlassCard sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography sx={{ fontWeight: 700, mb: 1.25 }}>Highest-Scoring Matches</Typography>
                    <Stack spacing={1}>
                      {(selectedSeasonRecords?.highestScoringMatches ?? []).slice(0, 5).map((row, index) => (
                        <Box key={row.matchId} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Typography sx={{ width: 26, color: '#F59E0B', fontWeight: 700 }}>#{index + 1}</Typography>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontWeight: 700 }} noWrap>{row.label}</Typography>
                            <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem' }} noWrap>{row.detail}</Typography>
                          </Box>
                          <Chip label={`${row.scoreline} · ${row.totalGoals}`} size="small" />
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </GlassCard>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Stack spacing={1}>
                  {selectedSeasonRecords?.biggestUpsets.length === 0 && (
                    <EmptyState icon={<ShowChartIcon fontSize="inherit" />} title="No upset records yet" description="This season has no qualifying upset records." />
                  )}
                  {selectedSeasonRecords?.biggestUpsets.map((row) => (
                    <GlassCard key={row.matchId}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ShowChartIcon sx={{ color: '#60A5FA' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 700 }}>{row.winnerName} upset {row.loserName}</Typography>
                          <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem' }}>{row.detail}</Typography>
                        </Box>
                        <Chip label={row.upsetScore} color="primary" />
                      </CardContent>
                    </GlassCard>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          )}

          {tab === 3 && (
            <Stack spacing={1}>
              {selectedSeasonRecords?.trophyCabinet.length === 0 && (
                <EmptyState icon={<EmojiEventsIcon fontSize="inherit" />} title="No trophies yet" description="Completed tournaments will build the cabinet." />
              )}
              {selectedSeasonRecords?.trophyCabinet.map((row) => (
                <GlassCard key={row.player.id}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EmojiEventsIcon sx={{ color: '#F59E0B', fontSize: 34 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700 }} noWrap>{row.player.name}</Typography>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem' }} noWrap>
                        Best season: {row.bestSeason ?? 'TBD'}
                      </Typography>
                    </Box>
                    <Chip icon={<MilitaryTechIcon />} label={`${row.titles} titles`} color="success" />
                    <Chip label={`${row.runnerUps} runner-up`} />
                  </CardContent>
                </GlassCard>
              ))}
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}
