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
const HEIGHT = 165;
const PAD_TOP = 12;
// Bottom of the plotted curve/gridlines; below this: hour tick labels.
const PLOT_BOTTOM = 118;

const ONSET_COLOR = '#2dd4bf';
const TAIL_COLOR = '#f87171';

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

  const lerp = (a: number, c: number, f: number) => a + (c - a) * f;

  // Psilocybin ('apex'): peak is reached early in the Wirkdauer phase, then
  // one continuous decay for the rest of the trip. LSD ('plateau'): the
  // high point is sustained much longer before the same decay kicks in.
  const isPlateau = substance.peakShape === 'plateau';
  const peakTime = lerp(comeupEnd, peakEnd, isPlateau ? 0.7 : 0.2);

  // Steep rise from ingestion up to the peak.
  const risePoints: { t: number; intensity: number }[] = [
    { t: start, intensity: 0 },
    { t: lerp(start, onsetEnd, 0.6), intensity: 0.5 },
    { t: onsetEnd, intensity: 0.78 },
    { t: lerp(onsetEnd, comeupEnd, 0.5), intensity: 0.92 },
    { t: comeupEnd, intensity: isPlateau ? 0.99 : 0.98 },
    { t: peakTime, intensity: 1 },
  ].filter((p, i, arr) => i === 0 || p.t > arr[i - 1].t);

  // Smooth exponential-style decay from the peak all the way to the end of
  // the tail: falls at first, then flattens out noticeably (never fully
  // resetting the shape of "langsam abfallen, in der Nachwirkung stark
  // abflachen").
  const DECAY_STEPS = 10;
  const DECAY_END_INTENSITY = 0.04;
  const decayRate = Math.log(1 / DECAY_END_INTENSITY);
  const decayPoints: { t: number; intensity: number }[] = Array.from({ length: DECAY_STEPS + 1 }, (_, i) => {
    const f = i / DECAY_STEPS;
    return { t: lerp(peakTime, end, f), intensity: Math.exp(-decayRate * f) };
  });

  const keyPoints = [...risePoints, ...decayPoints.slice(1)];

  const path = smoothPath(keyPoints.map((p) => [x(p.t), y(p.intensity)]));
  const areaPath = `${path} L ${WIDTH},${PLOT_BOTTOM} L 0,${PLOT_BOTTOM} Z`;

  const nowMs = now.getTime();
  const showNow = nowMs >= start && nowMs <= end;
  const nowX = showNow ? x(nowMs) : 0;
  const nowIntensity = showNow ? interpolateIntensity(keyPoints, nowMs) : 0;
  const nowY = showNow ? y(nowIntensity) : 0;

  const bands = [
    { color: ONSET_COLOR, from: start, to: comeupEnd, label: 'Wirkungseintritt' },
    { color: substance.color, from: comeupEnd, to: peakEnd, label: 'Wirkdauer' },
    { color: TAIL_COLOR, from: peakEnd, to: end, label: 'Nachwirkung' },
  ].filter((band) => band.to > band.from);

  const totalHours = Math.floor(total / 3_600_000);
  const hourTicks = Array.from({ length: totalHours }, (_, i) => start + (i + 1) * 3_600_000).filter(
    (t) => t < end - 5 * 60_000,
  );

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Trip-Verlaufskurve">
        <defs>
          <linearGradient id={`fill-${trip.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={substance.color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={substance.color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {bands.map((band, i) => (
          <rect
            key={i}
            x={x(band.from)}
            y={PAD_TOP}
            width={Math.max(0, x(band.to) - x(band.from))}
            height={PLOT_BOTTOM - PAD_TOP}
            fill={band.color}
            fillOpacity={0.16}
          />
        ))}

        {hourTicks.map((t, i) => (
          <g key={i}>
            <line x1={x(t)} x2={x(t)} y1={PAD_TOP} y2={PLOT_BOTTOM} stroke="currentColor" strokeOpacity={0.08} />
            <text x={x(t)} y={PLOT_BOTTOM + 13} textAnchor="middle" fontSize={8} fill="currentColor" opacity={0.4}>
              {i + 1}h
            </text>
          </g>
        ))}

        <path d={areaPath} fill={`url(#fill-${trip.id})`} stroke="none" />
        <path d={path} fill="none" stroke={substance.color} strokeWidth={3} strokeLinecap="round" />

        {showNow && (
          <g>
            <line x1={nowX} x2={nowX} y1={PAD_TOP} y2={PLOT_BOTTOM} stroke={substance.color} strokeOpacity={0.5} />
            <circle cx={nowX} cy={nowY} r={5} fill={substance.color} stroke="white" strokeWidth={1.5} />
          </g>
        )}

        <text x={x(start)} y={PLOT_BOTTOM + 30} fontSize={10} fill="currentColor" opacity={0.5} textAnchor="start">
          {formatTime(b.start)}
        </text>
        <text x={x(end)} y={PLOT_BOTTOM + 30} fontSize={10} fill="currentColor" opacity={0.5} textAnchor="end">
          {formatTime(b.tailEnd)}
        </text>
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-1">
        {bands.map((band, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: band.color }} />
            {band.label}
          </div>
        ))}
      </div>
    </div>
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
