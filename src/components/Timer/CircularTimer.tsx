import React, { useMemo } from 'react';
import { Pause, Play, Plus, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { useTimerStore } from '../../store/useTimerStore';
import { useSessionStore } from '../../store/useSessionStore';
import { cn, formatTime, pad2 } from '../../lib/ui';

interface CircularTimerProps {
  onOpenVoiceVerification: () => void;
}

/* Geometria dell'orologio */
const SIZE = 340;
const C = SIZE / 2;
const DOTS = 60; // un LED per ogni "secondo" del quadrante, come negli orologi da regia
const R_DOTS = 150;

const STATUS_COPY = {
  idle: { label: 'Pronto', dot: 'bg-ink-500' },
  running: { label: 'In onda', dot: 'bg-tally animate-pulse' },
  paused: { label: 'In pausa', dot: 'bg-cue' },
  completed: { label: 'Take ok', dot: 'bg-go' },
} as const;

/**
 * Orologio da studio broadcast: 60 LED che si spengono man mano che il tempo
 * dell'esercizio si esaurisce. Negli ultimi 3 secondi i LED diventano rossi,
 * in sincrono con i beep a 1000 Hz del countdown.
 */
export const CircularTimer: React.FC<CircularTimerProps> = ({ onOpenVoiceVerification }) => {
  const { status, timeLeft, duration, start, pause, resume, reset, addSeconds, nextExercise, prevExercise } =
    useTimerStore();
  const { activeQueue, currentQueueIndex } = useSessionStore();

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';
  const isFinal = isRunning && timeLeft <= 3 && timeLeft > 0;

  const progress = duration > 0 ? Math.max(0, Math.min(1, timeLeft / duration)) : 0;
  const lit = Math.ceil(progress * DOTS);

  // Posizioni dei LED e delle tacche, calcolate una sola volta
  const dots = useMemo(
    () =>
      Array.from({ length: DOTS }, (_, i) => {
        const a = (i / DOTS) * Math.PI * 2 - Math.PI / 2;
        return { x: C + Math.cos(a) * R_DOTS, y: C + Math.sin(a) * R_DOTS, major: i % 5 === 0 };
      }),
    []
  );
  const ticks = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const r1 = 124;
        const r2 = i % 3 === 0 ? 134 : 130;
        return {
          x1: C + Math.cos(a) * r1,
          y1: C + Math.sin(a) * r1,
          x2: C + Math.cos(a) * r2,
          y2: C + Math.sin(a) * r2,
          major: i % 3 === 0,
        };
      }),
    []
  );

  const ledColor = isFinal ? '#FF453A' : '#00F2FE';
  const copy = STATUS_COPY[status];

  const handleTogglePlay = () => {
    if (isRunning) pause();
    else if (isPaused) resume();
    else start();
  };

  return (
    <div className="flex w-full flex-col items-center">
      {/* Quadrante */}
      <div className="relative aspect-square w-full max-w-[340px]">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <radialGradient id="vt-face" cx="50%" cy="35%" r="68%">
              <stop offset="0%" stopColor="#26344F" />
              <stop offset="65%" stopColor="#192234" />
              <stop offset="100%" stopColor="#131A29" />
            </radialGradient>
            <filter id="vt-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ghiera e quadrante blu-ardesia satinato */}
          <circle cx={C} cy={C} r={168} fill="#141C2B" stroke="#2B3852" strokeWidth="1.2" />
          <circle cx={C} cy={C} r={164} fill="url(#vt-face)" stroke="#384766" strokeWidth="1" />
          <circle cx={C} cy={C} r={116} fill="none" stroke="#2B3852" strokeWidth="1" />

          {/* Tacche interne (ore) */}
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.major ? '#7C8FB5' : '#516388'}
              strokeWidth={t.major ? 2 : 1.25}
              strokeLinecap="round"
            />
          ))}

          {/* LED spenti */}
          <g>
            {dots.map((d, i) =>
              i >= lit ? <circle key={i} cx={d.x} cy={d.y} r={d.major ? 3.4 : 2.6} fill="#384766" /> : null
            )}
          </g>

          {/* LED accesi (con alone) */}
          <g filter="url(#vt-glow)" className={cn(isPaused && 'animate-blink')}>
            {dots.map((d, i) =>
              i < lit ? (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={d.major ? 3.6 : 2.8}
                  fill={ledColor}
                  className={cn(isRunning && i === lit - 1 && 'led-head')}
                  style={{ transition: 'fill 200ms' }}
                />
              ) : null
            )}
          </g>
        </svg>

        {/* Lettura digitale centrale */}
        <div className="absolute inset-0 flex select-none flex-col items-center justify-center">
          <span className="silk">
            Take <span className="text-ink-300">{pad2(activeQueue.length ? currentQueueIndex + 1 : 0)}</span>
            <span className="text-ink-700"> / </span>
            {pad2(activeQueue.length)}
          </span>

          <span
            className={cn(
              'mt-3 font-mono text-[60px] font-medium leading-none tracking-[-0.04em] tabular-nums transition-colors sm:text-[72px]',
              isFinal ? 'text-tally' : isCompleted ? 'text-go' : 'text-ink-100'
            )}
            aria-live="off"
          >
            {formatTime(timeLeft)}
          </span>

          <span className="silk mt-4 inline-flex items-center gap-2 text-ink-400">
            <span className={cn('h-1.5 w-1.5 rounded-full', copy.dot)} />
            {copy.label}
          </span>
        </div>
      </div>

      {/* Transport: tasti da piastra a nastro */}
      <div className="mt-7 flex items-end justify-center gap-3 sm:gap-4">
        <TransportKey label="Prec" onClick={prevExercise} disabled={currentQueueIndex === 0} title="Esercizio precedente (←)">
          <SkipBack className="h-[18px] w-[18px]" />
        </TransportKey>
        <TransportKey label="Reset" onClick={reset} title="Ricomincia l'esercizio">
          <RotateCcw className="h-[18px] w-[18px]" />
        </TransportKey>
        <TransportKey
          label={isRunning ? 'Pausa' : 'Play'}
          onClick={handleTogglePlay}
          variant={isRunning ? 'hold' : 'primary'}
          title={isRunning ? 'Pausa (Spazio)' : 'Avvia (Spazio)'}
        >
          {isRunning ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}
        </TransportKey>
        <TransportKey label="+15s" onClick={() => addSeconds(15)} title="Aggiungi 15 secondi">
          <Plus className="h-[18px] w-[18px]" />
        </TransportKey>
        <TransportKey
          label="Succ"
          onClick={nextExercise}
          disabled={currentQueueIndex >= activeQueue.length - 1}
          title="Esercizio successivo (→)"
        >
          <SkipForward className="h-[18px] w-[18px]" />
        </TransportKey>
      </div>

      {/* REC: verifica dizione */}
      <button onClick={onOpenVoiceVerification} className="btn btn-rec group mt-7 w-full max-w-[340px] justify-between py-3">
        <span className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 items-center justify-center">
            <span className="absolute h-3 w-3 rounded-full bg-tally/60 opacity-0 group-hover:animate-ring-pulse group-hover:opacity-100" />
            <span className="h-2.5 w-2.5 rounded-full bg-tally shadow-[0_0_10px_rgba(255,69,58,0.8)]" />
          </span>
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-tally">REC</span>
          <span className="text-[13px] text-ink-200">Registra e verifica la dizione</span>
        </span>
        <span className="chip border-ink-700 text-ink-400">AI</span>
      </button>
    </div>
  );
};

/* Tasto singolo del transport con etichetta serigrafata sotto */
const TransportKey: React.FC<{
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  variant?: 'default' | 'primary' | 'hold';
  children: React.ReactNode;
}> = ({ label, onClick, disabled, title, variant = 'default', children }) => (
  <div className="flex flex-col items-center gap-2">
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn('key', variant === 'primary' && 'key-primary', variant === 'hold' && 'key-hold')}
    >
      {children}
    </button>
    <span className="silk text-[9px]">{label}</span>
  </div>
);
