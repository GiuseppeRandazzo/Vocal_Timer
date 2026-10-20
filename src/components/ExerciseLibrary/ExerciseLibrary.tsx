import React, { useState } from 'react';
import {
  Highlighter,
  ListPlus,
  Mic,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { DifficultyLevel, Exercise, ExerciseCategory } from '../../types';
import { useExerciseStore } from '../../store/useExerciseStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useTimerStore } from '../../store/useTimerStore';
import {
  CATEGORY_LABELS,
  cn,
  DIFFICULTY_LABELS,
  pad2,
  usePersistentState,
} from '../../lib/ui';
import { DifficultyMeter, ScriptText } from '../ui/primitives';
import { Modal } from '../ui/Modal';

interface ExerciseLibraryProps {
  onSelectForVerification: (exercise: Exercise) => void;
  onOpenTimer: () => void;
  onOpenAIModal: () => void;
}

const CATEGORIES: { id: ExerciseCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Tutti' },
  { id: 'scioglilingua', label: 'Scioglilingua' },
  { id: 'articolazione', label: 'Articolazione' },
  { id: 'dizione-vocali', label: 'Vocali E/O' },
  { id: 'respirazione', label: 'Respirazione' },
  { id: 'velocita', label: 'Velocità' },
  { id: 'risonanza', label: 'Risonanza' },
];

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({
  onSelectForVerification,
  onOpenTimer,
  onOpenAIModal,
}) => {
  const {
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    setSearchQuery,
    setSelectedCategory,
    setSelectedDifficulty,
    addExercise,
    deleteExercise,
    getFilteredExercises,
  } = useExerciseStore();

  const addToActiveQueue = useSessionStore((s) => s.addToActiveQueue);
  const { initExercise, start } = useTimerStore();

  const [highlightPhonemes, setHighlightPhonemes] = usePersistentState<boolean>(
    'vt_lib_highlight',
    true
  );
  const [queuedFeedbackId, setQueuedFeedbackId] = useState<string | null>(null);

  // Stato modale nuovo esercizio manuale
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('scioglilingua');
  const [newTargetPhoneme, setNewTargetPhoneme] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<DifficultyLevel>('intermedio');
  const [newText, setNewText] = useState('');
  const [newTips, setNewTips] = useState('');
  const [newDuration, setNewDuration] = useState(60);

  const filteredExercises = getFilteredExercises();

  const handlePlayNow = (exercise: Exercise) => {
    addToActiveQueue(exercise);
    initExercise(exercise);
    start();
    onOpenTimer();
  };

  const handleQueue = (exercise: Exercise) => {
    addToActiveQueue(exercise);
    setQueuedFeedbackId(exercise.id);
    setTimeout(() => {
      setQueuedFeedbackId((curr) => (curr === exercise.id ? null : curr));
    }, 1200);
  };

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;

    const customEx: Exercise = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      targetPhoneme: newTargetPhoneme.trim() || 'Articolazione generale',
      difficulty: newDifficulty,
      text: newText.trim(),
      tips: newTips.trim() || 'Respira profondamente con il diaframma e scandisci ogni sillaba.',
      durationSeconds: Number(newDuration) || 60,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    addExercise(customEx);
    setIsCreatingManual(false);
    setNewTitle('');
    setNewTargetPhoneme('');
    setNewText('');
    setNewTips('');
  };

  return (
    <div className="space-y-6 animate-rise">
      {/* Intestazione */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="silk">CH-02 · Archivio copioni</span>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-ink-100 sm:text-4xl">
            Libreria di Dizione
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {pad2(filteredExercises.length)} esercizi pronti per il leggio — filtra per fonema o genera nuovi testi con l'AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setHighlightPhonemes(!highlightPhonemes)}
            className={cn(
              'btn text-xs',
              highlightPhonemes ? 'btn-signal' : 'btn-ghost'
            )}
            title="Evidenzia i fonemi target nei testi"
          >
            <Highlighter className="h-3.5 w-3.5" />
            Fonemi
          </button>
          <button onClick={() => setIsCreatingManual(true)} className="btn btn-ghost">
            <Plus className="h-4 w-4" />
            Nuovo copione
          </button>
          <button onClick={onOpenAIModal} className="btn btn-primary">
            <Sparkles className="h-4 w-4" />
            Genera con AI
          </button>
        </div>
      </div>

      {/* Console di filtraggio */}
      <div className="panel space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca titolo, testo o fonema (es. 'Trentini', 'Sibilanti', 'Kiwi')…"
              className="input pl-10 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-500 hover:text-ink-200"
                aria-label="Pulisci ricerca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Selettore difficoltà */}
          <div className="seg self-start">
            {(['all', 'principiante', 'intermedio', 'estremo'] as const).map((diff) => (
              <button
                key={diff}
                data-active={selectedDifficulty === diff}
                onClick={() => setSelectedDifficulty(diff)}
                className="seg-item text-xs"
              >
                {diff === 'all' ? 'Tutte' : DIFFICULTY_LABELS[diff]}
              </button>
            ))}
          </div>
        </div>

        {/* Pillole categoria */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pt-1">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'whitespace-nowrap rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition',
                  active
                    ? 'border-signal/50 bg-signal/10 text-signal'
                    : 'border-ink-800 bg-ink-950 text-ink-400 hover:border-ink-700 hover:text-ink-200'
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Griglia dei copioni */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredExercises.map((exercise, index) => (
          <article
            key={exercise.id}
            className="panel group flex flex-col justify-between overflow-hidden transition-colors hover:border-ink-600"
          >
            <div>
              {/* Barra superiore scheda */}
              <div className="flex items-center justify-between gap-2 border-b border-ink-800/80 px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] text-ink-500">{pad2(index + 1)}</span>
                  <span className="h-3 w-px bg-ink-800" />
                  <span className="silk text-ink-300">{CATEGORY_LABELS[exercise.category]}</span>
                  {exercise.isAIGenerated && (
                    <span className="chip border-signal/30 bg-signal/[0.06] text-signal">
                      <Sparkles className="h-2.5 w-2.5" /> AI
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <DifficultyMeter level={exercise.difficulty} showLabel={false} />
                  <span className="silk text-ink-400">{exercise.durationSeconds}s</span>
                </div>
              </div>

              {/* Contenuto copione */}
              <div className="p-5 sm:p-6">
                <h3 className="font-display text-xl font-medium leading-snug text-ink-100 group-hover:text-signal transition-colors">
                  {exercise.title}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  <span className="silk">Target</span>
                  <span className="font-mono text-xs text-signal">{exercise.targetPhoneme}</span>
                </div>

                <div className="well mt-4 p-4">
                  <ScriptText
                    text={`“${exercise.text}”`}
                    targetPhoneme={exercise.targetPhoneme}
                    highlight={highlightPhonemes}
                    className="font-display text-[17px] font-light leading-relaxed text-ink-100"
                  />
                </div>

                <p className="mt-3 border-l-2 border-cue/70 pl-3 font-display text-xs italic text-ink-300">
                  {exercise.tips}
                </p>
              </div>
            </div>

            {/* Piede d'azione */}
            <div className="flex items-center justify-between gap-2 border-t border-ink-800/80 bg-ink-950/50 px-5 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handlePlayNow(exercise)}
                  className="btn btn-primary px-3 py-1.5 text-xs"
                  title="Porta sul leggio e avvia il timer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Sul leggio
                </button>

                <button
                  onClick={() => handleQueue(exercise)}
                  className="btn btn-ghost px-3 py-1.5 text-xs"
                  title="Aggiungi in coda alla scaletta"
                >
                  <ListPlus className="h-3.5 w-3.5 text-signal" />
                  {queuedFeedbackId === exercise.id ? 'Aggiunto ✓' : 'In scaletta'}
                </button>

                <button
                  onClick={() => onSelectForVerification(exercise)}
                  className="btn btn-rec px-3 py-1.5 text-xs"
                  title="Registra e analizza la dizione su questo testo"
                >
                  <Mic className="h-3.5 w-3.5 text-tally" />
                  Prova REC
                </button>
              </div>

              {(exercise.isCustom || exercise.isAIGenerated) && (
                <button
                  onClick={() => deleteExercise(exercise.id)}
                  className="icon-btn h-8 w-8 text-ink-500 hover:text-tally"
                  title="Elimina esercizio"
                  aria-label="Elimina esercizio"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="panel p-12 text-center">
          <span className="silk">Nessuna corrispondenza</span>
          <p className="mt-2 font-display text-xl text-ink-300">
            Nessun copione trovato con i filtri attuali.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedDifficulty('all');
            }}
            className="btn btn-ghost mt-4 text-xs"
          >
            Reimposta filtri
          </button>
        </div>
      )}

      {/* Modale creazione nuovo copione manuale */}
      <Modal
        isOpen={isCreatingManual}
        onClose={() => setIsCreatingManual(false)}
        channel="CH-02 · Redazione"
        title="Nuovo Copione Manuale"
        subtitle="Aggiungi un tuo scioglilingua o esercizio personale all'archivio locale."
        size="md"
      >
        <form onSubmit={handleCreateExercise} className="space-y-4">
          <div>
            <label className="silk mb-1.5 block">Titolo dell'esercizio</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Es. Articolazione rapida delle dentali"
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="silk mb-1.5 block">Categoria</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ExerciseCategory)}
                className="input"
              >
                <option value="scioglilingua">Scioglilingua</option>
                <option value="articolazione">Articolazione</option>
                <option value="dizione-vocali">Vocali aperte/chiuse</option>
                <option value="respirazione">Respirazione</option>
                <option value="velocita">Velocità</option>
                <option value="risonanza">Risonanza</option>
              </select>
            </div>

            <div>
              <label className="silk mb-1.5 block">Difficoltà</label>
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value as DifficultyLevel)}
                className="input"
              >
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="estremo">Estremo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="silk mb-1.5 block">Fonema target</label>
              <input
                type="text"
                value={newTargetPhoneme}
                onChange={(e) => setNewTargetPhoneme(e.target.value)}
                placeholder="Es. R vibrante, S sorda…"
                className="input"
              />
            </div>

            <div>
              <label className="silk mb-1.5 block">Durata (secondi)</label>
              <input
                type="number"
                min={15}
                max={300}
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="silk mb-1.5 block">Testo del copione</label>
            <textarea
              required
              rows={3}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Scrivi lo scioglilingua o le istruzioni di respirazione…"
              className="input font-display text-base"
            />
          </div>

          <div>
            <label className="silk mb-1.5 block">Nota tecnica del Vocal Coach</label>
            <input
              type="text"
              value={newTips}
              onChange={(e) => setNewTips(e.target.value)}
              placeholder="Es. Mantieni la mandibola morbida e appoggia sul diaframma"
              className="input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsCreatingManual(false)} className="btn btn-ghost">
              Annulla
            </button>
            <button type="submit" className="btn btn-primary">
              Salva in archivio
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
