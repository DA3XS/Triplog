import { DOSE_LEVEL_LABEL, DOSE_LEVEL_ORDER } from '../lib/timeline';
import type { DoseLevel } from '../types';

interface Props {
  level: DoseLevel;
  /** 'full' shows numbered segments + a label underneath; 'compact' is a slim bar for tight spaces. */
  size?: 'full' | 'compact';
}

const SEGMENT_COLORS = ['#ddd6fe', '#c4b5fd', '#a78bfa', '#7c3aed', '#5b21b6'];

export function DoseScaleBar({ level, size = 'full' }: Props) {
  const activeIndex = DOSE_LEVEL_ORDER.indexOf(level);
  const compact = size === 'compact';

  return (
    <div>
      {!compact && (
        <div className="flex w-full">
          {SEGMENT_COLORS.map((_, i) => (
            <div key={i} className="flex-1 flex justify-center">
              {i === activeIndex && <span className="text-violet-600 dark:text-violet-400 text-xs leading-none">▼</span>}
            </div>
          ))}
        </div>
      )}
      <div className={`flex w-full overflow-hidden rounded-lg ${compact ? 'h-2' : 'h-9'}`}>
        {SEGMENT_COLORS.map((color, i) => {
          const active = i === activeIndex;
          return (
            <div
              key={i}
              className={`relative flex-1 flex items-center justify-center font-bold text-white ${compact ? '' : 'text-sm'}`}
              style={{
                backgroundColor: color,
                outline: active && !compact ? '2px solid white' : 'none',
                outlineOffset: '-3px',
                zIndex: active ? 1 : 0,
              }}
            >
              {!compact && i + 1}
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="text-xs text-center mt-1 text-black/60 dark:text-white/60">
          {DOSE_LEVEL_LABEL[level]} ({activeIndex + 1}/5)
        </div>
      )}
    </div>
  );
}
