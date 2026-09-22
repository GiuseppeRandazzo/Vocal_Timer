import React from 'react';
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Trophy, 
  History, 
  Sparkles,
  X
} from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { history, getStreakDays, getTotalMinutes } = useSessionStore();

  if (!isOpen) return null;

  const streakDays = getStreakDays();
  const totalMinutes = getTotalMinutes();
  const totalExercises = history.reduce((acc, curr) => acc + curr.exercisesCompleted, 0);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-studio-darker border border-studio-border rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-950/40 via-studio-panel to-studio-panel border-b border-studio-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Statistiche & Streak Giornaliero
              </h3>
              <p className="text-xs text-studio-muted">Traccia la costanza del tuo riscaldamento vocale</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-studio-muted hover:text-white hover:bg-studio-panel transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Streak */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/15 to-studio-panel border border-amber-500/30 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 mb-2 shadow-lg shadow-amber-500/20">
                <Flame className="w-6 h-6 fill-amber-400" />
              </div>
              <span className="text-3xl font-black font-mono text-white">
                {streakDays} {streakDays === 1 ? 'giorno' : 'giorni'}
              </span>
              <span className="text-xs text-amber-300/90 font-medium mt-0.5">
                Streak Allenamento
              </span>
            </div>

            {/* Minuti Totali */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-cyan-500/15 to-studio-panel border border-cyan-500/30 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-2xl bg-cyan-neon/20 text-cyan-neon mb-2 shadow-lg shadow-cyan-neon/20">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-3xl font-black font-mono text-white">
                {totalMinutes} min
              </span>
              <span className="text-xs text-cyan-300/90 font-medium mt-0.5">
                Tempo Vocale Totale
              </span>
            </div>

            {/* Esercizi completati */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-violet-500/15 to-studio-panel border border-violet-500/30 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-2xl bg-violet-500/20 text-violet-400 mb-2 shadow-lg shadow-violet-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-3xl font-black font-mono text-white">
                {totalExercises}
              </span>
              <span className="text-xs text-violet-300/90 font-medium mt-0.5">
                Esercizi Eseguiti
              </span>
            </div>
          </div>

          {/* Motivation Quote */}
          <div className="p-4 rounded-2xl bg-studio-panel/50 border border-studio-border flex items-center gap-3 text-xs sm:text-sm text-slate-300">
            <Sparkles className="w-5 h-5 text-cyan-neon shrink-0" />
            <p>
              "La voce è un muscolo e una memoria: 10 minuti di articolazione quotidiana valgono più di un'ora sporadica prima del microfono."
            </p>
          </div>

          {/* History Log */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-studio-muted mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-cyan-neon" />
              Cronologia Sessioni Completate
            </h4>

            {history.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-studio-panel/30 border border-studio-border text-studio-muted text-xs">
                Nessuna sessione completata registrata finora. Completa la tua prima sessione nel timer per iniziare a tracciare lo storico!
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-studio-panel border border-studio-border"
                  >
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-white">
                        {item.sessionName}
                      </h5>
                      <span className="text-[11px] text-studio-muted flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.date)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-cyan-neon block">
                        {Math.round(item.durationSeconds / 60)} min
                      </span>
                      <span className="text-[10px] text-studio-muted">
                        {item.exercisesCompleted} esercizi
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
