// The opening intro: the scoreboard powers on. Both digit slots show faintly,
// the segments of "FC" flick on one by one, the live dot lands, then the whole
// thing fades into the app. Plain CSS in the server HTML (styles in
// globals.css), so it shows before hydration and never blocks a tap.
// Geometry matches BrandMark: 24-unit segments, 45° ends, 5-unit gaps.
const GHOST = 'M31,52L43,40L83,40L95,52L83,64L43,64ZM100,57L112,69L112,111L100,123L88,111L88,69ZM100,133L112,145L112,187L100,199L88,187L88,145ZM31,204L43,192L83,192L95,204L83,216L43,216ZM26,133L38,145L38,187L26,199L14,187L14,145ZM26,57L38,69L38,111L26,123L14,111L14,69ZM31,128L43,116L83,116L95,128L83,140L43,140ZM135,52L147,40L187,40L199,52L187,64L147,64ZM204,57L216,69L216,111L204,123L192,111L192,69ZM204,133L216,145L216,187L204,199L192,187L192,145ZM135,204L147,192L187,192L199,204L187,216L147,216ZM130,133L142,145L142,187L130,199L118,187L118,145ZM130,57L142,69L142,111L130,123L118,111L118,69ZM135,128L147,116L187,116L199,128L187,140L147,140Z';
const SEGMENTS = [
  { d: 'M31,52L43,40L83,40L95,52L83,64L43,64Z', delay: 120 },
  { d: 'M26,57L38,69L38,111L26,123L14,111L14,69Z', delay: 170 },
  { d: 'M31,128L43,116L83,116L95,128L83,140L43,140Z', delay: 220 },
  { d: 'M26,133L38,145L38,187L26,199L14,187L14,145Z', delay: 270 },
  { d: 'M135,52L147,40L187,40L199,52L187,64L147,64Z', delay: 340 },
  { d: 'M130,57L142,69L142,111L130,123L118,111L118,69Z', delay: 390 },
  { d: 'M130,133L142,145L142,187L130,199L118,187L118,145Z', delay: 440 },
  { d: 'M135,204L147,192L187,192L199,204L187,216L147,216Z', delay: 490 },
];

export default function SplashIntro() {
  return (
    <div className="fc-splash" aria-hidden>
      <div className="fc-splash__inner">
        <svg viewBox="14 40 228 178">
          <path className="fc-splash__ghost" d={GHOST} />
          {SEGMENTS.map((segment) => (
            <path key={segment.delay} className="fc-splash__seg" d={segment.d} style={{ animationDelay: `${segment.delay}ms` }} />
          ))}
          <circle className="fc-splash__ring" cx="228" cy="203.5" r="14" />
          <circle className="fc-splash__dot" cx="228" cy="203.5" r="14" />
        </svg>
        <div className="fc-splash__name">TOURNAMENT TRACKER</div>
      </div>
    </div>
  );
}
