import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  X, 
  ChevronRight
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { CircularTimer } from './components/Timer/CircularTimer';
import { ExerciseCard } from './components/Timer/ExerciseCard';
import { ExerciseLibrary } from './components/ExerciseLibrary/ExerciseLibrary';
import { SessionBuilder } from './components/SessionBuilder/SessionBuilder';
import { StatsModal } from './components/Stats/StatsModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { AIGeneratorModal } from './components/AIGenerator/AIGeneratorModal';
import { VoiceVerificationModal } from './components/VoiceVerification/VoiceVerificationModal';
import { FocusModeModal } from './components/FocusMode/FocusModeModal';
import { useTimerStore } from './store/useTimerStore';
import { useSessionStore } from './store/useSessionStore';
import { useSettingsStore } from './store/useSettingsStore';
import { Exercise } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timer' | 'exercises' | 'builder' | 'stats'>('timer');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isVoiceVerificationOpen, setIsVoiceVerificationOpen] = useState(false);
  const [verificationExercise, setVerificationExercise] = useState<Exercise | null>(null);
  const [showKeyBanner, setShowKeyBanner] = useState(true);

  const { currentExercise, initExercise } = useTimerStore();
  const { activeQueue, currentQueueIndex } = useSessionStore();
  const hasGroq = useSettingsStore((state) => state.hasGroqKey());
  const hasHf = useSettingsStore((state) => state.hasHfKey());

  // Inizializza l'esercizio corrente alla partenza se non impostato
  useEffect(() => {
    if (!currentExercise && activeQueue.length > 0) {
      initExercise(activeQueue[currentQueueIndex] || activeQueue[0]);
    }
  }, [currentExercise, activeQueue, currentQueueIndex, initExercise]);

  // Se l'utente clicca il tab stats, apriamo la modale stats
  useEffect(() => {
    if (activeTab === 'stats') {
      setIsStatsOpen(true);
      setActiveTab('timer');
    }
  }, [activeTab]);

  const handleOpenVoiceVerification = (exercise?: Exercise) => {
    const target = exercise || currentExercise || activeQueue[0];
    if (target) {
      setVerificationExercise(target);
      setIsVoiceVerificationOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-studio-darkest text-studio-text flex flex-col font-sans selection:bg-cyan-neon selection:text-black">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFocusMode={() => setIsFocusModeOpen(true)}
      />

      {/* Banner Notifica Graceful Degradation (se mancano le chiavi) */}
      {showKeyBanner && (!hasGroq || !hasHf) && (
        <div className="bg-gradient-to-r from-violet-950/80 via-studio-panel to-cyan-950/80 border-b border-studio-border px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-200 overflow-hidden">
              <AlertCircle className="w-4 h-4 text-cyan-neon shrink-0" />
              <p className="truncate">
                <strong>Modalità Studio Offline attiva:</strong> Libreria completa con 12 esercizi per dizione pronta. Per generare nuovi scioglilingua AI e trascrivere con Whisper, inserisci le API keys nelle Impostazioni.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-cyan-neon text-black font-bold text-[11px] hover:bg-cyan-400 transition-all"
              >
                Configura Chiavi
              </button>
              <button
                onClick={() => setShowKeyBanner(false)}
                className="p-1 rounded-md text-studio-muted hover:text-white transition-all"
                title="Nascondi avviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Tab 1: Studio Timer */}
        {activeTab === 'timer' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Split layout: Sinistra Timer Circolare & Controlli, Destra Card Esercizio con Fonema & Tips */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Colonna Sinistra: Circular Timer */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center bg-studio-darker/60 border border-studio-border rounded-3xl p-6 sm:p-8 shadow-xl">
                <CircularTimer
                  onOpenVoiceVerification={() => handleOpenVoiceVerification()}
                />
              </div>

              {/* Colonna Destra: Exercise Card */}
              <div className="lg:col-span-7">
                <ExerciseCard exercise={currentExercise} />
              </div>

            </div>

            {/* Quick Session Queue Bar */}
            <div className="p-4 rounded-2xl bg-studio-darker border border-studio-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-x-auto">
                <span className="text-xs font-mono font-bold text-studio-muted uppercase tracking-wider shrink-0">
                  In Scaletta:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                  {activeQueue.map((ex, idx) => (
                    <button
                      key={`${ex.id}-${idx}`}
                      onClick={() => {
                        useSessionStore.getState().setCurrentQueueIndex(idx);
                        initExercise(ex);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        idx === currentQueueIndex
                          ? 'bg-cyan-neon/15 text-cyan-neon border border-cyan-neon/40 shadow-sm'
                          : 'bg-studio-panel text-studio-muted hover:text-white border border-studio-border/50'
                      }`}
                    >
                      <span className="font-mono text-[10px] opacity-70">#{idx + 1}</span>
                      <span className="max-w-[140px] truncate">{ex.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('builder')}
                className="text-xs text-cyan-neon hover:underline font-medium flex items-center gap-1 shrink-0"
              >
                <span>Gestisci Scaletta</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Libreria Esercizi */}
        {activeTab === 'exercises' && (
          <div className="animate-in fade-in duration-300">
            <ExerciseLibrary
              onSelectForVerification={(ex) => handleOpenVoiceVerification(ex)}
              onOpenTimer={() => setActiveTab('timer')}
              onOpenAIModal={() => setIsAIModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 3: Session Builder */}
        {activeTab === 'builder' && (
          <div className="animate-in fade-in duration-300">
            <SessionBuilder
              onOpenTimer={() => setActiveTab('timer')}
              onOpenExerciseLibrary={() => setActiveTab('exercises')}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-studio-border bg-studio-darkest py-4 px-4 text-center text-xs text-studio-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Vocal Timer • Pro Dubbing & Voice Warmup Suite</span>
          <span className="text-[11px] font-mono">Web Audio API • Groq Llama 3 • Whisper STT</span>
        </div>
      </footer>

      {/* Modali Globali */}
      <AIGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onOpenSettings={() => {
          setIsAIModalOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      <VoiceVerificationModal
        isOpen={isVoiceVerificationOpen}
        onClose={() => setIsVoiceVerificationOpen(false)}
        exercise={verificationExercise || currentExercise}
        onOpenSettings={() => {
          setIsVoiceVerificationOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      <FocusModeModal
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
};
export default App;
