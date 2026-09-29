'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import StarIcon from '@mui/icons-material/Star';
import ShieldIcon from '@mui/icons-material/Shield';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import type { TrophyKind } from '@/lib/trophies';

const FRAMES = 24;

const FALLBACK: Record<TrophyKind, { icon: typeof EmojiEventsIcon; color: string }> = {
  title: { icon: EmojiEventsIcon, color: '#F2C150' },
  'runner-up': { icon: MilitaryTechIcon, color: '#E4DEE0' },
  'golden-boot': { icon: DirectionsRunIcon, color: '#F2C150' },
  'golden-ball': { icon: SportsSoccerIcon, color: '#F2C150' },
  motm: { icon: StarIcon, color: '#F4A582' },
  'best-defence': { icon: ShieldIcon, color: '#B9C2D6' },
};

// One trophy from its rendered turntable sheet. It rests at a three-quarter
// view and spins while hovered or focused (never under reduced motion).
export default function Trophy3D({ kind, width = 90, spinning = false }: { kind: TrophyKind; width?: number; spinning?: boolean }) {
  const [sheet, setSheet] = useState<string | null | 'failed'>(null);

  useEffect(() => {
    let cancelled = false;
    // three.js loads only when a trophy case is on screen.
    import('@/lib/trophy-sprites')
      .then((module) => module.getTrophySheet(kind))
      .then((url) => { if (!cancelled) setSheet(url ?? 'failed'); })
      .catch(() => { if (!cancelled) setSheet('failed'); });
    return () => { cancelled = true; };
  }, [kind]);

  const height = Math.round(width * (4 / 3));
  if (sheet === 'failed') {
    const { icon: Icon, color } = FALLBACK[kind];
    return <Box sx={{ width, height, display: 'grid', placeItems: 'end center' }}><Icon sx={{ fontSize: width * 0.8, color }} /></Box>;
  }

  return (
    <Box
      aria-hidden
      className="trophy-3d"
      sx={{
        width,
        height,
        backgroundImage: sheet ? `url(${sheet})` : 'none',
        backgroundSize: `${FRAMES * 100}% 100%`,
        backgroundPosition: '0% 0',
        backgroundRepeat: 'no-repeat',
        opacity: sheet ? 1 : 0,
        transition: 'opacity 300ms ease',
        animation: spinning ? `trophySpin 2.4s steps(${FRAMES}, jump-none) infinite` : 'none',
        '@keyframes trophySpin': { from: { backgroundPosition: '0% 0' }, to: { backgroundPosition: '100% 0' } },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    />
  );
}
