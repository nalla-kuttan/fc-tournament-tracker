import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

const SKELETON_SX = { bgcolor: 'rgba(201, 185, 190, 0.05)' };

// Placeholder in the rough shape of a page (heading, then content blocks)
// instead of a spinner in the middle of empty space.
export default function PageSkeleton({ rows = 3, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <Box role="status" aria-label={label} aria-busy="true" sx={{ display: 'grid', gap: 1.5, py: 1 }}>
      <Skeleton variant="text" width="40%" height={36} sx={SKELETON_SX} />
      <Skeleton variant="rounded" height={120} sx={SKELETON_SX} />
      {Array.from({ length: rows - 1 }, (_, index) => (
        <Skeleton key={index} variant="rounded" height={72} sx={SKELETON_SX} />
      ))}
    </Box>
  );
}
