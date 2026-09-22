import { create } from 'zustand';
import { Exercise } from '../types';
import { audioEngine } from '../services/audioEngine';
import { useSettingsStore } from './useSettingsStore';
import { useSessionStore } from './useSessionStore';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

interface TimerState {
  status: TimerStatus;
  duration: number;
  timeLeft: number;
  currentExercise: Exercise | null;
  elapsedSessionSeconds: number;
  timerIntervalId: number | null;

  // Actions
  initExercise: (exercise: Exercise) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  addSeconds: (sec: number) => void;
  tick: () => void;
  nextExercise: () => void;
  prevExercise: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  status: 'idle',
  duration: 60,
  timeLeft: 60,
  currentExercise: null,
  elapsedSessionSeconds: 0,
  timerIntervalId: null,

  initExercise: (exercise: Exercise) => {
    const { timerIntervalId } = get();
    if (timerIntervalId) {
      window.clearInterval(timerIntervalId);
    }

    set({
      status: 'idle',
      currentExercise: exercise,
      duration: exercise.durationSeconds,
      timeLeft: exercise.durationSeconds,
      timerIntervalId: null,
    });
  },

  start: () => {
    const { status, timeLeft, tick } = get();
    const settings = useSettingsStore.getState();

    if (settings.soundEnabled) {
      audioEngine.playCiak(settings.soundVolume);
    }

    if (status === 'running') return;

    const intervalId = window.setInterval(() => {
      tick();
    }, 1000);

    set({
      status: 'running',
      timerIntervalId: intervalId,
      timeLeft: timeLeft <= 0 ? get().duration : timeLeft,
    });
  },

  pause: () => {
    const { timerIntervalId } = get();
    if (timerIntervalId) {
      window.clearInterval(timerIntervalId);
    }
    set({
      status: 'paused',
      timerIntervalId: null,
    });
  },

  resume: () => {
    const { status, tick } = get();
    if (status !== 'paused') return;

    const intervalId = window.setInterval(() => {
      tick();
    }, 1000);

    set({
      status: 'running',
      timerIntervalId: intervalId,
    });
  },

  reset: () => {
    const { timerIntervalId, duration } = get();
    if (timerIntervalId) {
      window.clearInterval(timerIntervalId);
    }
    set({
      status: 'idle',
      timeLeft: duration,
      timerIntervalId: null,
    });
  },

  addSeconds: (sec: number) => {
    set((state) => ({
      timeLeft: Math.max(5, state.timeLeft + sec),
      duration: Math.max(state.duration, state.timeLeft + sec),
    }));
  },

  tick: () => {
    const { timeLeft, timerIntervalId, duration } = get();
    const settings = useSettingsStore.getState();

    if (timeLeft <= 1) {
      // Fine esercizio!
      if (timerIntervalId) {
        window.clearInterval(timerIntervalId);
      }

      if (settings.soundEnabled) {
        audioEngine.playCompletionChime(settings.soundVolume);
      }
      if (settings.vibrationEnabled) {
        audioEngine.triggerVibration([150, 100, 200]);
      }

      set((state) => ({
        status: 'completed',
        timeLeft: 0,
        timerIntervalId: null,
        elapsedSessionSeconds: state.elapsedSessionSeconds + duration,
      }));

      // Avanzamento automatico se attivo
      if (settings.autoAdvance) {
        setTimeout(() => {
          get().nextExercise();
        }, 1500);
      }
      return;
    }

    const nextTime = timeLeft - 1;

    // Beep di sincronismo countdown da doppiaggio (3, 2, 1)
    if (nextTime <= 3 && nextTime > 0 && settings.soundEnabled) {
      audioEngine.playCountdownBeep(settings.soundVolume);
    }

    set((state) => ({
      timeLeft: nextTime,
      elapsedSessionSeconds: state.elapsedSessionSeconds + 1,
    }));
  },

  nextExercise: () => {
    const sessionStore = useSessionStore.getState();
    const { activeQueue, currentQueueIndex, setCurrentQueueIndex } = sessionStore;

    if (currentQueueIndex < activeQueue.length - 1) {
      const nextIdx = currentQueueIndex + 1;
      setCurrentQueueIndex(nextIdx);
      const nextEx = activeQueue[nextIdx];
      get().initExercise(nextEx);
      get().start();
    } else {
      // Scaletta completata!
      const { timerIntervalId } = get();
      if (timerIntervalId) {
        window.clearInterval(timerIntervalId);
      }
      set({ status: 'completed', timerIntervalId: null });

      // Salva sessione nello storico
      sessionStore.logCompletedSession({
        sessionName: 'Sessione Vocale',
        durationSeconds: get().elapsedSessionSeconds,
        exercisesCompleted: activeQueue.length,
      });
    }
  },

  prevExercise: () => {
    const sessionStore = useSessionStore.getState();
    const { activeQueue, currentQueueIndex, setCurrentQueueIndex } = sessionStore;

    if (currentQueueIndex > 0) {
      const prevIdx = currentQueueIndex - 1;
      setCurrentQueueIndex(prevIdx);
      const prevEx = activeQueue[prevIdx];
      get().initExercise(prevEx);
      get().start();
    }
  },
}));
