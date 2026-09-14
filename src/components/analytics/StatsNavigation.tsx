'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

const destinations = [
  ['Summary', '/analytics'], ['Player rankings', '/analytics/global'], ['Rivalries', '/analytics/h2h'],
  ['Tournaments', '/analytics/league'], ['Competition history', '/competitive'], ['Ask AI', '/analytics/ai'],
];
export default function StatsNavigation() {
  const pathname = usePathname();
  return <Box component="nav" aria-label="Stats navigation" sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', pb: 1, mb: 3, borderBottom: 1, borderColor: 'divider' }}>
    {destinations.map(([label, href]) => <Button component={Link} key={href} href={href} aria-current={pathname === href ? 'page' : undefined}
      sx={{ whiteSpace: 'nowrap', flexShrink: 0, px: 1.5, color: pathname === href ? 'primary.light' : 'text.secondary', bgcolor: pathname === href ? 'action.selected' : 'transparent' }}>{label}</Button>)}
  </Box>;
}
