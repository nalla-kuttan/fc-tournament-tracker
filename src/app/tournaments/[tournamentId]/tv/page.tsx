'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ClubBadge from '@/components/shared/ClubBadge';
import CountUp from '@/components/shared/CountUp';
import MatchOdds from '@/components/tournament/MatchOdds';
import { clubForSide } from '@/lib/club-analytics';
import { FORM_COLORS, FORM_TEXT_COLOR } from '@/lib/constants';
import { fetcher } from '@/lib/fetcher';
import type { Match, StandingRow } from '@/lib/types';

type TvMatch = Match & {
  home_player?: { id: string; name: string; team: string } | null;
  away_player?: { id: string; name: string; team: string } | null;
};

interface TournamentPayload {
  name: string;
  format: string;
  status: string;
  matches: TvMatch[];
}

const REFRESH_MS = 8000;
const REVEAL_MS = 7000;

function byPlayedAt(a: TvMatch, b: TvMatch) {
  return (b.played_at ?? '').localeCompare(a.played_at ?? '') || b.match_number - a.match_number;
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 15000);
    return () => window.clearInterval(timer);
  }, []);
  return <Typography sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary', fontSize: '1.25rem' }}>{now?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? ''}</Typography>;
}

function Side({ match, side, align }: { match: TvMatch; side: 'home' | 'away'; align: 'left' | 'right' }) {
  const player = side === 'home' ? match.home_player : match.away_player;
  const club = match.is_played ? clubForSide(match, side) : player?.team ?? '';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexDirection: align === 'left' ? 'row' : 'row-reverse', minWidth: 0 }}>
      <ClubBadge club={club} size={44} />
      <Box sx={{ minWidth: 0, textAlign: align }}>
        <Typography sx={{ fontSize: '1.9rem', fontWeight: 700, lineHeight: 1.05 }} noWrap>{player?.name ?? 'TBD'}</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '1rem' }} noWrap>{club}</Typography>
      </Box>
    </Box>
  );
}

// The big "result in" moment when a new score arrives.
function ResultReveal({ match }: { match: TvMatch }) {
  const reduceMotion = useReducedMotion();
  const homeWon = (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWon = (match.away_score ?? 0) > (match.home_score ?? 0);
  const winner = homeWon ? match.home_player?.name : awayWon ? match.away_player?.name : null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 1500, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 50% 45%, rgba(133, 42, 61, 0.98) 0%, rgba(59, 11, 22, 0.99) 40%, #0B0508 75%)' }}
      role="status"
      aria-live="assertive"
    >
      <Box sx={{ textAlign: 'center' }}>
        <motion.div initial={reduceMotion ? false : { y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.4em', color: '#FF8A73' }}>FULL TIME</Typography>
        </motion.div>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 5, mt: 5, px: 6 }}>
          <motion.div initial={reduceMotion ? false : { x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 120, damping: 16 }}>
            <Box sx={{ display: 'grid', justifyItems: 'end', gap: 1.5 }}>
              <ClubBadge club={clubForSide(match, 'home')} size={96} />
              <Typography sx={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: 1, opacity: awayWon ? 0.6 : 1 }}>{match.home_player?.name}</Typography>
            </Box>
          </motion.div>
          <motion.div initial={reduceMotion ? false : { scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.8, type: 'spring', stiffness: 220, damping: 14 }}>
            <Typography sx={{ fontSize: '9rem', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 60px rgba(234, 108, 86, 0.6)' }}>
              {match.home_score}–{match.away_score}
            </Typography>
          </motion.div>
          <motion.div initial={reduceMotion ? false : { x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 120, damping: 16 }}>
            <Box sx={{ display: 'grid', justifyItems: 'start', gap: 1.5 }}>
              <ClubBadge club={clubForSide(match, 'away')} size={96} />
              <Typography sx={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: 1, opacity: homeWon ? 0.6 : 1 }}>{match.away_player?.name}</Typography>
            </Box>
          </motion.div>
        </Box>
        <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
          <Typography sx={{ mt: 4, fontSize: '1.75rem', color: 'text.secondary' }}>{winner ? `${winner} takes the points` : 'Honours even'}</Typography>
        </motion.div>
      </Box>
    </motion.div>
  );
}

