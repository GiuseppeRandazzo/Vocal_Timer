import React from 'react';
import { Calendar, CheckCircle2, Clock, Flame, History } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { pad2 } from '../../lib/ui';
import { Modal } from '../ui/Modal';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { history, getStreakDays, getTotalMinutes } = useSessionStore();

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      channel="CH-06 · Registro di sala"
      title="Costanza & Storico Vocale"
      subtitle="Monitora la continuità del tuo riscaldamento e i turni completati."
      icon={<Flame className="h-5 w-5 text-cue" />}
      size="lg"
      accent="cue"
    >
      <div className="space-y-6">
        {/* Contatori hardware */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="well flex flex-col justify-between p-4">
            <div className="flex items-center justify-between">
              <span className="silk">Streak attivo</span>
              <Flame className="h-4 w-4 text-cue" />
            </div>
            <div className="mt-3 font-mono text-3xl font-semibold tabular-nums text-cue">
              {pad2(streakDays)}{' '}
              <span className="text-xs font-normal text-ink-400">
                {streakDays === 1 ? 'giorno' : 'giorni'}
              </span>
            </div>
          </div>

          <div className="well flex flex-col justify-between p-4">
            <div className="flex items-center justify-between">
              <span className="silk">Minuti al leggio</span>
              <Clock className="h-4 w-4 text-signal" />
            </div>
            <div className="mt-3 font-mono text-3xl font-semibold tabular-nums text-signal">
              {pad2(totalMinutes)}{' '}
              <span className="text-xs font-normal text-ink-400">min</span>
            </div>
          </div>

          <div className="well flex flex-col justify-between p-4">
            <div className="flex items-center justify-between">
              <span className="silk">Take completati</span>
              <CheckCircle2 className="h-4 w-4 text-go" />
            </div>
            <div className="mt-3 font-mono text-3xl font-semibold tabular-nums text-go">
              {pad2(totalExercises)}{' '}
              <span className="text-xs font-normal text-ink-400">esercizi</span>
            </div>
          </div>
        </div>

        {/* Nota motivazionale */}
        <blockquote className="border-l-2 border-cue/70 pl-4 font-display text-base italic text-ink-300">
          “La voce è muscolo e memoria: dieci minuti di articolazione ogni giorno valgono più di un'ora occasionale prima di entrare in turno.”
        </blockquote>

        {/* Registro sessioni */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-ink-400" />
            <span className="silk text-ink-300">Ultime sessioni registrate</span>
          </div>

          {history.length === 0 ? (
            <div className="well p-8 text-center">
              <span className="silk">Registro vuoto</span>
              <p className="mt-1.5 text-xs text-ink-400">
                Completa una scaletta nello Studio per registrare il tuo primo turno vocale.
              </p>
            </div>
          ) : (
            <div className="well divide-y divide-ink-800">
              {history.slice(0, 10).map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-ink-500">{pad2(idx + 1)}</span>
                    <div>
                      <h5 className="font-display text-sm font-medium text-ink-100">
                        {item.sessionName}
                      </h5>
                      <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-ink-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="block text-xs font-semibold text-signal">
                      {Math.max(1, Math.round(item.durationSeconds / 60))} min
                    </span>
                    <span className="text-[10px] text-ink-500">
                      {item.exercisesCompleted} take
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
