'use client';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { motion, AnimatePresence } from 'framer-motion';
import { FORM_COLORS, FORM_TEXT_COLOR } from '@/lib/constants';
import type { StandingRow } from '@/lib/types';

const MotionTableRow = motion.create(TableRow);

function FormDot({ result }: { result: 'W' | 'D' | 'L' }) {
  return (
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: '10px',
        bgcolor: FORM_COLORS[result],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        color: FORM_TEXT_COLOR,
        boxShadow: `0 2px 4px ${FORM_COLORS[result]}30`,
        transition: 'transform 150ms ease',
      }}
    >
      {result}
    </Box>
  );
}

export default function StandingsTable({ standings }: { standings: StandingRow[] }) {
  return (
    <TableContainer
      sx={{
        borderRadius: '16px',
        bgcolor: 'rgba(36, 16, 25, 0.6)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(201, 185, 190, 0.08)',
        overflowX: 'auto',
      }}
    >
      <Table size="small" sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>#</TableCell>
            <TableCell sx={{ borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>Player</TableCell>
            <TableCell sx={{ borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>Team</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>P</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>W</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>D</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>L</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>GF</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>GA</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>GD</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>Pts</TableCell>
            <TableCell sx={{ borderBottom: '1px solid rgba(201, 185, 190, 0.08)' }}>Form</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <AnimatePresence>
            {standings.map((row, idx) => (
              <MotionTableRow
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                key={row.player_id}
                sx={{
                bgcolor:
                  idx === 0
                    ? 'rgba(245, 158, 11, 0.04)'
                    : idx === standings.length - 1 && standings.length > 2
                      ? 'rgba(239, 68, 68, 0.04)'
                      : 'transparent',
                transition: 'background 150ms ease',
                '&:hover': { bgcolor: 'rgba(201, 185, 190, 0.04)' },
              }}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {idx === 0 && (
                    <EmojiEventsIcon
                      sx={{
                        fontSize: 16,
                        color: '#F59E0B',
                        filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.3))',
                      }}
                    />
                  )}
                  <Typography variant="body2" fontWeight={700} sx={{ color: idx === 0 ? '#F59E0B' : '#FFF7F6' }}>
                    {idx + 1}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600} sx={{ letterSpacing: '0.01em' }}>
                  {row.player_name}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ color: '#A18A93' }}>
                  {row.team}
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ px: 1, color: '#C9B9BE' }}>{row.played}</TableCell>
              <TableCell align="center" sx={{ color: '#EA6C56', fontWeight: 600, px: 1 }}>
                {row.wins}
              </TableCell>
              <TableCell align="center" sx={{ px: 1, color: '#C9B9BE' }}>{row.draws}</TableCell>
              <TableCell align="center" sx={{ color: '#EF4444', px: 1 }}>
                {row.losses}
              </TableCell>
              <TableCell align="center" sx={{ px: 1, color: '#C9B9BE' }}>{row.goals_for}</TableCell>
              <TableCell align="center" sx={{ px: 1, color: '#C9B9BE' }}>{row.goals_against}</TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color: row.goal_difference > 0 ? '#EA6C56' : row.goal_difference < 0 ? '#EF4444' : '#A18A93',
                }}
              >
                {row.goal_difference > 0 ? '+' : ''}
                {row.goal_difference}
              </TableCell>
              <TableCell align="center">
                <Typography
                  variant="body1"
                  fontWeight={800}
                  sx={{
                    color: '#EA6C56',
                    textShadow: '0 0 8px rgba(234, 108, 86, 0.3)',
                  }}
                >
                  {row.points}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {row.form.map((r, i) => (
                    <FormDot key={i} result={r} />
                  ))}
                </Box>
              </TableCell>
            </MotionTableRow>
          ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
