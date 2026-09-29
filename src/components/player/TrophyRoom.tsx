'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import SectionTitle from '@/components/shared/SectionTitle';
import Trophy3D from '@/components/player/Trophy3D';
import TrophyViewer from '@/components/player/TrophyViewer';
import { fetcher } from '@/lib/fetcher';
import { TROPHY_LABELS, type TrophyItem, type TrophyKind } from '@/lib/trophies';

const SHELF_ORDER: TrophyKind[] = ['title', 'golden-ball', 'golden-boot', 'motm', 'best-defence', 'runner-up'];

// A lit glass cabinet with a shelf per award. Trophies spin on hover; select
// one to look at it up close.
export default function TrophyRoom({ playerId, playerName }: { playerId: string; playerName: string }) {
  const { data } = useSWR<{ items: TrophyItem[] }>(`/api/players/${playerId}/trophies`, fetcher, { revalidateOnFocus: false, onError: () => undefined });
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState<TrophyItem | null>(null);
  if (!data || data.items.length === 0) return null;

  const shelves = SHELF_ORDER
    .map((kind) => ({ kind, items: data.items.filter((item) => item.kind === kind) }))
    .filter((shelf) => shelf.items.length > 0);
  const summary = shelves.map((shelf) => `${shelf.items.length} ${shelf.items.length === 1 ? TROPHY_LABELS[shelf.kind].name : TROPHY_LABELS[shelf.kind].plural}`).join(', ');

  return (
    <Box sx={{ mb: 4 }}>
      <SectionTitle title="Trophy room" />
      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mt: -0.75, mb: 1.5 }}>{summary}</Typography>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '18px',
          border: '1px solid rgba(252, 231, 168, 0.18)',
          background: 'linear-gradient(180deg, #1F0B12 0%, #150810 100%)',
          boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.6), 0 20px 40px rgba(0, 0, 0, 0.35)',
          p: { xs: 1.5, sm: 2.5 },
          display: 'grid',
          gap: { xs: 2.5, sm: 3 },
          // Glass: a faint diagonal reflection over the whole cabinet.
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.045) 38%, transparent 46%, transparent 62%, rgba(255, 255, 255, 0.03) 68%, transparent 74%)',
          },
        }}
      >
        {shelves.map((shelf) => (
          <Box key={shelf.kind} component="section" aria-label={`${TROPHY_LABELS[shelf.kind].plural}: ${shelf.items.length}`} sx={{ position: 'relative', minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5, px: 0.5 }}>
              <Typography component="h3" sx={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FCE7A8' }}>
                {TROPHY_LABELS[shelf.kind].plural}
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>{shelf.items.length} · {TROPHY_LABELS[shelf.kind].description}</Typography>
            </Box>
            <Box
              component="ul"
              sx={{
                listStyle: 'none',
                m: 0,
                p: 0,
                pt: 1,
                display: 'flex',
                gap: { xs: 0.5, sm: 1 },
                overflowX: 'auto',
                scrollbarWidth: 'thin',
                position: 'relative',
                // Spotlight wash from above the shelf.
                background: 'radial-gradient(ellipse 70% 90% at 50% 0%, rgba(255, 233, 210, 0.08), transparent 70%)',
              }}
            >
              {shelf.items.map((item) => {
                const key = `${item.kind}-${item.tournamentId}`;
                return (
                  <Box component="li" key={key} sx={{ flexShrink: 0 }}>
                    <ButtonBase
                      onClick={() => setOpen(item)}
                      onMouseEnter={() => setActive(key)}
                      onMouseLeave={() => setActive((current) => (current === key ? null : current))}
                      onFocus={() => setActive(key)}
                      onBlur={() => setActive((current) => (current === key ? null : current))}
                      aria-label={`${TROPHY_LABELS[item.kind].name}, ${item.tournamentName}: ${item.detail}. Open to view in 3D.`}
                      sx={{ display: 'grid', justifyItems: 'center', borderRadius: '10px', px: 0.25, pb: 0.5, transition: 'transform 200ms ease', '&:hover': { transform: 'translateY(-3px)' }, '&:focus-visible': { outline: '2px solid #F59E0B', outlineOffset: 2 } }}
                    >
                      <Trophy3D kind={item.kind} width={shelf.kind === 'title' ? 92 : 76} spinning={active === key} />
                      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#FCE7A8', whiteSpace: 'nowrap', mt: 0.25 }}>
                        {item.tournamentName.replace(/^Season\s+/i, 'S')}
                      </Typography>
                    </ButtonBase>
                  </Box>
                );
              })}
            </Box>
            {/* The shelf: lacquered plank with a lit front edge. */}
            <Box aria-hidden sx={{ height: 12, mt: -1.5, borderRadius: '3px', background: 'linear-gradient(180deg, #5A1C2B 0%, #852A3D 30%, #3B0B16 100%)', boxShadow: '0 10px 18px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(252, 231, 168, 0.35)' }} />
          </Box>
        ))}
      </Box>
      <TrophyViewer item={open} playerName={playerName} onClose={() => setOpen(null)} />
    </Box>
  );
}
