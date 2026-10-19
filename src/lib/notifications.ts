import type { Substance, Trip } from '../types';
import { computeTripBoundaries } from './timeline';

const ENABLED_KEY = 'triplog-reminders-enabled';
const NOTIFIED_PREFIX = 'triplog-notified:';

/** Trips whose comedown ended more than this long ago no longer trigger a notification (avoids a flood of stale reminders the first time this is turned on). */
const RECENT_WINDOW_MS = 6 * 60 * 60 * 1000;

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  return isNotificationSupported() ? Notification.permission : 'denied';
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  return Notification.requestPermission();
}

export function isRemindersEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === '1';
}

export function setRemindersEnabled(enabled: boolean) {
  localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
}

function wasNotified(tripId: string): boolean {
  return localStorage.getItem(NOTIFIED_PREFIX + tripId) === '1';
}

function markNotified(tripId: string) {
  localStorage.setItem(NOTIFIED_PREFIX + tripId, '1');
}

/**
 * Fires a one-time "Zeit zum Bewerten" notification for each trip whose felt
 * effects have just ended. Best-effort only: this works while the browser
 * tab is open (foreground or background), but there is no push server, so a
 * fully closed app/browser will not receive it.
 */
export function checkTripEndReminders(trips: Trip[], substancesById: Map<string, Substance>, now: Date) {
  if (!isRemindersEnabled() || getNotificationPermission() !== 'granted') return;

  for (const trip of trips) {
    if (trip.rating || wasNotified(trip.id)) continue;
    const substance = substancesById.get(trip.substanceId);
    if (!substance) continue;

    const b = computeTripBoundaries(trip, substance);
    if (now.getTime() < b.comedownEnd.getTime()) continue;

    markNotified(trip.id);
    const age = now.getTime() - b.comedownEnd.getTime();
    if (age > RECENT_WINDOW_MS) continue;

    new Notification('Triplog', {
      body: `Dein ${substance.name}-Trip klingt ab. Jetzt bewerten oder einen Tagebuch-Eintrag ergänzen?`,
      icon: './icon-192.png',
      tag: `trip-end-${trip.id}`,
    });
  }
}
