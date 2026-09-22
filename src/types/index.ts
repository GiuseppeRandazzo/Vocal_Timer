export type ExerciseCategory = 
  | 'respirazione'
  | 'articolazione'
  | 'risonanza'
  | 'scioglilingua'
  | 'dizione-vocali'
  | 'velocita';

export type DifficultyLevel = 'principiante' | 'intermedio' | 'estremo';

export interface Exercise {
  id: string;
  title: string;
  category: ExerciseCategory;
  targetPhoneme: string;
  difficulty: DifficultyLevel;
  text: string;
  tips: string;
  durationSeconds: number;
  isCustom?: boolean;
  isAIGenerated?: boolean;
  createdAt?: string;
}

export type WordDiffStatus = 'correct' | 'wrong' | 'omitted' | 'added';

export interface DiffWord {
  id: string;
  text: string;
  clean: string;
  status: WordDiffStatus;
  recognizedAs?: string;
}

export interface ComparisonResult {
  accuracyScore: number;
  words: DiffWord[];
  spokenText: string;
  originalText: string;
  stats: {
    totalWords: number;
    correctWords: number;
    wrongWords: number;
    omittedWords: number;
    addedWords: number;
  };
  feedbackNote: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  description: string;
  exerciseIds: string[];
  isPreset?: boolean;
  createdAt?: string;
}

export interface SessionHistoryEntry {
  id: string;
  date: string; // ISO date string
  sessionName: string;
  durationSeconds: number;
  exercisesCompleted: number;
  averageAccuracy?: number;
}

export interface AppSettings {
  groqApiKey: string;
  hfApiKey: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundVolume: number; // 0 to 1
  autoAdvance: boolean;
  focusFontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export interface LiveAudioData {
  volume: number; // 0 to 100
  frequencyData: Uint8Array;
}

export interface AIGenerationParams {
  targetPhoneme: string;
  difficulty: DifficultyLevel;
  category: ExerciseCategory;
  customContext?: string;
}
