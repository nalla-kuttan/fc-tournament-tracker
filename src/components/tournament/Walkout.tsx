'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion, useReducedMotion } from 'framer-motion';
import UltimateCard from '@/components/player/UltimateCard';
import { usePreview } from '@/components/tournament/MatchPreview';
import { fetcher } from '@/lib/fetcher';
import type { PlayerCardData } from '@/lib/player-cards';

const AUTO_CLOSE_MS = 16000;

interface Props {
  matchId: string;
  homeName: string;
  awayName: string;
  onDone: () => void;
}

// The pre-match walkout for TV: both cards come out, then the record,
// the odds and the talking points.
export default function Walkout({ matchId, homeName, awayName, onDone }: Props) {
  const { data: preview } = usePreview(matchId);
  const { data: cardData } = useSWR<{ cards: PlayerCardData[] }>('/api/players/cards', fetcher, { revalidateOnFocus: false, onError: () => undefined });
  const reduceMotion = useReducedMotion();
  const home = cardData?.cards.find((card) => card.playerId === preview?.homePlayerId);
  const away = cardData?.cards.find((card) => card.playerId === preview?.awayPlayerId);

  useEffect(() => {
    const timer = window.setTimeout(onDone, AUTO_CLOSE_MS);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' || event.key === 'Enter') onDone(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onDone]);

  const enter = (delay: number, from: Record<string, number>) => (reduceMotion
    ? { initial: false as const }
    : { initial: { opacity: 0, ...from }, animate: { opacity: 1, x: 0, y: 0, scale: 1 }, transition: { delay, type: 'spring' as const, stiffness: 110, damping: 16 } });

  const card = (entry: PlayerCardData | undefined, name: string) => (
    entry ? <Box sx={{ width: { xs: 150, md: 280 } }}><UltimateCard card={entry} width="100%" interactive={false} /></Box>
      : <Typography sx={{ fontSize: '4rem', fontWeight: 700 }}>{name}</Typography>
  );

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${homeName} versus ${awayName}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 1500, display: 'grid', placeItems: 'center', overflow: 'hidden', background: 'radial-gradient(ellipse 60% 50% at 25% 50%, rgba(234, 108, 86, 0.3), transparent 70%), radial-gradient(ellipse 60% 50% at 75% 50%, rgba(126, 140, 194, 0.3), transparent 70%), #0B0508' }}
    >
      {!reduceMotion && (
        <Box aria-hidden sx={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(100deg, transparent 0 60px, rgba(255, 247, 246, 0.025) 60px 62px)', animation: 'walkoutSweep 12s linear infinite', '@keyframes walkoutSweep': { to: { backgroundPosition: '600px 0' } } }} />
      )}
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 1400, px: { xs: 2, md: 6 }, display: 'grid', gap: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: { xs: 1, md: 4 } }}>
          <motion.div {...enter(0.2, { x: -300 })} style={{ justifySelf: 'end', display: 'grid', justifyItems: 'center', gap: 12 }}>
            {card(home, homeName)}
          </motion.div>
          <motion.div {...enter(1, { scale: 3 })} style={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: { xs: '3rem', md: '7rem' }, fontWeight: 700, lineHeight: 1, textShadow: '0 0 50px rgba(234, 108, 86, 0.7)' }}>VS</Typography>
            {preview && preview.h2h.meetings > 0 && (
              <Typography sx={{ fontSize: { xs: '1rem', md: '1.6rem' }, fontWeight: 600, mt: 1, color: 'rgba(255, 247, 246, 0.85)' }}>
                {preview.h2h.homeWins} – {preview.h2h.draws} – {preview.h2h.awayWins}
              </Typography>
            )}
            {preview && <Typography sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', md: '1.1rem' } }}>{preview.h2h.meetings ? `${preview.h2h.meetings} meetings` : 'First meeting'}</Typography>}
          </motion.div>
          <motion.div {...enter(0.6, { x: 300 })} style={{ justifySelf: 'start', display: 'grid', justifyItems: 'center', gap: 12 }}>
            {card(away, awayName)}
          </motion.div>
        </Box>

        {preview?.odds && (
          <motion.div {...enter(1.6, { y: 30 })}>
            <Box sx={{ maxWidth: 900, mx: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: { xs: '1rem', md: '1.5rem' }, fontWeight: 700, mb: 1 }}>
                <span>{homeName} {Math.round(preview.odds.home * 100)}%</span>
                <span style={{ color: '#C9B9BE' }}>Draw {Math.round(preview.odds.draw * 100)}%</span>
                <span>{awayName} {Math.round(preview.odds.away * 100)}%</span>
              </Box>
              <Box aria-hidden sx={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden', gap: '3px' }}>
                <Box sx={{ width: `${preview.odds.home * 100}%`, bgcolor: '#EA6C56' }} />
                <Box sx={{ width: `${preview.odds.draw * 100}%`, bgcolor: 'rgba(201, 185, 190, 0.45)' }} />
                <Box sx={{ width: `${preview.odds.away * 100}%`, bgcolor: '#7E8CC2' }} />
              </Box>
            </Box>
          </motion.div>
        )}

        {preview && preview.hype.length > 0 && (
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1, justifyItems: 'center', textAlign: 'center' }}>
            {preview.hype.map((line, index) => (
              <motion.li key={line.text} {...enter(2.2 + index * 0.5, { y: 20 })}>
                <Typography sx={{ fontSize: { xs: '1.1rem', md: '1.75rem' }, fontWeight: 600 }}>{line.text}</Typography>
              </motion.li>
            ))}
          </Box>
        )}

        <motion.div {...enter(3.6, { y: 20 })} style={{ textAlign: 'center' }}>
          <Button variant="contained" size="large" onClick={onDone} autoFocus sx={{ fontSize: '1.1rem', px: 4 }}>Kick off</Button>
        </motion.div>
      </Box>
    </motion.div>
  );
}
