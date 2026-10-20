import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Play,
  Settings as SettingsIcon,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { audioEngine } from '../../services/audioEngine';
import { Modal } from '../ui/Modal';
import { Switch } from '../ui/primitives';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    groqApiKey,
    hfApiKey,
    soundEnabled,
    vibrationEnabled,
    soundVolume,
    autoAdvance,
    setGroqApiKey,
    setHfApiKey,
    setSoundEnabled,
    setVibrationEnabled,
    setSoundVolume,
    setAutoAdvance,
  } = useSettingsStore();

  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showHfKey, setShowHfKey] = useState(false);

  const [testGroqStatus, setTestGroqStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testGroqMsg, setTestGroqMsg] = useState('');

  const [testHfStatus, setTestHfStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testHfMsg, setTestHfMsg] = useState('');

  const handleTestGroq = async () => {
    if (!groqApiKey || groqApiKey.trim() === '') {
      setTestGroqStatus('error');
      setTestGroqMsg('Inserisci prima una chiave Groq API.');
      return;
    }

    setTestGroqStatus('testing');
    setTestGroqMsg('Verifica credenziali con Groq…');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${groqApiKey.trim()}` },
      });

      if (response.ok) {
        setTestGroqStatus('success');
        setTestGroqMsg('Collegamento attivo: motore Llama 3 pronto.');
      } else {
        const data = await response.json().catch(() => ({}));
        setTestGroqStatus('error');
        setTestGroqMsg(data?.error?.message || `Errore HTTP ${response.status}: chiave non valida.`);
      }
    } catch (err: unknown) {
      setTestGroqStatus('error');
      setTestGroqMsg(err instanceof Error ? err.message : 'Impossibile contattare Groq API.');
    }
  };

  const handleTestHf = async () => {
    if (!hfApiKey || hfApiKey.trim() === '') {
      setTestHfStatus('error');
      setTestHfMsg('Inserisci prima un token Hugging Face.');
      return;
    }

    setTestHfStatus('testing');
    setTestHfMsg('Verifica token su Hugging Face…');

    try {
      const response = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: { Authorization: `Bearer ${hfApiKey.trim()}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTestHfStatus('success');
        setTestHfMsg(`Autenticato come "${data.name || 'Utente HF'}": Whisper attivo.`);
      } else {
        setTestHfStatus('error');
        setTestHfMsg(`Errore ${response.status}: token non riconosciuto.`);
      }
    } catch (err: unknown) {
      setTestHfStatus('error');
      setTestHfMsg(err instanceof Error ? err.message : 'Impossibile contattare Hugging Face.');
    }
  };

  const handleTestSound = () => {
    audioEngine.playCiak(soundVolume);
    setTimeout(() => {
      audioEngine.playCountdownBeep(soundVolume);
    }, 250);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      channel="CH-07 · Configurazione banco"
      title="Impostazioni Studio & API"
      subtitle="Configura le chiavi AI e calibra i segnali acustici di sincronismo."
      icon={<SettingsIcon className="h-5 w-5 text-signal" />}
      size="lg"
      footer={
        <div className="flex justify-end">
          <button onClick={onClose} className="btn btn-primary text-xs">
            Chiudi pannello
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Sezione Chiavi API */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 text-signal" />
            <span className="silk text-ink-300">Moduli AI & Credenziali</span>
          </div>

          {/* Groq */}
          <div className="well space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-medium text-ink-100">
                    Groq API Key
                  </span>
                  <span className="chip border-signal/30 text-signal">Llama 3.3</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-400">
                  Generazione istantanea di scioglilingua ed esercizi fonetici su misura.
                </p>
              </div>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-signal hover:underline"
              >
                console.groq.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="gsk_…"
                  className="input pr-9 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-200"
                  aria-label="Mostra o nascondi chiave Groq"
                >
                  {showGroqKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleTestGroq}
                disabled={testGroqStatus === 'testing'}
                className="btn btn-ghost text-xs"
              >
                {testGroqStatus === 'testing' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Test
              </button>
            </div>

            {testGroqStatus === 'success' && (
              <p className="flex items-center gap-1.5 text-xs text-go">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {testGroqMsg}
              </p>
            )}
            {testGroqStatus === 'error' && (
              <p className="flex items-center gap-1.5 text-xs text-tally">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {testGroqMsg}
              </p>
            )}
          </div>

          {/* Hugging Face */}
          <div className="well space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-medium text-ink-100">
                    Hugging Face Access Token
                  </span>
                  <span className="chip border-cue/30 text-cue">Whisper v3</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-400">
                  Trascrizione vocale ad alta precisione per la verifica della dizione.
                </p>
              </div>
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-signal hover:underline"
              >
                hf.co/settings/tokens <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showHfKey ? 'text' : 'password'}
                  value={hfApiKey}
                  onChange={(e) => setHfApiKey(e.target.value)}
                  placeholder="hf_…"
                  className="input pr-9 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowHfKey(!showHfKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-200"
                  aria-label="Mostra o nascondi token Hugging Face"
                >
                  {showHfKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleTestHf}
                disabled={testHfStatus === 'testing'}
                className="btn btn-ghost text-xs"
              >
                {testHfStatus === 'testing' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Test
              </button>
            </div>

            {testHfStatus === 'success' && (
              <p className="flex items-center gap-1.5 text-xs text-go">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {testHfMsg}
              </p>
            )}
            {testHfStatus === 'error' && (
              <p className="flex items-center gap-1.5 text-xs text-tally">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {testHfMsg}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-ink-800 bg-ink-950/70 p-3 text-xs text-ink-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
            <p>
              Le credenziali restano esclusivamente nel tuo browser (<code className="font-mono text-ink-200">localStorage</code>) o nel file locale <code className="font-mono text-ink-200">.env.local</code>.
            </p>
          </div>
        </section>

        {/* Sezione Audio & Sincronismo */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-signal" />
            <span className="silk text-ink-300">Segnali acustici & Comportamento</span>
          </div>

          <div className="well divide-y divide-ink-800">
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <span className="block text-sm font-medium text-ink-100">
                  Segnali di sincronismo da sala
                </span>
                <span className="text-xs text-ink-400">
                  Ciak d'avvio, beep a 1000 Hz negli ultimi 3 secondi e accordo finale.
                </span>
              </div>
              <Switch
                checked={soundEnabled}
                onChange={setSoundEnabled}
                label="Segnali di sincronismo da sala"
              />
            </div>

            {soundEnabled && (
              <div className="space-y-2.5 p-4">
                <div className="flex items-center justify-between">
                  <span className="silk text-ink-300">Guadagno uscita segnali</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-signal">
                      {Math.round(soundVolume * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={handleTestSound}
                      className="btn btn-ghost px-2.5 py-1 text-xs"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Prova tono
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(Number(e.target.value))}
                  className="w-full accent-signal cursor-pointer"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <span className="block text-sm font-medium text-ink-100">
                  Avanzamento automatico scaletta
                </span>
                <span className="text-xs text-ink-400">
                  Passa automaticamente al take successivo al termine del countdown.
                </span>
              </div>
              <Switch
                checked={autoAdvance}
                onChange={setAutoAdvance}
                label="Avanzamento automatico scaletta"
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <span className="block text-sm font-medium text-ink-100">
                  Feedback aptico (Mobile)
                </span>
                <span className="text-xs text-ink-400">
                  Vibrazione sul dispositivo al completamento dell'esercizio.
                </span>
              </div>
              <Switch
                checked={vibrationEnabled}
                onChange={setVibrationEnabled}
                label="Feedback aptico"
              />
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
};
