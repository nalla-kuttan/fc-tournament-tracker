'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ClubBadge from '@/components/shared/ClubBadge';
import ShareImageButton from '@/components/shared/ShareImageButton';
import UltimateCard from '@/components/player/UltimateCard';
import type { PlayerCardData } from '@/lib/player-cards';
import type { PlayerWrapped } from '@/lib/tournament-wrapped';

const SLIDE_MS = 5500;

const ordinal = (n: number) => {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};
const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`;

interface Slide {
  key: string;
  background: string;
  body: ReactNode;
}

function Kicker({ children }: { children: ReactNode }) {
  return <Typography sx={{ fontSize: { xs: '1.05rem', sm: '1.25rem' }, fontWeight: 600, color: 'rgba(255, 247, 246, 0.82)', mb: 1 }}>{children}</Typography>;
}

function Huge({ children, color = '#FFF7F6' }: { children: ReactNode; color?: string }) {
  return <Typography component="p" sx={{ fontSize: { xs: '5.5rem', sm: '8rem' }, fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.04em', color }}>{children}</Typography>;
}

function Line({ children }: { children: ReactNode }) {
  return <Typography sx={{ fontSize: { xs: '1.35rem', sm: '1.6rem' }, fontWeight: 600, mt: 2, maxWidth: '22ch', textWrap: 'balance' }}>{children}</Typography>;
}

function buildSlides(story: PlayerWrapped, tournamentName: string, card: PlayerCardData | undefined): Slide[] {
  const slides: Slide[] = [];
  const champion = story.position === 1;
  slides.push({
    key: 'intro',
    background: 'radial-gradient(circle at 30% 20%, #EA6C56 0%, #621122 55%, #12080C 100%)',
    body: (
      <>
        <Kicker>{tournamentName}</Kicker>
        <Typography component="h2" sx={{ fontSize: { xs: '3rem', sm: '4.5rem' }, fontWeight: 700, lineHeight: 1 }}>{story.name}, this was your tournament.</Typography>
        <Line>{story.played} matches. Let&apos;s look back.</Line>
      </>
    ),
  });
  slides.push({
    key: 'finish',
    background: champion ? 'radial-gradient(circle at 50% 30%, #FFD27A 0%, #C98A1B 35%, #621122 80%)' : 'radial-gradient(circle at 70% 25%, #7E8CC2 0%, #334075 45%, #12080C 100%)',
    body: (
      <>
        <Kicker>You finished</Kicker>
        <Huge color={champion ? '#2A1705' : undefined}>{ordinal(story.position)}</Huge>
        <Line>
          {champion ? 'Champion. 🏆 ' : `Out of ${story.entrants} · `}
          {story.points} points from {story.wins}W {story.draws}D {story.losses}L.
        </Line>
      </>
    ),
  });
  slides.push({
    key: 'goals',
    background: 'radial-gradient(circle at 20% 80%, #FF8A73 0%, #C84F3D 40%, #3B0B16 100%)',
    body: (
      <>
        <Kicker>You scored</Kicker>
        <Huge>{story.goals}</Huge>
        <Line>
          {story.goals === 1 ? 'goal' : 'goals'}
          {story.goalsRank === 1 && story.goals > 0 ? ' — more than anyone.' : ` — ${ordinal(story.goalsRank)} in the scoring chart.`}
          {' '}You conceded {story.goalsAgainst}.
        </Line>
      </>
    ),
  });
  if (story.bestWin) {
    slides.push({
      key: 'best',
      background: 'linear-gradient(160deg, #334075 0%, #222C55 45%, #12080C 100%)',
      body: (
        <>
          <Kicker>Your best night</Kicker>
          <Huge>{story.bestWin.score}</Huge>
          <Line>against {story.bestWin.opponent}.</Line>
        </>
      ),
    });
  }
  if (story.nemesis) {
    const n = story.nemesis;
    slides.push({
      key: 'nemesis',
      background: 'radial-gradient(circle at 80% 20%, #852A3D 0%, #3B0B16 55%, #0B0508 100%)',
      body: (
        <>
          <Kicker>Your nemesis</Kicker>
          <Typography component="p" sx={{ fontSize: { xs: '4rem', sm: '6rem' }, fontWeight: 700, lineHeight: 1 }}>{n.opponent}</Typography>
          <Line>{n.wins + n.draws + n.losses === 1 ? `They beat you ${n.goalsAgainst}–${n.goalsFor}.` : `${n.wins}W ${n.draws}D ${n.losses}L against them, ${n.goalsFor}–${n.goalsAgainst} on goals.`} Next time.</Line>
        </>
      ),
    });
  }
  if (story.motm > 0 || story.averageRating != null) {
    slides.push({
      key: 'motm',
      background: 'radial-gradient(circle at 30% 30%, #F59E0B 0%, #852A3D 55%, #12080C 100%)',
      body: (
        <>
          <Kicker>Man of the Match</Kicker>
          <Huge>{story.motm}×</Huge>
          <Line>{story.averageRating != null ? `Average match rating ${story.averageRating.toFixed(1)}.` : ''}</Line>
        </>
      ),
    });
  }
  if (story.rating) {
    const up = story.rating.change >= 0;
    slides.push({
      key: 'rating',
      background: up ? 'linear-gradient(200deg, #EA6C56 0%, #852A3D 50%, #12080C 100%)' : 'linear-gradient(200deg, #334075 0%, #222C55 50%, #0B0508 100%)',
      body: (
        <>
          <Kicker>Your rating</Kicker>
          <Huge>{signed(story.rating.change)}</Huge>
          <Line>{story.rating.from} → {story.rating.to}. {up ? 'Climbing.' : 'A dip. Bounce back.'}</Line>
        </>
      ),
    });
  }
  if (story.club) {
    slides.push({
      key: 'club',
      background: 'radial-gradient(circle at 50% 35%, #2D1620 0%, #12080C 70%)',
      body: (
        <>
          <Kicker>You mostly played as</Kicker>
          <Box sx={{ my: 2 }}><ClubBadge club={story.club.name} size={110} /></Box>
          <Typography component="p" sx={{ fontSize: { xs: '2.6rem', sm: '3.5rem' }, fontWeight: 700, lineHeight: 1 }}>{story.club.name}</Typography>
          <Line>{story.club.matches} of {story.played} matches.</Line>
        </>
      ),
    });
  }
  if (card) {
    slides.push({
      key: 'card',
      background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255, 214, 170, 0.28), transparent 70%), linear-gradient(180deg, #2D1620 0%, #12080C 100%)',
      body: (
        <>
          <Kicker>Your card now</Kicker>
          <Box sx={{ width: { xs: 220, sm: 260 }, my: 1 }} onPointerDown={(event) => event.stopPropagation()}>
            <UltimateCard card={card} width="100%" />
          </Box>
          <Box onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} sx={{ mt: 2 }}>
            <ShareImageButton src={`/api/og/player/${card.playerId}`} fileName={`${card.name.toLowerCase()}-card.png`} title={`${card.name}'s card`} label="Share card" sx={{ color: '#FFF7F6', borderColor: 'rgba(255, 247, 246, 0.5)' }} />
          </Box>
        </>
      ),
    });
  }
  return slides;
}

