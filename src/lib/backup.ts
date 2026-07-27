import { db } from '../db';
import type { BackupFile } from '../types';

export async function buildBackup(): Promise<BackupFile> {
  const [trips, substances] = await Promise.all([db.trips.toArray(), db.substances.toArray()]);
  return {
    format: 'triplog-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    trips,
    substances,
  };
}

export function downloadBackup(backup: BackupFile) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = backup.exportedAt.slice(0, 10);
  a.href = url;
  a.download = `triplog-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportAndDownload() {
  downloadBackup(await buildBackup());
}

export interface RestoreResult {
  trips: number;
  substances: number;
}

export async function importBackup(jsonText: string): Promise<RestoreResult> {
  let parsed: BackupFile;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Die Datei enthält kein gültiges JSON.');
  }
  if (parsed?.format !== 'triplog-backup' || !Array.isArray(parsed.trips) || !Array.isArray(parsed.substances)) {
    throw new Error('Das ist keine gültige Triplog-Backup-Datei.');
  }
  if (parsed.substances.length > 0) await db.substances.bulkPut(parsed.substances);
  if (parsed.trips.length > 0) await db.trips.bulkPut(parsed.trips);
  return { trips: parsed.trips.length, substances: parsed.substances.length };
}
