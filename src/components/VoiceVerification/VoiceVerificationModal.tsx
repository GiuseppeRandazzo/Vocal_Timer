import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Mic, 
  Square, 
  RotateCcw, 
  AlertTriangle, 
  Volume2, 
  Loader2, 
  Award
} from 'lucide-react';
import { Exercise, ComparisonResult } from '../../types';
import { VoiceRecorderService, LiveAudioData } from '../../services/mediaRecorderService';
import { transcribeAudioWithHF, transcribeWithBrowserSpeech } from '../../services/sttService';
import { compareSpeechToOriginal } from '../../services/comparisonService';
import { useSettingsStore } from '../../store/useSettingsStore';

interface VoiceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onOpenSettings: () => void;
}

export const VoiceVerificationModal: React.FC<VoiceVerificationModalProps> = ({
  isOpen,
  onClose,
  exercise,
  onOpenSettings,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [frequencyBars, setFrequencyBars] = useState<number[]>(new Array(16).fill(0));

  const recorderServiceRef = useRef<VoiceRecorderService | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const hfApiKey = useSettingsStore((state) => state.hfApiKey);
  const hasHf = useSettingsStore((state) => state.hasHfKey());

  useEffect(() => {
    return () => {
      // Cleanup su unmount
      if (recorderServiceRef.current) {
        recorderServiceRef.current.cancelRecording();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  if (!isOpen || !exercise) return null;

  const handleStartRecording = async () => {
    setErrorMessage(null);
    setComparisonResult(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordDuration(0);

    try {
      recorderServiceRef.current = new VoiceRecorderService();
      await recorderServiceRef.current.startRecording((data: LiveAudioData) => {
        // Campiona 16 barre per il VU meter
        const step = Math.floor(data.frequencyData.length / 16);
        const bars: number[] = [];
        for (let i = 0; i < 16; i++) {
          bars.push(data.frequencyData[i * step] || 0);
        }
        setFrequencyBars(bars);
      });

      setIsRecording(true);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Impossibile avviare il microfono.');
      }
    }
  };

  const handleStopRecording = async () => {
    if (!recorderServiceRef.current || !isRecording) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    try {
      const blob = await recorderServiceRef.current.stopRecording();
      setIsRecording(false);
      setFrequencyBars(new Array(16).fill(0));
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Procedi all'analisi automatica
      await processAudioAnalysis(blob);
    } catch (err: unknown) {
      setIsRecording(false);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Errore nel salvataggio dell\'audio registrato.');
      }
    }
  };

  const processAudioAnalysis = async (blob: Blob) => {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      let transcribedText = '';

      if (hasHf) {
        setStatusMessage('Trascrizione in corso con Hugging Face Whisper Large-v3...');
        transcribedText = await transcribeAudioWithHF(blob, hfApiKey);
      } else {
        setStatusMessage('Chiave Hugging Face non inserita: trascrizione locale con Web Speech API...');
        transcribedText = await transcribeWithBrowserSpeech();
      }

      setStatusMessage('Analisi comparativa della dizione fonetica...');
      const comparison = compareSpeechToOriginal(exercise.text, transcribedText);
      setComparisonResult(comparison);
      setStatusMessage('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Errore durante l\'analisi vocale.');
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFallbackLocalSTT = async () => {
    setIsTranscribing(true);
    setErrorMessage(null);
    setStatusMessage('Avvio riconoscimento vocale Web Speech...');

    try {
      const transcript = await transcribeWithBrowserSpeech();
      const comparison = compareSpeechToOriginal(exercise.text, transcript);
      setComparisonResult(comparison);
      setStatusMessage('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Errore nel riconoscimento vocale locale.');
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-studio-darker border border-studio-border rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header Modale */}
        <div className="p-6 bg-gradient-to-r from-cyan-950/40 via-studio-panel to-studio-panel border-b border-studio-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-neon/15 text-cyan-neon border border-cyan-neon/30">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Verifica Dizione & Articolazione Vocale
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-neon/15 text-cyan-neon border border-cyan-neon/30">
                  AI Speech-to-Text
                </span>
              </h3>
              <p className="text-xs text-studio-muted">Registra il tuo take al microfono per misurare accuratezza e fonemi</p>
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
          
          {/* Box Testo Scioglilingua da pronunciare */}
          <div className="bg-studio-darkest p-5 rounded-2xl border border-studio-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-cyan-neon uppercase tracking-wider">
                Testo da Recitare ({exercise.title}):
              </span>
              <span className="text-xs text-studio-muted font-mono">
                Target: {exercise.targetPhoneme}
              </span>
            </div>
            <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
              "{exercise.text}"
            </p>
          </div>

          {/* Area Registratore & VU-Meter Live */}
          <div className="p-6 rounded-2xl bg-studio-panel/70 border border-studio-border flex flex-col items-center justify-center text-center">
            
            {/* Live VU Meter LED Bars */}
            <div className="h-16 flex items-end justify-center gap-1.5 w-full max-w-xs mb-4">
              {frequencyBars.map((val, idx) => {
                const heightPercent = isRecording ? Math.max(8, Math.min(100, (val / 255) * 100)) : 8;
                const isHigh = heightPercent > 75;
                const isMid = heightPercent > 40;

                return (
                  <div
                    key={idx}
                    style={{ height: `${heightPercent}%` }}
                    className={`w-2.5 rounded-t-sm transition-all duration-75 ${
                      isRecording
                        ? isHigh
                          ? 'bg-rose-500 shadow-rose-500/50 shadow-sm'
                          : isMid
                            ? 'bg-amber-400'
                            : 'bg-cyan-neon shadow-cyan-neon/30 shadow-sm'
                        : 'bg-studio-border'
                    }`}
                  />
                );
              })}
            </div>

            {/* Timer Durata Registrazione */}
            <div className="font-mono text-2xl font-bold mb-4 flex items-center gap-2">
              {isRecording && (
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping inline-block" />
              )}
              <span className={isRecording ? 'text-rose-400' : 'text-studio-muted'}>
                00:{recordDuration.toString().padStart(2, '0')}
              </span>
            </div>

            {/* Pulsante Principale Microfono */}
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={isTranscribing}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-tr from-cyan-neon to-cyan-500 text-black font-bold text-sm shadow-xl shadow-cyan-neon/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <Mic className="w-5 h-5" />
                <span>Inizia a Registrare</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-xl shadow-rose-500/40 animate-pulse transition-all"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>Ferma e Analizza Dizione</span>
              </button>
            )}

            {/* Player Riascolto Take */}
            {audioUrl && !isRecording && (
              <div className="mt-4 w-full max-w-sm flex items-center gap-3 p-2.5 rounded-xl bg-studio-darkest border border-studio-border">
                <Volume2 className="w-4 h-4 text-cyan-neon shrink-0 ml-1" />
                <audio
                  ref={audioPlayerRef}
                  src={audioUrl}
                  controls
                  className="w-full h-8 rounded-lg outline-none"
                />
              </div>
            )}
          </div>

          {/* Stato di Trascrizione / Loading */}
          {isTranscribing && (
            <div className="p-4 rounded-2xl bg-studio-panel border border-cyan-neon/30 flex items-center justify-center gap-3 text-cyan-300">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-neon" />
              <span className="text-sm font-medium">{statusMessage}</span>
            </div>
          )}

          {/* Errore con supporto e fallback */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleFallbackLocalSTT}
                  className="px-3 py-1.5 rounded-lg bg-studio-darker border border-studio-border hover:border-cyan-neon text-cyan-neon text-xs font-medium transition-all"
                >
                  Riprova con Riconoscimento Vocale Browser Nativo
                </button>
                <button
                  onClick={onOpenSettings}
                  className="px-3 py-1.5 rounded-lg bg-studio-darker border border-studio-border hover:border-white text-studio-text text-xs font-medium transition-all"
                >
                  Verifica Chiave Hugging Face
                </button>
              </div>
            </div>
          )}

          {/* Risultato Analisi Comparativa Fonetica */}
          {comparisonResult && !isTranscribing && (
            <div className="p-6 rounded-2xl bg-studio-darkest border border-studio-border space-y-5 animate-in fade-in duration-300">
              
              {/* Header Punteggio */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-studio-panel/70 border border-studio-border">
                <div className="flex items-center gap-4">
                  <div className={`relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center border shadow-lg ${
                    comparisonResult.accuracyScore >= 85
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : comparisonResult.accuracyScore >= 70
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  }`}>
                    <span className="text-2xl font-mono font-black">
                      {comparisonResult.accuracyScore}%
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">
                      Accuratezza
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      Valutazione Articolatoria
                    </h4>
                    <p className="text-xs text-studio-muted mt-0.5">
                      {comparisonResult.feedbackNote}
                    </p>
                  </div>
                </div>

                {/* Badge Statistiche */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ {comparisonResult.stats.correctWords} Corrette
                  </span>
                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    ~ {comparisonResult.stats.wrongWords} Storpiate
                  </span>
                  <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    ✗ {comparisonResult.stats.omittedWords} Omesse
                  </span>
                </div>
              </div>

              {/* Mappa Dettagliata Parola per Parola */}
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-studio-muted mb-2">
                  Verifica Fonetica Dettagliata:
                </span>
                <div className="p-4 rounded-xl bg-studio-panel/50 border border-studio-border flex flex-wrap gap-2 leading-relaxed text-sm sm:text-base">
                  {comparisonResult.words.map((word) => {
                    if (word.status === 'correct') {
                      return (
                        <span
                          key={word.id}
                          className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium"
                          title="Pronunciata correttamente"
                        >
                          {word.text}
                        </span>
                      );
                    }
                    if (word.status === 'wrong') {
                      return (
                        <span
                          key={word.id}
                          className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium relative group cursor-help"
                          title={`Hai detto: "${word.recognizedAs || 'non chiaro'}"`}
                        >
                          {word.text}
                          <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-amber-200 text-[10px] rounded whitespace-nowrap z-10 border border-amber-500/30">
                            Detto: {word.recognizedAs}
                          </span>
                        </span>
                      );
                    }
                    // omitted
                    return (
                      <span
                        key={word.id}
                        className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 line-through font-medium"
                        title="Parola omessa o saltata"
                      >
                        {word.text}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Trascrizione Grezza Rilevata */}
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-studio-muted mb-1.5">
                  Trascrizione Audio Rilevata (Whisper):
                </span>
                <div className="p-3 rounded-xl bg-studio-panel/30 border border-studio-border text-xs text-studio-muted font-mono">
                  "{comparisonResult.spokenText || 'Nessun testo rilevato'}"
                </div>
              </div>

              {/* Bottone per riprovare */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleStartRecording}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-studio-panel hover:bg-studio-border text-studio-text text-xs font-semibold border border-studio-border transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Registra un Altro Take</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
