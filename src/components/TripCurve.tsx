import type { Substance, Trip } from '../types';
import { computeTripBoundaries } from '../lib/timeline';
import { smoothPath } from '../lib/svgPath';
import { formatTime } from '../lib/format';

interface Props {
  trip: Trip;
  substance: Substance;
  now: Date;
}

const WIDTH = 600;
const HEIGHT = 210;
const PAD_TOP = 12;
// Bottom of the plotted curve/gridlines; below this: hour ticks, phase labels, clock labels.
const PLOT_BOTTOM = 118;

export function TripCurve({ trip, substance, now }: Props) {
  const b = computeTripBoundaries(trip, substance);
  const start = b.start.getTime();
  const end = b.tailEnd.getTime();
  const total = Math.max(1, end - start);

  const x = (t: number) => ((t - start) / total) * WIDTH;
  const y = (intensity: number) => PAD_TOP + (1 - intensity) * (PLOT_BOTTOM - PAD_TOP);

  const onsetEnd = b.onsetEnd.getTime();
  const comeupEnd = b.comeupEnd.getTime();
  const peakEnd = b.peakEnd.getTime();
  const comedownEnd = b.comedownEnd.getTime();

  const mid = (a: number, c: number) => a + (c - a) * 0.5;

  // Fast rise to plateau within onset, a flat felt-effect plateau, a
  // steady come-down, then a long, deliberately flat low tail.
  const keyPoints: { t: number; intensity: number }[] = [
    { t: start, intensity: 0 },
    { t: mid(start, onsetEnd), intensity: 0.55 },
    { t: onsetEnd, intensity: 0.98 },
    { t: mid(comeupEnd, peakEnd), intensity: 1 },
    { t: peakEnd, intensity: 0.95 },
    { t: mid(peakEnd, comedownEnd), intensity: 0.55 },
    { t: comedownEnd, intensity: 0.2 },
    { t: mid(comedownEnd, end), intensity: 0.14 },
    { t: end, intensity: 0.08 },
  ];

  const path = smoothPath(keyPoints.map((p) => [x(p.t), y(p.intensity)]));
  const areaPath = `${path} L ${WIDTH},${PLOT_BOTTOM} L 0,${PLOT_BOTTOM} Z`;

  const nowMs = now.getTime();
  const showNow = nowMs >= start && nowMs <= end;
  const nowX = showNow ? x(nowMs) : 0;
  const nowIntensity = showNow ? interpolateIntensity(keyPoints, nowMs) : 0;
  const nowY = showNow ? y(nowIntensity) : 0;

  const segments = [
    { label: 'Onset', from: start, to: onsetEnd },
    { label: 'Wirkdauer', from: comeupEnd, to: peakEnd },
    { label: 'Come-down', from: peakEnd, to: comedownEnd },
    { label: 'Ausklang', from: comedownEnd, to: end },
  ].filter((s) => s.to > s.from);

  const totalHours = Math.floor(total / 3_600_000);
  const hourTicks = Array.from({ length: totalHours }, (_, i) => start + (i + 1) * 3_600_000).filter(
    (t) => t < end - 5 * 60_000,
  );

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Trip-Verlaufskurve">
      <defs>
        <linearGradient id={`fill-${trip.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={substance.color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={substance.color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {hourTicks.map((t, i) => (
        <g key={i}>
          <line x1={x(t)} x2={x(t)} y1={PAD_TOP} y2={PLOT_BOTTOM} stroke="currentColor" strokeOpacity={0.06} />
          <text x={x(t)} y={PLOT_BOTTOM + 13} textAnchor="middle" fontSize={8} fill="currentColor" opacity={0.4}>
            {i + 1}h
          </text>
        </g>
      ))}

      {segments.map((s, i) => (
        <line
          key={i}
          x1={x(s.to)}
          x2={x(s.to)}
          y1={PAD_TOP}
          y2={PLOT_BOTTOM}
          stroke="currentColor"
          strokeOpacity={i === segments.length - 1 ? 0 : 0.18}
          strokeDasharray="4 4"
        />
      ))}

      <path d={areaPath} fill={`url(#fill-${trip.id})`} stroke="none" />
      <path d={path} fill="none" stroke={substance.color} strokeWidth={3} strokeLinecap="round" />

      {showNow && (
        <g>
          <line x1={nowX} x2={nowX} y1={PAD_TOP} y2={PLOT_BOTTOM} stroke={substance.color} strokeOpacity={0.5} />
          <circle cx={nowX} cy={nowY} r={5} fill={substance.color} stroke="white" strokeWidth={1.5} />
        </g>
      )}

      {segments.map((s, i) => {
        const isFirst = i === 0;
        const isLast = i === segments.length - 1;
        const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
        const textX = isFirst ? x(s.from) : isLast ? x(s.to) : (x(s.from) + x(s.to)) / 2;
        return (
          <text key={i} x={textX} y={PLOT_BOTTOM + 34} textAnchor={anchor} fontSize={11} fill="currentColor" opacity={0.65}>
            {s.label}
          </text>
        );
      })}

      <text x={x(start)} y={PLOT_BOTTOM + 52} fontSize={10} fill="currentColor" opacity={0.5} textAnchor="start">
        {formatTime(b.start)}
      </text>
      <text x={x(end)} y={PLOT_BOTTOM + 52} fontSize={10} fill="currentColor" opacity={0.5} textAnchor="end">
        {formatTime(b.tailEnd)}
      </text>
    </svg>
  );
}

function interpolateIntensity(points: { t: number; intensity: number }[], t: number): number {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const f = span > 0 ? (t - a.t) / span : 0;
      return a.intensity + f * (b.intensity - a.intensity);
    }
  }
  return 0;
}
