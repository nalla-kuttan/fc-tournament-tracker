'use client';

import useSWR from 'swr';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { motion, useReducedMotion } from 'framer-motion';
import UltimateCard from '@/components/player/UltimateCard';
import { fetcher } from '@/lib/fetcher';
import { getPlayerImagePath } from '@/lib/player-images';
import type { PlayerCardData } from '@/lib/player-cards';
import type { H2HData } from '@/lib/types';

const LEFT = '#EA6C56';
const RIGHT = '#7E8CC2';

interface Row {
  label: string;
  left: number;
  right: number;
  format?: (value: number) => string;
}

function Fighter({ name, card, align }: { name: string; card?: PlayerCardData; align: 'left' | 'right' }) {
  return (
    <Box sx={{ display: 'grid', justifyItems: 'center', minWidth: 0 }}>
      {card ? (
        <Box sx={{ width: { xs: 96, sm: 170, md: 200 } }}>
          <UltimateCard card={card} width="100%" />
        </Box>
      ) : (
        <Avatar src={getPlayerImagePath(name) ?? undefined} sx={{ width: 96, height: 96, fontSize: '2rem', border: `2px solid ${align === 'left' ? LEFT : RIGHT}` }}>
          {name.slice(0, 1)}
        </Avatar>
      )}
    </Box>
  );
}

function TapeRow({ row, index }: { row: Row; index: number }) {
  const reduceMotion = useReducedMotion();
  const total = row.left + row.right;
  const share = total > 0 ? row.left / total : 0.5;
  const format = row.format ?? ((value: number) => String(value));
  const leftLeads = row.left > row.right;
  const rightLeads = row.right > row.left;
  return (
    <Box component="li" sx={{ py: 1.1 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'baseline', gap: 1, mb: 0.6 }}>
        <Typography sx={{ fontWeight: leftLeads ? 700 : 500, color: leftLeads ? LEFT : 'text.secondary', fontVariantNumeric: 'tabular-nums', fontSize: '1.05rem' }}>{format(row.left)}</Typography>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>{row.label}</Typography>
        <Typography sx={{ fontWeight: rightLeads ? 700 : 500, color: rightLeads ? RIGHT : 'text.secondary', fontVariantNumeric: 'tabular-nums', fontSize: '1.05rem', textAlign: 'right' }}>{format(row.right)}</Typography>
      </Box>
      <Box aria-hidden sx={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', bgcolor: 'rgba(201, 185, 190, 0.08)', gap: '2px' }}>
        <motion.div
          initial={reduceMotion ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: `${share * 100}%`, background: `linear-gradient(90deg, ${LEFT}66, ${LEFT})`, transformOrigin: 'right', opacity: leftLeads ? 1 : 0.55 }}
        />
        <motion.div
          initial={reduceMotion ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
          style={{ flex: 1, background: `linear-gradient(90deg, ${RIGHT}, ${RIGHT}66)`, transformOrigin: 'left', opacity: rightLeads ? 1 : 0.55 }}
        />
      </Box>
    </Box>
  );
}

// A fight-poster header for a rivalry: both cards facing off, the
// head-to-head record, then side-by-side bars for who leads what.
export default function TaleOfTheTape({ data }: { data: H2HData }) {
  const { data: cardData } = useSWR<{ cards: PlayerCardData[] }>('/api/players/cards', fetcher, { revalidateOnFocus: false, onError: () => undefined });
  const left = cardData?.cards.find((card) => card.playerId === data.player1.id);
  const right = cardData?.cards.find((card) => card.playerId === data.player2.id);
  const p1 = data.player1_career;
  const p2 = data.player2_career;
  const met = data.total_encounters > 0;

  const rows: Row[] = [
    ...(met ? [
      { label: 'Meetings won', left: data.player1_wins, right: data.player2_wins },
      { label: 'Goals in meetings', left: data.player1_goals, right: data.player2_goals },
    ] : []),
    ...(left && right ? [{ label: 'Overall', left: left.overall, right: right.overall }] : []),
    { label: 'Career win rate', left: Math.round(p1.win_rate), right: Math.round(p2.win_rate), format: (value: number) => `${value}%` },
    { label: 'Goals per match', left: Math.round(p1.goals_per_match * 100) / 100, right: Math.round(p2.goals_per_match * 100) / 100, format: (value: number) => value.toFixed(2) },
    { label: 'Man of the Match', left: p1.motm_awards, right: p2.motm_awards },
    ...(left && right ? [{ label: 'Titles', left: left.titles, right: right.titles }] : []),
  ];

  return (
    <Box
      component="section"
      aria-label={`Tale of the tape: ${data.player1.name} versus ${data.player2.name}`}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px',
        border: '1px solid rgba(201, 185, 190, 0.12)',
        background: `linear-gradient(115deg, rgba(234, 108, 86, 0.22) 0%, rgba(98, 17, 34, 0.35) 48%, rgba(51, 64, 117, 0.4) 52%, rgba(34, 44, 85, 0.3) 100%), #1A0B11`,
        px: { xs: 1.5, sm: 3 },
        pt: { xs: 2.5, sm: 3.5 },
        pb: { xs: 2, sm: 3 },
      }}
    >
      <Typography aria-hidden sx={{ position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)', fontSize: { xs: '7rem', sm: '11rem' }, fontWeight: 700, lineHeight: 1, color: 'rgba(255, 247, 246, 0.04)', letterSpacing: '-0.05em', pointerEvents: 'none', userSelect: 'none' }}>
        VS
      </Typography>

      <Box sx={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
        <Fighter name={data.player1.name} card={left} align="left" />
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' }, fontWeight: 700, letterSpacing: { xs: '0.1em', sm: '0.2em' }, color: 'text.secondary' }}>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>HEAD TO HEAD</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>H2H</Box>
          </Typography>
          {met ? (
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: { xs: 0.75, sm: 1.5 }, my: 0.5 }}>
              <Typography component="span" sx={{ fontSize: { xs: '2.25rem', sm: '3.5rem' }, fontWeight: 700, color: LEFT, lineHeight: 1, textShadow: `0 0 24px ${LEFT}66` }}>{data.player1_wins}</Typography>
              <Typography component="span" sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem' }, fontWeight: 600, color: 'text.secondary' }}>{data.draws}</Typography>
              <Typography component="span" sx={{ fontSize: { xs: '2.25rem', sm: '3.5rem' }, fontWeight: 700, color: RIGHT, lineHeight: 1, textShadow: `0 0 24px ${RIGHT}66` }}>{data.player2_wins}</Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, my: 0.5 }}>VS</Typography>
          )}
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', display: met ? { xs: 'none', sm: 'block' } : 'block' }}>
            {met ? `wins · draws · wins` : 'Never met'}
          </Typography>
          {met && <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, color: 'text.secondary' }}>{data.total_encounters} meetings</Typography>}
        </Box>
        <Fighter name={data.player2.name} card={right} align="right" />
      </Box>

      <Box sx={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto 1fr', mt: 2.5, mb: 0.5 }}>
        <Typography sx={{ fontWeight: 700, color: LEFT }} noWrap>{data.player1.name}</Typography>
        <Typography component="h2" sx={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.16em', color: 'text.primary', px: 1 }}>TALE OF THE TAPE</Typography>
        <Typography sx={{ fontWeight: 700, color: RIGHT, textAlign: 'right' }} noWrap>{data.player2.name}</Typography>
      </Box>
      <Box component="ul" sx={{ position: 'relative', listStyle: 'none', m: 0, p: 0 }}>
        {rows.map((row, index) => <TapeRow key={row.label} row={row} index={index} />)}
      </Box>
    </Box>
  );
}
