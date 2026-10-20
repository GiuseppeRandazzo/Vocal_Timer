import { useEffect, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { DifficultyLevel, ExerciseCategory } from '../types';

/** Unisce classi condizionali (wrapper di clsx). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Formatta i secondi come timecode MM:SS. */
export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Numero a due cifre, stile contatore hardware (01, 02, …). */
export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  respirazione: 'Respirazione',
  articolazione: 'Articolazione',
  risonanza: 'Risonanza',
  scioglilingua: 'Scioglilingua',
  'dizione-vocali': 'Vocali aperte/chiuse',
  velocita: 'Velocità',
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  estremo: 'Estremo',
};

export const DIFFICULTY_LEVEL: Record<DifficultyLevel, number> = {
  principiante: 1,
  intermedio: 2,
  estremo: 3,
};

/* --------------------------------------------------------------------------
   EVIDENZIAZIONE FONEMI
   Dal "target fonetico" dell'esercizio ricaviamo un pattern di lettere da
   evidenziare nel copione: un aiuto visivo da insegnante di dizione.
   L'ordine delle regole conta: dalle più specifiche alle più generiche.
   -------------------------------------------------------------------------- */
const PHONEME_RULES: Array<[RegExp, RegExp]> = [
  [/p-s-t/, /p+|s+|t+/],
  [/st-qu|questore/, /st|qu/],
  [/\bgli\b|\bgne\b|palatal|ʎ|ɲ/, /gli|gn/],
  [/apert|chius|timbr/, /[èéòó]/],
  [/doppi|occlusiv/, /bb|cc|dd|ff|gg|ll|mm|nn|pp|rr|ss|tt|vv|zz/],
  [/sibilant|\bs sorda|\bs sonora/, /s+/],
  [/\bz sorda|\bz sonora|affricat|\[ts\]|\[dz\]/, /z+/],
  [/\br\b|vibrant|r moscia/, /r+/],
  [/labiovelar|kiwi|\[w\]|\bqu/, /qu|k|w/],
  [/risuonat|maschera|humming|nasal/, /m+/],
];

export function getPhonemePattern(targetPhoneme: string): RegExp | null {
  const t = targetPhoneme.toLowerCase();
  for (const [test, pattern] of PHONEME_RULES) {
    if (test.test(t)) return new RegExp(pattern.source, 'gi');
  }
  return null;
}

export interface TextSegment {
  text: string;
  hit: boolean;
}

/** Divide il testo in segmenti normali / evidenziati secondo il pattern. */
export function segmentText(text: string, pattern: RegExp | null): TextSegment[] {
  if (!pattern) return [{ text, hit: false }];
  const re = new RegExp(pattern.source, 'gi');
  const out: TextSegment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    if (match.index > last) out.push({ text: text.slice(last, match.index), hit: false });
    out.push({ text: match[0], hit: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), hit: false });
  return out;
}

/** useState persistito in localStorage (per piccole preferenze di interfaccia). */
export function usePersistentState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage non disponibile: ignoriamo */
    }
  }, [key, value]);

  return [value, setValue];
}

