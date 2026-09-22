import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Play, 
  ListPlus, 
  Mic, 
  Trash2, 
  Sparkles, 
  Target, 
  Clock, 
  BookOpen,
  X
} from 'lucide-react';
import { Exercise, ExerciseCategory, DifficultyLevel } from '../../types';
import { useExerciseStore } from '../../store/useExerciseStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useTimerStore } from '../../store/useTimerStore';

interface ExerciseLibraryProps {
  onSelectForVerification: (exercise: Exercise) => void;
  onOpenTimer: () => void;
  onOpenAIModal: () => void;
}

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

  const addToActiveQueue = useSessionStore((state) => state.addToActiveQueue);
  const { initExercise, start } = useTimerStore();

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

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;

    const customEx: Exercise = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      targetPhoneme: newTargetPhoneme.trim() || 'Generale',
      difficulty: newDifficulty,
      text: newText.trim(),
      tips: newTips.trim() || 'Respira profondamente ed emetti la voce con fluidità.',
      durationSeconds: Number(newDuration) || 60,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    addExercise(customEx);
    setIsCreatingManual(false);
    // Reset form
    setNewTitle('');
    setNewTargetPhoneme('');
    setNewText('');
    setNewTips('');
  };

  const categories: { id: ExerciseCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Tutti' },
    { id: 'scioglilingua', label: 'Scioglilingua' },
    { id: 'articolazione', label: 'Articolazione' },
    { id: 'dizione-vocali', label: 'Vocali Aperte/Chiuse' },
    { id: 'respirazione', label: 'Respirazione' },
    { id: 'velocita', label: 'Velocità' },
    { id: 'risonanza', label: 'Risonanza' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-neon" />
            Libreria Esercizi di Dizione
          </h2>
          <p className="text-xs sm:text-sm text-studio-muted mt-0.5">
            Esercizi professionali per doppiatori, attori e cantanti ({filteredExercises.length} disponibili)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-md shadow-violet-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Genera con AI</span>
          </button>
          <button
            onClick={() => setIsCreatingManual(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-studio-panel hover:bg-studio-border border border-studio-border text-studio-text font-semibold text-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-neon" />
            <span>Aggiungi Manuale</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 bg-studio-darker p-4 rounded-2xl border border-studio-border">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-studio-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per parola, titolo, fonema (es. 'Trentini', 'Sibilanti', 'Kiwi')..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs sm:text-sm text-white placeholder-studio-muted focus:outline-none focus:border-cyan-neon"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-cyan-neon/15 text-cyan-neon border border-cyan-neon/40 shadow-sm'
                  : 'bg-studio-panel text-studio-muted hover:text-white border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-2 pt-1 border-t border-studio-border/50 text-xs">
          <span className="text-studio-muted font-medium">Difficoltà:</span>
          {(['all', 'principiante', 'intermedio', 'estremo'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                selectedDifficulty === diff
                  ? 'bg-studio-panel text-white font-semibold border border-studio-border'
                  : 'text-studio-muted hover:text-white'
              }`}
            >
              {diff === 'all' ? 'Tutte' : diff}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Exercises */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            className="group relative flex flex-col justify-between bg-studio-panel/80 hover:bg-studio-panel border border-studio-border hover:border-studio-muted/50 rounded-2xl p-5 transition-all shadow-md hover:shadow-xl"
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                    exercise.difficulty === 'principiante'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : exercise.difficulty === 'intermedio'
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  }`}>
                    {exercise.difficulty}
                  </span>
                  <span className="text-[11px] text-studio-muted bg-studio-darkest px-2 py-0.5 rounded border border-studio-border">
                    {exercise.category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-studio-muted font-mono">
                  <Clock className="w-3.5 h-3.5 text-cyan-neon" />
                  <span>{exercise.durationSeconds}s</span>
                </div>
              </div>

              {/* Title & Target Phoneme */}
              <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-cyan-neon transition-colors">
                {exercise.title}
              </h3>
              
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-studio-darkest border border-studio-border text-[11px] text-cyan-200 mb-3">
                <Target className="w-3 h-3 text-cyan-neon" />
                <span>Target: <strong>{exercise.targetPhoneme}</strong></span>
              </div>

              {/* Text */}
              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed line-clamp-3 mb-3">
                "{exercise.text}"
              </p>

              {/* Tips preview */}
              <p className="text-[11px] text-amber-300/80 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 line-clamp-2">
                <strong>Coach:</strong> {exercise.tips}
              </p>
            </div>

            {/* Actions Bar */}
            <div className="mt-4 pt-3 border-t border-studio-border/70 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePlayNow(exercise)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-neon text-black font-semibold text-xs hover:bg-cyan-400 transition-all shadow-sm"
                  title="Carica e avvia nel timer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Avvia</span>
                </button>

                <button
                  onClick={() => addToActiveQueue(exercise)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-studio-darkest hover:bg-studio-border text-studio-text text-xs border border-studio-border transition-all"
                  title="Aggiungi alla scaletta attiva"
                >
                  <ListPlus className="w-3.5 h-3.5 text-cyan-neon" />
                  <span>In Scaletta</span>
                </button>

                <button
                  onClick={() => onSelectForVerification(exercise)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-studio-darkest hover:bg-studio-border text-cyan-neon text-xs border border-cyan-neon/30 transition-all"
                  title="Registra e verifica dizione"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Verifica</span>
                </button>
              </div>

              {/* Delete button (only custom or AI) */}
              {(exercise.isCustom || exercise.isAIGenerated) && (
                <button
                  onClick={() => deleteExercise(exercise.id)}
                  className="p-1.5 rounded-lg text-studio-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Elimina esercizio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="p-12 text-center bg-studio-darker border border-studio-border rounded-2xl text-studio-muted">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30 text-cyan-neon" />
          <p className="text-sm">Nessun esercizio trovato per i criteri selezionati.</p>
        </div>
      )}

      {/* Modal Aggiungi Esercizio Manuale */}
      {isCreatingManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-studio-darker border border-studio-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-studio-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-neon" />
                Nuovo Esercizio di Dizione Manuale
              </h3>
              <button
                onClick={() => setIsCreatingManual(false)}
                className="p-1.5 rounded-lg text-studio-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExercise} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-studio-muted mb-1">Titolo</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Es. Scioglilingua del Fiume Rosso"
                  className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-white focus:outline-none focus:border-cyan-neon"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-studio-muted mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ExerciseCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-white focus:outline-none focus:border-cyan-neon"
                  >
                    <option value="scioglilingua">Scioglilingua</option>
                    <option value="articolazione">Articolazione</option>
                    <option value="dizione-vocali">Vocali Aperte/Chiuse</option>
                    <option value="respirazione">Respirazione</option>
                    <option value="velocita">Velocità</option>
                    <option value="risonanza">Risonanza</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-studio-muted mb-1">Difficoltà</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-white focus:outline-none focus:border-cyan-neon"
                  >
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="estremo">Scioglilingua Estremo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-studio-muted mb-1">Fonema Target</label>
                  <input
                    type="text"
                    value={newTargetPhoneme}
                    onChange={(e) => setNewTargetPhoneme(e.target.value)}
                    placeholder="Es. 'R vibrante', 'S sorda'"
                    className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-white focus:outline-none focus:border-cyan-neon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-studio-muted mb-1">Durata (secondi)</label>
                  <input
                    type="number"
                    min="15"
                    max="300"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-white focus:outline-none focus:border-cyan-neon"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-muted mb-1">Testo dello Scioglilingua / Esercizio</label>
                <textarea
                  required
                  rows={3}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Inserisci il testo completo da pronunciare..."
                  className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-white focus:outline-none focus:border-cyan-neon"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-muted mb-1">Consiglio Vocale / Postura</label>
                <input
                  type="text"
                  value={newTips}
                  onChange={(e) => setNewTips(e.target.value)}
                  placeholder="Es. 'Allena la punta della lingua senza forzare la gola'"
                  className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-white focus:outline-none focus:border-cyan-neon"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingManual(false)}
                  className="px-4 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-studio-muted hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-neon text-black font-semibold text-xs hover:bg-cyan-400"
                >
                  Salva Esercizio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
