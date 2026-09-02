// Het woordmerk als SVG-tekst. De langste regel krijgt `textLength` gelijk aan
// de breedte van de viewBox, waardoor het woordmerk zich altijd exact op de
// beschikbare ruimte past — ongeacht het lettertype van de bezoeker of hoe lang
// de naam is. Kortere regels lijnen links uit op hun eigen breedte.

const VIEWBOX_WIDTH = 1000;

// Gemeten breedte van één teken in Archivo Black, als factor van de
// lettergrootte. Hiermee komt de natuurlijke breedte van de langste regel al
// dicht bij de viewBox, zodat `textLength` alleen nog de letterafstand hoeft
// bij te sturen en de letters zelf niet vervormen.
const CHAR_RATIO = 0.72;

const LINE_HEIGHT = 0.95; // regelafstand, als factor van de lettergrootte
const BASELINE = 0.78; // afstand tot de basislijn binnen een regel

type Props = {
  lines: string[];
  gradientId: string;
  className?: string;
};

export default function Wordmark({ lines, gradientId, className }: Props) {
  const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), "");
  const fontSize = VIEWBOX_WIDTH / Math.max(1, longest.length * CHAR_RATIO);
  const lineHeight = fontSize * LINE_HEIGHT;
  const height = (lines.length - 1) * lineHeight + fontSize * (BASELINE + 0.08);

  return (
    <svg
      className={className ? `wordmark-svg ${className}` : "wordmark-svg"}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${height.toFixed(1)}`}
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
          y={(fontSize * BASELINE + i * lineHeight).toFixed(1)}
          fontSize={fontSize.toFixed(1)}
          // Alleen de langste regel wordt op de volle breedte gezet; de rest
          // houdt zijn eigen breedte en lijnt links uit.
          textLength={line === longest ? VIEWBOX_WIDTH : undefined}
          lengthAdjust={line === longest ? "spacing" : undefined}
          fill={`url(#${gradientId})`}
        >
          {line}
        </text>
      ))}
    </svg>
  );
}
