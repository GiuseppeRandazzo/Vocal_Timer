import React, { useEffect, useState } from 'react';
import { 
  Minimize2, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Target,
  Radio
} from 'lucide-react';
import { useTimerStore } from '../../store/useTimerStore';
import { useSessionStore } from '../../store/useSessionStore';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({ isOpen, onClose }) => {
  const {
    status,
    timeLeft,
    currentExercise,
    start,
    pause,
    resume,
    reset,
    nextExercise,
    prevExercise,
  } = useTimerStore();

  const { activeQueue, currentQueueIndex } = useSessionStore();

  const [fontSizeLevel, setFontSizeLevel] = useState<number>(2); // 0: small, 1: normal, 2: large, 3: extra-large, 4: giant

  const isRunning = status === 'running';

  const fontClasses = [
    'text-xl sm:text-2xl',      // 0
    'text-2xl sm:text-3xl',      // 1
    'text-3xl sm:text-4xl lg:text-5xl', // 2 (default)
    'text-4xl sm:text-5xl lg:text-6xl', // 3
    'text-5xl sm:text-6xl lg:text-7xl', // 4
  ];

  // Gestione scorciatoie da tastiera
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se si sta digitando in un input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (isRunning) {
            pause();
          } else if (status === 'paused') {
            resume();
          } else {
            start();
          }
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-y-auto">
      
      {/* Top Header Barra da Studio */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        
        {/* Status Indicatore */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs font-bold ${
            isRunning 
              ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' 
              : 'bg-white/10 text-white/60 border border-white/10'
          }`}>
            <Radio className="w-4 h-4" />
            <span>{isRunning ? 'ON AIR' : 'LEGGIO STUDIO'}</span>
          </div>

          <span className="font-mono text-xs text-white/50 hidden sm:inline">
            Esercizio {currentQueueIndex + 1} di {activeQueue.length}
          </span>
        </div>

        {/* Font Scaling & Exit */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFontSizeLevel((prev) => Math.max(0, prev - 1))}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
            title="Riduci font (A-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFontSizeLevel((prev) => Math.min(fontClasses.length - 1, prev + 1))}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
            title="Ingrandisci font (A+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all ml-2"
            title="Esci da modalità leggio (ESC)"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Esci</span>
          </button>
        </div>
      </div>

      {/* Main Focus Content (Leggio) */}
      <div className="my-auto py-8 max-w-5xl mx-auto w-full text-center space-y-8">
        
        {/* Target Fonetico Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-sm font-semibold tracking-wide">
          <Target className="w-4 h-4 text-cyan-400" />
          <span>Target Fonetico: <strong className="text-white uppercase">{currentExercise.targetPhoneme}</strong></span>
        </div>

        {/* Titolo Esercizio */}
        <h1 className="text-xl sm:text-2xl font-bold text-white/80 tracking-wide">
          {currentExercise.title}
        </h1>

        {/* Testo dello Scioglilingua Ad Altissimo Contrasto */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-md">
          <p className={`${fontClasses[fontSizeLevel]} font-medium text-white leading-relaxed tracking-wide transition-all duration-200`}>
            "{currentExercise.text}"
          </p>
        </div>

        {/* Suggerimento del Vocal Coach */}
        <p className="text-sm sm:text-base text-amber-300/90 max-w-2xl mx-auto leading-relaxed font-sans">
          💡 <strong>Coach:</strong> {currentExercise.tips}
        </p>

        {/* Timer Timecode Gigante */}
        <div className="font-mono text-5xl sm:text-7xl font-black text-cyan-400 tracking-tight drop-shadow-[0_0_20px_rgba(0,242,254,0.4)]">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Bottom Controls & Shortcuts */}
      <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Scorciatoie */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-white/40">
          <span><strong className="text-white/70">[Spazio]</strong> Play/Pausa</span>
          <span><strong className="text-white/70">[→]</strong> Prossimo</span>
          <span><strong className="text-white/70">[←]</strong> Precedente</span>
          <span><strong className="text-white/70">[R]</strong> Reset</span>
          <span><strong className="text-white/70">[ESC]</strong> Esci</span>
        </div>

        {/* Bottoni Rapidi */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevExercise}
            disabled={currentQueueIndex === 0}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-20 transition-all"
            title="Precedente"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={reset}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => (isRunning ? pause() : resume())}
            className={`p-4 rounded-2xl transition-all shadow-xl ${
              isRunning ? 'bg-amber-500 text-black' : 'bg-cyan-400 text-black'
            }`}
            title="Play/Pausa"
          >
            {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
          </button>

          <button
            onClick={nextExercise}
            disabled={currentQueueIndex >= activeQueue.length - 1}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-20 transition-all"
            title="Prossimo"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
};
