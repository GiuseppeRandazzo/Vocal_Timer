import React, { useState } from 'react';
import { 
  ListMusic, 
  Play, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Plus, 
  Bookmark, 
  Clock, 
  Check, 
  Save, 
  Layers
} from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { useExerciseStore } from '../../store/useExerciseStore';
import { useTimerStore } from '../../store/useTimerStore';

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

  const allExercises = useExerciseStore((state) => state.exercises);
  const { initExercise, start } = useTimerStore();

  const [sessionName, setSessionName] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Calcolo tempo totale della scaletta
  const totalSeconds = activeQueue.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSecs = totalSeconds % 60;

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
      sessionDesc.trim() || 'Sessione vocale personalizzata',
      activeQueue.map((e) => e.id)
    );

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSavingModal(false);
      setSessionName('');
      setSessionDesc('');
    }, 1200);
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <ListMusic className="w-6 h-6 text-cyan-neon" />
            Session Builder & Scaletta
          </h2>
          <p className="text-xs sm:text-sm text-studio-muted mt-0.5">
            Crea sequenze di riscaldamento vocale su misura per i tuoi turni o lezioni
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSavingModal(true)}
            disabled={activeQueue.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-studio-panel hover:bg-studio-border border border-studio-border text-studio-text font-semibold text-xs transition-all disabled:opacity-40"
          >
            <Bookmark className="w-3.5 h-3.5 text-cyan-neon" />
            <span>Salva Scaletta</span>
          </button>

          <button
            onClick={handleStartWorkout}
            disabled={activeQueue.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-tr from-cyan-neon to-cyan-500 text-black font-bold text-xs sm:text-sm shadow-lg shadow-cyan-neon/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Avvia Workout Ora</span>
          </button>
        </div>
      </div>

      {/* Preset Sessions Bar */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-studio-muted mb-2.5">
          Preset Consigliati da Studio:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-studio-panel border border-studio-border hover:border-cyan-neon/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-neon transition-colors">
                    {s.name}
                  </h4>
                  {s.isPreset && (
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-studio-darkest text-studio-muted border border-studio-border">
                      PRESET
                    </span>
                  )}
                </div>
                <p className="text-xs text-studio-muted line-clamp-2 mb-3">
                  {s.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-studio-border/50">
                <span className="text-xs font-mono text-cyan-neon">
                  {s.exerciseIds.length} esercizi
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => loadSessionIntoQueue(s.id, allExercises)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-neon/15 hover:bg-cyan-neon/25 text-cyan-neon text-xs font-semibold border border-cyan-neon/30 transition-all"
                  >
                    Carica in Scaletta
                  </button>
                  {!s.isPreset && (
                    <button
                      onClick={() => deleteCustomSession(s.id)}
                      className="p-1 rounded-lg text-studio-muted hover:text-rose-400"
                      title="Elimina sessione"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Active Queue (Scaletta Attiva) */}
      <div className="bg-studio-darker border border-studio-border rounded-3xl p-6 space-y-4">
        
        {/* Scaletta Header & Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-studio-border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-neon" />
              Scaletta Attiva
            </span>
            <span className="px-2 py-0.5 rounded-full bg-studio-panel border border-studio-border text-xs font-mono text-studio-muted">
              {activeQueue.length} esercizi
            </span>
            <span className="flex items-center gap-1 text-xs font-mono text-cyan-neon">
              <Clock className="w-3.5 h-3.5" />
              {totalMinutes}m {remainingSecs}s totali
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExerciseLibrary}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-studio-panel hover:bg-studio-border border border-studio-border text-xs text-studio-text transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-neon" />
              <span>Aggiungi Dalla Libreria</span>
            </button>
            {activeQueue.length > 0 && (
              <button
                onClick={clearActiveQueue}
                className="px-3 py-1.5 rounded-xl text-xs text-studio-muted hover:text-rose-400 transition-all"
              >
                Svuota
              </button>
            )}
          </div>
        </div>

        {/* Scaletta Exercise Items */}
        {activeQueue.length === 0 ? (
          <div className="p-8 text-center text-studio-muted">
            <p className="text-sm mb-3">La scaletta è vuota. Seleziona un preset o aggiungi esercizi dalla libreria.</p>
            <button
              onClick={onOpenExerciseLibrary}
              className="px-4 py-2 rounded-xl bg-cyan-neon text-black font-bold text-xs"
            >
              Esplora Libreria Esercizi
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeQueue.map((exercise, index) => (
              <div
                key={`${exercise.id}-${index}`}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-studio-panel/70 border border-studio-border hover:border-studio-muted/40 transition-all"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="w-6 text-center font-mono text-xs font-bold text-studio-muted">
                    #{index + 1}
                  </span>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {exercise.title}
                      </h4>
                      <span className="text-[10px] text-cyan-neon font-mono shrink-0">
                        {exercise.durationSeconds}s
                      </span>
                    </div>
                    <p className="text-[11px] text-studio-muted truncate max-w-md">
                      {exercise.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Sposta Su */}
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-studio-muted hover:text-white disabled:opacity-20 transition-all"
                    title="Sposta prima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Sposta Giù */}
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === activeQueue.length - 1}
                    className="p-1.5 rounded-lg text-studio-muted hover:text-white disabled:opacity-20 transition-all"
                    title="Sposta dopo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Rimuovi */}
                  <button
                    onClick={() => removeFromActiveQueue(index)}
                    className="p-1.5 rounded-lg text-studio-muted hover:text-rose-400 transition-all ml-1"
                    title="Rimuovi dalla scaletta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modale Salva Nuova Sessione */}
      {isSavingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-studio-darker border border-studio-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-cyan-neon" />
              Salva Sessione Preferita
            </h3>
            <p className="text-xs text-studio-muted">
              Salva l'attuale scaletta ({activeQueue.length} esercizi, {totalMinutes}m {remainingSecs}s) per riutilizzarla quando vuoi.
            </p>

            <form onSubmit={handleSaveSession} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-studio-muted mb-1">Nome Sessione</label>
                <input
                  type="text"
                  required
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Es. Warmup Prima di Recitare"
                  className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-white focus:outline-none focus:border-cyan-neon"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-muted mb-1">Descrizione (Opzionale)</label>
                <input
                  type="text"
                  value={sessionDesc}
                  onChange={(e) => setSessionDesc(e.target.value)}
                  placeholder="Es. Focus sulle sibilanti e controllo diaframmatico"
                  className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-white focus:outline-none focus:border-cyan-neon"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSavingModal(false)}
                  className="px-4 py-2 rounded-xl bg-studio-panel text-xs text-studio-muted hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saveSuccess}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-neon text-black font-semibold text-xs hover:bg-cyan-400 transition-all"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvata!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Salva Template</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
