/** The four coloured yards: where each colour sits on the 150 × 150 board, and the colour token it uses. */
const YARDS = [
  { x: 0, y: 0, colour: 'var(--ludo-red)' },
  { x: 90, y: 0, colour: 'var(--ludo-green)' },
  { x: 90, y: 90, colour: 'var(--ludo-yellow)' },
  { x: 0, y: 90, colour: 'var(--ludo-blue)' },
] as const;

const LINES =
  'M0 60V90M60 0H90M10 60V90M60 10H90M20 60V90M60 20H90M30 60V90M60 30H90M40 60V90M60 40H90M50 60V90M60 50H90M60 60V90M60 60H90M90 60V90M60 90H90M100 60V90M60 100H90M110 60V90M60 110H90M120 60V90M60 120H90M130 60V90M60 130H90M140 60V90M60 140H90M150 60V90M60 150H90M0 60H60M90 60H150M60 0V60M60 90V150M0 70H60M90 70H150M70 0V60M70 90V150M0 80H60M90 80H150M80 0V60M80 90V150M0 90H60M90 90H150M90 0V60M90 90V150';

/** The ludo board as one SVG (screen 5): four yards with four coins each, four arms, the grid and the centre. */
export function LudoBoard() {
  return (
    <svg
      viewBox="0 0 150 150"
      width="128"
      height="128"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {YARDS.map((yard) => (
        <g key={yard.colour}>
          <rect x={yard.x} y={yard.y} width="60" height="60" style={{ fill: yard.colour }} />
          <rect
            x={yard.x + 10}
            y={yard.y + 10}
            width="40"
            height="40"
            rx="3"
            style={{ fill: 'var(--ludo-paper)' }}
          />
          {[20, 40].flatMap((dx) =>
            [20, 40].map((dy) => (
              <circle
                key={`${dx}-${dy}`}
                cx={yard.x + dx}
                cy={yard.y + dy}
                r="5.5"
                style={{ fill: yard.colour, stroke: 'var(--ov-k25)' }}
                strokeWidth=".8"
              />
            )),
          )}
        </g>
      ))}
      <rect x="10" y="70" width="50" height="10" style={{ fill: 'var(--ludo-red)' }} />
      <rect x="70" y="10" width="10" height="50" style={{ fill: 'var(--ludo-green)' }} />
      <rect x="90" y="70" width="50" height="10" style={{ fill: 'var(--ludo-yellow)' }} />
      <rect x="70" y="90" width="10" height="50" style={{ fill: 'var(--ludo-blue)' }} />
      <rect x="10" y="60" width="10" height="10" style={{ fill: 'var(--ludo-red)' }} />
      <rect x="80" y="10" width="10" height="10" style={{ fill: 'var(--ludo-green)' }} />
      <rect x="130" y="80" width="10" height="10" style={{ fill: 'var(--ludo-yellow)' }} />
      <rect x="60" y="130" width="10" height="10" style={{ fill: 'var(--ludo-blue)' }} />
      <path d={LINES} fill="none" strokeWidth=".8" style={{ stroke: 'var(--ludo-grid)' }} />
      <polygon points="60,60 75,75 60,90" style={{ fill: 'var(--ludo-red)' }} />
      <polygon points="60,60 75,75 90,60" style={{ fill: 'var(--ludo-green)' }} />
      <polygon points="90,60 75,75 90,90" style={{ fill: 'var(--ludo-yellow)' }} />
      <polygon points="60,90 75,75 90,90" style={{ fill: 'var(--ludo-blue)' }} />
      <rect
        x=".5"
        y=".5"
        width="149"
        height="149"
        fill="none"
        style={{ stroke: 'var(--ov-k35)' }}
      />
    </svg>
  );
}
