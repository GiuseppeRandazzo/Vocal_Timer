import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Key, 
  Volume2, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Smartphone,
  Play
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { audioEngine } from '../../services/audioEngine';

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

  if (!isOpen) return null;

  // Test rapido connessione Groq API
  const handleTestGroq = async () => {
    if (!groqApiKey || groqApiKey.trim() === '') {
      setTestGroqStatus('error');
      setTestGroqMsg('Inserisci prima una chiave Groq API.');
      return;
    }

    setTestGroqStatus('testing');
    setTestGroqMsg('Verifica connessione con server Groq...');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${groqApiKey.trim()}`,
        },
      });

      if (response.ok) {
        setTestGroqStatus('success');
        setTestGroqMsg('Connessione riuscita! Llama 3 su Groq è attivo e pronto.');
      } else {
        const data = await response.json().catch(() => ({}));
        setTestGroqStatus('error');
        setTestGroqMsg(data?.error?.message || `Errore HTTP ${response.status}: chiave non valida.`);
      }
    } catch (err: unknown) {
      setTestGroqStatus('error');
      setTestGroqMsg(err instanceof Error ? err.message : 'Impossibile raggiungere Groq API.');
    }
  };

  // Test rapido connessione Hugging Face API
  const handleTestHf = async () => {
    if (!hfApiKey || hfApiKey.trim() === '') {
      setTestHfStatus('error');
      setTestHfMsg('Inserisci prima un token Hugging Face.');
      return;
    }

    setTestHfStatus('testing');
    setTestHfMsg('Verifica token con Hugging Face...');

    try {
      const response = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: {
          Authorization: `Bearer ${hfApiKey.trim()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestHfStatus('success');
        setTestHfMsg(`Autenticato con successo come "${data.name || 'Utente HF'}"! Whisper è abilitato.`);
      } else {
        setTestHfStatus('error');
        setTestHfMsg(`Errore ${response.status}: token non valido o non riconosciuto.`);
      }
    } catch (err: unknown) {
      setTestHfStatus('error');
      setTestHfMsg(err instanceof Error ? err.message : 'Impossibile raggiungere Hugging Face.');
    }
  };

  const handleTestSound = () => {
    audioEngine.playCiak(soundVolume);
    setTimeout(() => {
      audioEngine.playCountdownBeep(soundVolume);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-studio-darker border border-studio-border rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 bg-studio-panel border-b border-studio-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-neon/15 text-cyan-neon border border-cyan-neon/30">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Impostazioni Studio & Chiavi AI
              </h3>
              <p className="text-xs text-studio-muted">Configurazione API, segnali acustici e preferenze</p>
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
          
          {/* Sezione Chiavi API */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-studio-border">
              <Key className="w-4 h-4 text-cyan-neon" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Integrazioni Chiavi API (AI Engine)
              </h4>
            </div>

            {/* Groq API Key */}
            <div className="p-4 rounded-2xl bg-studio-panel/70 border border-studio-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    Groq API Key
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      Llama 3
                    </span>
                  </label>
                  <p className="text-[11px] text-studio-muted">
                    Utilizzata per generare scioglilingua ed esercizi in tempo reale in frazioni di secondo.
                  </p>
                </div>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-medium text-cyan-neon hover:underline"
                >
                  <span>Ottieni Gratis</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showGroqKey ? 'text' : 'password'}
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full pl-3 pr-10 py-2 rounded-xl bg-studio-darkest border border-studio-border text-xs text-white font-mono placeholder-studio-muted focus:outline-none focus:border-cyan-neon"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-studio-muted hover:text-white"
                  >
                    {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestGroq}
                  disabled={testGroqStatus === 'testing'}
                  className="px-3 py-2 rounded-xl bg-studio-darkest hover:bg-studio-border text-xs font-semibold text-studio-text border border-studio-border transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  {testGroqStatus === 'testing' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  <span>Test API</span>
                </button>
              </div>

              {testGroqStatus === 'success' && (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{testGroqMsg}</span>
                </div>
              )}
              {testGroqStatus === 'error' && (
                <div className="text-[11px] text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{testGroqMsg}</span>
                </div>
              )}
            </div>

            {/* Hugging Face Token */}
            <div className="p-4 rounded-2xl bg-studio-panel/70 border border-studio-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    Hugging Face Access Token
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Whisper Large-v3
                    </span>
                  </label>
                  <p className="text-[11px] text-studio-muted">
                    Utilizzato per trascrivere con altissima fedeltà la tua voce al microfono.
                  </p>
                </div>
                <a
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-medium text-cyan-neon hover:underline"
                >
                  <span>Crea Token</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showHfKey ? 'text' : 'password'}
                    value={hfApiKey}
                    onChange={(e) => setHfApiKey(e.target.value)}
                    placeholder="hf_..."
                    className="w-full pl-3 pr-10 py-2 rounded-xl bg-studio-darkest border border-studio-border text-xs text-white font-mono placeholder-studio-muted focus:outline-none focus:border-cyan-neon"
                  />
                  <button
                    type="button"
                    onClick={() => setShowHfKey(!showHfKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-studio-muted hover:text-white"
                  >
                    {showHfKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestHf}
                  disabled={testHfStatus === 'testing'}
                  className="px-3 py-2 rounded-xl bg-studio-darkest hover:bg-studio-border text-xs font-semibold text-studio-text border border-studio-border transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  {testHfStatus === 'testing' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  <span>Test API</span>
                </button>
              </div>

              {testHfStatus === 'success' && (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{testHfMsg}</span>
                </div>
              )}
              {testHfStatus === 'error' && (
                <div className="text-[11px] text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{testHfMsg}</span>
                </div>
              )}
            </div>

            {/* Privacy notice */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-cyan-950/20 border border-cyan-900/30 text-[11px] text-cyan-200/80">
              <ShieldCheck className="w-4 h-4 text-cyan-neon shrink-0 mt-0.5" />
              <p>
                <strong>Sicurezza e Privacy Locale:</strong> Le tue chiavi API non vengono mai inviate a server intermedi. Sono salvate esclusivamente nella memoria locale del tuo browser (localStorage) o lette dal tuo file <code className="bg-black/40 px-1 py-0.5 rounded">.env.local</code>.
              </p>
            </div>
          </div>

          {/* Sezione Suoni & Feedback */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-studio-border">
              <Volume2 className="w-4 h-4 text-cyan-neon" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Audio & Feedback Tattile (Web Audio API)
              </h4>
            </div>

            {/* Toggle Suoni */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-studio-panel border border-studio-border">
              <div>
                <span className="text-xs font-bold text-white block">
                  Segnali Acustici da Studio
                </span>
                <span className="text-[11px] text-studio-muted">
                  Beep sincronismo 3-2-1 a 1000Hz, ciak inizio e accordo armonico di fine esercizio.
                </span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 accent-cyan-neon cursor-pointer"
              />
            </div>

            {/* Slider Volume */}
            {soundEnabled && (
              <div className="p-3.5 rounded-xl bg-studio-panel border border-studio-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Volume Segnali Audio</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-neon">
                      {Math.round(soundVolume * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={handleTestSound}
                      className="p-1 rounded bg-studio-darkest hover:bg-studio-border text-cyan-neon text-xs flex items-center gap-1 px-2 border border-studio-border"
                      title="Ascolta prova audio"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Prova</span>
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(Number(e.target.value))}
                  className="w-full accent-cyan-neon cursor-pointer"
                />
              </div>
            )}

            {/* Toggle Vibrazione */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-studio-panel border border-studio-border">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-neon" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Vibrazione al Termine (Mobile)
                  </span>
                  <span className="text-[11px] text-studio-muted">
                    Feedback aptico tramite Vibration API quando l'esercizio termina.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(e) => setVibrationEnabled(e.target.checked)}
                className="w-4 h-4 accent-cyan-neon cursor-pointer"
              />
            </div>

            {/* Toggle Auto-Advance */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-studio-panel border border-studio-border">
              <div>
                <span className="text-xs font-bold text-white block">
                  Avanzamento Automatico Esercizi
                </span>
                <span className="text-[11px] text-studio-muted">
                  Passa automaticamente all'esercizio successivo della scaletta al termine del tempo.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="w-4 h-4 accent-cyan-neon cursor-pointer"
              />
            </div>

          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-neon text-black font-semibold text-xs hover:bg-cyan-400 transition-all shadow-md"
            >
              Chiudi e Salva
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
