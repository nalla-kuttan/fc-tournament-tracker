'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import ShowChartIcon from '@mui/icons-material/ShowChart';
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

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <GlassCard>
      <CardContent>
        <Typography sx={{ color: '#94A3B8', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '2rem', fontWeight: 950, color: '#F8FAFC', lineHeight: 1.05 }}>
          {value}
        </Typography>
        <Typography sx={{ color: '#B6C3D5', fontSize: '0.86rem' }}>{detail}</Typography>
      </CardContent>
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
            <Typography sx={{ width: 34, color: '#4ADE80', fontWeight: 950 }}>#{row.rank}</Typography>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 900 }} noWrap>{row.player.name}</Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem' }} noWrap>
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
              <Typography sx={{ fontWeight: 950, fontSize: '1.2rem' }}>{row.rating}</Typography>
              <Typography sx={{ color: row.movement >= 0 ? '#4ADE80' : '#EF4444', fontSize: '0.78rem', fontWeight: 800 }}>
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
        <Typography sx={{ fontWeight: 900, mb: 1.25 }}>{title}</Typography>
        {rows.length === 0 ? (
          <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem' }}>No records yet</Typography>
        ) : (
          <Stack spacing={1}>
            {rows.slice(0, 5).map((row, index) => (
              <Box key={`${title}-${row.playerName}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Typography sx={{ width: 26, color: '#4ADE80', fontWeight: 900 }}>#{index + 1}</Typography>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 800 }} noWrap>{row.playerName}</Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.78rem' }} noWrap>{row.detail}</Typography>
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
  const { data, isLoading } = useSWR<CompetitiveOverview>('/api/competitive/overview', fetcher);
  const defaultSeason = data?.activeSeason ?? data?.seasons[0] ?? null;
  const effectiveSeasonId = selectedSeasonId || ALL_TIME_VALUE;
  const isAllTimeLens = effectiveSeasonId === ALL_TIME_VALUE;
  const { data: selectedRatingsData } = useSWR<RatingsResponse>(
    effectiveSeasonId && !isAllTimeLens ? `/api/competitive/ratings?scope=season&seasonId=${effectiveSeasonId}` : null,
    fetcher
  );
  const { data: selectedRecordsData } = useSWR<RecordsResponse>(
    effectiveSeasonId && !isAllTimeLens ? `/api/competitive/records?scope=season&seasonId=${effectiveSeasonId}` : null,
    fetcher
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
  const topAllTime = data?.allTimeRatings[0] ?? null;
  const topWin = selectedSeasonRecords?.biggestWins[0] ?? null;
  const intelligenceCount = selectedSeasonIntelligence.reduce((sum, row) => sum + row.labels.length, 0);
  const activeTabLabel = useMemo(() => tabLabels[tab] ?? tabLabels[0], [tab]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ color: '#4ADE80', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.12em' }}>
          Competitive
        </Typography>
        <Typography component="h1" variant="h3" sx={{ fontWeight: 950 }}>
          Season Race & Legacy Board
        </Typography>
        <Typography sx={{ color: '#94A3B8', maxWidth: 760 }}>
          Ratings, records, trophies, and match intelligence across current and previous seasons.
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 260 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && data && (
        <>
          <GlassCard sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 2, alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontWeight: 900, color: '#F8FAFC' }}>
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

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                label={isAllTimeLens ? 'Selected Lens' : 'Selected Season'}
                value={isAllTimeLens ? 'All-time' : selectedSeason?.name ?? 'None'}
                detail={isAllTimeLens ? 'Every recorded tournament' : selectedSeason ? `${selectedSeason.status} campaign` : 'No season selected'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard label={isAllTimeLens ? 'All-Time Leader' : 'Season Leader'} value={topSeason?.player.name ?? '-'} detail={topSeason ? `${topSeason.rating} rating` : 'No matches'} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard label="All-Time #1" value={topAllTime?.player.name ?? '-'} detail={topAllTime ? `${topAllTime.rating} rating` : 'No played matches'} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard label="Intel Tags" value={intelligenceCount} detail="Recent competitive storylines" />
            </Grid>
          </Grid>

          <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ mb: 2 }}>
            {tabLabels.map((label) => <Tab key={label} label={label} />)}
          </Tabs>

          <Typography sx={{ mb: 1.5, fontWeight: 900, color: '#F8FAFC' }}>{activeTabLabel}</Typography>

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
                          <Typography sx={{ fontWeight: 900 }}>
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
              <Grid size={{ xs: 12, md: 6 }}>
                <MetricCard label="Biggest Win" value={topWin?.scoreline ?? '-'} detail={topWin ? `${topWin.playerName} vs ${topWin.opponentName}` : 'No wins yet'} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <MetricCard label="Longest Streak" value={selectedSeasonRecords?.longestWinStreaks[0]?.streak ?? '-'} detail={selectedSeasonRecords?.longestWinStreaks[0]?.playerName ?? 'No streaks yet'} />
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
                  <Typography sx={{ mt: 1, mb: 0.5, fontWeight: 950, color: '#F8FAFC' }}>
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
                    <Typography sx={{ fontWeight: 900, mb: 1.25 }}>Biggest Losses</Typography>
                    <Stack spacing={1}>
                      {(selectedSeasonRecords?.biggestLosses ?? []).slice(0, 5).map((row, index) => (
                        <Box key={`${row.matchId}-${row.playerId}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Typography sx={{ width: 26, color: '#EF4444', fontWeight: 900 }}>#{index + 1}</Typography>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontWeight: 800 }} noWrap>{row.playerName} vs {row.opponentName}</Typography>
                            <Typography sx={{ color: '#94A3B8', fontSize: '0.78rem' }} noWrap>{row.goalDifference} goal margin</Typography>
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
                    <Typography sx={{ fontWeight: 900, mb: 1.25 }}>Highest-Scoring Matches</Typography>
                    <Stack spacing={1}>
                      {(selectedSeasonRecords?.highestScoringMatches ?? []).slice(0, 5).map((row, index) => (
                        <Box key={row.matchId} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Typography sx={{ width: 26, color: '#F59E0B', fontWeight: 900 }}>#{index + 1}</Typography>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontWeight: 800 }} noWrap>{row.label}</Typography>
                            <Typography sx={{ color: '#94A3B8', fontSize: '0.78rem' }} noWrap>{row.detail}</Typography>
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
                          <Typography sx={{ fontWeight: 900 }}>{row.winnerName} upset {row.loserName}</Typography>
                          <Typography sx={{ color: '#94A3B8', fontSize: '0.86rem' }}>{row.detail}</Typography>
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
                      <Typography sx={{ fontWeight: 950 }} noWrap>{row.player.name}</Typography>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.86rem' }} noWrap>
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
