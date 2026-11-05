'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import UltimateCard from '@/components/player/UltimateCard';
import { fetcher } from '@/lib/fetcher';
import type { PlayerCardData } from '@/lib/player-cards';
import type { TournamentRecap } from '@/lib/tournament-recap';
import { buildCeremony, type TrophyKind } from '@/lib/trophies';
import TrophyCeremony from '@/components/tournament/TrophyCeremony';

const CONFETTI = ['#EA6C56', '#FF8A73', '#F59E0B', '#FCE7A8', '#7E8CC2', '#FFF7F6'];
// Only celebrate on its own for a tournament decided in the last week, so
// browsing old seasons doesn't set it off.
const FRESH_MS = 7 * 24 * 60 * 60 * 1000;
const seenKey = (id: string) => `fc-champion-seen:${id}`;

function readSeen(id: string) {
  try {
    return window.localStorage.getItem(seenKey(id)) === '1';
  } catch {
    return true;
  }
}

function markSeen(id: string) {
  try {
    window.localStorage.setItem(seenKey(id), '1');
  } catch {
    // Private mode: it just celebrates again next time.
  }
}

function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const scale = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.clientWidth * scale;
      canvas.height = canvas.clientHeight * scale;
    };
    resize();
    window.addEventListener('resize', resize);
    const width = () => canvas.width;
    const pieces = Array.from({ length: 180 }, (_, i) => ({
      x: width() / 2 + (Math.random() - 0.5) * 80 * scale,
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 22 * scale,
      vy: (-Math.random() * 20 - 8) * scale,
      size: (Math.random() * 7 + 5) * scale,
      spin: Math.random() * Math.PI,
      spinSpeed: (Math.random() - 0.5) * 0.3,
      color: CONFETTI[i % CONFETTI.length],
      delay: Math.random() * 20,
    }));
    let frame = 0;
    let tick = 0;
    const draw = () => {
      tick++;
      context.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const piece of pieces) {
        if (tick < piece.delay) { alive++; continue; }
        piece.vy += 0.45 * scale;
        piece.vx *= 0.985;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.spin += piece.spinSpeed;
        if (piece.y < canvas.height + 40) alive++;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.spin);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2 * Math.abs(Math.cos(piece.spin * 2)) + 1);
        context.restore();
      }
      if (alive > 0) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return <Box component="canvas" ref={ref} aria-hidden sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

interface Props {
  tournamentId: string;
  lastPlayedAt: string | null;
}

// When a tournament is decided: a one-time full-screen trophy moment, then a
// champion banner that stays on the tournament page (and can replay it).
export default function ChampionCelebration({ tournamentId, lastPlayedAt }: Props) {
  const { data: recap } = useSWR<TournamentRecap>(`/api/tournaments/${tournamentId}/recap`, fetcher, { revalidateOnFocus: false, onError: () => undefined });
  const [replay, setReplay] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const decided = Boolean(recap?.decided && recap.champion);
  // Decided once on the client when the page opens: a stored "seen" never
  // re-triggers it, and old tournaments don't celebrate on their own.
  const [autoplay] = useState(() => (
    typeof window !== 'undefined'
    && Boolean(lastPlayedAt)
    && Date.now() - new Date(lastPlayedAt!).getTime() < FRESH_MS
    && !readSeen(tournamentId)
  ));
  const open = decided && !dismissed && (replay || autoplay);

  useEffect(() => {
    if (open) markSeen(tournamentId);
  }, [open, tournamentId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setDismissed(true); setReplay(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!recap || !decided) return null;
  const champion = recap.champion!;
  const winner = recap.podium[0];
  const close = () => { setDismissed(true); setReplay(false); };

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          mb: 3,
          borderRadius: '16px',
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: 'linear-gradient(120deg, rgba(245, 158, 11, 0.22) 0%, rgba(234, 108, 86, 0.18) 45%, rgba(98, 17, 34, 0.5) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(110deg, transparent 35%, rgba(255, 236, 170, 0.16) 50%, transparent 65%)',
            backgroundSize: '250% 100%',
            animation: 'bannerSheen 6s ease-in-out infinite',
            pointerEvents: 'none',
          },
          '@keyframes bannerSheen': { '0%': { backgroundPosition: '120% 0' }, '60%, 100%': { backgroundPosition: '-120% 0' } },
        }}
      >
        <Box aria-hidden sx={{ width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, bgcolor: 'rgba(245, 158, 11, 0.2)', boxShadow: '0 0 30px rgba(245, 158, 11, 0.45)' }}>
          <EmojiEventsIcon sx={{ fontSize: 30, color: '#F59E0B' }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F59E0B' }}>Champion</Typography>
          <Typography component="p" sx={{ fontSize: { xs: '1.5rem', sm: '1.9rem' }, fontWeight: 700, lineHeight: 1.1 }} noWrap>{champion}</Typography>
          {winner && (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              {winner.points} pts · {winner.wins}W {winner.draws}D {winner.losses}L
            </Typography>
          )}
        </Box>
        <Button size="small" onClick={() => { setDismissed(false); setReplay(true); }} sx={{ color: '#FCE7A8', position: 'relative', zIndex: 1, flexShrink: 0 }}>
          Celebrate
        </Button>
      </Box>

      <AnimatePresence>{open && <ChampionMoment recap={recap} onClose={close} />}</AnimatePresence>
    </>
  );
}

