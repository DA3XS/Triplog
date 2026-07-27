import { useRef, useState } from 'react';
import { useSortedSubstances } from '../hooks/useData';
import { db } from '../db';
import { exportAndDownload, importBackup } from '../lib/backup';
import { importOpenmindExport } from '../lib/importLegacy';
import type { Substance } from '../types';

export function SettingsView() {
  const substances = useSortedSubstances();
  const [message, setMessage] = useState<string | null>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const legacyInputRef = useRef<HTMLInputElement>(null);

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
        <h2 className="font-semibold mb-1">Substanzen</h2>
        <p className="text-xs text-black/50 dark:text-white/50 mb-3">
          Persönliche Richtwerte für mentale Nachwirkung (Afterglow) und Toleranz-Erholung. Keine medizinische
          Beratung – passe die Werte an deine eigene Erfahrung an.
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
  const [afterglow, setAfterglow] = useState(substance.mentalAfterglowDays);
  const [tolerance, setTolerance] = useState(substance.toleranceResetDays);

  async function commit(next: Partial<Pick<Substance, 'mentalAfterglowDays' | 'toleranceResetDays'>>) {
    await db.substances.update(substance.id, next);
  }

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 min-w-32">
        <span>{substance.emoji}</span>
        <span className="font-medium">{substance.name}</span>
      </div>
      <label className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
        Afterglow (Tage)
        <input
          type="number"
          min={0}
          value={afterglow}
          onChange={(e) => {
            const v = Number(e.target.value);
            setAfterglow(v);
            commit({ mentalAfterglowDays: v });
          }}
          className="w-16 rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
        Toleranz-Reset (Tage)
        <input
          type="number"
          min={0}
          value={tolerance}
          onChange={(e) => {
            const v = Number(e.target.value);
            setTolerance(v);
            commit({ toleranceResetDays: v });
          }}
          className="w-16 rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-2 py-1"
        />
      </label>
    </div>
  );
}
