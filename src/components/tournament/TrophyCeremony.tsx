'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { motion, useReducedMotion } from 'framer-motion';
import Trophy3D from '@/components/player/Trophy3D';
import TrophyViewer from '@/components/player/TrophyViewer';
import { TROPHY_LABELS, type CeremonyAward, type TrophyItem } from '@/lib/trophies';

interface Props {
  awards: CeremonyAward[];
  tournamentId: string;
  tournamentName: string;
}

const names = (winners: string[]) => (winners.length > 2 ? `${winners.slice(0, -1).join(', ')} & ${winners.at(-1)}` : winners.join(' & '));

// Every trophy from the tournament side by side, each spinning above its
// winner. Tap one to pick it up and turn it in 3D.
export default function TrophyCeremony({ awards, tournamentId, tournamentName }: Props) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState<{ item: TrophyItem; winners: string } | null>(null);

  return (
    <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 1.5, md: 2.5 } }}>
        {awards.map((award, index) => {
          const label = TROPHY_LABELS[award.kind];
          const title = award.kind === 'title';
          const item: TrophyItem = { kind: award.kind, tournamentId, tournamentName, detail: award.detail, date: null, ...(award.perfect && { perfect: true }) };
          return (
            <motion.div
              key={award.kind}
              initial={reduceMotion ? false : { opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.25 + index * 0.35, type: 'spring', stiffness: 170, damping: 18 }}
              style={{ minWidth: 0 }}
            >
              <ButtonBase
                onClick={() => setOpen({ item, winners: names(award.winners) })}
                aria-label={`${label.name}: ${names(award.winners)}, ${award.detail}. Open the trophy in 3D.`}
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'grid',
                  justifyItems: 'center',
                  alignContent: 'start',
                  gap: 0.5,
                  px: 1.5,
                  pt: 1.5,
                  pb: 2,
                  borderRadius: '18px',
                  textAlign: 'center',
                  background: title
                    ? 'radial-gradient(ellipse 80% 70% at 50% 30%, rgba(245, 158, 11, 0.28), rgba(36, 16, 25, 0.75) 75%)'
                    : 'radial-gradient(ellipse 80% 70% at 50% 30%, rgba(255, 247, 246, 0.08), rgba(36, 16, 25, 0.7) 75%)',
                  border: title ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(201, 185, 190, 0.14)',
                  transition: 'transform 200ms ease, border-color 200ms ease',
                  '&:hover, &.Mui-focusVisible': { transform: 'translateY(-4px)', borderColor: 'rgba(245, 158, 11, 0.7)' },
                }}
              >
                <Box sx={{ filter: title ? 'drop-shadow(0 0 28px rgba(245, 158, 11, 0.45))' : 'none' }}>
                  <Trophy3D kind={award.kind} width={title ? 128 : 104} spinning crowned={Boolean(award.perfect)} />
                </Box>
                <Typography sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#F59E0B' }}>
                  {award.perfect ? `${label.name} · Perfect` : label.name}
                </Typography>
                <Typography sx={{ fontSize: { xs: '1.35rem', md: '1.75rem' }, fontWeight: 700, lineHeight: 1.1, maxWidth: '100%', overflowWrap: 'anywhere' }}>{names(award.winners)}</Typography>
                <Typography sx={{ fontSize: { xs: '0.8125rem', md: '0.95rem' }, color: 'rgba(255, 247, 246, 0.75)' }}>{award.detail}</Typography>
              </ButtonBase>
            </motion.div>
          );
        })}
      </Box>
      <TrophyViewer item={open?.item ?? null} playerName={open?.winners ?? ''} onClose={() => setOpen(null)} />
    </Box>
  );
}
