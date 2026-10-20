import React, { useEffect, useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { AppTab, Navbar } from './components/Navbar';
import { CircularTimer } from './components/Timer/CircularTimer';
import { ExerciseCard } from './components/Timer/ExerciseCard';
import { SessionTimeline } from './components/Timer/SessionTimeline';
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
import { usePersistentState } from './lib/ui';
import { Exercise } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('timer');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isVoiceVerificationOpen, setIsVoiceVerificationOpen] = useState(false);
  const [verificationExercise, setVerificationExercise] = useState<Exercise | null>(null);
  const [showKeyBanner, setShowKeyBanner] = useState(true);

  const [highlightPhonemes, setHighlightPhonemes] = usePersistentState<boolean>(
    'vt_studio_highlight',
    true
  );

  const {
    status,
    currentExercise,
    initExercise,
    start,
    pause,
    resume,
    nextExercise,
    prevExercise,
  } = useTimerStore();
  const { activeQueue, currentQueueIndex } = useSessionStore();
  const hasGroq = useSettingsStore((s) => s.hasGroqKey());
  const hasHf = useSettingsStore((s) => s.hasHfKey());

  // Inizializza l'esercizio corrente alla partenza
  useEffect(() => {
    if (!currentExercise && activeQueue.length > 0) {
      initExercise(activeQueue[currentQueueIndex] || activeQueue[0]);
    }
  }, [currentExercise, activeQueue, currentQueueIndex, initExercise]);

  // Scorciatoie globali da tastiera quando nessuna modale è aperta
  useEffect(() => {
    const anyModal =
      isAIModalOpen ||
      isSettingsOpen ||
      isStatsOpen ||
      isFocusModeOpen ||
      isVoiceVerificationOpen;
    if (anyModal || activeTab !== 'timer') return;

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (status === 'running') pause();
        else if (status === 'paused') resume();
        else start();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        setIsFocusModeOpen(true);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextExercise();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevExercise();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    activeTab,
    isAIModalOpen,
    isSettingsOpen,
    isStatsOpen,
    isFocusModeOpen,
    isVoiceVerificationOpen,
    status,
    start,
    pause,
    resume,
    nextExercise,
    prevExercise,
  ]);

  const handleOpenVoiceVerification = (exercise?: Exercise) => {
    const target = exercise || currentExercise || activeQueue[0];
    if (target) {
      setVerificationExercise(target);
      setIsVoiceVerificationOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-20 lg:pb-0">
      {/* Header Console */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFocusMode={() => setIsFocusModeOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
      />

      {/* Striscia avviso se mancano le chiavi AI */}
      {showKeyBanner && (!hasGroq || !hasHf) && (
        <div className="border-b border-ink-800 bg-ink-900/90 px-4 py-2">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 text-xs">
            <div className="flex min-w-0 items-center gap-2.5 text-ink-300">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cue" />
              <p className="truncate">
                <strong className="font-medium text-ink-100">Modalità locale attiva</strong> — 12 copioni di dizione pronti. Collega Groq e Hugging Face per sbloccare generazione AI e trascrizione Whisper.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-cue/40 bg-cue/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-cue hover:bg-cue/20"
              >
                <KeyRound className="h-3 w-3" />
                Chiavi API
              </button>
              <button
                onClick={() => setShowKeyBanner(false)}
                className="rounded p-1 text-ink-500 hover:text-ink-200"
                aria-label="Chiudi avviso"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area operativa principale */}
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-8 sm:py-9">
        {activeTab === 'timer' && (
          <div className="space-y-6 animate-rise">
            <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
              {/* Modulo 1: Orologio Broadcast & Transport */}
              <section
                className="panel flex flex-col justify-between p-6 sm:p-8 lg:col-span-5"
                aria-label="Orologio e controlli del timer"
              >
                <div className="mb-4 flex items-center justify-between border-b border-ink-800 pb-3">
                  <span className="silk text-ink-400">CH-01 · Master Clock</span>
                  <span className="silk">1000 Hz Sync</span>
                </div>

                <div className="my-auto py-2">
                  <CircularTimer
                    onOpenVoiceVerification={() => handleOpenVoiceVerification()}
                  />
                </div>
              </section>

              {/* Modulo 2: Copione sul leggio */}
              <div className="lg:col-span-7">
                <ExerciseCard
                  exercise={currentExercise}
                  highlight={highlightPhonemes}
                  onToggleHighlight={() => setHighlightPhonemes(!highlightPhonemes)}
                />
              </div>
            </div>

            {/* Modulo 3: Timeline della scaletta */}
            <SessionTimeline onManage={() => setActiveTab('builder')} />
          </div>
        )}

        {activeTab === 'exercises' && (
          <ExerciseLibrary
            onSelectForVerification={(ex) => handleOpenVoiceVerification(ex)}
            onOpenTimer={() => setActiveTab('timer')}
            onOpenAIModal={() => setIsAIModalOpen(true)}
          />
        )}

        {activeTab === 'builder' && (
          <SessionBuilder
            onOpenTimer={() => setActiveTab('timer')}
            onOpenExerciseLibrary={() => setActiveTab('exercises')}
          />
        )}
      </main>

      {/* Piede console */}
      <footer className="border-t border-ink-800/70 bg-ink-950/80 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 text-xs text-ink-500 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="silk text-ink-400">Vocal Timer · VT-1</span>
            <span className="hidden h-3 w-px bg-ink-800 sm:inline-block" />
            <span className="hidden sm:inline">Console di riscaldamento vocale & dizione italiana</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[10px] text-ink-500">
            <span>
              <strong className="text-ink-300">[Spazio]</strong> Play/Pausa
            </span>
            <span>
              <strong className="text-ink-300">[← / →]</strong> Take
            </span>
            <span>
              <strong className="text-ink-300">[F]</strong> Leggio
            </span>
          </div>
        </div>
      </footer>

      {/* Modali di sistema */}
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
