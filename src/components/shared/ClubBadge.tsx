import Box from '@mui/material/Box';
import { getClubBadge } from '@/lib/club-badge';

// A shield in the club's colours with its short code. Decorative: the club
// name is always written next to it.
export default function ClubBadge({ club, size = 28 }: { club: string | null | undefined; size?: number | string }) {
  const badge = getClubBadge(club);
  const id = `club-${badge.code}-${badge.primary.slice(1)}-${badge.secondary.slice(1)}`;
  return (
    <Box
      component="svg"
      viewBox="0 0 40 46"
      aria-hidden
      sx={{ width: size, height: typeof size === 'number' ? size * 1.15 : 'auto', flexShrink: 0, display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
    >
      <defs>
        <clipPath id={id}>
          <path d="M20 1 L38 6 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V6 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="40" height="46" fill={badge.primary} />
        <path d="M0 36 L40 30 V46 H0 Z" fill={badge.secondary} />
        <rect x="0" y="6" width="40" height="2" fill={badge.secondary} opacity="0.9" />
      </g>
      <path d="M20 1 L38 6 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V6 Z" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <text
        x="20"
        y="21"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="inherit"
        fontWeight="700"
        fontSize={badge.code.length > 2 ? 11 : 14}
        fill={badge.text}
        stroke={badge.text === '#FFF7F6' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'}
        strokeWidth="0.6"
        paintOrder="stroke"
      >
        {badge.code}
      </text>
    </Box>
  );
}
