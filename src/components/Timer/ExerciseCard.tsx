import React from 'react';
import { Sparkles, Lightbulb, Clock, Target, Layers } from 'lucide-react';
import { Exercise } from '../../types';

interface ExerciseCardProps {
  exercise: Exercise | null;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise }) => {
  if (!exercise) {
    return (
      <div className="bg-studio-panel/50 border border-studio-border rounded-3xl p-8 text-center text-studio-muted">
        <p>Nessun esercizio selezionato.</p>
      </div>
    );
  }

  const getDifficultyBadge = (difficulty: Exercise['difficulty']) => {
    switch (difficulty) {
      case 'principiante':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Principiante
          </span>
        );
      case 'intermedio':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            Intermedio
          </span>
        );
      case 'estremo':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
            Scioglilingua Estremo
          </span>
        );
    }
  };

  const getCategoryLabel = (category: Exercise['category']) => {
    switch (category) {
      case 'respirazione': return 'Respirazione & Diaframma';
      case 'articolazione': return 'Articolazione Labiale/Linguale';
      case 'scioglilingua': return 'Scioglilingua Fonetico';
      case 'dizione-vocali': return 'Dizione & Timbro Vocali';
      case 'risonanza': return 'Risonanza di Maschera';
      case 'velocita': return 'Velocità & Agilità';
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-studio-panel/90 to-studio-darker/90 border border-studio-border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
      {/* Decorative top border glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-neon/50 to-transparent" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {getDifficultyBadge(exercise.difficulty)}
          <span className="flex items-center gap-1 text-xs text-studio-muted bg-studio-darkest/70 px-2.5 py-0.5 rounded-full border border-studio-border">
            <Layers className="w-3 h-3 text-studio-muted" />
            {getCategoryLabel(exercise.category)}
          </span>
          {exercise.isAIGenerated && (
            <span className="flex items-center gap-1 text-xs font-medium text-violet-300 bg-violet-500/15 px-2.5 py-0.5 rounded-full border border-violet-500/30">
              <Sparkles className="w-3 h-3 text-violet-400" />
              Generato con AI
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-studio-muted font-mono bg-studio-darkest px-2.5 py-1 rounded-lg border border-studio-border">
          <Clock className="w-3.5 h-3.5 text-cyan-neon" />
          <span>{exercise.durationSeconds}s raccomandati</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-3">
        {exercise.title}
      </h2>

      {/* Target Phoneme Highlight */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-neon/10 border border-cyan-neon/20 mb-5">
        <Target className="w-4 h-4 text-cyan-neon shrink-0" />
        <span className="text-xs text-cyan-100 font-medium">
          Target fonetico: <strong className="text-cyan-neon uppercase tracking-wide">{exercise.targetPhoneme}</strong>
        </span>
      </div>

      {/* Main Exercise Text (Scioglilingua) */}
      <div className="bg-studio-darkest/80 rounded-2xl p-5 sm:p-6 border border-studio-border shadow-inner mb-5">
        <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-sans font-medium tracking-wide">
          "{exercise.text}"
        </p>
      </div>

      {/* Coach Voice Tips */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs sm:text-sm leading-relaxed">
        <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300 block mb-0.5">Indicazione del Vocal Coach:</span>
          <span>{exercise.tips}</span>
        </div>
      </div>
    </div>
  );
};
