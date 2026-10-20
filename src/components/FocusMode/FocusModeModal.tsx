import React, { useEffect, useState } from 'react';
import {
  Highlighter,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useTimerStore } from '../../store/useTimerStore';
import { useSessionStore } from '../../store/useSessionStore';
import { cn, formatTime, pad2 } from '../../lib/ui';
import { ScriptText, TallyLight } from '../ui/primitives';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FONT_SCALE = [
  'text-2xl sm:text-3xl leading-[1.55]',
  'text-3xl sm:text-4xl leading-[1.5]',
  'text-3xl sm:text-5xl leading-[1.45]',
  'text-4xl sm:text-6xl leading-[1.4]',
  'text-5xl sm:text-7xl leading-[1.35]',
];

export const FocusModeModal: React.FC<FocusModeModalProps> = ({ isOpen, onClose }) => {
  const {
    status,
    timeLeft,
    duration,
    currentExercise,
    start,
    pause,
    resume,
    reset,
    nextExercise,
    prevExercise,
  } = useTimerStore();

  const { activeQueue, currentQueueIndex } = useSessionStore();

  const [fontSizeIndex, setFontSizeIndex] = useState(2);
  const [highlight, setHighlight] = useState(true);

  const isRunning = status === 'running';
  const isFinal = isRunning && timeLeft <= 3 && timeLeft > 0;
  const progress = duration > 0 ? Math.max(0, Math.min(100, (timeLeft / duration) * 100)) : 0;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (isRunning) pause();
          else if (status === 'paused') resume();
          else start();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextExercise();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevExercise();
          break;
        case 'KeyR':
          e.preventDefault();
          reset();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRunning, status, pause, resume, start, nextExercise, prevExercise, reset, onClose]);

  if (!isOpen || !currentExercise) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex select-none flex-col justify-between overflow-y-auto bg-ink-950 text-ink-100"
      style={{
        backgroundImage:
          'radial-gradient(900px 480px at 50% 0%, rgba(0, 242, 254, 0.14), transparent 65%), radial-gradient(700px 420px at 85% 90%, rgba(255, 184, 48, 0.10), transparent 65%)',
      }}
    >
      {/* Barra progresso luminosa in cima allo schermo */}
      <div className="h-1 w-full bg-ink-900">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-linear',
            isFinal
              ? 'bg-tally shadow-[0_0_16px_rgba(255,82,71,0.9)]'
              : 'bg-signal shadow-[0_0_16px_rgba(0,242,254,0.8)]'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Intestazione leggio */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-b border-ink-800/80 px-6 py-4">
        <div className="flex items-center gap-4">
          <TallyLight live={isRunning} label={isRunning ? 'ON AIR' : 'LEGGIO'} />
          <span className="silk">
            Take {pad2(currentQueueIndex + 1)} / {pad2(activeQueue.length)}
          </span>
          <span className="hidden h-3 w-px bg-ink-700 sm:inline-block" />
          <span className="hidden font-mono text-xs text-signal sm:inline">
            {currentExercise.targetPhoneme}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setHighlight(!highlight)}
            className={cn('btn px-2.5 py-1.5 text-xs', highlight ? 'btn-signal' : 'btn-ghost')}
            title="Evidenzia fonemi sul leggio"
          >
            <Highlighter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Fonemi</span>
          </button>

          <button
            onClick={() => setFontSizeIndex((i) => Math.max(0, i - 1))}
            className="icon-btn"
            title="Riduci carattere (A-)"
            aria-label="Riduci carattere"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            onClick={() => setFontSizeIndex((i) => Math.min(FONT_SCALE.length - 1, i + 1))}
            className="icon-btn"
            title="Ingrandisci carattere (A+)"
            aria-label="Ingrandisci carattere"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button onClick={onClose} className="btn btn-ghost ml-2 px-3 py-1.5 text-xs">
            <Minimize2 className="h-3.5 w-3.5" />
            Esci (ESC)
          </button>
        </div>
      </header>

      {/* Pagina centrale del leggio */}
      <main className="mx-auto my-auto flex w-full max-w-5xl flex-col items-center px-6 py-10 text-center">
        <span className="silk text-ink-300">{currentExercise.title}</span>

        <div className="panel mt-6 w-full p-8 sm:p-14">
          <ScriptText
            text={`“${currentExercise.text}”`}
            targetPhoneme={currentExercise.targetPhoneme}
            highlight={highlight}
            className={cn(
              'font-display font-light text-ink-100 transition-all duration-200',
              FONT_SCALE[fontSizeIndex]
            )}
          />
        </div>

        <p className="mt-6 max-w-2xl font-display text-base italic text-cue-300 sm:text-lg">
          {currentExercise.tips}
        </p>

        <div
          className={cn(
            'mt-8 font-mono text-6xl font-medium tracking-[-0.04em] tabular-nums sm:text-7xl',
            isFinal ? 'text-tally' : 'text-signal'
          )}
        >
          {formatTime(timeLeft)}
        </div>
      </main>

      {/* Piede con tasti fisici e scorciatoie */}
      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 border-t border-ink-800/80 px-6 py-4 sm:flex-row">
        <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[11px] text-ink-400">
          <span>
            <strong className="text-ink-200">[Spazio]</strong> Play/Pausa
          </span>
          <span>
            <strong className="text-ink-200">[← / →]</strong> Cambia take
          </span>
          <span>
            <strong className="text-ink-200">[R]</strong> Reset
          </span>
          <span>
            <strong className="text-ink-200">[ESC]</strong> Chiudi
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={prevExercise}
            disabled={currentQueueIndex === 0}
            className="key h-11 w-11"
            title="Precedente"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button onClick={reset} className="key h-11 w-11" title="Reset">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => (isRunning ? pause() : status === 'paused' ? resume() : start())}
            className={cn('key h-12 w-12', isRunning ? 'key-hold' : 'key-primary')}
            title="Play / Pausa"
          >
            {isRunning ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            )}
          </button>
          <button
            onClick={nextExercise}
            disabled={currentQueueIndex >= activeQueue.length - 1}
            className="key h-11 w-11"
            title="Successivo"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
