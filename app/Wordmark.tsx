// Het woordmerk als SVG-tekst. Door `textLength` gelijk te zetten aan de
// breedte van de viewBox past de tekst zichzelf altijd exact op de beschikbare
// ruimte — ongeacht het lettertype van de bezoeker of hoe lang de naam is.

const VIEWBOX_WIDTH = 1000;
const FONT_SIZE = 100;
const BASELINE = 86;
const LINE_HEIGHT = 104;

type Props = {
  lines: string[];
  gradientId: string;
  className?: string;
  /** Verdikt de letters; Arial/Helvetica houdt op bij gewicht 900. */
  strokeWidth?: number;
};

export default function Wordmark({
  lines,
  gradientId,
  className,
  strokeWidth = 0,
}: Props) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${LINE_HEIGHT * lines.length}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop className="wm-stop-1" offset="0%" />
          <stop className="wm-stop-2" offset="50%" />
          <stop className="wm-stop-3" offset="100%" />
        </linearGradient>
      </defs>
      {lines.map((line, i) => (
        <text
          key={i}
          x="0"
          y={BASELINE + i * LINE_HEIGHT}
          fontSize={FONT_SIZE}
          textLength={VIEWBOX_WIDTH}
          lengthAdjust="spacingAndGlyphs"
          fill={`url(#${gradientId})`}
          stroke={strokeWidth ? `url(#${gradientId})` : undefined}
          strokeWidth={strokeWidth || undefined}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {line}
        </text>
      ))}
    </svg>
  );
}
