import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Check,
  GripVertical,
  Play,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { useExerciseStore } from '../../store/useExerciseStore';
import { useTimerStore } from '../../store/useTimerStore';
import { CATEGORY_LABELS, cn, formatTime, pad2 } from '../../lib/ui';
import { DifficultyMeter } from '../ui/primitives';
import { Modal } from '../ui/Modal';

interface SessionBuilderProps {
  onOpenTimer: () => void;
  onOpenExerciseLibrary: () => void;
}

export const SessionBuilder: React.FC<SessionBuilderProps> = ({
  onOpenTimer,
  onOpenExerciseLibrary,
}) => {
  const {
    sessions,
    activeQueue,
    loadSessionIntoQueue,
    removeFromActiveQueue,
    clearActiveQueue,
    reorderActiveQueue,
    saveCustomSession,
    deleteCustomSession,
  } = useSessionStore();

  const allExercises = useExerciseStore((s) => s.exercises);
  const { initExercise, start } = useTimerStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [sessionName, setSessionName] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const totalSeconds = activeQueue.reduce((acc, curr) => acc + curr.durationSeconds, 0);

  const handleStartWorkout = () => {
    if (activeQueue.length === 0) return;
    initExercise(activeQueue[0]);
    start();
    onOpenTimer();
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    reorderActiveQueue(index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (index >= activeQueue.length - 1) return;
    reorderActiveQueue(index, index + 1);
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim() || activeQueue.length === 0) return;

    saveCustomSession(
      sessionName.trim(),
      sessionDesc.trim() || 'Programma vocale personalizzato',
      activeQueue.map((ex) => ex.id)
    );

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSavingModal(false);
      setSessionName('');
      setSessionDesc('');
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-rise">
      {/* Intestazione */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="silk">CH-03 · Banco di montaggio</span>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-ink-100 sm:text-4xl">
            Scaletta & Programmi
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Trascina i take per riordinare la sequenza di riscaldamento o carica un programma predefinito.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSavingModal(true)}
            disabled={activeQueue.length === 0}
            className="btn btn-ghost"
          >
            <Bookmark className="h-4 w-4 text-signal" />
            Salva programma
          </button>

          <button
            onClick={handleStartWorkout}
            disabled={activeQueue.length === 0}
            className="btn btn-primary"
          >
            <Play className="h-4 w-4 fill-current" />
            Avvia sessione ({formatTime(totalSeconds)})
          </button>
        </div>
      </div>

      {/* Programmi salvati / Preset */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="silk text-ink-400">Programmi memorizzati</span>
          <span className="silk">{pad2(sessions.length)} slot</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {sessions.map((s, idx) => (
            <div
              key={s.id}
              className="panel flex flex-col justify-between p-5 transition-colors hover:border-ink-600"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-signal">PRG-{pad2(idx + 1)}</span>
                  {s.isPreset ? (
                    <span className="chip">Studio preset</span>
                  ) : (
                    <span className="chip border-signal/30 text-signal">Custom</span>
                  )}
                </div>

                <h3 className="mt-2.5 font-display text-lg font-medium text-ink-100">
                  {s.name}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-400">
                  {s.description}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-ink-800 pt-3">
                <span className="font-mono text-xs text-ink-300">
                  {pad2(s.exerciseIds.length)} take
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => loadSessionIntoQueue(s.id, allExercises)}
                    className="btn btn-signal px-3 py-1 text-xs"
                  >
                    Carica in banco
                  </button>
                  {!s.isPreset && (
                    <button
                      onClick={() => deleteCustomSession(s.id)}
                      className="icon-btn h-8 w-8 text-ink-500 hover:text-tally"
                      title="Elimina programma"
                      aria-label="Elimina programma"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coda attiva con Drag & Drop */}
      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="silk text-ink-300">Sequenza attiva</span>
            <span className="h-3 w-px bg-ink-700" />
            <span className="font-mono text-xs text-signal">
              {pad2(activeQueue.length)} take · {formatTime(totalSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onOpenExerciseLibrary} className="btn btn-ghost px-3 py-1.5 text-xs">
              <Plus className="h-3.5 w-3.5 text-signal" />
              Aggiungi dalla libreria
            </button>
            {activeQueue.length > 0 && (
              <button
                onClick={clearActiveQueue}
                className="btn btn-quiet px-2.5 py-1.5 text-xs text-ink-500 hover:text-tally"
              >
                Svuota
              </button>
            )}
          </div>
        </div>

        {activeQueue.length === 0 ? (
          <div className="p-12 text-center">
            <span className="silk">Nessun take in sequenza</span>
            <p className="mt-2 font-display text-xl text-ink-300">
              La scaletta è vuota. Carica un programma qui sopra o scegli i copioni dalla libreria.
            </p>
            <button onClick={onOpenExerciseLibrary} className="btn btn-primary mt-4 text-xs">
              Apri Libreria Copioni
            </button>
          </div>
        ) : (
          <div className="divide-y divide-ink-800/80">
            {activeQueue.map((exercise, index) => {
              const isDragged = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              return (
                <div
                  key={`${exercise.id}-${index}`}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(index);
                  }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={() => {
                    if (draggedIndex !== null && draggedIndex !== index) {
                      reorderActiveQueue(draggedIndex, index);
                    }
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={cn(
                    'flex items-center justify-between gap-3 px-4 py-3.5 transition-colors sm:px-6',
                    isDragged && 'opacity-40',
                    isDragOver ? 'bg-signal/10' : 'hover:bg-ink-850/70'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className="cursor-grab text-ink-600 hover:text-ink-300 active:cursor-grabbing"
                      title="Trascina per riordinare"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>

                    <span className="font-mono text-xs text-ink-500">{pad2(index + 1)}</span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate font-display text-base font-medium text-ink-100">
                          {exercise.title}
                        </h4>
                        <span className="silk text-[9px] text-ink-400">
                          {CATEGORY_LABELS[exercise.category]}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-400">
                        “{exercise.text}”
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="hidden sm:block">
                      <DifficultyMeter level={exercise.difficulty} showLabel={false} />
                    </div>
                    <span className="w-12 text-right font-mono text-xs text-signal">
                      {formatTime(exercise.durationSeconds)}
                    </span>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="icon-btn h-8 w-8"
                        title="Sposta su"
                        aria-label="Sposta su"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === activeQueue.length - 1}
                        className="icon-btn h-8 w-8"
                        title="Sposta giù"
                        aria-label="Sposta giù"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromActiveQueue(index)}
                        className="icon-btn h-8 w-8 text-ink-500 hover:text-tally"
                        title="Rimuovi dalla scaletta"
                        aria-label="Rimuovi dalla scaletta"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modale salvataggio programma */}
      <Modal
        isOpen={isSavingModal}
        onClose={() => setIsSavingModal(false)}
        channel="CH-03 · Memoria banco"
        title="Salva Programma di Riscaldamento"
        subtitle={`Memorizza questa sequenza (${pad2(activeQueue.length)} take · ${formatTime(totalSeconds)}) per richiamarla con un click.`}
        size="md"
      >
        <form onSubmit={handleSaveSession} className="space-y-4">
          <div>
            <label className="silk mb-1.5 block">Nome del programma</label>
            <input
              type="text"
              required
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Es. Turno Mattutino Doppiaggio"
              className="input"
            />
          </div>

          <div>
            <label className="silk mb-1.5 block">Note / Descrizione</label>
            <input
              type="text"
              value={sessionDesc}
              onChange={(e) => setSessionDesc(e.target.value)}
              placeholder="Es. Focus sibilanti e diaframma prima di entrare in sala"
              className="input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsSavingModal(false)} className="btn btn-ghost">
              Annulla
            </button>
            <button type="submit" disabled={saveSuccess} className="btn btn-primary">
              {saveSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  Programma salvato
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Memorizza
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
