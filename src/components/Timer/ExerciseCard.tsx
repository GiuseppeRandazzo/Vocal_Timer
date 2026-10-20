import React from 'react';
import { Highlighter, Sparkles } from 'lucide-react';
import { Exercise } from '../../types';
import { CATEGORY_LABELS, cn, getPhonemePattern } from '../../lib/ui';
import { DifficultyMeter, ScriptText } from '../ui/primitives';

interface ExerciseCardProps {
  exercise: Exercise | null;
  highlight: boolean;
  onToggleHighlight: () => void;
}

/**
 * Il "Copione": l'esercizio corrente impaginato su pannello blu-ardesia satinato
 * con filo luminoso ciano/ambra, testo editoriale Fraunces e fonemi evidenziati.
 */
export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  highlight,
  onToggleHighlight,
}) => {
  if (!exercise) {
    return (
      <div className="panel flex min-h-[420px] flex-col items-center justify-center p-10 text-center">
        <span className="silk">Copione vuoto</span>
        <p className="mt-3 font-display text-2xl text-ink-300">Nessun esercizio in scaletta.</p>
        <p className="mt-2 text-sm text-ink-400">
          Aggiungine uno dalla Libreria o generane uno con l'AI.
        </p>
      </div>
    );
  }

  const canHighlight = getPhonemePattern(exercise.targetPhoneme) !== null;

  return (
    <article className="panel flex h-full flex-col overflow-hidden">
      {/* Filo luminoso superiore ciano/ambra */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-signal/70 to-cue/50"
        aria-hidden
      />

      {/* Striscia d'intestazione */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="silk text-ink-200">CH-02 · Copione</span>
          <span className="h-3 w-px bg-ink-700" />
          <span className="silk text-signal">{CATEGORY_LABELS[exercise.category]}</span>
          {exercise.isAIGenerated && (
            <span className="chip border-signal/35 bg-signal/10 text-signal">
              <Sparkles className="h-3 w-3" /> AI
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <DifficultyMeter level={exercise.difficulty} />
          <span className="chip font-mono text-ink-200">{exercise.durationSeconds}s</span>
        </div>
      </header>

      {/* Corpo: la pagina */}
      <div key={exercise.id} className="flex flex-1 animate-rise flex-col px-5 py-7 sm:px-9 sm:py-8">
        <h1 className="max-w-[24ch] font-display text-[30px] font-medium leading-[1.1] tracking-[-0.015em] text-white sm:text-[38px]">
          {exercise.title}
        </h1>

        {/* Riga del target fonetico + toggle evidenziazione */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="silk">Target fonetico</span>
          <span className="rounded-md border border-signal/30 bg-signal/10 px-2.5 py-0.5 font-mono text-[12px] font-medium tracking-wide text-signal">
            {exercise.targetPhoneme}
          </span>
          {canHighlight && (
            <button
              onClick={onToggleHighlight}
              className={cn(
                'ml-auto inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition',
                highlight
                  ? 'border-signal/50 bg-signal/15 text-signal shadow-[0_0_16px_-6px_rgba(0,242,254,0.6)]'
                  : 'border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-600 hover:text-white'
              )}
              aria-pressed={highlight}
              title="Evidenzia nel testo le lettere del fonema target"
            >
              <Highlighter className="h-3.5 w-3.5" />
              Evidenzia fonema
            </button>
          )}
        </div>

        {/* Il testo da leggere dentro un pozzetto luminoso */}
        <div className="well relative mt-6 flex flex-1 items-center p-6 sm:p-8">
          <span
            className="pointer-events-none absolute left-3 top-1 select-none font-display text-[84px] leading-none text-signal/10 sm:left-5"
            aria-hidden
          >
            “
          </span>
          <ScriptText
            text={exercise.text}
            targetPhoneme={exercise.targetPhoneme}
            highlight={highlight}
            className="relative font-display text-[21px] font-light leading-[1.62] text-white sm:text-[25px]"
          />
        </div>

        {/* Nota del coach, a margine con accento ambra caldo */}
        <aside className="mt-6 rounded-r-xl border-l-2 border-cue bg-cue/[0.07] px-4 py-3">
          <span className="silk text-cue">Nota del Vocal Coach</span>
          <p className="mt-1 font-display text-[16px] italic leading-relaxed text-ink-200 sm:text-[17px]">
            {exercise.tips}
          </p>
        </aside>
      </div>
    </article>
  );
};
