import Box from '@mui/material/Box';
import { BRAND_COLORS } from '@/design-tokens';
import { MARK_ASPECT, MARK_DOT, MARK_LETTERS, MARK_VIEWBOX } from '@/lib/brand-mark';

// The logo symbol for the app's dark surfaces.
export default function BrandMark({ height = 32, title }: { height?: number; title?: string }) {
  return (
    <Box
      component="svg"
      viewBox={MARK_VIEWBOX}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      sx={{ width: height * MARK_ASPECT, height, flexShrink: 0, display: 'block' }}
    >
      {title && <title>{title}</title>}
      <path fill={BRAND_COLORS.text} d={MARK_LETTERS} />
      <path fill={BRAND_COLORS.coral} d={MARK_DOT} />
    </Box>
  );
}
