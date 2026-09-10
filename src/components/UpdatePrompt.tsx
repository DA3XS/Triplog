import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

/**
 * Registers the service worker and surfaces its lifecycle to the user
 * instead of silently swapping the app underneath them: a dismissable
 * banner when a new version is ready (so an in-progress form isn't lost to
 * an unexpected reload), and a brief one-time note once offline use works.
 */
export function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    updateSWRef.current = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });
  }, []);

  useEffect(() => {
    if (!offlineReady) return;
    const id = setTimeout(() => setOfflineReady(false), 5000);
    return () => clearTimeout(id);
  }, [offlineReady]);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 pointer-events-none">
      {needRefresh ? (
        <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 pl-4 pr-1.5 py-1.5 shadow-lg text-sm">
          <span>Neue Version verfügbar</span>
          <button
            onClick={() => updateSWRef.current?.(true)}
            className="rounded-full bg-violet-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-violet-700"
          >
            Aktualisieren
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            aria-label="Schliessen"
            className="text-white/60 dark:text-neutral-900/60 hover:text-white dark:hover:text-neutral-900 px-1.5"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="pointer-events-auto rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 shadow-lg text-sm">
          ✅ Triplog ist jetzt offline verfügbar
        </div>
      )}
    </div>
  );
}
