import { DOSE_LEVEL_COLOR, DOSE_LEVEL_LABEL, DOSE_LEVEL_ORDER } from '../lib/timeline';
import type { DoseLevel } from '../types';

interface Props {
  level: DoseLevel;
}

export function DoseScaleBar({ level }: Props) {
  const activeIndex = DOSE_LEVEL_ORDER.indexOf(level);

  return (
    <div>
      <div className="flex w-full">
        {DOSE_LEVEL_ORDER.map((lvl, i) => (
          <div key={lvl} className="flex-1 flex justify-center">
            {i === activeIndex && <span className="text-violet-600 dark:text-violet-400 text-xs leading-none">▼</span>}
          </div>
        ))}
      </div>
      <div className="flex w-full overflow-hidden rounded-lg h-9">
        {DOSE_LEVEL_ORDER.map((lvl, i) => {
          const active = i === activeIndex;
          return (
            <div
              key={lvl}
              className="relative flex-1 flex items-center justify-center font-bold text-white text-sm"
              style={{
                backgroundColor: DOSE_LEVEL_COLOR[lvl],
                outline: active ? '2px solid white' : 'none',
                outlineOffset: '-3px',
                zIndex: active ? 1 : 0,
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
      <div className="text-xs text-center mt-1 text-black/60 dark:text-white/60">
        {DOSE_LEVEL_LABEL[level]} ({activeIndex + 1}/5)
      </div>
    </div>
  );
}
