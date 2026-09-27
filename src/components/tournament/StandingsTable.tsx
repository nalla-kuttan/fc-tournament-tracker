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
import { FORM_COLORS } from '@/lib/constants';
import type { StandingRow } from '@/lib/types';

const MotionTableRow = motion.create(TableRow);

const HEAD_BORDER = { borderBottom: '1px solid rgba(201, 185, 190, 0.08)' };
// Phones keep #, Player (with team beneath), P, GD, Pts and recent form.
const WIDE_ONLY = { display: { xs: 'none', sm: 'table-cell' } } as const;
const PHONE_FORM_RESULTS = 3;

function FormDot({ result, phoneHidden = false }: { result: 'W' | 'D' | 'L'; phoneHidden?: boolean }) {
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
        color: '#FFF7F6',
        boxShadow: `0 2px 4px ${FORM_COLORS[result]}30`,
        transition: 'transform 150ms ease',
        // After the base display so it wins on phones.
        ...(phoneHidden && { display: { xs: 'none', sm: 'inline-flex' } }),
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
      <Table
        size="small"
        sx={{
          minWidth: { xs: 0, sm: 700 },
          '& .MuiTableCell-root': { px: { xs: 0.75, sm: 1.5 } },
          '& abbr': { textDecoration: 'none' },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={HEAD_BORDER}>#</TableCell>
            <TableCell sx={HEAD_BORDER}>Player</TableCell>
            <TableCell sx={{ ...HEAD_BORDER, ...WIDE_ONLY }}>Team</TableCell>
            <TableCell align="center" sx={HEAD_BORDER}><abbr title="Played">P</abbr></TableCell>
            <TableCell align="center" sx={{ ...HEAD_BORDER, ...WIDE_ONLY }}><abbr title="Won">W</abbr></TableCell>
            <TableCell align="center" sx={{ ...HEAD_BORDER, ...WIDE_ONLY }}><abbr title="Drawn">D</abbr></TableCell>
            <TableCell align="center" sx={{ ...HEAD_BORDER, ...WIDE_ONLY }}><abbr title="Lost">L</abbr></TableCell>
            <TableCell align="center" sx={{ ...HEAD_BORDER, ...WIDE_ONLY }}><abbr title="Goals for">GF</abbr></TableCell>
            <TableCell align="center" sx={{ ...HEAD_BORDER, ...WIDE_ONLY }}><abbr title="Goals against">GA</abbr></TableCell>
            <TableCell align="center" sx={HEAD_BORDER}><abbr title="Goal difference">GD</abbr></TableCell>
            <TableCell align="center" sx={HEAD_BORDER}><abbr title="Points">Pts</abbr></TableCell>
            <TableCell sx={HEAD_BORDER}>Form</TableCell>
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
                <Typography variant="caption" sx={{ display: { xs: 'block', sm: 'none' }, color: '#A18A93', lineHeight: 1.3 }}>
                  {row.team}
                </Typography>
              </TableCell>
              <TableCell sx={WIDE_ONLY}>
                <Typography variant="body2" sx={{ color: '#A18A93' }}>
                  {row.team}
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ px: 1, color: '#C9B9BE' }}>{row.played}</TableCell>
              <TableCell align="center" sx={{ ...WIDE_ONLY, color: '#EA6C56', fontWeight: 600, px: 1 }}>
                {row.wins}
              </TableCell>
              <TableCell align="center" sx={{ ...WIDE_ONLY, px: 1, color: '#C9B9BE' }}>{row.draws}</TableCell>
              <TableCell align="center" sx={{ ...WIDE_ONLY, color: '#EF4444', px: 1 }}>
                {row.losses}
              </TableCell>
              <TableCell align="center" sx={{ ...WIDE_ONLY, px: 1, color: '#C9B9BE' }}>{row.goals_for}</TableCell>
              <TableCell align="center" sx={{ ...WIDE_ONLY, px: 1, color: '#C9B9BE' }}>{row.goals_against}</TableCell>
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
                    <FormDot key={i} result={r} phoneHidden={i < row.form.length - PHONE_FORM_RESULTS} />
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