// A living-room TV view of match night: the table, the next fixture with
// odds, the latest result, refreshing on its own.
export default function TvModePage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const router = useRouter();
  const { data: tournament } = useSWR<TournamentPayload>(`/api/tournaments/${tournamentId}`, fetcher, { refreshInterval: REFRESH_MS });
  const { data: standings = [] } = useSWR<StandingRow[]>(`/api/tournaments/${tournamentId}/standings`, fetcher, { refreshInterval: REFRESH_MS });
  const [fullscreen, setFullscreen] = useState(false);
  const [seenLatest, setSeenLatest] = useState<string | null | undefined>(undefined);
  const [reveal, setReveal] = useState<TvMatch | null>(null);

  const matches = useMemo(() => tournament?.matches ?? [], [tournament?.matches]);
  const played = useMemo(() => matches.filter((match) => match.is_played && !match.is_bye).sort(byPlayedAt), [matches]);
  const upcoming = matches.filter((match) => !match.is_played && !match.is_bye);
  const latest = played[0] ?? null;
  const next = upcoming[0] ?? null;

  // A result that arrives while the screen is up gets the full-time reveal.
  // Adjusted during render (React's "storing information from previous
  // renders" pattern) rather than in an effect.
  const latestId = latest?.id ?? null;
  const latestKey = latest ? `${latest.id}:${latest.home_score}-${latest.away_score}` : null;
  if (tournament && seenLatest !== latestKey) {
    if (seenLatest !== undefined && latestId) setReveal(latest);
    setSeenLatest(latestKey);
  }

  useEffect(() => {
    if (!reveal) return;
    const timer = window.setTimeout(() => setReveal(null), REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [reveal]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !document.fullscreenElement) router.push(`/tournaments/${tournamentId}`); };
    document.addEventListener('fullscreenchange', onChange);
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [router, tournamentId]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  const total = matches.filter((match) => !match.is_bye).length;
  const isLeague = tournament?.format !== 'knockout';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        overflow: 'auto',
        color: '#FFF7F6',
        background: 'radial-gradient(ellipse 50% 40% at 15% -5%, rgba(255, 214, 170, 0.18), transparent 70%), radial-gradient(ellipse 50% 40% at 85% -5%, rgba(126, 140, 194, 0.2), transparent 70%), linear-gradient(180deg, #1D0D14 0%, #0B0508 100%)',
        p: { xs: 2, md: 4 },
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Box component="header" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.5, borderRadius: 999, bgcolor: 'rgba(234, 108, 86, 0.16)', border: '1px solid rgba(234, 108, 86, 0.4)' }}>
          <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#EA6C56', animation: 'livePulse 1.6s ease-in-out infinite', '@keyframes livePulse': { '0%, 100%': { boxShadow: '0 0 0 0 rgba(234, 108, 86, 0.7)' }, '50%': { boxShadow: '0 0 0 8px rgba(234, 108, 86, 0)' } } }} />
          <Typography sx={{ fontWeight: 700, letterSpacing: '0.2em', fontSize: '0.875rem', color: '#FF8A73' }}>LIVE</Typography>
        </Box>
        <Typography component="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, fontWeight: 700, flex: 1, minWidth: 0 }} noWrap>{tournament?.name ?? ''}</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '1.25rem', display: { xs: 'none', sm: 'block' } }}>{played.length} / {total} played</Typography>
        <Clock />
        <IconButton aria-label={fullscreen ? 'Exit full screen' : 'Full screen'} onClick={toggleFullscreen} sx={{ color: '#FFF7F6' }}>
          {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
        <IconButton aria-label="Leave TV mode" onClick={() => router.push(`/tournaments/${tournamentId}`)} sx={{ color: '#FFF7F6' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: isLeague ? '1.4fr 1fr' : '1fr' }, gap: 3, flex: 1, minHeight: 0 }}>
        {isLeague && (
          <Box component="section" aria-label="Table" sx={{ overflowX: 'auto', borderRadius: '20px', bgcolor: 'rgba(36, 16, 25, 0.75)', border: '1px solid rgba(201, 185, 190, 0.1)', p: { xs: 2, md: 3 } }}>
            <Box role="table" aria-label="Standings" sx={{ display: 'grid', gap: 0.5 }}>
              <Box role="row" sx={{ display: 'grid', gridTemplateColumns: '64px 1fr 70px 90px 100px 190px', alignItems: 'center', color: 'text.secondary', fontSize: '1rem', fontWeight: 600, px: 1.5, pb: 1 }}>
                <span role="columnheader">#</span><span role="columnheader">Player</span><span role="columnheader" style={{ textAlign: 'center' }}>P</span><span role="columnheader" style={{ textAlign: 'center' }}>GD</span><span role="columnheader" style={{ textAlign: 'center' }}>Pts</span><span role="columnheader">Form</span>
              </Box>
              <AnimatePresence initial={false}>
                {standings.map((row, index) => {
                  const moved = row.previous_position != null ? row.previous_position - (index + 1) : 0;
                  return (
                    <motion.div
                      key={row.player_id}
                      layout
                      role="row"
                      transition={{ layout: { type: 'spring', stiffness: 200, damping: 26 } }}
                      style={{ display: 'grid', gridTemplateColumns: '64px 1fr 70px 90px 100px 190px', alignItems: 'center', padding: '14px 12px', borderRadius: 14, background: index === 0 ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.18), rgba(245, 158, 11, 0.02))' : 'rgba(201, 185, 190, 0.03)' }}
                    >
                      <Box role="cell" sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                        <Typography sx={{ fontSize: '1.9rem', fontWeight: 700, color: index === 0 ? '#F59E0B' : '#FFF7F6' }}>{index + 1}</Typography>
                        {moved !== 0 && <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: moved > 0 ? '#FF8A73' : '#EF4444' }}>{moved > 0 ? '▲' : '▼'}{Math.abs(moved)}</Typography>}
                      </Box>
                      <Box role="cell" sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '1.9rem', fontWeight: 700, lineHeight: 1.1 }} noWrap>{row.player_name}</Typography>
                      </Box>
                      <Typography role="cell" sx={{ fontSize: '1.6rem', textAlign: 'center', color: 'text.secondary' }}>{row.played}</Typography>
                      <Typography role="cell" sx={{ fontSize: '1.6rem', textAlign: 'center', fontWeight: 600, color: row.goal_difference > 0 ? '#FF8A73' : row.goal_difference < 0 ? '#EF4444' : 'text.secondary' }}>{row.goal_difference > 0 ? '+' : ''}{row.goal_difference}</Typography>
                      <Typography role="cell" sx={{ fontSize: '2.2rem', textAlign: 'center', fontWeight: 700, color: '#EA6C56', textShadow: '0 0 18px rgba(234, 108, 86, 0.45)' }}><CountUp value={row.points} /></Typography>
                      <Box role="cell" sx={{ display: 'flex', gap: 0.75 }}>
                        {row.form.slice(-5).map((result, i) => (
                          <Box key={i} sx={{ width: 30, height: 30, borderRadius: '10px', display: 'grid', placeItems: 'center', bgcolor: FORM_COLORS[result], color: FORM_TEXT_COLOR, fontWeight: 700 }}>{result}</Box>
                        ))}
                      </Box>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'grid', gap: 3, alignContent: 'start' }}>
          <Box component="section" aria-label="Next fixture" sx={{ borderRadius: '20px', p: { xs: 2, md: 3 }, background: 'linear-gradient(135deg, rgba(51, 64, 117, 0.5), rgba(36, 16, 25, 0.8))', border: '1px solid rgba(126, 140, 194, 0.3)' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.24em', color: '#7E8CC2', mb: 2 }}>UP NEXT</Typography>
            {next ? (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 2, mb: 2.5 }}>
                  <Side match={next} side="home" align="left" />
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: 'text.secondary' }}>VS</Typography>
                  <Side match={next} side="away" align="right" />
                </Box>
                <MatchOdds key={next.id} matchId={next.id} homeName={next.home_player?.name ?? 'Home'} awayName={next.away_player?.name ?? 'Away'} />
              </>
            ) : (
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 600 }}>All fixtures played.</Typography>
            )}
          </Box>

          {latest && (
            <Box component="section" aria-label="Latest result" sx={{ borderRadius: '20px', p: { xs: 2, md: 3 }, bgcolor: 'rgba(36, 16, 25, 0.75)', border: '1px solid rgba(201, 185, 190, 0.1)' }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.24em', color: '#FF8A73', mb: 2 }}>LATEST RESULT</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 2 }}>
                <Side match={latest} side="home" align="left" />
                <Typography sx={{ fontSize: '3rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{latest.home_score}–{latest.away_score}</Typography>
                <Side match={latest} side="away" align="right" />
              </Box>
            </Box>
          )}

          {upcoming.length > 1 && (
            <Box component="section" aria-label="Later fixtures" sx={{ borderRadius: '20px', p: { xs: 2, md: 3 }, bgcolor: 'rgba(36, 16, 25, 0.6)', border: '1px solid rgba(201, 185, 190, 0.08)' }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.24em', color: 'text.secondary', mb: 1.5 }}>LATER</Typography>
              {upcoming.slice(1, 4).map((match) => (
                <Typography key={match.id} sx={{ fontSize: '1.35rem', py: 0.5 }}>{match.home_player?.name ?? 'TBD'} <Box component="span" sx={{ color: 'text.secondary' }}>vs</Box> {match.away_player?.name ?? 'TBD'}</Typography>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <AnimatePresence>{reveal && <ResultReveal key={reveal.id} match={reveal} />}</AnimatePresence>
    </Box>
  );
}
