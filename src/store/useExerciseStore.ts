import { create } from 'zustand';
import { Exercise, ExerciseCategory, DifficultyLevel } from '../types';
import { PRESET_EXERCISES } from '../data/presetExercises';

interface ExerciseState {
  exercises: Exercise[];
  searchQuery: string;
  selectedCategory: ExerciseCategory | 'all';
  selectedDifficulty: DifficultyLevel | 'all';
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ExerciseCategory | 'all') => void;
  setSelectedDifficulty: (difficulty: DifficultyLevel | 'all') => void;
  addExercise: (exercise: Exercise) => void;
  updateExercise: (id: string, updated: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  getFilteredExercises: () => Exercise[];
}

const CUSTOM_EXERCISES_STORAGE = 'vocal_timer_custom_exercises_v1';

const getStoredExercises = (): Exercise[] => {
  try {
    const saved = localStorage.getItem(CUSTOM_EXERCISES_STORAGE);
    if (saved) {
      const custom: Exercise[] = JSON.parse(saved);
      // Evitiamo duplicati con gli ID dei preset
      const presetIds = new Set(PRESET_EXERCISES.map((e) => e.id));
      const filteredCustom = custom.filter((c) => !presetIds.has(c.id));
      return [...PRESET_EXERCISES, ...filteredCustom];
    }
  } catch (e) {
    console.warn('Errore lettura esercizi salvati', e);
  }
  return PRESET_EXERCISES;
};

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: getStoredExercises(),
  searchQuery: '',
  selectedCategory: 'all',
  selectedDifficulty: 'all',

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),

  addExercise: (newEx: Exercise) => {
    set((state) => {
      const updated = [newEx, ...state.exercises];
      try {
        const customOnly = updated.filter((e) => e.isCustom || e.isAIGenerated);
        localStorage.setItem(CUSTOM_EXERCISES_STORAGE, JSON.stringify(customOnly));
      } catch (e) {
        console.warn('Errore salvataggio esercizio', e);
      }
      return { exercises: updated };
    });
  },

  updateExercise: (id: string, fields: Partial<Exercise>) => {
    set((state) => {
      const updated = state.exercises.map((ex) =>
        ex.id === id ? { ...ex, ...fields } : ex
      );
      try {
        const customOnly = updated.filter((e) => e.isCustom || e.isAIGenerated);
        localStorage.setItem(CUSTOM_EXERCISES_STORAGE, JSON.stringify(customOnly));
      } catch (e) {
        console.warn('Errore salvataggio modifica', e);
      }
      return { exercises: updated };
    });
  },

  deleteExercise: (id: string) => {
    set((state) => {
      const updated = state.exercises.filter((ex) => ex.id !== id);
      try {
        const customOnly = updated.filter((e) => e.isCustom || e.isAIGenerated);
        localStorage.setItem(CUSTOM_EXERCISES_STORAGE, JSON.stringify(customOnly));
      } catch (e) {
        console.warn('Errore salvataggio cancellazione', e);
      }
      return { exercises: updated };
    });
  },

  getFilteredExercises: () => {
    const { exercises, searchQuery, selectedCategory, selectedDifficulty } = get();

    return exercises.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.targetPhoneme.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const matchesDifficulty =
        selectedDifficulty === 'all' || item.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  },
}));
