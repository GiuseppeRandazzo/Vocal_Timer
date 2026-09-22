import { create } from 'zustand';
import { AppSettings } from '../types';

interface SettingsState extends AppSettings {
  setGroqApiKey: (key: string) => void;
  setHfApiKey: (key: string) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setAutoAdvance: (enabled: boolean) => void;
  setFocusFontSize: (size: AppSettings['focusFontSize']) => void;
  hasGroqKey: () => boolean;
  hasHfKey: () => boolean;
}

const STORAGE_KEY = 'vocal_timer_settings_v1';

const getInitialSettings = (): AppSettings => {
  const envGroq = import.meta.env.VITE_GROQ_API_KEY || '';
  const envHf = import.meta.env.VITE_HF_API_KEY || '';

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        groqApiKey: parsed.groqApiKey || envGroq,
        hfApiKey: parsed.hfApiKey || envHf,
        soundEnabled: parsed.soundEnabled ?? true,
        vibrationEnabled: parsed.vibrationEnabled ?? true,
        soundVolume: parsed.soundVolume ?? 0.7,
        autoAdvance: parsed.autoAdvance ?? true,
        focusFontSize: parsed.focusFontSize ?? 'xl',
      };
    }
  } catch (e) {
    console.warn('Errore lettura settings da localStorage', e);
  }

  return {
    groqApiKey: envGroq,
    hfApiKey: envHf,
    soundEnabled: true,
    vibrationEnabled: true,
    soundVolume: 0.7,
    autoAdvance: true,
    focusFontSize: 'xl',
  };
};

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = getInitialSettings();

  const persist = (partial: Partial<AppSettings>) => {
    try {
      const current = {
        groqApiKey: get().groqApiKey,
        hfApiKey: get().hfApiKey,
        soundEnabled: get().soundEnabled,
        vibrationEnabled: get().vibrationEnabled,
        soundVolume: get().soundVolume,
        autoAdvance: get().autoAdvance,
        focusFontSize: get().focusFontSize,
        ...partial,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('Errore salvataggio settings in localStorage', e);
    }
  };

  return {
    ...initial,
    setGroqApiKey: (groqApiKey: string) => {
      persist({ groqApiKey });
      set({ groqApiKey });
    },
    setHfApiKey: (hfApiKey: string) => {
      persist({ hfApiKey });
      set({ hfApiKey });
    },
    setSoundEnabled: (soundEnabled: boolean) => {
      persist({ soundEnabled });
      set({ soundEnabled });
    },
    setVibrationEnabled: (vibrationEnabled: boolean) => {
      persist({ vibrationEnabled });
      set({ vibrationEnabled });
    },
    setSoundVolume: (soundVolume: number) => {
      persist({ soundVolume });
      set({ soundVolume });
    },
    setAutoAdvance: (autoAdvance: boolean) => {
      persist({ autoAdvance });
      set({ autoAdvance });
    },
    setFocusFontSize: (focusFontSize: AppSettings['focusFontSize']) => {
      persist({ focusFontSize });
      set({ focusFontSize });
    },
    hasGroqKey: () => {
      const key = get().groqApiKey;
      return Boolean(key && key.trim() !== '' && key !== 'gsk_your_groq_api_key_here');
    },
    hasHfKey: () => {
      const key = get().hfApiKey;
      return Boolean(key && key.trim() !== '' && key !== 'hf_your_huggingface_token_here');
    },
  };
});
