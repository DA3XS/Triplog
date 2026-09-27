import { DOSE_LEVEL_LABEL, DOSE_LEVEL_ORDER } from '../lib/timeline';
import type { DoseLevel } from '../types';

interface Props {
  level: DoseLevel;
  /** 'full' shows numbered segments + a label underneath; 'compact' is a slim bar for tight spaces. */
  size?: 'full' | 'compact';
}

const SEGMENT_COLORS = ['#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#7c3aed'];

export function DoseScaleBar({ level, size = 'full' }: Props) {
  const activeIndex = DOSE_LEVEL_ORDER.indexOf(level);
  const compact = size === 'compact';

  return (
    <div>
      <div className={`flex w-full overflow-hidden rounded-lg ${compact ? 'h-2' : 'h-9'}`}>
        {SEGMENT_COLORS.map((color, i) => {
          const active = i === activeIndex;
          return (
            <div
              key={i}
              className={`flex-1 flex items-center justify-center font-bold text-white transition-opacity ${
                compact ? '' : 'text-sm'
              }`}
              style={{
                backgroundColor: color,
                opacity: active ? 1 : 0.3,
                outline: active && !compact ? '2px solid white' : 'none',
                outlineOffset: '-2px',
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
