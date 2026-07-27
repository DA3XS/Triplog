import type { Unit } from '../types';

const dateFmt = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const timeFmt = new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' });
const dayMonthFmt = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' });
const weekdayFmt = new Intl.DateTimeFormat('de-CH', { weekday: 'short' });
const monthYearFmt = new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' });

export const formatDate = (d: Date) => dateFmt.format(d);
export const formatDateTime = (d: Date) => dateTimeFmt.format(d);
export const formatTime = (d: Date) => timeFmt.format(d);
export const formatDayMonth = (d: Date) => dayMonthFmt.format(d);
export const formatWeekday = (d: Date) => weekdayFmt.format(d);
export const formatMonthYear = (d: Date) => monthYearFmt.format(d);

export function formatAmount(value: number, unit: Unit): string {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded} ${unit}`;
}

export function formatDaysCount(days: number): string {
  if (days === 0) return 'heute';
  if (days === 1) return '1 Tag';
  return `${days} Tage`;
}

/** Rounds up so "0.4 Tage übrig" still reads as "1 Tag". */
export function daysRemaining(from: Date, to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
}

export function formatRelativeDays(now: Date, target: Date): string {
  const diffDays = Math.round((target.getTime() - now.getTime()) / 86_400_000);
  if (diffDays === 0) return 'heute';
  if (diffDays === 1) return 'morgen';
  if (diffDays === -1) return 'gestern';
  if (diffDays > 1) return `in ${diffDays} Tagen`;
  return `vor ${Math.abs(diffDays)} Tagen`;
}

export function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m} Min`;
  if (m === 0) return `${h} Std`;
  return `${h} Std ${m} Min`;
}
