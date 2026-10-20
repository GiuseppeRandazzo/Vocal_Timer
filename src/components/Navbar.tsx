import React from 'react';
import { BookOpen, Flame, ListOrdered, Maximize2, Settings as SettingsIcon, Sparkles, Timer } from 'lucide-react';
import { useTimerStore } from '../store/useTimerStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useSessionStore } from '../store/useSessionStore';
import { cn } from '../lib/ui';
import { LogoMark, TallyLight } from './ui/primitives';

export type AppTab = 'timer' | 'exercises' | 'builder';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenAIModal: () => void;
  onOpenSettings: () => void;
  onOpenFocusMode: () => void;
  onOpenStats: () => void;
}

const TABS: { id: AppTab; label: string; short: string; icon: React.ElementType }[] = [
  { id: 'timer', label: 'Studio', short: 'Studio', icon: Timer },
  { id: 'exercises', label: 'Libreria', short: 'Libreria', icon: BookOpen },
  { id: 'builder', label: 'Scaletta', short: 'Scaletta', icon: ListOrdered },
];

/**
 * Header della console: marchio, selettore di sezione, spia ON AIR e azioni rapide.
 * Su mobile la navigazione diventa una barra fissa in basso (pollice-friendly).
 */
export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAIModal,
  onOpenSettings,
  onOpenFocusMode,
  onOpenStats,
}) => {
  const timerStatus = useTimerStore((s) => s.status);
  const hasGroq = useSettingsStore((s) => s.hasGroqKey());
  const hasHf = useSettingsStore((s) => s.hasHfKey());
  const streakDays = useSessionStore((s) => s.getStreakDays());

  const isLive = timerStatus === 'running';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-8">
          {/* Marchio */}
          <button
            onClick={() => setActiveTab('timer')}
            className="group flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
            aria-label="Vocal Timer — torna allo studio"
          >
            <LogoMark className="h-9 w-9 transition-transform duration-300 group-hover:rotate-[30deg]" />
            <div className="flex flex-col items-start leading-none">
              <span className="flex items-baseline gap-1">
                <span className="font-display text-[21px] font-medium italic tracking-tight text-ink-100">Vocal</span>
                <span className="text-[17px] font-semibold tracking-tight text-ink-100">Timer</span>
              </span>
              <span className="silk mt-1 hidden text-[9px] sm:block">VT-1 · Voice warm-up console</span>
            </div>
          </button>

          {/* Selettore di sezione (desktop) */}
          <nav className="seg hidden lg:inline-flex" aria-label="Sezioni">
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                data-active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="seg-item px-4"
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className={cn('font-mono text-[10px]', activeTab === tab.id ? 'text-signal' : 'text-ink-600')}>
                  0{i + 1}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Azioni */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <TallyLight live={isLive} className="mr-1 hidden md:inline-flex" />

            <button
              onClick={onOpenStats}
              className={cn(
                'btn btn-quiet px-2.5',
                streakDays > 0 && 'text-cue hover:text-cue-300'
              )}
              title="Statistiche e streak"
            >
              <Flame className={cn('h-4 w-4', streakDays > 0 && 'fill-cue/30')} />
              <span className="font-mono text-xs tabular-nums">{streakDays}</span>
              <span className="hidden text-xs xl:inline">{streakDays === 1 ? 'giorno' : 'giorni'}</span>
            </button>

            <button onClick={onOpenAIModal} className="btn btn-signal" title="Genera un esercizio con l'AI (Groq)">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Genera con AI</span>
              <span className="sm:hidden">AI</span>
            </button>

            <button onClick={onOpenFocusMode} className="icon-btn" title="Modalità leggio (F)" aria-label="Modalità leggio">
              <Maximize2 className="h-[18px] w-[18px]" />
            </button>

            <button
              onClick={onOpenSettings}
              className="icon-btn relative"
              title="Impostazioni e chiavi API"
              aria-label="Impostazioni"
            >
              <SettingsIcon className="h-[18px] w-[18px]" />
              {(!hasGroq || !hasHf) && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-ink-950 bg-cue" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Navigazione mobile: barra fissa in basso */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800 bg-ink-950/90 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl lg:hidden"
        aria-label="Sezioni"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors',
                  active ? 'text-ink-100' : 'text-ink-500'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className={cn(
                    'absolute top-0 h-[2px] w-8 rounded-full transition-all',
                    active ? 'bg-signal shadow-[0_0_10px_rgba(0,242,254,0.8)]' : 'bg-transparent'
                  )}
                />
                <Icon className="mt-1 h-5 w-5" />
                {tab.short}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
