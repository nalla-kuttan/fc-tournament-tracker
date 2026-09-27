'use client';

import { usePathname, useRouter } from 'next/navigation';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';

interface Props {
  tournamentId: string;
  format: string;
}

export default function TournamentTabs({ tournamentId, format }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const basePath = `/tournaments/${tournamentId}`;

  const tabs = [
    { label: 'Dashboard', path: basePath, icon: <DashboardIcon /> },
    { label: 'Matches', path: `${basePath}/matches`, icon: <SportsSoccerIcon /> },
    ...(format !== 'knockout'
      ? [{ label: 'Standings', path: `${basePath}/standings`, icon: <LeaderboardIcon /> }]
      : []),
    ...(format === 'knockout'
      ? [{ label: 'Bracket', path: `${basePath}/bracket`, icon: <AccountTreeIcon /> }]
      : []),
    { label: 'Players', path: `${basePath}/players`, icon: <PeopleIcon /> },
    { label: 'Settings', path: `${basePath}/settings`, icon: <SettingsIcon /> },
  ];

  // Longest matching prefix, so /matches/:id highlights Matches rather than Dashboard.
  const currentTab = tabs.reduce((best, tab, index) => {
    const matches = pathname === tab.path || pathname.startsWith(`${tab.path}/`);
    return matches && (best < 0 || tab.path.length > tabs[best].path.length) ? index : best;
  }, -1);

  return (
    <Box
      sx={{
        borderBottom: '1px solid rgba(201, 185, 190, 0.08)',
        mb: 3,
        background: 'rgba(36, 16, 25, 0.3)',
        borderRadius: '12px 12px 0 0',
        mx: -1,
        px: 1,
      }}
    >
      <Tabs
        value={currentTab >= 0 ? currentTab : 0}
        onChange={(_, idx) => router.push(tabs[idx].path)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Tournament sections"
        sx={{
          '& .MuiTab-root': {
            minHeight: 56,
            transition: 'color 200ms ease',
          },
          // Phones: every section visible at once, icon above a short label,
          // instead of two tabs and a scroll arrow.
          '@media (max-width: 599.95px)': {
            '& .MuiTabs-flexContainer': { width: '100%' },
            '& .MuiTab-root': {
              flex: '1 1 0',
              minWidth: 0,
              minHeight: 60,
              px: 0.25,
              py: 0.75,
              flexDirection: 'column',
              gap: 0.25,
              fontSize: '0.75rem',
              lineHeight: 1.2,
              '& .MuiTab-icon': { mr: 0, mb: 0, fontSize: 20 },
            },
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.path} label={tab.label} icon={tab.icon} iconPosition="start" />
        ))}
      </Tabs>
    </Box>
  );
}
