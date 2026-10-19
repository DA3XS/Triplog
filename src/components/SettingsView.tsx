import { useRef, useState } from 'react';
import { useSortedSubstances } from '../hooks/useData';
import { exportAndDownload, importBackup } from '../lib/backup';
import { importOpenmindExport } from '../lib/importLegacy';
import { getThemeSetting, setThemeSetting, type ThemeSetting } from '../lib/theme';
import {
  getNotificationPermission,
  isNotificationSupported,
  isRemindersEnabled,
  requestNotificationPermission,
  setRemindersEnabled,
} from '../lib/notifications';
import type { Substance } from '../types';

const THEME_OPTIONS: { value: ThemeSetting; label: string }[] = [
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
  { value: 'system', label: 'System' },
];

export function SettingsView() {
  const substances = useSortedSubstances();
  const [message, setMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeSetting>(() => getThemeSetting());
  const [remindersOn, setRemindersOn] = useState(() => isRemindersEnabled() && getNotificationPermission() === 'granted');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => getNotificationPermission());
  const backupInputRef = useRef<HTMLInputElement>(null);
  const legacyInputRef = useRef<HTMLInputElement>(null);

  function handleThemeChange(next: ThemeSetting) {
    setTheme(next);
    setThemeSetting(next);
  }

  async function handleRemindersToggle() {
    if (remindersOn) {
      setRemindersEnabled(false);
      setRemindersOn(false);
      return;
    }
    const permission = await requestNotificationPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      setRemindersEnabled(true);
      setRemindersOn(true);
    }
  }

  async function handleBackupFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importBackup(text);
      setMessage(`Backup importiert: ${result.trips} Trips, ${result.substances} Substanzen.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import fehlgeschlagen.');
    }
  }

  async function handleLegacyFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importOpenmindExport(text);
      setMessage(
        `Openmind-Import: ${result.importedTrips} Trips übernommen` +
          (result.skippedUnsupportedSubstances.length
            ? `. Nicht unterstützte Substanzen übersprungen: ${result.skippedUnsupportedSubstances.join(', ')}`
            : '') +
          (result.skipped ? ` (${result.skipped} Einträge insgesamt übersprungen)` : '') +
          '.',
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import fehlgeschlagen.');
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="font-semibold mb-1">Darstellung</h2>
        <p className="text-xs text-black/50 dark:text-white/50 mb-3">Hell/Dunkel-Modus, unabhängig vom Betriebssystem wählbar.</p>
        <div className="inline-flex rounded-full border border-black/15 dark:border-white/15 p-1 gap-1">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleThemeChange(opt.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                theme === opt.value
                  ? 'bg-violet-600 text-white'
                  : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {isNotificationSupported() && (
        <section>
          <h2 className="font-semibold mb-1">Erinnerungen</h2>
          <p className="text-xs text-black/50 dark:text-white/50 mb-3">
            Benachrichtigung, sobald ein Trip abklingt – Zeit zum Bewerten oder für einen Tagebuch-Eintrag.
            Funktioniert nur, solange Triplog in diesem Browser offen ist (auch im Hintergrund-Tab), nicht nach
            komplettem Schliessen der App.
          </p>
          <button
            onClick={handleRemindersToggle}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              remindersOn
                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                : 'border border-black/15 dark:border-white/15'
            }`}
          >
            {remindersOn ? 'Erinnerungen aktiv – ausschalten' : 'Erinnerungen aktivieren'}
          </button>
          {notifPermission === 'denied' && !remindersOn && (
            <p className="text-xs text-red-600 mt-2">
              Benachrichtigungen sind für diese Seite blockiert. Erlaube sie in den Browser-Einstellungen, um
              Erinnerungen zu aktivieren.
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-1">Substanzen</h2>
        <p className="text-xs text-black/50 dark:text-white/50 mb-3">
          Fix hinterlegte Richtwerte für mentale Nachwirkung (Afterglow) und Toleranz-Erholung. Keine medizinische
          Beratung, nicht editierbar.
        </p>
        <div className="flex flex-col gap-3">
          {substances.map((s) => (
            <SubstanceRow key={s.id} substance={s} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-1">Backup</h2>
        <p className="text-xs text-black/50 dark:text-white/50 mb-3">
          Alle Daten liegen nur lokal in diesem Browser. Exportiere regelmässig ein Backup, um sie zu sichern oder auf
          ein anderes Gerät zu übertragen.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => exportAndDownload()}
            className="rounded-full bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-sm font-medium"
          >
            Backup exportieren
          </button>
          <button
            onClick={() => backupInputRef.current?.click()}
            className="rounded-full border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium"
          >
            Backup importieren
          </button>
          <input ref={backupInputRef} type="file" accept="application/json" className="hidden" onChange={handleBackupFile} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-1">Openmind-Export importieren</h2>
        <p className="text-xs text-black/50 dark:text-white/50 mb-3">
          Alte Trips aus der Openmind-App als JSON-Datei importieren. Mehrfacher Import derselben Datei überschreibt
          keine Duplikate.
        </p>
        <button
          onClick={() => legacyInputRef.current?.click()}
          className="rounded-full border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium"
        >
          Openmind-JSON auswählen
        </button>
        <input ref={legacyInputRef} type="file" accept="application/json" className="hidden" onChange={handleLegacyFile} />
      </section>

      {message && (
        <div className="text-sm rounded-lg bg-black/5 dark:bg-white/10 px-3 py-2">{message}</div>
      )}
    </div>
  );
}

function SubstanceRow({ substance }: { substance: Substance }) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 min-w-32">
        <span>{substance.emoji}</span>
        <span className="font-medium">{substance.name}</span>
      </div>
      <div className="text-sm text-black/60 dark:text-white/60">
        Afterglow: <span className="font-medium">{substance.mentalAfterglowDays} Tage</span>
      </div>
      <div className="text-sm text-black/60 dark:text-white/60">
        Toleranz-Reset: <span className="font-medium">{substance.toleranceResetDays} Tage</span>
      </div>
    </div>
  );
}
