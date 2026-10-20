import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Loader2,
  Mic,
  RotateCcw,
  Square,
  Volume2,
} from 'lucide-react';
import { ComparisonResult, Exercise } from '../../types';
import { LiveAudioData, VoiceRecorderService } from '../../services/mediaRecorderService';
import { transcribeAudioWithHF, transcribeWithBrowserSpeech } from '../../services/sttService';
import { compareSpeechToOriginal } from '../../services/comparisonService';
import { useSettingsStore } from '../../store/useSettingsStore';
import { cn, formatTime } from '../../lib/ui';
import { ScriptText, TallyLight } from '../ui/primitives';
import { Modal } from '../ui/Modal';

interface VoiceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onOpenSettings: () => void;
}

const BAR_COUNT = 24;

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
  const [frequencyBars, setFrequencyBars] = useState<number[]>(new Array(BAR_COUNT).fill(0));

  const recorderServiceRef = useRef<VoiceRecorderService | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const hfApiKey = useSettingsStore((s) => s.hfApiKey);
  const hasHf = useSettingsStore((s) => s.hasHfKey());

  useEffect(() => {
    return () => {
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

  if (!exercise) return null;

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
        const step = Math.max(1, Math.floor(data.frequencyData.length / BAR_COUNT));
        const bars: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          bars.push(data.frequencyData[i * step] || 0);
        }
        setFrequencyBars(bars);
      });

      setIsRecording(true);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Impossibile accedere al microfono.');
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
      setFrequencyBars(new Array(BAR_COUNT).fill(0));
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      await processAudioAnalysis(blob);
    } catch (err: unknown) {
      setIsRecording(false);
      setErrorMessage(err instanceof Error ? err.message : 'Errore nel salvataggio del take audio.');
    }
  };

  const processAudioAnalysis = async (blob: Blob) => {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      let transcribedText = '';
      if (hasHf) {
        setStatusMessage('Trascrizione in corso con Hugging Face Whisper Large-v3…');
        transcribedText = await transcribeAudioWithHF(blob, hfApiKey);
      } else {
        setStatusMessage('Token HF non presente: ascolto tramite Web Speech API del browser…');
        transcribedText = await transcribeWithBrowserSpeech();
      }

      setStatusMessage('Allineamento fonetico e verifica del copione…');
      const comparison = compareSpeechToOriginal(exercise.text, transcribedText);
      setComparisonResult(comparison);
      setStatusMessage('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Errore durante la trascrizione vocale.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFallbackLocalSTT = async () => {
    setIsTranscribing(true);
    setErrorMessage(null);
    setStatusMessage('Ascolto attivo tramite riconoscimento vocale del browser: leggi ora il testo…');

    try {
      const transcript = await transcribeWithBrowserSpeech();
      const comparison = compareSpeechToOriginal(exercise.text, transcript);
      setComparisonResult(comparison);
      setStatusMessage('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Errore nel riconoscimento vocale locale.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      channel="CH-04 · Cabina di registrazione · Whisper STT"
      title="Verifica Dizione & Articolazione"
      subtitle="Incidi il take al microfono: l'AI confronterà ogni parola con il copione originale."
      icon={<Mic className="h-5 w-5 text-tally" />}
      size="xl"
      accent="tally"
    >
      <div className="space-y-6">
        {/* Copione da incidere */}
        <div className="well p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-ink-700/70 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="silk">Copione da incidere</span>
              <span className="h-3 w-px bg-ink-700" />
              <span className="font-mono text-xs text-signal">{exercise.targetPhoneme}</span>
            </div>
            <TallyLight live={isRecording} label={isRecording ? 'REC' : 'READY'} />
          </div>

          <ScriptText
            text={`“${exercise.text}”`}
            targetPhoneme={exercise.targetPhoneme}
            highlight={true}
            className="font-display text-xl font-light leading-relaxed text-ink-100 sm:text-2xl"
          />
        </div>

        {/* Banco di registrazione + VU Meter */}
        <div className="well flex flex-col items-center p-6 text-center">
          {/* Scala dB */}
          <div className="mb-2 flex w-full max-w-md justify-between font-mono text-[9px] text-ink-500">
            <span>-36 dB</span>
            <span>-24</span>
            <span>-12</span>
            <span className="text-cue">-6</span>
            <span className="text-tally">0 PEAK</span>
          </div>

          {/* Barre spettrali LED */}
          <div className="flex h-16 w-full max-w-md items-end justify-between gap-1 rounded-md border border-ink-800 bg-ink-900 px-3 py-2">
            {frequencyBars.map((val, idx) => {
              const pct = isRecording ? Math.max(10, Math.min(100, (val / 255) * 100)) : 10;
              const isPeak = pct > 78;
              const isWarm = pct > 45;
              return (
                <div
                  key={idx}
                  style={{ height: `${pct}%` }}
                  className={cn(
                    'flex-1 rounded-[1px] transition-all duration-75',
                    isRecording
                      ? isPeak
                        ? 'bg-tally shadow-[0_0_8px_rgba(255,69,58,0.8)]'
                        : isWarm
                          ? 'bg-cue'
                          : 'bg-go shadow-[0_0_6px_rgba(82,227,160,0.5)]'
                      : 'bg-ink-700'
                  )}
                />
              );
            })}
          </div>

          {/* Timecode registrazione */}
          <div className="mt-4 flex items-center gap-2 font-mono text-3xl font-medium tabular-nums">
            <span className={cn('h-2 w-2 rounded-full', isRecording ? 'animate-ping bg-tally' : 'bg-ink-600')} />
            <span className={isRecording ? 'text-tally' : 'text-ink-300'}>
              {formatTime(recordDuration)}
            </span>
          </div>

          {/* Pulsante REC / STOP */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={isTranscribing}
                className="btn btn-rec px-6 py-3 text-sm font-semibold"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-tally shadow-[0_0_10px_rgba(255,69,58,0.9)]" />
                Inizia registrazione take
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="btn border border-tally bg-tally px-6 py-3 text-sm font-semibold text-ink-950 shadow-[0_10px_30px_-8px_rgba(255,69,58,0.85)]"
              >
                <Square className="h-4 w-4 fill-current" />
                Ferma e analizza dizione
              </button>
            )}
          </div>

          {/* Player riascolto */}
          {audioUrl && !isRecording && (
            <div className="mt-5 flex w-full max-w-md items-center gap-3 rounded-lg border border-ink-800 bg-ink-900 px-3 py-2">
              <Volume2 className="h-4 w-4 shrink-0 text-signal" />
              <audio ref={audioPlayerRef} src={audioUrl} controls className="h-8 w-full" />
            </div>
          )}
        </div>

        {/* Stato di elaborazione */}
        {isTranscribing && (
          <div className="well flex items-center justify-center gap-3 border-signal/30 p-4 text-xs text-signal">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Errore con opzioni di recupero */}
        {errorMessage && (
          <div className="well space-y-3 border-tally/40 bg-tally/[0.06] p-4">
            <div className="flex items-start gap-2.5 text-xs text-ink-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-tally" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleFallbackLocalSTT} className="btn btn-signal py-1.5 text-xs">
                Usa riconoscimento vocale del browser
              </button>
              <button onClick={onOpenSettings} className="btn btn-ghost py-1.5 text-xs">
                Configura token Hugging Face
              </button>
            </div>
          </div>
        )}

        {/* Risultato analisi comparativa */}
        {comparisonResult && !isTranscribing && (
          <div className="well space-y-5 p-5 animate-rise">
            {/* Punteggio e giudizio */}
            <div className="flex flex-col justify-between gap-4 border-b border-ink-800 pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border font-mono',
                    comparisonResult.accuracyScore >= 85
                      ? 'border-go/40 bg-go/10 text-go'
                      : comparisonResult.accuracyScore >= 70
                        ? 'border-cue/40 bg-cue/10 text-cue'
                        : 'border-tally/40 bg-tally/10 text-tally'
                  )}
                >
                  <span className="text-2xl font-bold tabular-nums">
                    {comparisonResult.accuracyScore}%
                  </span>
                  <span className="text-[9px] uppercase tracking-widest opacity-80">Dizione</span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-cue" />
                    <span className="silk text-ink-300">Esito fonetico</span>
                  </div>
                  <p className="mt-1 font-display text-base text-ink-100">
                    {comparisonResult.feedbackNote}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                <span className="rounded border border-go/30 bg-go/10 px-2.5 py-1 text-go">
                  ✓ {comparisonResult.stats.correctWords} esatte
                </span>
                <span className="rounded border border-cue/30 bg-cue/10 px-2.5 py-1 text-cue">
                  ~ {comparisonResult.stats.wrongWords} imprecise
                </span>
                <span className="rounded border border-tally/30 bg-tally/10 px-2.5 py-1 text-tally">
                  ✗ {comparisonResult.stats.omittedWords} omesse
                </span>
              </div>
            </div>

            {/* Mappa parola per parola */}
            <div>
              <span className="silk mb-2.5 block">Allineamento parola per parola sul copione</span>
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-ink-800 bg-ink-900 p-4 font-display text-lg leading-relaxed">
                {comparisonResult.words.map((word) => {
                  if (word.status === 'correct') {
                    return (
                      <span
                        key={word.id}
                        className="rounded border border-go/30 bg-go/10 px-2 py-0.5 text-go"
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
                        className="group relative cursor-help rounded border border-cue/40 bg-cue/15 px-2 py-0.5 text-cue"
                        title={`Rilevato: "${word.recognizedAs || '—'}"`}
                      >
                        {word.text}
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded border border-cue/40 bg-ink-950 px-2 py-1 font-mono text-[10px] text-cue shadow-lg group-hover:block">
                          Udito: “{word.recognizedAs}”
                        </span>
                      </span>
                    );
                  }
                  return (
                    <span
                      key={word.id}
                      className="rounded border border-tally/30 bg-tally/10 px-2 py-0.5 text-tally line-through"
                      title="Parola omessa"
                    >
                      {word.text}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Trascrizione rilevata */}
            <div>
              <span className="silk mb-1.5 block">Trascrizione grezza rilevata</span>
              <p className="rounded-lg border border-ink-800 bg-ink-900 p-3 font-mono text-xs text-ink-300">
                “{comparisonResult.spokenText || 'Nessun parlato rilevato'}”
              </p>
            </div>

            <div className="flex justify-end">
              <button onClick={handleStartRecording} className="btn btn-ghost text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                Incidi un altro take
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
