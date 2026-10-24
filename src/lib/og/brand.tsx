import { MARK_ASPECT, MARK_DOT, MARK_LETTERS, MARK_VIEWBOX } from '@/lib/brand-mark';

// The horizontal logo lockup for the share images: the mark, then
// "TOURNAMENT / TRACKER" in Chakra Petch Medium, its two lines spanning the
// mark's height (the same proportions as the logo kit's lockup).
export function OgBrandLockup({ height = 64 }: { height?: number }) {
  const fontSize = height * 0.41;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: height * 0.3 }}>
      <svg width={height * MARK_ASPECT} height={height} viewBox={MARK_VIEWBOX}>
        <path fill="#FFF7F6" d={MARK_LETTERS} />
        <path fill="#EA6C56" d={MARK_DOT} />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', fontSize, fontWeight: 500, lineHeight: 1.05, letterSpacing: fontSize * 0.05, color: '#FFF7F6' }}>
        <div style={{ display: 'flex' }}>TOURNAMENT</div>
        <div style={{ display: 'flex' }}>TRACKER</div>
      </div>
    </div>
  );
}