interface Props {
  story: PlayerWrapped;
  tournamentName: string;
  card?: PlayerCardData;
  onClose: () => void;
}

// A full-screen, story-style look back at one player's tournament. Tap the
// right side (or →) for next, the left (or ←) for back, hold to pause.
export default function WrappedStory({ story, tournamentName, card, onClose }: Props) {
  const slides = useMemo(() => buildSlides(story, tournamentName, card), [story, tournamentName, card]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const last = index === slides.length - 1;

  const go = useCallback((delta: number) => {
    setElapsed(0);
    setIndex((current) => Math.max(0, Math.min(slides.length - 1, current + delta)));
  }, [slides.length]);

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); go(1); }
      if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  // Advance on a timer; the last slide stays up.
  useEffect(() => {
    if (paused || last) return;
    const started = performance.now() - elapsed;
    let frame = 0;
    const tick = (now: number) => {
      const spent = now - started;
      if (spent >= SLIDE_MS) {
        go(1);
        return;
      }
      setElapsed(spent);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when the slide or pause state changes
  }, [index, paused, last, go]);

  const slide = slides[index];
  const holdTimer = useRef<number | null>(null);

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={`${story.name}'s ${tournamentName} Wrapped`}
      sx={{ position: 'fixed', inset: 0, zIndex: 1400, bgcolor: '#0B0508', display: 'grid', placeItems: 'center' }}
    >
      <Box
        sx={{ position: 'relative', width: '100%', height: '100%', maxWidth: 520, maxHeight: { sm: 920 }, overflow: 'hidden', borderRadius: { sm: '24px' }, touchAction: 'manipulation' }}
        onPointerDown={() => { holdTimer.current = window.setTimeout(() => setPaused(true), 180); }}
        onPointerUp={(event) => {
          if (holdTimer.current) window.clearTimeout(holdTimer.current);
          if (paused) { setPaused(false); return; }
          const rect = event.currentTarget.getBoundingClientRect();
          go(event.clientX - rect.left < rect.width * 0.33 ? -1 : 1);
        }}
        onPointerLeave={() => { if (holdTimer.current) window.clearTimeout(holdTimer.current); setPaused(false); }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={slide.key}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'absolute', inset: 0, background: slide.background }}
          >
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: slide.key === 'card' || slide.key === 'club' ? 'center' : 'flex-start', textAlign: slide.key === 'card' || slide.key === 'club' ? 'center' : 'left', px: { xs: 3.5, sm: 5 }, color: '#FFF7F6' }}>
              <motion.div
                initial={reduceMotion ? false : { y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'inherit' }}
              >
                {slide.body}
              </motion.div>
            </Box>
          </motion.div>
        </AnimatePresence>

        {/* Progress */}
        <Box sx={{ position: 'absolute', top: 12, left: 12, right: 60, display: 'flex', gap: 0.5, zIndex: 2 }} aria-hidden>
          {slides.map((entry, i) => (
            <Box key={entry.key} sx={{ flex: 1, height: 3, borderRadius: 2, bgcolor: 'rgba(255, 247, 246, 0.3)', overflow: 'hidden' }}>
              <Box sx={{ height: '100%', bgcolor: '#FFF7F6', width: i < index ? '100%' : i === index ? `${last ? 100 : (elapsed / SLIDE_MS) * 100}%` : '0%' }} />
            </Box>
          ))}
        </Box>
        <IconButton
          ref={closeRef}
          aria-label="Close Wrapped"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onClick={onClose}
          sx={{ position: 'absolute', top: 2, right: 6, zIndex: 3, color: '#FFF7F6' }}
        >
          <CloseIcon />
        </IconButton>
        <Typography aria-live="polite" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {`Slide ${index + 1} of ${slides.length}`}
        </Typography>
      </Box>
    </Box>
  );
}
