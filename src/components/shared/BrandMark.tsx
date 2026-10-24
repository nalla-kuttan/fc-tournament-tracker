import Box from '@mui/material/Box';
import { BRAND_COLORS } from '@/design-tokens';

// The logo symbol: "FC" in scoreboard segments with the live dot as its decimal
// point. This is the reversed drawing (slightly thinner segments) made for the
// app's dark surfaces.
const LETTERS = 'M31,52L43,40L83,40L95,52L83,64L43,64ZM26,57L38,69L38,111L26,123L14,111L14,69ZM31,128L43,116L83,116L95,128L83,140L43,140ZM26,133L38,145L38,187L26,199L14,187L14,145ZM135,52L147,40L187,40L199,52L187,64L147,64ZM130,57L142,69L142,111L130,123L118,111L118,69ZM130,133L142,145L142,187L130,199L118,187L118,145ZM135,204L147,192L187,192L199,204L187,216L147,216Z';
const DOT = 'M214,203.5A14,14 0 1 0 242,203.5A14,14 0 1 0 214,203.5Z';
const WIDTH = 228;
const HEIGHT = 178;

export default function BrandMark({ height = 32, title }: { height?: number; title?: string }) {
  return (
    <Box
      component="svg"
      viewBox={`14 40 ${WIDTH} ${HEIGHT}`}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      sx={{ width: (height * WIDTH) / HEIGHT, height, flexShrink: 0, display: 'block' }}
    >
      {title && <title>{title}</title>}
      <path fill={BRAND_COLORS.text} d={LETTERS} />
      <path fill={BRAND_COLORS.coral} d={DOT} />
    </Box>
  );
}
