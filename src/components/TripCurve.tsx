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
const HEIGHT = 160;
const PAD_TOP = 12;
const PAD_BOTTOM = 34;

export function TripCurve({ trip, substance, now }: Props) {
  const b = computeTripBoundaries(trip, substance);
  const start = b.start.getTime();
  const end = b.aftereffectsEnd.getTime();
  const total = Math.max(1, end - start);

  const x = (t: number) => ((t - start) / total) * WIDTH;
  const y = (intensity: number) => PAD_TOP + (1 - intensity) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const onsetEnd = b.onsetEnd.getTime();
  const durationEnd = b.durationEnd.getTime();
  const peakT = onsetEnd + (durationEnd - onsetEnd) * 0.35;
  const comedownT = durationEnd + (end - durationEnd) * 0.35;

  const keyPoints: { t: number; intensity: number }[] = [
    { t: start, intensity: 0 },
    { t: start + (onsetEnd - start) * 0.6, intensity: 0.55 },
    { t: onsetEnd, intensity: 0.92 },
    { t: peakT, intensity: 1 },
    { t: durationEnd, intensity: 0.55 },
    { t: comedownT, intensity: 0.22 },
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
    { label: 'Eintrittsphase', from: start, to: onsetEnd },
    { label: 'Wirkdauer', from: onsetEnd, to: durationEnd },
    { label: 'Nachwirkung', from: durationEnd, to: end },
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
          <text key={i} x={textX} y={HEIGHT - 18} textAnchor={anchor} fontSize={11} fill="currentColor" opacity={0.6}>
            {s.label}
          </text>
        );
      })}

      <text x={x(start)} y={HEIGHT - 4} fontSize={10} fill="currentColor" opacity={0.5} textAnchor="start">
        {formatTime(b.start)}
      </text>
      <text x={x(end)} y={HEIGHT - 4} fontSize={10} fill="currentColor" opacity={0.5} textAnchor="end">
        {formatTime(b.aftereffectsEnd)}
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
