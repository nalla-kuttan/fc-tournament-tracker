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
import { FORM_COLORS } from '@/lib/constants';
import type { StandingRow } from '@/lib/types';

function FormDot({ result }: { result: 'W' | 'D' | 'L' }) {
  return (
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: '6px',
        bgcolor: FORM_COLORS[result],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        color: '#fff',
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
        bgcolor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        overflowX: 'auto',
      }}
    >
      <Table size="small" sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>#</TableCell>
            <TableCell sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>Player</TableCell>
            <TableCell sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>Team</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>P</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>W</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>D</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>L</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>GF</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>GA</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>GD</TableCell>
            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>Pts</TableCell>
            <TableCell sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>Form</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {standings.map((row, idx) => (
            <TableRow
              key={row.player_id}
              sx={{
                bgcolor:
                  idx === 0
                    ? 'rgba(245, 158, 11, 0.04)'
                    : idx === standings.length - 1 && standings.length > 2
                      ? 'rgba(239, 68, 68, 0.04)'
                      : 'transparent',
                transition: 'background 150ms ease',
                '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.04)' },
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
                  <Typography variant="body2" fontWeight={700} sx={{ color: idx === 0 ? '#F59E0B' : '#F8FAFC' }}>
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
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  {row.team}
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ px: 1, color: '#94A3B8' }}>{row.played}</TableCell>
              <TableCell align="center" sx={{ color: '#22C55E', fontWeight: 600, px: 1 }}>
                {row.wins}
              </TableCell>
              <TableCell align="center" sx={{ px: 1, color: '#94A3B8' }}>{row.draws}</TableCell>
              <TableCell align="center" sx={{ color: '#EF4444', px: 1 }}>
                {row.losses}
              </TableCell>
              <TableCell align="center" sx={{ px: 1, color: '#94A3B8' }}>{row.goals_for}</TableCell>
              <TableCell align="center" sx={{ px: 1, color: '#94A3B8' }}>{row.goals_against}</TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color: row.goal_difference > 0 ? '#22C55E' : row.goal_difference < 0 ? '#EF4444' : '#64748B',
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
                    color: '#22C55E',
                    textShadow: '0 0 8px rgba(34, 197, 94, 0.3)',
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
