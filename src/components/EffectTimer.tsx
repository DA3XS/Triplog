import { useEffect, useState } from 'react';
import type { Substance, Trip } from '../types';
import { computeTripBoundaries } from '../lib/timeline';
import { formatTime } from '../lib/format';

interface Props {
  trip: Trip;
  substance: Substance;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function hms(ms: number): string {
  const hh = Math.floor(ms / 3_600_000);
  const mm = Math.floor((ms % 3_600_000) / 60_000);
  const ss = Math.floor((ms % 60_000) / 1000);
  return `${hh}:${pad(mm)}:${pad(ss)}`;
}

/** Live countdown ring for the "felt" effect window (onset + Wirkdauer + Come-down), plus start time and a running elapsed clock. */
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
  const elapsed = nowMs - start;
  const remaining = Math.max(0, feltEnd - nowMs);
  const fraction = elapsed / total;

  return (
    <div className="flex flex-col gap-3">
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
          <div className="text-2xl font-semibold tabular-nums">{hms(remaining)}</div>
          <div className="text-xs text-black/50 dark:text-white/50">verbleibende spürbare Wirkzeit</div>
        </div>
      </div>

      <div className="flex gap-5 text-xs text-black/50 dark:text-white/50">
        <div>
          Start <span className="font-medium tabular-nums text-black/70 dark:text-white/70">{formatTime(b.start)}</span>
        </div>
        <div>
          Verstrichen{' '}
          <span className="font-medium tabular-nums text-black/70 dark:text-white/70">{hms(elapsed)}</span>
        </div>
      </div>
    </div>
  );
}