// The full-screen trophy moment: rays, confetti, the champion's card and
// their numbers, then every trophy from the tournament with its winner.
// Shared with TV mode, which passes `autoAdvanceMs` since nobody taps a TV.
export function ChampionMoment({ recap, onClose, autoAdvanceMs }: { recap: TournamentRecap; onClose: () => void; autoAdvanceMs?: number }) {
  const reduceMotion = useReducedMotion();
  const { data: cardData } = useSWR<{ cards: PlayerCardData[] }>('/api/players/cards', fetcher, { revalidateOnFocus: false, onError: () => undefined });
  const champion = recap.champion ?? '';
  const winner = recap.podium[0];
  const card = cardData?.cards.find((entry) => entry.name === champion);
  const ceremony = buildCeremony(recap);
  const [stage, setStage] = useState<'champion' | 'trophies'>('champion');
  const hasTrophies = ceremony.length > 1;
  const advance = () => (hasTrophies && stage === 'champion' ? setStage('trophies') : onClose());

  // Render the trophies' turntables while the champion is on screen, so the
  // lineup is ready when it appears (they're cached for the page).
  const ceremonyKey = ceremony.map((award) => `${award.kind}${award.perfect ? ':crowned' : ''}`).join(',');
  useEffect(() => {
    if (!ceremonyKey) return;
    import('@/lib/trophy-sprites')
      .then((sprites) => {
        for (const key of ceremonyKey.split(',')) {
          const [kind, crowned] = key.split(':');
          void sprites.getTrophySheet(kind as TrophyKind, crowned === 'crowned');
        }
      })
      .catch(() => undefined);
  }, [ceremonyKey]);

  useEffect(() => {
    if (!autoAdvanceMs || !hasTrophies || stage !== 'champion') return;
    const timer = window.setTimeout(() => setStage('trophies'), autoAdvanceMs);
    return () => window.clearTimeout(timer);
  }, [autoAdvanceMs, hasTrophies, stage]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={stage === 'champion' ? `${champion} wins ${recap.tournament.name}` : `${recap.tournament.name} trophies`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={stage === 'champion' ? advance : onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'radial-gradient(circle at 50% 40%, rgba(98, 17, 34, 0.92) 0%, rgba(11, 5, 8, 0.97) 65%)', cursor: 'pointer' }}
    >
      {!reduceMotion && (
        <Box
          aria-hidden
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '160vmax',
            height: '160vmax',
            translate: '-50% -50%',
            background: 'repeating-conic-gradient(from 0deg, rgba(245, 158, 11, 0.12) 0deg 8deg, transparent 8deg 24deg)',
            maskImage: 'radial-gradient(circle, #000 0%, transparent 45%)',
            animation: 'championRays 30s linear infinite',
            '@keyframes championRays': { to: { transform: 'rotate(360deg)' } },
          }}
        />
      )}
      {!reduceMotion && <Confetti key={stage} />}
      <AnimatePresence mode="wait">
        {stage === 'champion' ? (
          <motion.div key="champion" exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }} style={{ position: 'relative', margin: 'auto' }}>
            <Box sx={{ textAlign: 'center', px: 3, display: 'grid', justifyItems: 'center' }}>
              <motion.div
                initial={reduceMotion ? false : { scale: 0.3, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.15 }}
              >
                {card ? (
                  <Box sx={{ width: { xs: 190, sm: 230 } }}><UltimateCard card={card} width="100%" interactive={false} /></Box>
                ) : (
                  <EmojiEventsIcon sx={{ fontSize: 140, color: '#F59E0B', filter: 'drop-shadow(0 0 40px rgba(245, 158, 11, 0.6))' }} />
                )}
              </motion.div>
              <motion.div initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}>
                <Typography sx={{ mt: 3, fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '0.3em', color: '#F59E0B' }}>{recap.tournament.name.toUpperCase()} CHAMPION</Typography>
                <Typography component="p" sx={{ fontSize: { xs: '3.25rem', sm: '4.5rem' }, fontWeight: 700, lineHeight: 1, textShadow: '0 0 40px rgba(234, 108, 86, 0.6)' }}>{champion}</Typography>
                {winner && <Typography sx={{ mt: 1, color: 'rgba(255, 247, 246, 0.8)' }}>{winner.points} points · {winner.wins} wins · {winner.goal_difference > 0 ? '+' : ''}{winner.goal_difference} goal difference</Typography>}
                <Button variant="contained" autoFocus onClick={(event) => { event.stopPropagation(); advance(); }} sx={{ mt: 3 }}>
                  {hasTrophies ? 'See the trophies' : 'Continue'}
                </Button>
              </motion.div>
            </Box>
          </motion.div>
        ) : (
          <motion.div key="trophies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ position: 'relative', width: '100%', margin: 'auto' }}>
            <Box onClick={(event) => event.stopPropagation()} sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 }, cursor: 'default', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '0.3em', color: '#F59E0B' }}>{recap.tournament.name.toUpperCase()}</Typography>
              <Typography component="h2" sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, fontWeight: 700, lineHeight: 1.1, mb: { xs: 2, md: 3 } }}>The trophies</Typography>
              <TrophyCeremony awards={ceremony} tournamentId={recap.tournament.id} tournamentName={recap.tournament.name} />
              <Button variant="contained" autoFocus onClick={onClose} sx={{ mt: 3 }}>Done</Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
