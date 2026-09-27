'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// Labels match each page's title. On phones the six destinations sit in a
// 3x2 grid so none are hidden behind a sideways scroll.
const destinations = [
  ['Summary', '/analytics'], ['Rankings', '/analytics/global'], ['Rivalries', '/analytics/h2h'],
  ['Tournaments', '/analytics/league'], ['History', '/competitive'], ['Ask AI', '/analytics/ai'],
];
export default function StatsNavigation() {
  const pathname = usePathname();
  return <Box component="nav" aria-label="Stats navigation" sx={{
    display: { xs: 'grid', sm: 'flex' },
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 0.5, pb: 1, mb: 3, borderBottom: 1, borderColor: 'divider',
  }}>
    {destinations.map(([label, href]) => <Button component={Link} key={href} href={href} aria-current={pathname === href ? 'page' : undefined}
      sx={{ whiteSpace: 'nowrap', minWidth: 0, px: 1.5, color: pathname === href ? 'primary.light' : 'text.secondary', bgcolor: pathname === href ? 'action.selected' : 'transparent' }}>{label}</Button>)}
  </Box>;
}
