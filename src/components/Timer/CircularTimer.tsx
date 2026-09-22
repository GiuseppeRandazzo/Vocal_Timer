import React, { useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  SkipBack, 
  Plus, 
  Mic
} from 'lucide-react';
import { useTimerStore } from '../../store/useTimerStore';
import { useSessionStore } from '../../store/useSessionStore';

interface CircularTimerProps {
  onOpenVoiceVerification: () => void;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({ onOpenVoiceVerification }) => {
  const {
    status,
    timeLeft,
    duration,
    start,
    pause,
    resume,
    reset,
    addSeconds,
    nextExercise,
    prevExercise,
  } = useTimerStore();

  const { activeQueue, currentQueueIndex } = useSessionStore();

  // Calcolo circonferenza SVG
  const radius = 135;
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);

  // Progresso del timer (da 1 a 0 quando si svuota)
  const progress = duration > 0 ? Math.max(0, Math.min(1, timeLeft / duration)) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  // Formattazione tempo MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isRunning = status === 'running';
  const isCompleted = status === 'completed';

  const handleTogglePlay = () => {
    if (isRunning) {
      pause();
    } else if (status === 'paused') {
      resume();
    } else {
      start();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* SVG Circular Display */}
      <div className="relative flex items-center justify-center">
        <svg
          className="w-72 h-72 sm:w-80 sm:h-80 -rotate-90 transform drop-shadow-2xl"
          viewBox="0 0 320 320"
        >
          {/* Definizioni gradienti SVG */}
          <defs>
            <linearGradient id="studioTimerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FE" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Sfondo cerchio statico */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="transparent"
            stroke="#161F33"
            strokeWidth="12"
          />

          {/* Cerchio di progresso animato */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="transparent"
            stroke="url(#studioTimerGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-linear"
            filter={isRunning ? 'url(#neonGlow)' : undefined}
          />
        </svg>

        {/* Display Digitale Centrale */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none">
          {/* Badge Scaletta Esercizio */}
          <div className="text-[11px] font-mono uppercase tracking-wider text-studio-muted mb-1 flex items-center gap-1.5 bg-studio-panel px-2.5 py-0.5 rounded-full border border-studio-border">
            <span>SCALETTA</span>
            <span className="text-cyan-neon font-bold">
              {activeQueue.length > 0 ? `${currentQueueIndex + 1}/${activeQueue.length}` : '0/0'}
            </span>
          </div>

          {/* Timecode MM:SS */}
          <div className={`font-mono text-5xl sm:text-6xl font-black tracking-tight ${
            isCompleted 
              ? 'text-emerald-400 animate-pulse' 
              : isRunning 
                ? 'text-white' 
                : 'text-studio-text'
          }`}>
            {formatTime(timeLeft)}
          </div>

          {/* Subtitle Status */}
          <p className="text-xs font-mono tracking-widest text-studio-muted uppercase mt-1">
            {isCompleted ? 'Esercizio Terminato!' : isRunning ? 'In Esecuzione' : status === 'paused' ? 'In Pausa' : 'Pronto'}
          </p>
        </div>
      </div>

      {/* Controlli Timer Ergonomici */}
      <div className="mt-6 flex items-center justify-center gap-4 sm:gap-6">
        {/* Precedente */}
        <button
          onClick={prevExercise}
          disabled={currentQueueIndex === 0}
          className="p-3 rounded-2xl bg-studio-panel border border-studio-border text-studio-muted hover:text-white hover:border-studio-muted disabled:opacity-30 disabled:hover:border-studio-border disabled:hover:text-studio-muted transition-all"
          title="Esercizio precedente"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Reset */}
        <button
          onClick={reset}
          className="p-3 rounded-2xl bg-studio-panel border border-studio-border text-studio-muted hover:text-white hover:border-studio-muted transition-all"
          title="Ricomincia tempo esercizio"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Play / Pausa Principale */}
        <button
          onClick={handleTogglePlay}
          className={`relative p-5 rounded-3xl transition-all shadow-xl hover:scale-105 active:scale-95 ${
            isRunning
              ? 'bg-amber-500 text-black shadow-amber-500/30'
              : 'bg-gradient-to-tr from-cyan-neon to-cyan-500 text-black shadow-cyan-neon/30 hover:shadow-cyan-neon/50'
          }`}
          title={isRunning ? 'Metti in pausa' : 'Avvia riscaldamento'}
        >
          {isRunning ? (
            <Pause className="w-7 h-7 fill-current" />
          ) : (
            <Play className="w-7 h-7 fill-current ml-0.5" />
          )}
        </button>

        {/* +15 Secondi */}
        <button
          onClick={() => addSeconds(15)}
          className="flex items-center gap-0.5 px-3 py-3 rounded-2xl bg-studio-panel border border-studio-border text-xs font-mono font-semibold text-cyan-neon hover:border-cyan-neon/40 hover:bg-cyan-neon/10 transition-all"
          title="Aggiungi 15 secondi"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>15s</span>
        </button>

        {/* Successivo */}
        <button
          onClick={nextExercise}
          disabled={currentQueueIndex >= activeQueue.length - 1}
          className="p-3 rounded-2xl bg-studio-panel border border-studio-border text-studio-muted hover:text-white hover:border-studio-muted disabled:opacity-30 disabled:hover:border-studio-border disabled:hover:text-studio-muted transition-all"
          title="Prossimo esercizio"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Bottone "Registra e Verifica Dizione con AI" */}
      <div className="mt-5 w-full max-w-sm">
        <button
          onClick={onOpenVoiceVerification}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-neon/15 to-violet-neon/15 hover:from-cyan-neon/25 hover:to-violet-neon/25 border border-cyan-neon/40 text-white font-medium text-sm transition-all shadow-lg hover:shadow-cyan-neon/20 group"
        >
          <div className="p-1 rounded-lg bg-cyan-neon/20 text-cyan-neon group-hover:scale-110 transition-transform">
            <Mic className="w-4 h-4" />
          </div>
          <span>Registra e Verifica Dizione con AI</span>
        </button>
      </div>
    </div>
  );
};
