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

  const currentTab = tabs.findIndex((t) => pathname === t.path);

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs
        value={currentTab >= 0 ? currentTab : 0}
        onChange={(_, idx) => router.push(tabs[idx].path)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        {tabs.map((tab) => (
          <Tab key={tab.path} label={tab.label} icon={tab.icon} iconPosition="start" />
        ))}
      </Tabs>
    </Box>
  );
}
