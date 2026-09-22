import React from 'react';
import { 
  Mic2, 
  Sparkles, 
  Maximize2, 
  Settings as SettingsIcon, 
  Flame, 
  ListMusic, 
  BookOpen, 
  Radio
} from 'lucide-react';
import { useTimerStore } from '../store/useTimerStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useSessionStore } from '../store/useSessionStore';

interface NavbarProps {
  activeTab: 'timer' | 'exercises' | 'builder' | 'stats';
  setActiveTab: (tab: 'timer' | 'exercises' | 'builder' | 'stats') => void;
  onOpenAIModal: () => void;
  onOpenSettings: () => void;
  onOpenFocusMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAIModal,
  onOpenSettings,
  onOpenFocusMode,
}) => {
  const timerStatus = useTimerStore((state) => state.status);
  const hasGroq = useSettingsStore((state) => state.hasGroqKey());
  const hasHf = useSettingsStore((state) => state.hasHfKey());
  const streakDays = useSessionStore((state) => state.getStreakDays());

  const isLive = timerStatus === 'running';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-studio-border bg-studio-darkest/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Studio Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-neon to-violet-neon p-0.5 shadow-lg shadow-cyan-neon/20">
              <div className="h-full w-full bg-studio-darkest rounded-[10px] flex items-center justify-center">
                <Mic2 className="w-5 h-5 text-cyan-neon" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">Vocal<span className="text-cyan-neon">Timer</span></span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-studio-panel border border-studio-border text-studio-muted">
                  PRO STUDIO
                </span>
              </div>
              <p className="text-xs text-studio-muted hidden sm:block">Dizione, Riscaldamento & AI Voice</p>
            </div>
          </div>

          {/* ON AIR Badge */}
          <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-semibold transition-all ${
            isLive 
              ? 'bg-onair-red/10 border-onair-red text-onair-red animate-pulse shadow-lg shadow-onair-red/30' 
              : 'bg-studio-panel border-studio-border text-studio-muted'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${isLive ? 'text-onair-red' : 'text-studio-muted'}`} />
            <span>{isLive ? 'ON AIR' : 'STANDBY'}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-studio-darker p-1 rounded-xl border border-studio-border">
          <button
            onClick={() => setActiveTab('timer')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'timer'
                ? 'bg-cyan-neon/15 text-cyan-neon border border-cyan-neon/30 shadow-sm'
                : 'text-studio-muted hover:text-studio-text hover:bg-studio-panel'
            }`}
          >
            Studio Timer
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'exercises'
                ? 'bg-cyan-neon/15 text-cyan-neon border border-cyan-neon/30 shadow-sm'
                : 'text-studio-muted hover:text-studio-text hover:bg-studio-panel'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Libreria Dizione
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'builder'
                ? 'bg-cyan-neon/15 text-cyan-neon border border-cyan-neon/30 shadow-sm'
                : 'text-studio-muted hover:text-studio-text hover:bg-studio-panel'
            }`}
          >
            <ListMusic className="w-4 h-4" />
            Session Builder
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'stats'
                ? 'bg-cyan-neon/15 text-cyan-neon border border-cyan-neon/30 shadow-sm'
                : 'text-studio-muted hover:text-studio-text hover:bg-studio-panel'
            }`}
          >
            <Flame className={`w-4 h-4 ${streakDays > 0 ? 'text-amber-400' : ''}`} />
            Streak ({streakDays}d)
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* AI Generator Button */}
          <button
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-violet-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Genera nuovo scioglilingua con Groq AI"
          >
            <Sparkles className="w-4 h-4 text-violet-200" />
            <span className="hidden sm:inline">Genera con</span> AI
          </button>

          {/* Focus Mode (Leggio) */}
          <button
            onClick={onOpenFocusMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-studio-panel border border-studio-border text-studio-text hover:border-cyan-neon/50 hover:text-cyan-neon text-xs sm:text-sm font-medium transition-all"
            title="Modalità Leggio / Full Screen per lo studio"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden md:inline">Focus Leggio</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="relative p-2 rounded-xl bg-studio-panel border border-studio-border text-studio-muted hover:text-white hover:border-studio-muted transition-all"
            title="Impostazioni & Chiavi API"
          >
            <SettingsIcon className="w-4 h-4" />
            {(!hasGroq || !hasHf) && (
              <span 
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                title="API Keys parziali o mancanti"
              />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Tabs Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-studio-border bg-studio-darker px-2 py-2">
        <button
          onClick={() => setActiveTab('timer')}
          className={`px-3 py-1 text-xs rounded-lg ${activeTab === 'timer' ? 'text-cyan-neon font-bold' : 'text-studio-muted'}`}
        >
          Timer
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`px-3 py-1 text-xs rounded-lg ${activeTab === 'exercises' ? 'text-cyan-neon font-bold' : 'text-studio-muted'}`}
        >
          Libreria
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-3 py-1 text-xs rounded-lg ${activeTab === 'builder' ? 'text-cyan-neon font-bold' : 'text-studio-muted'}`}
        >
          Scaletta
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-3 py-1 text-xs rounded-lg flex items-center gap-1 ${activeTab === 'stats' ? 'text-cyan-neon font-bold' : 'text-studio-muted'}`}
        >
          <Flame className="w-3 h-3 text-amber-400" />
          Streak ({streakDays})
        </button>
      </div>
    </header>
  );
};
