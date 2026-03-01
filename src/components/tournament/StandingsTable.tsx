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
        width: 20,
        height: 20,
        borderRadius: '50%',
        bgcolor: FORM_COLORS[result],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        color: '#fff',
      }}
    >
      {result}
    </Box>
  );
}

export default function StandingsTable({ standings }: { standings: StandingRow[] }) {
  return (
    <TableContainer sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Player</TableCell>
            <TableCell>Team</TableCell>
            <TableCell align="center">P</TableCell>
            <TableCell align="center">W</TableCell>
            <TableCell align="center">D</TableCell>
            <TableCell align="center">L</TableCell>
            <TableCell align="center">GF</TableCell>
            <TableCell align="center">GA</TableCell>
            <TableCell align="center">GD</TableCell>
            <TableCell align="center">Pts</TableCell>
            <TableCell>Form</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {standings.map((row, idx) => (
            <TableRow
              key={row.player_id}
              sx={{
                bgcolor:
                  idx === 0
                    ? 'rgba(255, 215, 0, 0.06)'
                    : idx === standings.length - 1 && standings.length > 2
                      ? 'rgba(239, 68, 68, 0.06)'
                      : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
              }}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {idx === 0 && <EmojiEventsIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                  <Typography variant="body2" fontWeight={700}>
                    {idx + 1}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {row.player_name}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {row.team}
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ px: 1 }}>{row.played}</TableCell>
              <TableCell align="center" sx={{ color: 'success.main', fontWeight: 600, px: 1 }}>
                {row.wins}
              </TableCell>
              <TableCell align="center" sx={{ px: 1 }}>{row.draws}</TableCell>
              <TableCell align="center" sx={{ color: 'error.main', px: 1 }}>
                {row.losses}
              </TableCell>
              <TableCell align="center" sx={{ px: 1 }}>{row.goals_for}</TableCell>
              <TableCell align="center" sx={{ px: 1 }}>{row.goals_against}</TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color: row.goal_difference > 0 ? 'success.main' : row.goal_difference < 0 ? 'error.main' : 'text.secondary',
                }}
              >
                {row.goal_difference > 0 ? '+' : ''}
                {row.goal_difference}
              </TableCell>
              <TableCell align="center">
                <Typography variant="body1" fontWeight={800} color="primary.main">
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
