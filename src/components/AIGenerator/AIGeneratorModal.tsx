import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Play,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { DifficultyLevel, Exercise, ExerciseCategory } from '../../types';
import { generateExerciseWithAI, getOfflineFallbackExercise } from '../../services/aiService';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useExerciseStore } from '../../store/useExerciseStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useTimerStore } from '../../store/useTimerStore';
import { cn, DIFFICULTY_LABELS } from '../../lib/ui';
import { DifficultyMeter, ScriptText } from '../ui/primitives';
import { Modal } from '../ui/Modal';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

const PHONEME_PRESETS = [
  { code: 'R', label: 'R vibrante alveolare (R moscia)', value: 'R vibrante alveolare' },
  { code: 'S', label: 'Sibilanti: S sorda vs S sonora', value: 'S sorda e S sonora' },
  { code: 'Z', label: 'Affricate: Z sorda vs Z sonora', value: 'Z sorda [ts] e Z sonora [dz]' },
  { code: 'PP', label: 'Consonanti doppie e occlusive', value: 'Consonanti doppie occlusive' },
  { code: 'È/É', label: 'Vocali aperte e chiuse (È/É · Ò/Ó)', value: 'Distinzione timbrica vocali È/É e Ò/Ó' },
  { code: 'GLI', label: 'Gruppi palatali GLI e GNE', value: 'Palatali [ʎ] GLI e [ɲ] GNE' },
  { code: 'VEL', label: 'Agilità labiale e velocità estrema', value: 'Agilità labiale e velocità' },
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

  const groqApiKey = useSettingsStore((s) => s.groqApiKey);
  const hasGroq = useSettingsStore((s) => s.hasGroqKey());
  const addExercise = useExerciseStore((s) => s.addExercise);
  const addToActiveQueue = useSessionStore((s) => s.addToActiveQueue);
  const { initExercise, start } = useTimerStore();

  const targetPhoneme = customPhoneme.trim() || selectedPreset;

  const handleGenerate = async (useFallback = false) => {
    setIsLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      if (useFallback || !hasGroq) {
        await new Promise((res) => setTimeout(res, 500));
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
      setError(err instanceof Error ? err.message : 'Errore nella generazione AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToLibrary = () => {
    if (!generatedExercise) return;
    addExercise(generatedExercise);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddToSession = () => {
    if (!generatedExercise) return;
    addToActiveQueue(generatedExercise);
    addExercise(generatedExercise);
    setSavedSuccess(true);
    setTimeout(() => onClose(), 700);
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      channel="CH-05 · Sintetizzatore dizione · Groq Llama 3"
      title="Generatore Copioni AI"
      subtitle="Componi uno scioglilingua o un esercizio calibrato sul fonema che vuoi allenare."
      icon={<Sparkles className="h-5 w-5 text-signal" />}
      size="lg"
      accent="signal"
    >
      <div className="space-y-6">
        {/* Avviso se manca la chiave Groq */}
        {!hasGroq && (
          <div className="well flex flex-col justify-between gap-3 border-cue/30 bg-cue/[0.05] p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-cue" />
              <div className="text-xs leading-relaxed text-ink-200">
                <strong className="text-cue">Chiave Groq non configurata.</strong> Puoi testare subito il generatore usando il motore offline integrato, oppure inserire la chiave Groq gratuita per testi inediti illimitati.
              </div>
            </div>
            <button onClick={onOpenSettings} className="btn btn-ghost shrink-0 text-xs">
              <SettingsIcon className="h-3.5 w-3.5 text-cue" />
              Imposta chiave
            </button>
          </div>
        )}

        {/* 1. Fonema Target */}
        <div>
          <label className="silk mb-2 block">01 · Seleziona fonema o articolazione target</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PHONEME_PRESETS.map((preset) => {
              const active = selectedPreset === preset.value && !customPhoneme;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset.value);
                    setCustomPhoneme('');
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-xs transition',
                    active
                      ? 'border-signal/60 bg-signal/[0.08] text-ink-100'
                      : 'border-ink-800 bg-ink-950 text-ink-300 hover:border-ink-700 hover:text-ink-100'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-6 min-w-[34px] items-center justify-center rounded border px-1.5 font-mono text-[10px]',
                      active
                        ? 'border-signal/50 bg-signal/15 text-signal'
                        : 'border-ink-700 bg-ink-900 text-ink-400'
                    )}
                  >
                    {preset.code}
                  </span>
                  <span className="truncate font-medium">{preset.label}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={customPhoneme}
            onChange={(e) => setCustomPhoneme(e.target.value)}
            placeholder="Oppure specifica un fonema personalizzato (es. Dentali T/D, nessi STR/SPR)…"
            className="input mt-2.5 text-xs"
          />
        </div>

        {/* 2. Difficoltà e Tipologia */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="silk mb-2 block">02 · Livello di difficoltà</label>
            <div className="seg w-full">
              {(['principiante', 'intermedio', 'estremo'] as DifficultyLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  data-active={difficulty === lvl}
                  onClick={() => setDifficulty(lvl)}
                  className="seg-item flex-1 justify-center text-xs"
                >
                  {DIFFICULTY_LABELS[lvl]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="silk mb-2 block">03 · Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
              className="input text-xs"
            >
              <option value="scioglilingua">Scioglilingua fonetico</option>
              <option value="articolazione">Articolazione muscolare</option>
              <option value="dizione-vocali">Timbro vocali È/É e Ò/Ó</option>
              <option value="velocita">Velocità e fiato unico</option>
              <option value="respirazione">Controllo diaframmatico</option>
            </select>
          </div>
        </div>

        {/* 3. Contesto opzionale */}
        <div>
          <label className="silk mb-1.5 block">04 · Contesto o registro attoriale (opzionale)</label>
          <input
            type="text"
            value={customContext}
            onChange={(e) => setCustomContext(e.target.value)}
            placeholder="Es. 'monologo noir drammatico', 'spot pubblicitario brillante', 'narrazione fiaba'…"
            className="input text-xs"
          />
        </div>

        {/* Eventuale errore */}
        {error && (
          <div className="well flex items-center justify-between gap-3 border-tally/40 bg-tally/10 p-3.5 text-xs text-ink-100">
            <span>{error}</span>
            <button onClick={() => handleGenerate(true)} className="btn btn-ghost shrink-0 py-1 text-xs">
              Usa preset locale
            </button>
          </div>
        )}

        {/* Pulsante genera */}
        <button
          onClick={() => handleGenerate(false)}
          disabled={isLoading}
          className="btn btn-primary w-full py-3 text-sm font-semibold"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Composizione copione in corso…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              {hasGroq ? 'Componi nuovo copione con AI' : 'Genera copione di prova (Offline)'}
            </>
          )}
        </button>

        {/* Skeleton durante l'attesa */}
        {isLoading && (
          <div className="well space-y-3 p-5">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-3 w-2/3" />
          </div>
        )}

        {/* Anteprima copione generato */}
        {generatedExercise && !isLoading && (
          <div className="well space-y-4 border-signal/35 p-5 animate-rise">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="silk text-signal">Copione generato</span>
                <span className="h-3 w-px bg-ink-800" />
                <span className="font-mono text-xs text-ink-300">{generatedExercise.targetPhoneme}</span>
              </div>
              <div className="flex items-center gap-3">
                <DifficultyMeter level={generatedExercise.difficulty} />
                <span className="silk text-ink-400">{generatedExercise.durationSeconds}s</span>
              </div>
            </div>

            <h4 className="font-display text-2xl font-medium text-ink-100">
              {generatedExercise.title}
            </h4>

            <div className="rounded-xl border border-ink-700/80 bg-ink-950/75 p-4">
              <ScriptText
                text={`“${generatedExercise.text}”`}
                targetPhoneme={generatedExercise.targetPhoneme}
                highlight={true}
                className="font-display text-lg font-light leading-relaxed text-ink-100"
              />
            </div>

            <p className="border-l-2 border-cue/70 pl-3 font-display text-xs italic text-ink-300">
              {generatedExercise.tips}
            </p>

            <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-3">
              <button onClick={handlePlayNow} className="btn btn-primary text-xs">
                <Play className="h-3.5 w-3.5 fill-current" />
                Subito sul leggio
              </button>
              <button onClick={handleAddToSession} className="btn btn-signal text-xs">
                <Plus className="h-3.5 w-3.5" />
                Aggiungi in scaletta
              </button>
              <button onClick={handleSaveToLibrary} disabled={savedSuccess} className="btn btn-ghost text-xs">
                {savedSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-go" />
                    Salvato in archivio
                  </>
                ) : (
                  'Salva in libreria'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
