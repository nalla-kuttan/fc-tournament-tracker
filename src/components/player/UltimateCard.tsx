'use client';

import { useRef } from 'react';
import Box from '@mui/material/Box';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import ClubBadge from '@/components/shared/ClubBadge';
import { getPlayerImagePath } from '@/lib/player-images';
import { getInitials } from '@/lib/player-insights';
import { CARD_SHAPE, cardFinish } from '@/lib/card-finish';
import type { PlayerCardData } from '@/lib/player-cards';

interface Props {
  card: PlayerCardData;
  width?: number | string;
  // Tilts toward the pointer and catches the light. Off for small thumbnails.
  interactive?: boolean;
}

export default function UltimateCard({ card, width = 260, interactive = true }: Props) {
  const finish = cardFinish(card);
  const reduceMotion = useReducedMotion();
  const tiltEnabled = interactive && !reduceMotion;
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [10, -10]), { stiffness: 180, damping: 18 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-12, 12]), { stiffness: 180, damping: 18 });
  const glareX = useTransform(px, [0, 1], ['0%', '100%']);
  const glareY = useTransform(py, [0, 1], ['0%', '100%']);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.45), rgba(255,255,255,0) 55%)`;
  const photo = getPlayerImagePath(card.name);
  const special = card.reigningChampion || card.tier === 'elite';

  const onMove = (event: React.PointerEvent) => {
    if (!tiltEnabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  const summary = `${card.name}, overall ${card.overall}, ${finish.label.toLowerCase()} card. ${card.attributes.map((a) => `${a.label} ${a.value}`).join(', ')}.`;

  return (
    <Box sx={{ width, maxWidth: '100%', perspective: '900px', mx: 'auto' }}>
      {/* The flip-in and the pointer tilt are separate layers so they never
          fight over the same rotation. */}
      <motion.div
        initial={reduceMotion ? false : { rotateY: -90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
      <motion.div
        ref={ref}
        role="img"
        aria-label={summary}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: tiltEnabled ? rotateX : 0, rotateY: tiltEnabled ? rotateY : 0, transformStyle: 'preserve-3d', filter: `drop-shadow(0 18px 30px ${finish.glow})` }}
      >
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '5 / 7',
            clipPath: CARD_SHAPE,
            background: finish.background,
            color: finish.ink,
            containerType: 'inline-size',
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          {/* Inner rim */}
          <Box aria-hidden sx={{ position: 'absolute', inset: '3%', clipPath: CARD_SHAPE, border: `2px solid ${finish.rim}`, opacity: 0.55 }} />
          <Box aria-hidden sx={{ position: 'absolute', inset: '3.6%', clipPath: CARD_SHAPE, background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.12))' }} />

          {/* Moving foil on special cards */}
          {special && (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                mixBlendMode: 'overlay',
                background: card.reigningChampion
                  ? 'linear-gradient(115deg, transparent 20%, rgba(255,120,120,0.55) 30%, rgba(255,230,120,0.55) 38%, rgba(120,255,200,0.5) 46%, rgba(120,170,255,0.55) 54%, rgba(220,120,255,0.5) 62%, transparent 72%)'
                  : 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 45%, transparent 60%)',
                backgroundSize: '250% 250%',
                animation: 'cardFoil 5s linear infinite',
                '@keyframes cardFoil': { from: { backgroundPosition: '100% 100%' }, to: { backgroundPosition: '-150% -150%' } },
              }}
            />
          )}

          {/* Photo or initials */}
          <Box aria-hidden sx={{ position: 'absolute', top: '9%', right: '6%', width: '62%', height: '50%', display: 'grid', placeItems: 'end center', overflow: 'hidden', maskImage: 'linear-gradient(180deg, #000 72%, transparent 100%), linear-gradient(90deg, transparent 0%, #000 18%, #000 88%, transparent 100%)', maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }}>
            {photo ? (
              <Box component="img" src={photo} alt="" draggable={false} sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            ) : (
              <Box sx={{ fontSize: '26cqi', fontWeight: 700, lineHeight: 1, opacity: 0.85, pb: '8%' }}>{getInitials(card.name)}</Box>
            )}
          </Box>

          {/* Overall and club */}
          <Box sx={{ position: 'absolute', top: '10%', left: '9%', display: 'grid', justifyItems: 'center', gap: '1.5cqi' }}>
            <Box sx={{ fontSize: '19cqi', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.04em' }}>{card.overall}</Box>
            <Box sx={{ fontSize: '5cqi', fontWeight: 700, letterSpacing: '0.12em', color: finish.muted }}>OVR</Box>
            <Box sx={{ width: '11cqi', height: '1px', bgcolor: finish.muted, opacity: 0.6, my: '1cqi' }} />
            <Box sx={{ width: '12cqi' }}>
              <ClubBadge club={card.club} size="100%" />
            </Box>
            {card.titles > 0 && (
              <Box sx={{ mt: '1cqi', fontSize: '4.6cqi', fontWeight: 700, textAlign: 'center', lineHeight: 1.1 }}>
                <Box component="span" aria-hidden>🏆</Box>
                <br />
                {card.titles}
              </Box>
            )}
          </Box>

          {/* Name band */}
          <Box sx={{ position: 'absolute', top: '57%', left: 0, right: 0, textAlign: 'center' }}>
            <Box sx={{ fontSize: card.name.length > 9 ? '8cqi' : '10cqi', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1 }}>{card.name}</Box>
            <Box sx={{ mx: 'auto', mt: '2cqi', width: '70%', height: '1px', bgcolor: finish.muted, opacity: 0.5 }} />
          </Box>

          {/* Attributes */}
          <Box
            component="dl"
            sx={{
              position: 'absolute',
              top: '67%',
              left: '13%',
              right: '13%',
              m: 0,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: '6cqi',
              rowGap: '1cqi',
            }}
          >
            {card.attributes.map((attribute) => (
              <Box key={attribute.key} sx={{ display: 'flex', alignItems: 'baseline', gap: '2cqi', justifyContent: 'center' }}>
                <Box component="dd" sx={{ m: 0, fontSize: '7.4cqi', fontWeight: 700, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', minWidth: '9cqi', textAlign: 'right' }}>{attribute.value}</Box>
                <Box component="dt" sx={{ fontSize: '5.6cqi', fontWeight: 600, color: finish.muted, minWidth: '10cqi' }}>{attribute.key}</Box>
              </Box>
            ))}
          </Box>

          {(card.reigningChampion || card.provisional) && (
            <Box sx={{ position: 'absolute', bottom: '7.5%', left: 0, right: 0, textAlign: 'center', fontSize: '4.2cqi', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: finish.muted }}>
              {card.reigningChampion ? '★ Champion ★' : 'Provisional'}
            </Box>
          )}

          {tiltEnabled && <motion.div aria-hidden style={{ position: 'absolute', inset: 0, background: glare, mixBlendMode: 'soft-light', pointerEvents: 'none' }} />}
        </Box>
      </motion.div>
      </motion.div>
    </Box>
  );
}
