import { useEffect, useState } from 'react';
import type { Substance, Trip } from '../types';
import { computeTripBoundaries } from '../lib/timeline';

interface Props {
  trip: Trip;
  substance: Substance;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Live countdown ring for the "felt" effect window (onset + Wirkdauer + Come-down). */
export function EffectTimer({ trip, substance }: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const b = computeTripBoundaries(trip, substance);
  const start = b.start.getTime();
  const feltEnd = b.comedownEnd.getTime();
  const nowMs = now.getTime();

  if (nowMs < start || nowMs >= feltEnd) return null;

  const total = Math.max(1, feltEnd - start);
  const elapsed = Math.min(Math.max(nowMs - start, 0), total);
  const remaining = Math.max(0, feltEnd - nowMs);
  const fraction = elapsed / total;

  const hh = Math.floor(remaining / 3_600_000);
  const mm = Math.floor((remaining % 3_600_000) / 60_000);
  const ss = Math.floor((remaining % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-4">
      <svg width={92} height={92} viewBox="0 0 92 92" className="-rotate-90 shrink-0">
        <circle cx={46} cy={46} r={RADIUS} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={7} />
        <circle
          cx={46}
          cy={46}
          r={RADIUS}
          fill="none"
          stroke={substance.color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * fraction}
        />
      </svg>
      <div>
        <div className="text-2xl font-semibold tabular-nums">
          {hh}:{pad(mm)}:{pad(ss)}
        </div>
        <div className="text-xs text-black/50 dark:text-white/50">verbleibende spürbare Wirkzeit</div>
      </div>
    </div>
  );
}
