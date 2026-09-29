'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import { motion, useReducedMotion } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';
import SectionTitle from '@/components/shared/SectionTitle';
import { getAvatarColor } from '@/lib/player-insights';
import { fetcher } from '@/lib/fetcher';
import type { RatingRace as RatingRaceData } from '@/lib/rating-race';

const FRAME_MS = 140;
const ROW_HEIGHT = 34;

// Everyone's rating racing through history, one step per match.
export default function RatingRace() {
  const { data } = useSWR<RatingRaceData>('/api/competitive/rating-race', fetcher, { revalidateOnFocus: false, onError: () => undefined });
  const reduceMotion = useReducedMotion();
  const last = (data?.frames.length ?? 1) - 1;
  const [frame, setFrame] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  // Until someone presses play or scrubs, show today.
  const index = frame ?? last;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setFrame((current) => {
        const next = (current ?? 0) + 1;
        if (next >= last) {
          setPlaying(false);
          return last;
        }
        return next;
      });
    }, FRAME_MS);
    return () => window.clearInterval(timer);
  }, [playing, last]);

  const rows = useMemo(() => {
    if (!data?.frames.length) return [];
    const ratings = data.frames[index].ratings;
    return data.players
      .filter((player) => ratings[player.id] != null)
      .map((player) => ({ ...player, rating: ratings[player.id] }))
      .sort((a, b) => b.rating - a.rating);
  }, [data, index]);

  if (!data) return <Skeleton variant="rounded" height={320} sx={{ mb: 3, bgcolor: 'rgba(201, 185, 190, 0.05)' }} />;
  if (data.frames.length < 2) return null;

  const all = data.frames.flatMap((f) => Object.values(f.ratings));
  const floor = Math.floor((Math.min(...all) - 20) / 50) * 50;
  const ceiling = Math.max(...all) + 10;
  const width = (rating: number) => `${Math.max(4, ((rating - floor) / (ceiling - floor)) * 100)}%`;
  const label = data.frames[index].label;

  const toggle = () => {
    if (playing) { setPlaying(false); return; }
    if (index >= last) setFrame(0);
    else if (frame == null) setFrame(0);
    setPlaying(true);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <SectionTitle title="Rating race" />
      <GlassCard>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <IconButton aria-label={playing ? 'Pause' : index >= last && frame != null ? 'Replay from the start' : 'Play from the first match'} onClick={toggle} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.light' } }}>
              {playing ? <PauseIcon /> : index >= last && frame != null ? <ReplayIcon /> : <PlayArrowIcon />}
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }} noWrap aria-live="off">{label}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                {index >= last ? `Today · after ${last} matches` : `Going into match ${index + 1} of ${last}`}
              </Typography>
            </Box>
          </Box>

          <Box role="list" aria-label={`Ratings ${index >= last ? 'today' : `going into match ${index + 1}`}`} sx={{ position: 'relative', height: rows.length * ROW_HEIGHT }}>
            {rows.map((row, position) => (
              <motion.div
                key={row.id}
                role="listitem"
                aria-label={`${position + 1}. ${row.name} ${row.rating}`}
                animate={{ y: position * ROW_HEIGHT }}
                initial={false}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 32 }}
                style={{ position: 'absolute', left: 0, right: 0, height: ROW_HEIGHT - 6, display: 'grid', gridTemplateColumns: '84px minmax(0, 1fr)', alignItems: 'center', gap: 8 }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', textAlign: 'right' }} noWrap>{row.name}</Typography>
                <Box sx={{ position: 'relative', height: '100%' }}>
                  <Box
                    sx={{
                      height: '100%',
                      width: width(row.rating),
                      borderRadius: '6px',
                      background: `linear-gradient(90deg, ${getAvatarColor(row.id)}55, ${getAvatarColor(row.id)})`,
                      boxShadow: position === 0 ? `0 0 16px ${getAvatarColor(row.id)}88` : 'none',
                      transition: reduceMotion ? 'none' : `width ${FRAME_MS}ms linear`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      pr: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FFF7F6', textShadow: '0 1px 2px rgba(0,0,0,0.6)', fontVariantNumeric: 'tabular-nums' }}>{row.rating}</Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Box>

          <Slider
            aria-label="Match"
            value={index}
            min={0}
            max={last}
            onChange={(_, value) => { setPlaying(false); setFrame(value as number); }}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => (value >= last ? 'Today' : `Match ${value + 1}`)}
            sx={{ mt: 2 }}
          />
        </CardContent>
      </GlassCard>
    </Box>
  );
}
