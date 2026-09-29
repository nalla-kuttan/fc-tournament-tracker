'use client';

import type { ReactNode } from 'react';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { motion, useReducedMotion } from 'framer-motion';
import SectionTitle from '@/components/shared/SectionTitle';
import { fetcher } from '@/lib/fetcher';
import type { TrophyItem } from '@/lib/trophies';

function Cup({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 48 56" aria-hidden>
      <defs>
        <linearGradient id="cup-gold" x1="0" x2="1">
          <stop offset="0" stopColor="#8A5A0B" />
          <stop offset="0.35" stopColor="#FCE7A8" />
          <stop offset="0.6" stopColor="#F2C150" />
          <stop offset="1" stopColor="#8A5A0B" />
        </linearGradient>
      </defs>
      <path d="M10 6h28v10c0 9-6 16-14 16S10 25 10 16z" fill="url(#cup-gold)" />
      <path d="M10 9H4c0 8 3 12 8 13M38 9h6c0 8-3 12-8 13" fill="none" stroke="url(#cup-gold)" strokeWidth="3" />
      <rect x="21" y="31" width="6" height="10" fill="url(#cup-gold)" />
      <path d="M14 41h20l3 8H11z" fill="url(#cup-gold)" />
      <rect x="9" y="49" width="30" height="5" rx="1.5" fill="#3B0B16" />
      <path d="M15 9v7c0 5 2 9 5 11" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Medal({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 40 52" aria-hidden>
      <defs>
        <linearGradient id="medal-silver" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#F4EEF0" />
          <stop offset="0.5" stopColor="#B7A9AF" />
          <stop offset="1" stopColor="#6E5F66" />
        </linearGradient>
      </defs>
      <path d="M10 0h8l6 18h-8zM30 0h-8l-6 18h8z" fill="#334075" />
      <circle cx="20" cy="34" r="14" fill="url(#medal-silver)" stroke="#F4EEF0" strokeOpacity="0.5" />
      <text x="20" y="39" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2B1D22">2</text>
    </svg>
  );
}

function Boot({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="boot-gold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#FCE7A8" />
          <stop offset="0.5" stopColor="#F2C150" />
          <stop offset="1" stopColor="#8A5A0B" />
        </linearGradient>
      </defs>
      <path d="M12 6h12v16c6 1 14 4 18 9 2 3 1 7-3 7H10c-3 0-4-2-4-5l3-9z" fill="url(#boot-gold)" />
      <path d="M8 38h33v3H8z" fill="#3B0B16" />
      {[12, 19, 26, 33].map((x) => <rect key={x} x={x} y="41" width="3" height="4" fill="#3B0B16" />)}
      <path d="M15 12h6M15 16h6" stroke="#8A5A0B" strokeWidth="1.5" />
    </svg>
  );
}

const SHELVES: Array<{ kind: TrophyItem['kind']; title: string; icon: () => ReactNode }> = [
  { kind: 'title', title: 'Titles', icon: () => <Cup /> },
  { kind: 'golden-boot', title: 'Golden boots', icon: () => <Boot /> },
  { kind: 'runner-up', title: 'Runner-up', icon: () => <Medal /> },
];

// A shelf for each kind of honour, one piece per tournament.
export default function TrophyRoom({ playerId }: { playerId: string }) {
  const { data } = useSWR<{ items: TrophyItem[] }>(`/api/players/${playerId}/trophies`, fetcher, { revalidateOnFocus: false, onError: () => undefined });
  const reduceMotion = useReducedMotion();
  if (!data || data.items.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <SectionTitle title="Trophy room" />
      <Box
        sx={{
          borderRadius: '16px',
          p: { xs: 1.5, sm: 2.5 },
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245, 158, 11, 0.12), transparent 70%), linear-gradient(180deg, #2D1620, #1D0D14)',
          border: '1px solid rgba(245, 158, 11, 0.18)',
          display: 'grid',
          gap: 2.5,
        }}
      >
        {SHELVES.map((shelf) => {
          const items = data.items.filter((item) => item.kind === shelf.kind);
          if (items.length === 0) return null;
          return (
            <Box key={shelf.kind} component="section" aria-label={`${shelf.title}: ${items.length}`}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}>
                {shelf.title} · {items.length}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: { xs: 1.5, sm: 2 }, px: 1, pb: 1.25, position: 'relative', '&::after': { content: '""', position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, borderRadius: '3px', background: 'linear-gradient(180deg, #852A3D, #3B0B16)', boxShadow: '0 6px 14px rgba(0,0,0,0.45)' } }}>
                {items.map((item, index) => (
                  <Tooltip key={`${item.kind}-${item.tournamentId}`} title={`${item.tournamentName} · ${item.detail}`} arrow>
                    <Box
                      component={motion.li}
                      tabIndex={0}
                      aria-label={`${item.tournamentName}: ${item.detail}`}
                      initial={reduceMotion ? false : { y: 12, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      whileHover={reduceMotion ? undefined : { y: -4 }}
                      sx={{ display: 'grid', justifyItems: 'center', gap: 0.25, position: 'relative', zIndex: 1, cursor: 'default', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.4))', '&:focus-visible': { outline: '2px solid #F59E0B', outlineOffset: 4, borderRadius: '8px' } }}
                    >
                      {shelf.icon()}
                      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#FCE7A8', whiteSpace: 'nowrap' }}>{item.tournamentName.replace(/^Season\s+/i, 'S')}</Typography>
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
