'use client';

import { KeyboardEvent, ReactNode, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import useSWR from 'swr';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
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
import type { RegisteredPlayer, Tournament } from '@/lib/types';
import { fetcher } from '@/lib/fetcher';

const SIDEBAR_WIDTH = 278;

const COLORS = {
  pitchBlack: '#020617',
  textIce: '#F8FAFC',
  textSteel: '#94A3B8',
  textMuted: '#94A3B8',
  green: '#22C55E',
  greenLight: '#4ADE80',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
};

const NAV_GROUPS = [
  {
    label: 'Play',
    items: [
      { label: 'Home', path: '/', icon: <HomeRoundedIcon /> },
      { label: 'Players', path: '/players', icon: <GroupsIcon /> },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Overview', path: '/analytics', icon: <AnalyticsIcon /> },
      { label: 'Rivalries', path: '/analytics/h2h', icon: <SportsSoccerIcon /> },
      { label: 'Global Stats', path: '/analytics/global', icon: <LeaderboardIcon /> },
      { label: 'Leagues', path: '/analytics/league', icon: <TableChartIcon /> },
      { label: 'AI Analyst', path: '/analytics/ai', icon: <AutoAwesomeIcon /> },
    ],
  },
  {
    label: 'Legacy',
    items: [
      { label: 'Competitive', path: '/competitive', icon: <EmojiEventsIcon /> },
    ],
  },
];

const MOBILE_NAV_ITEMS = [
  { label: 'Home', path: '/', icon: <HomeRoundedIcon /> },
  { label: 'Players', path: '/players', icon: <GroupsIcon /> },
  { label: 'Insights', path: '/analytics', icon: <AnalyticsIcon /> },
  { label: 'Compete', path: '/competitive', icon: <EmojiEventsIcon /> },
];

type SearchResult = {
  id: string;
  label: string;
  meta: string;
  path: string;
  kind: 'Player' | 'Tournament';
};

function isActive(pathname: string, path: string) {
  if (path === '/') return pathname === '/' || pathname.startsWith('/tournaments');
  if (path === '/analytics') return pathname === '/analytics';
  return pathname === path || pathname.startsWith(`${path}/`);
}

function isMobileActive(pathname: string, path: string) {
  if (path === '/') return pathname === '/' || pathname.startsWith('/tournaments');
  if (path === '/analytics') return pathname.startsWith('/analytics');
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const activeSearch = searchOpen || query.trim().length > 0;
  const { data: tournaments = [], error: tournamentSearchError, isLoading: loadingTournaments, mutate: retryTournamentSearch } = useSWR<Tournament[]>(
    activeSearch ? '/api/tournaments' : null,
    fetcher,
    { onError: () => undefined, revalidateOnFocus: false }
  );
  const { data: players = [], error: playerSearchError, isLoading: loadingPlayers, mutate: retryPlayerSearch } = useSWR<RegisteredPlayer[]>(
    activeSearch ? '/api/players' : null,
    fetcher,
    { onError: () => undefined, revalidateOnFocus: false }
  );

  const activeMobileTab = MOBILE_NAV_ITEMS.findIndex((item) => isMobileActive(pathname, item.path));
  const trimmedQuery = query.trim().toLowerCase();
  const searchResults = useMemo<SearchResult[]>(() => {
    if (trimmedQuery.length < 2) return [];

    const tournamentMatches = tournaments
      .filter((tournament) =>
        `${tournament.name} ${tournament.format} ${tournament.status}`.toLowerCase().includes(trimmedQuery)
      )
      .slice(0, 4)
      .map((tournament) => ({
        id: `tournament-${tournament.id}`,
        label: tournament.name,
        meta: `${tournament.format} · ${tournament.status}`,
        path: `/tournaments/${tournament.id}`,
        kind: 'Tournament' as const,
      }));

    const playerMatches = players
      .filter((player) => `${player.name} ${player.base_team}`.toLowerCase().includes(trimmedQuery))
      .slice(0, 4)
      .map((player) => ({
        id: `player-${player.id}`,
        label: player.name,
        meta: player.base_team,
        path: `/players/${player.id}`,
        kind: 'Player' as const,
      }));

    return [...tournamentMatches, ...playerMatches].slice(0, 6);
  }, [players, tournaments, trimmedQuery]);
  const searchLoading = loadingTournaments || loadingPlayers;
  const searchError = tournamentSearchError ?? playerSearchError;

  const navigateTo = (path: string) => {
    setQuery('');
    setSearchOpen(false);
    router.push(path);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setSearchOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' && searchResults.length > 0) {
      event.preventDefault();
      setActiveResultIndex((index) => (index + 1) % searchResults.length);
      return;
    }
    if (event.key === 'ArrowUp' && searchResults.length > 0) {
      event.preventDefault();
      setActiveResultIndex((index) => (index - 1 + searchResults.length) % searchResults.length);
      return;
    }
    if (event.key === 'Enter' && searchResults[activeResultIndex]) {
      event.preventDefault();
      navigateTo(searchResults[activeResultIndex].path);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: COLORS.textIce,
        background: 'radial-gradient(circle at 84% 0%, rgba(59, 130, 246, 0.1), transparent 28%), #020617',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <Box
        component="nav"
        aria-label="Primary navigation"
        sx={{
          display: { xs: 'none', lg: 'flex' },
          position: 'fixed',
          left: 14,
          top: 14,
          bottom: 14,
          width: SIDEBAR_WIDTH,
          flexDirection: 'column',
          borderRadius: '16px',
          border: '1px solid rgba(34, 197, 94, 0.24)',
          background: '#07111F',
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
              color: COLORS.pitchBlack,
              background: '#4ADE80',
            }}
          >
            <SportsSoccerIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.38rem', lineHeight: 0.9, color: '#4ADE80' }}>
              FC
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', letterSpacing: '0.14em', fontWeight: 700, color: COLORS.textIce }}>
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
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: COLORS.textSteel,
                }}
              >
                {group.label}
              </Typography>
              {group.items.map((item) => {
                const active = isActive(pathname, item.path);
                return (
                  <Button
                    key={`${group.label}-${item.label}`}
                    aria-current={active ? 'page' : undefined}
                    component={Link}
                    href={item.path}
                    fullWidth
                    startIcon={item.icon}
                    sx={{
                      justifyContent: 'flex-start',
                      mb: 0.35,
                      px: 1.25,
                      py: 1.05,
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: active ? COLORS.textIce : '#B7C4D6',
                      bgcolor: active ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                      border: active ? '1px solid rgba(34, 197, 94, 0.55)' : '1px solid transparent',
                      boxShadow: 'none',
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
            component="button"
            type="button"
            aria-label="Go to dashboard"
            onClick={() => router.push('/')}
            sx={{
              display: { xs: 'flex', lg: 'none' },
              alignItems: 'center',
              gap: 1,
              flex: 1,
              minWidth: 0,
              cursor: 'pointer',
              appearance: 'none',
              border: 0,
              p: 0,
              background: 'transparent',
              textAlign: 'left',
              font: 'inherit',
            }}
          >
            <SportsSoccerIcon sx={{ color: '#22C55E', fontSize: 28 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: '#F8FAFC', lineHeight: 1 }}>
                FC Tracker
              </Typography>
              <Typography sx={{ color: '#B6C3D5', fontSize: '0.875rem', fontWeight: 600 }}>
                Tournament hub
              </Typography>
            </Box>
          </Box>

          <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
            <Box sx={{ display: 'contents' }}>
              <IconButton
                aria-label="Search players and tournaments"
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen((open) => !open)}
                sx={{ display: { xs: 'inline-flex', lg: 'none' }, ml: 'auto', color: searchOpen ? '#4ADE80' : '#B6C3D5' }}
              >
                <SearchIcon />
              </IconButton>

              <Box
              sx={{
                display: { xs: searchOpen ? 'block' : 'none', lg: 'block' },
                width: { xs: 'auto', lg: 420 },
                ml: 'auto',
                position: { xs: 'fixed', lg: 'relative' },
                top: { xs: 72, lg: 'auto' },
                left: { xs: 12, lg: 'auto' },
                right: { xs: 12, lg: 'auto' },
                zIndex: 50,
              }}
            >
              <Box
                role="search"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.65,
                  borderRadius: '16px',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  background: '#0F172A',
                  boxShadow: searchOpen ? '0 0 0 3px rgba(34, 197, 94, 0.1)' : 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                }}
              >
                <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                <InputBase
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveResultIndex(0);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search players, tournaments..."
                  inputProps={{
                    'aria-label': 'Search players and tournaments',
                    'aria-controls': searchOpen ? 'global-search-results' : undefined,
                    'aria-activedescendant': searchResults[activeResultIndex]?.id,
                    'aria-autocomplete': 'list',
                  }}
                  sx={{
                    flex: 1,
                    color: '#F8FAFC',
                    fontSize: '0.9rem',
                    '& input::placeholder': { color: '#94A3B8', opacity: 1 },
                  }}
                />
                {searchLoading && <CircularProgress size={16} thickness={5} sx={{ color: '#22C55E' }} />}
              </Box>

              {searchOpen && (
                <Paper
                  elevation={0}
                  sx={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    zIndex: 40,
                    overflow: 'hidden',
                    borderRadius: '16px',
                    border: '1px solid rgba(148, 163, 184, 0.14)',
                    background: '#0F172A',
                    boxShadow: '0 6px 8px rgba(0, 0, 0, 0.32)',
                  }}
                >
                  {searchError ? (
                    <Box sx={{ p: 1.5 }}>
                      <Typography sx={{ color: '#F8FAFC', fontWeight: 700 }}>Search is unavailable</Typography>
                      <Typography sx={{ color: '#B6C3D5', fontSize: '0.875rem', mb: 1 }}>
                        Check the connection or deployment configuration, then retry.
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<SearchIcon />}
                        onClick={() => {
                          void retryTournamentSearch();
                          void retryPlayerSearch();
                        }}
                      >
                        Retry search
                      </Button>
                    </Box>
                  ) : trimmedQuery.length < 2 ? (
                    <Box sx={{ p: 1.5 }}>
                      <Typography sx={{ color: '#B6C3D5', fontSize: '0.875rem' }}>
                        Type at least two characters to find a player or tournament.
                      </Typography>
                    </Box>
                  ) : searchResults.length === 0 && !searchLoading ? (
                    <Box sx={{ p: 1.5 }}>
                      <Typography sx={{ color: '#F8FAFC', fontWeight: 700 }}>No results found</Typography>
                      <Typography sx={{ color: '#B6C3D5', fontSize: '0.875rem' }}>
                        Try a player name, team, tournament, or format.
                      </Typography>
                    </Box>
                  ) : (
                    <Box id="global-search-results" role="listbox" aria-label="Search results" sx={{ py: 0.5 }}>
                      {searchResults.map((result, index) => (
                        <Button
                          key={result.id}
                          id={result.id}
                          role="option"
                          aria-selected={index === activeResultIndex}
                          fullWidth
                          onClick={() => navigateTo(result.path)}
                          onFocus={() => setActiveResultIndex(index)}
                          onMouseEnter={() => setActiveResultIndex(index)}
                          sx={{
                            justifyContent: 'space-between',
                            gap: 1.5,
                            px: 1.5,
                            py: 1.1,
                            borderRadius: 0,
                            color: '#F8FAFC',
                            textAlign: 'left',
                            background: index === activeResultIndex ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                            '&:hover': { background: 'rgba(34, 197, 94, 0.1)' },
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }} noWrap>
                              {result.label}
                            </Typography>
                            <Typography sx={{ color: '#B6C3D5', fontSize: '0.875rem' }} noWrap>
                              {result.meta}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={result.kind}
                            sx={{
                              flexShrink: 0,
                              color: result.kind === 'Player' ? '#60A5FA' : '#22C55E',
                              bgcolor: result.kind === 'Player' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                              fontWeight: 700,
                            }}
                          />
                        </Button>
                      ))}
                    </Box>
                  )}
                </Paper>
              )}
              </Box>
            </Box>
          </ClickAwayListener>

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
          borderRadius: 0,
        }}
        elevation={0}
      >
        <BottomNavigation
          component="nav"
          aria-label="Primary mobile navigation"
          value={activeMobileTab >= 0 ? activeMobileTab : 0}
          onChange={(_, newValue) => router.push(MOBILE_NAV_ITEMS[newValue].path)}
          sx={{
            background: 'transparent',
            height: 'calc(74px + env(safe-area-inset-bottom))',
            pb: 'env(safe-area-inset-bottom)',
            '& .MuiBottomNavigationAction-root': {
              color: COLORS.textSteel,
              minWidth: 'auto',
              gap: 0,
              pt: 1,
              '&.Mui-selected': { color: '#22C55E' },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.875rem',
                fontWeight: 700,
                mt: 0.25,
                '&.Mui-selected': { fontSize: '0.875rem' },
              },
              '& .MuiSvgIcon-root': { fontSize: 25 },
            },
          }}
          showLabels
        >
          {MOBILE_NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={`${item.label}-${item.path}`}
              aria-current={isMobileActive(pathname, item.path) ? 'page' : undefined}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
