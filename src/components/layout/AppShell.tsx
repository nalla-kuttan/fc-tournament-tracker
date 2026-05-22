'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import SearchIcon from '@mui/icons-material/Search';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import TableChartIcon from '@mui/icons-material/TableChart';

const SIDEBAR_WIDTH = 278;

const NAV_GROUPS = [
  {
    label: 'Dashboard',
    items: [
      { label: 'Dashboard', path: '/', icon: <HomeRoundedIcon /> },
    ],
  },
  {
    label: 'Players',
    items: [
      { label: 'Players', path: '/players', icon: <GroupsIcon /> },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Rivalry', path: '/analytics/h2h', icon: <SportsSoccerIcon /> },
      { label: 'Analytics', path: '/analytics/global', icon: <LeaderboardIcon /> },
      { label: 'Leagues', path: '/analytics/league', icon: <TableChartIcon /> },
      { label: 'AI Analyst', path: '/analytics/ai', icon: <AutoAwesomeIcon /> },
    ],
  },
  {
    label: 'Competitive',
    items: [
      { label: 'Competitive', path: '/competitive', icon: <EmojiEventsIcon /> },
    ],
  },
];

const MOBILE_NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <HomeRoundedIcon /> },
  { label: 'Players', path: '/players', icon: <GroupsIcon /> },
  { label: 'Rivalry', path: '/analytics/h2h', icon: <SportsSoccerIcon /> },
  { label: 'Analytics', path: '/analytics/global', icon: <AnalyticsIcon /> },
  { label: 'Leagues', path: '/analytics/league', icon: <TableChartIcon /> },
  { label: 'AI', path: '/analytics/ai', icon: <AutoAwesomeIcon /> },
  { label: 'Comp', path: '/competitive', icon: <EmojiEventsIcon /> },
];

