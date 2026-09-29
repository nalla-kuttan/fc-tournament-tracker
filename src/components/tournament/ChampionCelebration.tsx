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
  const { data: cardData } = useSWR<{ cards: PlayerCardData[] }>(recap?.decided ? '/api/players/cards' : null, fetcher, { revalidateOnFocus: false, onError: () => undefined });
  const [replay, setReplay] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const reduceMotion = useReducedMotion();

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
  const card = cardData?.cards.find((entry) => entry.name === champion);
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

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${champion} wins ${recap.tournament.name}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={close}
            style={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 50% 40%, rgba(98, 17, 34, 0.92) 0%, rgba(11, 5, 8, 0.97) 65%)', cursor: 'pointer' }}
          >
            {!reduceMotion && (
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  width: '160vmax',
                  height: '160vmax',
                  background: 'repeating-conic-gradient(from 0deg, rgba(245, 158, 11, 0.12) 0deg 8deg, transparent 8deg 24deg)',
                  maskImage: 'radial-gradient(circle, #000 0%, transparent 45%)',
                  animation: 'championRays 30s linear infinite',
                  '@keyframes championRays': { to: { transform: 'rotate(360deg)' } },
                }}
              />
            )}
            {!reduceMotion && <Confetti />}
            <Box sx={{ position: 'relative', textAlign: 'center', px: 3, display: 'grid', justifyItems: 'center' }}>
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
                <Button variant="contained" autoFocus onClick={close} sx={{ mt: 3 }}>Continue</Button>
              </motion.div>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
