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
const HEIGHT = 170;
const PAD_TOP = 12;
const PAD_BOTTOM = 34;

export function TripCurve({ trip, substance, now }: Props) {
  const b = computeTripBoundaries(trip, substance);
  const start = b.start.getTime();
  const end = b.tailEnd.getTime();
  const total = Math.max(1, end - start);

  const x = (t: number) => ((t - start) / total) * WIDTH;
  const y = (intensity: number) => PAD_TOP + (1 - intensity) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const onsetEnd = b.onsetEnd.getTime();
  const comeupEnd = b.comeupEnd.getTime();
  const peakEnd = b.peakEnd.getTime();
  const comedownEnd = b.comedownEnd.getTime();

  const mid = (a: number, c: number) => a + (c - a) * 0.5;

  const keyPoints: { t: number; intensity: number }[] = [
    { t: start, intensity: 0 },
    { t: mid(start, onsetEnd), intensity: 0.15 },
    { t: onsetEnd, intensity: 0.32 },
    { t: mid(onsetEnd, comeupEnd), intensity: 0.6 },
    { t: comeupEnd, intensity: 0.85 },
    { t: mid(comeupEnd, peakEnd), intensity: 1 },
    { t: peakEnd, intensity: 0.85 },
    { t: mid(peakEnd, comedownEnd), intensity: 0.5 },
    { t: comedownEnd, intensity: 0.25 },
    { t: mid(comedownEnd, end), intensity: 0.1 },
    { t: end, intensity: 0.03 },
  ];

  const path = smoothPath(keyPoints.map((p) => [x(p.t), y(p.intensity)]));
  const areaPath = `${path} L ${WIDTH},${HEIGHT - PAD_BOTTOM} L 0,${HEIGHT - PAD_BOTTOM} Z`;

  const nowMs = now.getTime();
  const showNow = nowMs >= start && nowMs <= end;
  const nowX = showNow ? x(nowMs) : 0;
  const nowIntensity = showNow ? interpolateIntensity(keyPoints, nowMs) : 0;
  const nowY = showNow ? y(nowIntensity) : 0;

  const segments = [
    { label: 'Onset', from: start, to: onsetEnd },
    { label: 'Come-up', from: onsetEnd, to: comeupEnd },
    { label: 'Peak', from: comeupEnd, to: peakEnd },
    { label: 'Come-down', from: peakEnd, to: comedownEnd },
    { label: 'Ausklang', from: comedownEnd, to: end },
  ];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Trip-Verlaufskurve">
      <defs>
        <linearGradient id={`fill-${trip.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={substance.color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={substance.color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {segments.map((s, i) => (
        <line
          key={i}
          x1={x(s.to)}
          x2={x(s.to)}
          y1={PAD_TOP}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="currentColor"
          strokeOpacity={i === segments.length - 1 ? 0 : 0.15}
          strokeDasharray="4 4"
        />
      ))}

      <path d={areaPath} fill={`url(#fill-${trip.id})`} stroke="none" />
      <path d={path} fill="none" stroke={substance.color} strokeWidth={3} strokeLinecap="round" />

      {showNow && (
        <g>
          <line x1={nowX} x2={nowX} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} stroke={substance.color} strokeOpacity={0.5} />
          <circle cx={nowX} cy={nowY} r={5} fill={substance.color} stroke="white" strokeWidth={1.5} />
        </g>
      )}

      {segments.map((s, i) => {
        const isFirst = i === 0;
        const isLast = i === segments.length - 1;
        const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
        const textX = isFirst ? x(s.from) : isLast ? x(s.to) : (x(s.from) + x(s.to)) / 2;
        return (
          <text key={i} x={textX} y={HEIGHT - 18} textAnchor={anchor} fontSize={10} fill="currentColor" opacity={0.6}>
            {s.label}
          </text>
        );
      })}

      <text x={x(start)} y={HEIGHT - 4} fontSize={10} fill="currentColor" opacity={0.5} textAnchor="start">
        {formatTime(b.start)}
      </text>
      <text x={x(end)} y={HEIGHT - 4} fontSize={10} fill="currentColor" opacity={0.5} textAnchor="end">
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