function isActive(pathname: string, path: string, label: string) {
  if (label === 'Dashboard') return pathname === '/';
  if (label === 'Players') return pathname.startsWith('/players');
  if (label === 'Rivalry') return pathname.startsWith('/analytics/h2h');
  if (label === 'Analytics') return pathname === '/analytics/global';
  if (label === 'Leagues') return pathname.startsWith('/analytics/league');
  if (label === 'AI Analyst' || label === 'AI') return pathname.startsWith('/analytics/ai');
  if (label === 'Competitive' || label === 'Comp') return pathname.startsWith('/competitive');
  return pathname === path;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const activeMobileTab = MOBILE_NAV_ITEMS.findIndex((item) => isActive(pathname, item.path, item.label));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: '#F8FAFC',
        background:
          'linear-gradient(180deg, rgba(2, 6, 23, 0.88), rgba(2, 6, 23, 0.97)), radial-gradient(circle at 45% 28%, rgba(34, 197, 94, 0.16), transparent 28%), radial-gradient(circle at 90% 0%, rgba(59, 130, 246, 0.18), transparent 24%), linear-gradient(135deg, #020617 0%, #05111f 42%, #031409 100%)',
        position: 'relative',
        overflowX: 'hidden',
        '&::before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.22,
          background:
            'linear-gradient(90deg, transparent 0 8%, rgba(34, 197, 94, 0.18) 8.2% 8.5%, transparent 8.7% 100%), linear-gradient(0deg, transparent 0 68%, rgba(148, 163, 184, 0.16) 68.2% 68.4%, transparent 68.6% 100%)',
          backgroundSize: '120px 100%, 100% 86px',
          maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 82%, transparent)',
        },
      }}
    >
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', lg: 'flex' },
          position: 'fixed',
          left: 14,
          top: 14,
          bottom: 14,
          width: SIDEBAR_WIDTH,
          flexDirection: 'column',
          borderRadius: '18px',
          border: '1px solid rgba(34, 197, 94, 0.24)',
          background: 'rgba(2, 10, 20, 0.76)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.42)',
          overflow: 'hidden',
          zIndex: 20,
        }}
      >
        <Box sx={{ p: 2.25, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              color: '#02130B',
              background: 'linear-gradient(135deg, #4ADE80, #22C55E)',
              boxShadow: '0 0 24px rgba(34, 197, 94, 0.36)',
            }}
          >
            <SportsSoccerIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: '1.38rem', lineHeight: 0.9, color: '#4ADE80' }}>
              FC
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', letterSpacing: '0.14em', fontWeight: 800, color: '#E2E8F0' }}>
              TOURNAMENT TRACKER
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.09)' }} />

        <Box sx={{ flex: 1, px: 1.25, py: 1.5, overflowY: 'auto' }}>
          {NAV_GROUPS.map((group) => (
            <Box key={group.label} sx={{ mb: 2 }}>
              <Typography
                sx={{
                  px: 1.25,
                  mb: 0.75,
                  fontSize: '0.66rem',
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#7891AE',
                }}
              >
                {group.label}
              </Typography>
              {group.items.map((item) => {
                const active = isActive(pathname, item.path, item.label);
                return (
                  <Button
                    key={`${group.label}-${item.label}`}
                    fullWidth
                    startIcon={item.icon}
                    onClick={() => router.push(item.path)}
                    sx={{
                      justifyContent: 'flex-start',
                      mb: 0.35,
                      px: 1.25,
                      py: 1.05,
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: active ? '#ECFDF5' : '#B7C4D6',
                      bgcolor: active ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                      border: active ? '1px solid rgba(34, 197, 94, 0.55)' : '1px solid transparent',
                      boxShadow: active ? 'inset 4px 0 0 rgba(74, 222, 128, 0.9), 0 0 22px rgba(34, 197, 94, 0.13)' : 'none',
                      '&:hover': {
                        bgcolor: active ? 'rgba(34, 197, 94, 0.24)' : 'rgba(148, 163, 184, 0.07)',
                      },
                      '& .MuiButton-startIcon': {
                        color: active ? '#4ADE80' : '#91A4BC',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          ))}
        </Box>

        <Box sx={{ p: 1.5 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '14px',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.11), rgba(34, 197, 94, 0.08))',
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: '0.9rem' }}>Kick Off Vibes</Typography>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.76rem', mb: 1.25 }}>by Inner Celestial</Typography>
            <Box
              sx={{
                height: 34,
                borderRadius: '10px',
                background:
                  'repeating-linear-gradient(90deg, #22C55E 0 3px, transparent 3px 7px), linear-gradient(90deg, rgba(34, 197, 94, 0.05), rgba(59, 130, 246, 0.12))',
                opacity: 0.85,
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ minHeight: '100vh', pl: { lg: `${SIDEBAR_WIDTH + 28}px` } }}>
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: { xs: 2, sm: 3, lg: 4 },
            py: { xs: 1.25, sm: 1.75 },
            background: { xs: 'rgba(2, 6, 23, 0.86)', lg: 'transparent' },
            backdropFilter: { xs: 'blur(22px)', lg: 'none' },
            WebkitBackdropFilter: { xs: 'blur(22px)', lg: 'none' },
            borderBottom: { xs: '1px solid rgba(148, 163, 184, 0.08)', lg: 'none' },
          }}
        >
          <Box
            onClick={() => router.push('/')}
            sx={{
              display: { xs: 'flex', lg: 'none' },
              alignItems: 'center',
              gap: 1,
              flex: 1,
              minWidth: 0,
              cursor: 'pointer',
            }}
          >
            <SportsSoccerIcon sx={{ color: '#22C55E', fontSize: 28, filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.45))' }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 950, color: '#F8FAFC', lineHeight: 1 }}>
                FC Tracker
              </Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em' }}>
                TOURNAMENT HUB
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              gap: 1,
              width: 380,
              px: 1.5,
              py: 0.65,
              ml: 'auto',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              background: 'rgba(15, 23, 42, 0.68)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
            }}
          >
            <SearchIcon sx={{ color: '#8DA2BA', fontSize: 20 }} />
            <InputBase
              placeholder="Search players, tournaments..."
              sx={{
                flex: 1,
                color: '#E2E8F0',
                fontSize: '0.86rem',
                '& input::placeholder': { color: '#90A0B8', opacity: 1 },
              }}
            />
          </Box>

        </Box>

        <Box
          component="main"
          sx={{
            px: { xs: 2, sm: 3, lg: 4 },
            pt: { xs: 2, lg: 0.5 },
            pb: { xs: 'calc(104px + env(safe-area-inset-bottom))', lg: 5 },
            width: '100%',
            maxWidth: 1540,
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>

      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: { xs: 'block', lg: 'none' },
          zIndex: 1200,
          background: 'rgba(2, 6, 23, 0.86)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(148, 163, 184, 0.09)',
          boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.36)',
          borderRadius: 0,
        }}
        elevation={0}
      >
        <BottomNavigation
          value={activeMobileTab >= 0 ? activeMobileTab : 0}
          onChange={(_, newValue) => router.push(MOBILE_NAV_ITEMS[newValue].path)}
          sx={{
            background: 'transparent',
            height: 'calc(74px + env(safe-area-inset-bottom))',
            pb: 'env(safe-area-inset-bottom)',
            '& .MuiBottomNavigationAction-root': {
              color: '#7C8EA6',
              minWidth: 'auto',
              gap: 0,
              pt: 1,
              '&.Mui-selected': { color: '#22C55E' },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.66rem',
                fontWeight: 800,
                mt: 0.25,
                '&.Mui-selected': { fontSize: '0.66rem' },
              },
              '& .MuiSvgIcon-root': { fontSize: 25 },
              '&.Mui-selected .MuiSvgIcon-root': {
                filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.48))',
              },
            },
          }}
          showLabels
        >
          {MOBILE_NAV_ITEMS.map((item) => (
            <BottomNavigationAction key={`${item.label}-${item.path}`} label={item.label} icon={item.icon} />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
