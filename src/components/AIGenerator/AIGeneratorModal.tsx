import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Play, 
  Plus, 
  Check, 
  AlertCircle, 
  Flame, 
  Wand2, 
  Settings as SettingsIcon,
  RefreshCw
} from 'lucide-react';
import { Exercise, DifficultyLevel, ExerciseCategory } from '../../types';
import { generateExerciseWithAI, getOfflineFallbackExercise } from '../../services/aiService';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useExerciseStore } from '../../store/useExerciseStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useTimerStore } from '../../store/useTimerStore';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

const PHONEME_PRESETS = [
  { label: 'R vibrante alveolare (R moscia)', value: 'R vibrante alveolare' },
  { label: 'Sibilanti: S sorda vs S sonora', value: 'S sorda e S sonora' },
  { label: 'Affricate: Z sorda vs Z sonora', value: 'Z sorda [ts] e Z sonora [dz]' },
  { label: 'Consonanti doppie e occlusive (P, T, C)', value: 'Consonanti doppie occlusive' },
  { label: 'Vocali aperte e chiuse (È/É e Ò/Ó)', value: 'Distinzione timbrica vocali È/É e Ò/Ó' },
  { label: 'Gruppi palatali GLI e GNE', value: 'Palatali [ʎ] GLI e [ɲ] GNE' },
  { label: 'Scioglilingua di agilità e velocità estrema', value: 'Agilità labiale e velocità' },
];

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(PHONEME_PRESETS[0].value);
  const [customPhoneme, setCustomPhoneme] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermedio');
  const [category, setCategory] = useState<ExerciseCategory>('scioglilingua');
  const [customContext, setCustomContext] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedExercise, setGeneratedExercise] = useState<Exercise | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const groqApiKey = useSettingsStore((state) => state.groqApiKey);
  const hasGroq = useSettingsStore((state) => state.hasGroqKey());
  const addExercise = useExerciseStore((state) => state.addExercise);
  const addToActiveQueue = useSessionStore((state) => state.addToActiveQueue);
  const { initExercise, start } = useTimerStore();

  if (!isOpen) return null;

  const targetPhoneme = customPhoneme.trim() || selectedPreset;

  const handleGenerate = async (useFallback = false) => {
    setIsLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      if (useFallback || !hasGroq) {
        // Simulazione caricamento leggero per feedback utente
        await new Promise((res) => setTimeout(res, 600));
        const fallback = getOfflineFallbackExercise({
          targetPhoneme,
          difficulty,
          category,
          customContext,
        });
        setGeneratedExercise(fallback);
      } else {
        const result = await generateExerciseWithAI(
          {
            targetPhoneme,
            difficulty,
            category,
            customContext,
          },
          groqApiKey
        );
        setGeneratedExercise(result);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Errore nella generazione dell\'esercizio con AI.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToLibrary = () => {
    if (!generatedExercise) return;
    addExercise(generatedExercise);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddToSession = () => {
    if (!generatedExercise) return;
    addToActiveQueue(generatedExercise);
    addExercise(generatedExercise);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handlePlayNow = () => {
    if (!generatedExercise) return;
    addExercise(generatedExercise);
    addToActiveQueue(generatedExercise);
    initExercise(generatedExercise);
    start();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-studio-darker border border-studio-border rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header con gradiente */}
        <div className="relative p-6 bg-gradient-to-r from-violet-950/60 via-studio-panel to-studio-panel border-b border-studio-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Generatore Esercizi & Scioglilingua AI
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/40">
                  Groq Llama 3
                </span>
              </h3>
              <p className="text-xs text-studio-muted">Crea esercizi calibrati su misura per la tua voce e dizione</p>
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
          
          {/* Warning se manca la chiave Groq */}
          {!hasGroq && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs sm:text-sm text-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-amber-300 block mb-1">
                  Chiave Groq API non rilevata
                </span>
                <p className="text-amber-200/90 mb-2">
                  Puoi provare la generazione tramite il <strong>motore offline di riserva</strong>, oppure inserire la tua chiave Groq gratuita per generare scioglilingua inediti con Llama 3.
                </p>
                <button
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-xs border border-amber-500/40 transition-all"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  Configura Groq API Key
                </button>
              </div>
            </div>
          )}

          {/* Form di Configurazione */}
          <div className="space-y-4">
            
            {/* Target Fonetico Preset */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-studio-muted mb-2">
                1. Seleziona il Fonema o la Lettera Target
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PHONEME_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(preset.value);
                      setCustomPhoneme('');
                    }}
                    className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      selectedPreset === preset.value && !customPhoneme
                        ? 'bg-violet-600/20 border-violet-500 text-violet-200 shadow-sm'
                        : 'bg-studio-panel/70 border-studio-border text-studio-muted hover:text-white hover:bg-studio-panel'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Input personalizzato */}
              <div className="mt-2.5">
                <input
                  type="text"
                  value={customPhoneme}
                  onChange={(e) => setCustomPhoneme(e.target.value)}
                  placeholder="Oppure scrivi un fonema o combinazione specifica (es. GLI + GN, Dente-labiale F/V)..."
                  className="w-full px-3.5 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-white placeholder-studio-muted focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Livello di Difficoltà */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-studio-muted mb-2">
                2. Livello di Difficoltà
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['principiante', 'intermedio', 'estremo'] as DifficultyLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold capitalize border transition-all flex items-center justify-center gap-1.5 ${
                      difficulty === lvl
                        ? lvl === 'estremo'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-violet-600/20 border-violet-500 text-violet-200'
                        : 'bg-studio-panel/70 border-studio-border text-studio-muted hover:text-white'
                    }`}
                  >
                    {lvl === 'estremo' && <Flame className="w-3.5 h-3.5 text-rose-400" />}
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-studio-muted mb-2">
                3. Tipologia Esercizio
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-studio-panel border border-studio-border text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="scioglilingua">Scioglilingua Fonetico Tradizionale / Creativo</option>
                <option value="articolazione">Esercizio di Articolazione e Muscoli Facciali</option>
                <option value="dizione-vocali">Dizione Vocali Aperte e Chiuse (È/É e Ò/Ó)</option>
                <option value="velocita">Velocità e Tenuta d'Aria (Doppiaggio rapido)</option>
                <option value="respirazione">Respirazione & Appoggio Diaframmatico</option>
              </select>
            </div>

            {/* Contesto addizionale opzionale */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-studio-muted mb-2">
                4. Contesto o Tema Specifico (Opzionale)
              </label>
              <input
                type="text"
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="Es. 'tono drammatico teatrale', 'ritmo comico sincrono per cartoni animati'..."
                className="w-full px-3.5 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-white placeholder-studio-muted focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Errore */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => handleGenerate(true)}
                className="underline hover:text-white shrink-0 ml-2"
              >
                Usa fallback offline
              </button>
            </div>
          )}

          {/* Bottone Genera */}
          <button
            onClick={() => handleGenerate(false)}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-violet-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-violet-200" />
                <span>Generazione con Groq Llama 3 in corso...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-violet-200" />
                <span>Genera Nuovo Esercizio con AI</span>
              </>
            )}
          </button>

          {/* Risultato Generato */}
          {generatedExercise && (
            <div className="mt-6 p-5 rounded-2xl bg-studio-darkest border border-violet-500/30 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                  Esercizio Generato:
                </span>
                <span className="text-xs font-mono text-studio-muted">
                  {generatedExercise.durationSeconds}s
                </span>
              </div>

              <h4 className="text-lg font-bold text-white">
                {generatedExercise.title}
              </h4>

              <div className="p-4 rounded-xl bg-studio-panel border border-studio-border">
                <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
                  "{generatedExercise.text}"
                </p>
              </div>

              <div className="text-xs text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <strong>Consiglio Vocale:</strong> {generatedExercise.tips}
              </div>

              {/* Azioni sull'esercizio generato */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <button
                  onClick={handlePlayNow}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-neon text-black font-semibold text-xs hover:bg-cyan-400 transition-all shadow-md shadow-cyan-neon/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Avvia nel Timer</span>
                </button>

                <button
                  onClick={handleAddToSession}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-md shadow-violet-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi alla Scaletta</span>
                </button>

                <button
                  onClick={handleSaveToLibrary}
                  disabled={savedSuccess}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-studio-panel hover:bg-studio-border text-studio-text font-semibold text-xs border border-studio-border transition-all"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Salvato!</span>
                    </>
                  ) : (
                    <>
                      <span>Salva in Libreria</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
