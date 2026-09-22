import { create } from 'zustand';
import { WorkoutSession, SessionHistoryEntry, Exercise } from '../types';
import { PRESET_SESSIONS, PRESET_EXERCISES } from '../data/presetExercises';

interface SessionState {
  sessions: WorkoutSession[];
  activeQueue: Exercise[];
  currentQueueIndex: number;
  history: SessionHistoryEntry[];

  // Actions
  setActiveQueue: (queue: Exercise[]) => void;
  addToActiveQueue: (exercise: Exercise) => void;
  removeFromActiveQueue: (index: number) => void;
  clearActiveQueue: () => void;
  setCurrentQueueIndex: (index: number) => void;
  reorderActiveQueue: (startIndex: number, endIndex: number) => void;
  
  loadSessionIntoQueue: (sessionId: string, allExercises: Exercise[]) => void;
  saveCustomSession: (name: string, description: string, exerciseIds: string[]) => WorkoutSession;
  deleteCustomSession: (sessionId: string) => void;
  
  logCompletedSession: (entry: Omit<SessionHistoryEntry, 'id' | 'date'>) => void;
  getStreakDays: () => number;
  getTotalMinutes: () => number;
}

const CUSTOM_SESSIONS_STORAGE = 'vocal_timer_custom_sessions_v1';
const HISTORY_STORAGE = 'vocal_timer_history_v1';

const getInitialSessions = (): WorkoutSession[] => {
  try {
    const saved = localStorage.getItem(CUSTOM_SESSIONS_STORAGE);
    if (saved) {
      const custom = JSON.parse(saved);
      return [...PRESET_SESSIONS, ...custom];
    }
  } catch (e) {
    console.warn('Errore lettura sessioni', e);
  }
  return PRESET_SESSIONS;
};

const getInitialHistory = (): SessionHistoryEntry[] => {
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Errore lettura storico', e);
  }
  return [];
};

// Coda iniziale: prima sessione preset (Express)
const getInitialQueue = (): Exercise[] => {
  const defaultSession = PRESET_SESSIONS[0];
  return defaultSession.exerciseIds
    .map((id) => PRESET_EXERCISES.find((e) => e.id === id))
    .filter((e): e is Exercise => Boolean(e));
};

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: getInitialSessions(),
  activeQueue: getInitialQueue(),
  currentQueueIndex: 0,
  history: getInitialHistory(),

  setActiveQueue: (queue: Exercise[]) => {
    set({ activeQueue: queue, currentQueueIndex: 0 });
  },

  addToActiveQueue: (exercise: Exercise) => {
    set((state) => ({
      activeQueue: [...state.activeQueue, exercise],
    }));
  },

  removeFromActiveQueue: (index: number) => {
    set((state) => {
      const updated = state.activeQueue.filter((_, i) => i !== index);
      const newIndex = Math.min(state.currentQueueIndex, Math.max(0, updated.length - 1));
      return { activeQueue: updated, currentQueueIndex: newIndex };
    });
  },

  clearActiveQueue: () => {
    set({ activeQueue: [], currentQueueIndex: 0 });
  },

  setCurrentQueueIndex: (index: number) => {
    const maxIdx = Math.max(0, get().activeQueue.length - 1);
    const clamped = Math.max(0, Math.min(index, maxIdx));
    set({ currentQueueIndex: clamped });
  },

  reorderActiveQueue: (startIndex: number, endIndex: number) => {
    set((state) => {
      const result = Array.from(state.activeQueue);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { activeQueue: result };
    });
  },

  loadSessionIntoQueue: (sessionId: string, allExercises: Exercise[]) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const queue = session.exerciseIds
      .map((id) => allExercises.find((e) => e.id === id))
      .filter((e): e is Exercise => Boolean(e));

    set({ activeQueue: queue, currentQueueIndex: 0 });
  },

  saveCustomSession: (name: string, description: string, exerciseIds: string[]) => {
    const newSession: WorkoutSession = {
      id: `custom-session-${Date.now()}`,
      name,
      description,
      exerciseIds,
      isPreset: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updated = [...state.sessions, newSession];
      try {
        const customOnly = updated.filter((s) => !s.isPreset);
        localStorage.setItem(CUSTOM_SESSIONS_STORAGE, JSON.stringify(customOnly));
      } catch (e) {
        console.warn('Errore salvataggio sessione', e);
      }
      return { sessions: updated };
    });

    return newSession;
  },

  deleteCustomSession: (sessionId: string) => {
    set((state) => {
      const updated = state.sessions.filter((s) => s.id !== sessionId);
      try {
        const customOnly = updated.filter((s) => !s.isPreset);
        localStorage.setItem(CUSTOM_SESSIONS_STORAGE, JSON.stringify(customOnly));
      } catch (e) {
        console.warn('Errore cancellazione sessione', e);
      }
      return { sessions: updated };
    });
  },

  logCompletedSession: (entry) => {
    const newEntry: SessionHistoryEntry = {
      ...entry,
      id: `hist-${Date.now()}`,
      date: new Date().toISOString(),
    };

    set((state) => {
      const updated = [newEntry, ...state.history];
      try {
        localStorage.setItem(HISTORY_STORAGE, JSON.stringify(updated));
      } catch (e) {
        console.warn('Errore salvataggio storico', e);
      }
      return { history: updated };
    });
  },

  getStreakDays: () => {
    const { history } = get();
    if (history.length === 0) return 0;

    const uniqueDates = Array.from(
      new Set(
        history.map((h) => new Date(h.date).toISOString().split('T')[0])
      )
    ).sort().reverse();

    if (uniqueDates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Se l'ultimo allenamento non è né oggi né ieri, lo streak si è interrotto
    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterday) {
      return 0;
    }

    let streak = 0;
    let expectedDate = new Date(uniqueDates[0]);

    for (const dateStr of uniqueDates) {
      const currentDate = new Date(dateStr);
      const diffTime = expectedDate.getTime() - currentDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      if (diffDays <= 1) {
        streak++;
        expectedDate = currentDate;
      } else {
        break;
      }
    }

    return streak;
  },

  getTotalMinutes: () => {
    const { history } = get();
    const totalSecs = history.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    return Math.round(totalSecs / 60);
  },
}));
