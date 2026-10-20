import React, { useMemo } from 'react';
import { DifficultyLevel } from '../../types';
import { cn, DIFFICULTY_LABELS, DIFFICULTY_LEVEL, getPhonemePattern, segmentText } from '../../lib/ui';

/* --------------------------------------------------------------------------
   DifficultyMeter — tre barrette crescenti, come un indicatore di segnale
   -------------------------------------------------------------------------- */
export const DifficultyMeter: React.FC<{
  level: DifficultyLevel;
  showLabel?: boolean;
}> = ({ level, showLabel = true }) => {
  const filled = DIFFICULTY_LEVEL[level];
  const heights = ['h-1.5', 'h-2.5', 'h-3.5'];
  return (
    <span className="inline-flex items-center gap-2" title={`Difficoltà: ${DIFFICULTY_LABELS[level]}`}>
      <span className="flex h-3.5 items-end gap-[3px]" aria-hidden>
        {heights.map((h, i) => (
          <span
            key={h}
            className={cn(
              'w-[4px] rounded-[1px]',
              h,
              i < filled ? (level === 'estremo' ? 'bg-tally' : 'bg-signal') : 'bg-ink-700'
            )}
          />
        ))}
      </span>
      {showLabel && (
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-300">
          {DIFFICULTY_LABELS[level]}
        </span>
      )}
    </span>
  );
};

/* --------------------------------------------------------------------------
   TallyLight — la spia "ON AIR" della sala di registrazione
   -------------------------------------------------------------------------- */
export const TallyLight: React.FC<{ live: boolean; label?: string; className?: string }> = ({
  live,
  label = 'ON AIR',
  className,
}) => (
  <div
    className={cn(
      'inline-flex select-none items-center gap-2 rounded-md border px-2.5 py-[5px] font-mono text-[11px] font-bold tracking-[0.22em] transition-all duration-300',
      live
        ? 'border-tally/70 bg-tally/15 text-tally shadow-[0_0_28px_-4px_rgba(255,82,71,0.75)]'
        : 'border-ink-700 bg-ink-850 text-ink-300',
      className
    )}
    role="status"
    aria-live="polite"
  >
    <span className={cn('h-1.5 w-1.5 rounded-full', live ? 'animate-pulse bg-tally' : 'bg-ink-500')} />
    {label}
  </div>
);

/* --------------------------------------------------------------------------
   Switch — interruttore a levetta
   -------------------------------------------------------------------------- */
export const Switch: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60',
      checked ? 'border-signal/50 bg-signal/20' : 'border-ink-700 bg-ink-950'
    )}
  >
    <span
      className={cn(
        'inline-block h-4 w-4 rounded-full transition-all duration-200',
        checked ? 'translate-x-[22px] bg-signal shadow-[0_0_10px_rgba(0,242,254,0.7)]' : 'translate-x-[3px] bg-ink-400'
      )}
    />
  </button>
);

/* --------------------------------------------------------------------------
   ScriptText — il testo del copione con i fonemi target evidenziati
   -------------------------------------------------------------------------- */
export const ScriptText: React.FC<{
  text: string;
  targetPhoneme: string;
  highlight: boolean;
  className?: string;
  as?: 'p' | 'span';
}> = ({ text, targetPhoneme, highlight, className, as = 'p' }) => {
  const segments = useMemo(
    () => segmentText(text, highlight ? getPhonemePattern(targetPhoneme) : null),
    [text, targetPhoneme, highlight]
  );
  const Tag = as;
  return (
    <Tag className={className}>
      {segments.map((s, i) =>
        s.hit ? (
          <mark key={i} className="phoneme-hit">
            {s.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{s.text}</React.Fragment>
        )
      )}
    </Tag>
  );
};

/* --------------------------------------------------------------------------
   LogoMark — mini orologio da studio (12 LED + spia centrale)
   -------------------------------------------------------------------------- */
export const LogoMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="#1B2436" stroke="#384766" />
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      return (
        <circle
          key={i}
          cx={16 + Math.cos(a) * 10}
          cy={16 + Math.sin(a) * 10}
          r={1.35}
          fill={i < 9 ? '#00F2FE' : '#516388'}
        />
      );
    })}
    <circle cx="16" cy="16" r="3.2" fill="#FF5247" />
  </svg>
);
