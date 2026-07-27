import type { Substance, Trip } from '../types';
import { computeTripBoundaries } from './timeline';

export type DayStatus = 'none' | 'tolerance' | 'afterglow' | 'trip';

const STATUS_SEVERITY: Record<DayStatus, number> = { none: 0, tolerance: 1, afterglow: 2, trip: 3 };

export interface DayInfo {
  status: DayStatus;
  /** 0..1, fades out as the afterglow/tolerance window elapses. */
  intensity: number;
  trips: Trip[];
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getDayInfo(day: Date, trips: Trip[], substancesById: Map<string, Substance>): DayInfo {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + 86_400_000;

  let status: DayStatus = 'none';
  let intensity = 0;
  const contributing: Trip[] = [];

  for (const trip of trips) {
    const substance = substancesById.get(trip.substanceId);
    if (!substance) continue;
    const b = computeTripBoundaries(trip, substance);

    let localStatus: DayStatus;
    let localIntensity: number;

    if (b.start.getTime() < dayEnd && b.tailEnd.getTime() > dayStart) {
      localStatus = 'trip';
      localIntensity = 1;
    } else if (b.tailEnd.getTime() <= dayStart && b.afterglowEnd.getTime() > dayStart) {
      localStatus = 'afterglow';
      const span = b.afterglowEnd.getTime() - b.tailEnd.getTime();
      const elapsed = dayStart - b.tailEnd.getTime();
      localIntensity = span > 0 ? 1 - elapsed / span : 1;
    } else if (b.afterglowEnd.getTime() <= dayStart && b.toleranceResetEnd.getTime() > dayStart) {
      localStatus = 'tolerance';
      const span = b.toleranceResetEnd.getTime() - b.afterglowEnd.getTime();
      const elapsed = dayStart - b.afterglowEnd.getTime();
      localIntensity = span > 0 ? 1 - elapsed / span : 1;
    } else {
      continue;
    }

    contributing.push(trip);
    if (
      STATUS_SEVERITY[localStatus] > STATUS_SEVERITY[status] ||
      (localStatus === status && localIntensity > intensity)
    ) {
      status = localStatus;
      intensity = localIntensity;
    }
  }

  return { status, intensity: Math.min(1, Math.max(0, intensity)), trips: contributing };
}

/** Monday-first month grid, padded with leading/trailing days so every row has 7 entries. */
export function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(year, month, 1 - firstWeekday);

  const last = new Date(year, month + 1, 0);
  const lastWeekday = (last.getDay() + 6) % 7;
  const totalDays = firstWeekday + last.getDate() + (6 - lastWeekday);

  return Array.from({ length: totalDays }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
