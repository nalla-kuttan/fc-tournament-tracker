'use client';

import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { fieldGlyph } from '@/lib/glyphs';

// A loading placeholder in place of MUI's Skeleton (same variant / width /
// height / sx props): a dim field of drifting glyphs instead of a pulsing grey
// block. DecodeReveal watches for these being replaced and decodes the real
// content into the same spot. Drawn on a canvas so the grid stays even in
// Chakra Petch.

const CELL_W = 9;
const CELL_H = 15;
const FONT_PX = 12;
const INK = 'rgba(201, 185, 190, 0.3)';
const FRAME_MS = 80;

const RADIUS = { text: '4px', rounded: '12px', rectangular: 0, circular: '50%' } as const;

// One shared timer drives every skeleton on screen, and stops when none are.
const drawers = new Set<() => void>();
let timer: number | undefined;

function animate(draw: () => void) {
  drawers.add(draw);
  if (timer === undefined) {
    timer = window.setInterval(() => {
      if (!document.hidden) drawers.forEach((fn) => fn());
    }, FRAME_MS);
  }
  return () => {
    drawers.delete(draw);
    if (drawers.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

interface Props {
  variant?: keyof typeof RADIUS;
  width?: number | string;
  height?: number | string;
  sx?: SxProps<Theme>;
}

export default function GlyphSkeleton({ variant = 'text', width, height, sx }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const font = `500 ${FONT_PX}px ${getComputedStyle(canvas).fontFamily}`;
    // Each skeleton starts somewhere else in the wave, so a stack of them
    // doesn't move in lockstep.
    const offset = Math.random() * 10;
    const start = performance.now();
    let cols = 0;
    let rows = 0;
    let scale = 1;

    const draw = () => {
      const t = still ? offset : offset + (performance.now() - start) / 1000;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, cols * CELL_W, rows * CELL_H);
      context.font = font;
      context.fillStyle = INK;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const glyph = fieldGlyph(x, y, t);
          if (glyph !== ' ') context.fillText(glyph, x * CELL_W + CELL_W / 2, y * CELL_H + CELL_H / 2);
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * scale));
      canvas.height = Math.max(1, Math.round(rect.height * scale));
      cols = Math.ceil(rect.width / CELL_W);
      rows = Math.ceil(rect.height / CELL_H);
      draw();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const stop = still ? undefined : animate(draw);
    return () => {
      observer.disconnect();
      stop?.();
    };
  }, []);

  return (
    <Box
      data-glyph-skeleton=""
      aria-hidden
      sx={[
        {
          position: 'relative',
          display: 'block',
          overflow: 'hidden',
          width: width ?? '100%',
          height: height ?? (variant === 'text' ? '1.2em' : 40),
          borderRadius: RADIUS[variant],
          bgcolor: 'rgba(201, 185, 190, 0.03)',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
    </Box>
  );
}
