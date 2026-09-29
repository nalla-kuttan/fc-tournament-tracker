import { cardFinish } from '@/lib/card-finish';
import { getClubBadge } from '@/lib/club-badge';
import { getInitials } from '@/lib/player-insights';
import type { PlayerCardData } from '@/lib/player-cards';

// The player card drawn for the image renderer (flexbox and pixel units
// only). Mirrors components/player/UltimateCard.
// The card silhouette in pixels (the renderer reads polygon percentages
// against the width only).
function shape(width: number, height: number) {
  const points: Array<[number, number]> = [[8, 0], [38, 0], [44, 3], [56, 3], [62, 0], [92, 0], [100, 6], [100, 88], [50, 100], [0, 88], [0, 6]];
  return `polygon(${points.map(([x, y]) => `${(x * width) / 100}px ${(y * height) / 100}px`).join(', ')})`;
}

export function CardArt({ card, photo, width }: { card: PlayerCardData; photo: string | null; width: number }) {
  const finish = cardFinish(card);
  const height = Math.round(width * 1.4);
  const u = width / 100;
  const badge = getClubBadge(card.club);

  return (
    <div style={{ display: 'flex', position: 'relative', width, height, clipPath: shape(width, height), backgroundImage: finish.background, color: finish.ink }}>
      {card.reigningChampion && (
        <div style={{ display: 'flex', position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(115deg, rgba(255,255,255,0) 25%, rgba(255,150,150,0.35) 35%, rgba(255,235,140,0.35) 43%, rgba(140,255,210,0.3) 51%, rgba(140,180,255,0.35) 59%, rgba(255,255,255,0) 70%)' }} />
      )}
      <div style={{ display: 'flex', position: 'absolute', top: 9 * u, right: 6 * u, width: 62 * u, height: height * 0.5, alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden', maskImage: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 20%, #000 85%, rgba(0,0,0,0) 100%)' }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={62 * u} height={height * 0.5} style={{ objectFit: 'cover', objectPosition: 'center top' }} />
        ) : (
          <div style={{ display: 'flex', fontSize: 26 * u, fontWeight: 700, opacity: 0.85, paddingBottom: 8 * u }}>{getInitials(card.name)}</div>
        )}
        <div style={{ display: 'flex', position: 'absolute', left: 0, right: 0, bottom: 0, height: 14 * u, backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.25))' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', top: 10 * u, left: 9 * u }}>
        <div style={{ display: 'flex', fontSize: 19 * u, fontWeight: 700, lineHeight: 0.9, letterSpacing: -0.6 * u }}>{card.overall}</div>
        <div style={{ display: 'flex', fontSize: 5 * u, fontWeight: 700, letterSpacing: 0.6 * u, color: finish.muted, marginTop: 1.5 * u }}>OVR</div>
        <div style={{ display: 'flex', width: 11 * u, height: 2, background: finish.muted, opacity: 0.6, margin: `${2 * u}px 0` }} />
        <div style={{ display: 'flex', width: 12 * u, height: 13.8 * u, alignItems: 'center', justifyContent: 'center', borderRadius: `${1 * u}px ${1 * u}px ${6 * u}px ${6 * u}px`, backgroundImage: `linear-gradient(170deg, ${badge.primary} 62%, ${badge.secondary} 62%)`, border: `${0.4 * u}px solid rgba(255,255,255,0.4)`, color: badge.text, fontSize: 3.6 * u, fontWeight: 700 }}>
          {badge.code}
        </div>
        {card.titles > 0 && (
          <div style={{ display: 'flex', marginTop: 2 * u, fontSize: 4.6 * u, fontWeight: 700 }}>{`${card.titles}×`}</div>
        )}
        {card.titles > 0 && <div style={{ display: 'flex', fontSize: 3.4 * u, color: finish.muted, fontWeight: 700 }}>TITLES</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', top: height * 0.57, left: 0, right: 0 }}>
        <div style={{ display: 'flex', fontSize: (card.name.length > 9 ? 8 : 10) * u, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.2 * u }}>{card.name}</div>
        <div style={{ display: 'flex', marginTop: 2 * u, width: 70 * u, height: 2, background: finish.muted, opacity: 0.5 }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', position: 'absolute', top: height * 0.67, left: 13 * u, right: 13 * u }}>
        {card.attributes.map((attribute) => (
          <div key={attribute.key} style={{ display: 'flex', width: '50%', alignItems: 'baseline', justifyContent: 'center', marginBottom: 1 * u }}>
            <div style={{ display: 'flex', fontSize: 7.4 * u, fontWeight: 700, width: 10 * u, justifyContent: 'flex-end' }}>{attribute.value}</div>
            <div style={{ display: 'flex', fontSize: 5.6 * u, fontWeight: 500, color: finish.muted, marginLeft: 2 * u, width: 11 * u }}>{attribute.key}</div>
          </div>
        ))}
      </div>
      {(card.reigningChampion || card.provisional) && (
        <div style={{ display: 'flex', position: 'absolute', bottom: height * 0.075, left: 0, right: 0, justifyContent: 'center', fontSize: 4.2 * u, fontWeight: 700, letterSpacing: 0.4 * u, color: finish.muted }}>
          {card.reigningChampion ? '— CHAMPION —' : 'PROVISIONAL'}
        </div>
      )}
    </div>
  );
}

// The shared stadium backdrop for every share image.
export const STADIUM_BACKGROUND = 'radial-gradient(ellipse 60% 40% at 20% 0%, rgba(255, 214, 170, 0.22), rgba(255,255,255,0) 70%), radial-gradient(ellipse 60% 40% at 80% 0%, rgba(126, 140, 194, 0.22), rgba(255,255,255,0) 70%), linear-gradient(180deg, #2D1620 0%, #12080C 60%, #0B0508 100%)';
