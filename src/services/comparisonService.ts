import { ComparisonResult, DiffWord } from '../types';

/**
 * Normalizza una singola parola rimuovendo punteggiatura comune italiana
 * mantenendo gli accenti fonetici rilevanti.
 */
function cleanWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
    .trim();
}

/**
 * Calcola la distanza di Levenshtein tra due stringhe
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sostituzione
          matrix[i][j - 1] + 1,     // inserimento
          matrix[i - 1][j] + 1      // cancellazione
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calcola la somiglianza percentuale tra due parole (0 a 1)
 */
function wordSimilarity(w1: string, w2: string): number {
  if (w1 === w2) return 1;
  const maxLen = Math.max(w1.length, w2.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(w1, w2);
  return 1 - dist / maxLen;
}

/**
 * Confronta il testo originale dello scioglilingua con la trascrizione audio
 * e calcola il diff parola per parola con accuratezza %.
 */
export function compareSpeechToOriginal(
  originalText: string,
  spokenText: string
): ComparisonResult {
  const rawOriginalTokens = originalText.trim().split(/\s+/).filter(Boolean);
  const rawSpokenTokens = spokenText.trim().split(/\s+/).filter(Boolean);

  const cleanOriginal = rawOriginalTokens.map(cleanWord);
  const cleanSpoken = rawSpokenTokens.map(cleanWord);

  const resultWords: DiffWord[] = [];
  let spokenIndex = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let omittedCount = 0;

  // Scansione e allineamento sequenziale con finestra di tolleranza
  for (let i = 0; i < rawOriginalTokens.length; i++) {
    const origWord = rawOriginalTokens[i];
    const origClean = cleanOriginal[i];

    if (origClean === '') {
      continue;
    }

    // Cerchiamo una corrispondenza nei token pronunciati entro una finestra di 3 parole
    let matchedIndex = -1;
    let bestSimilarity = 0;
    const windowEnd = Math.min(cleanSpoken.length, spokenIndex + 4);

    for (let j = spokenIndex; j < windowEnd; j++) {
      const sim = wordSimilarity(origClean, cleanSpoken[j]);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        matchedIndex = j;
      }
    }

    if (matchedIndex !== -1 && bestSimilarity >= 0.82) {
      // Corrispondenza quasi perfetta o identica
      resultWords.push({
        id: `word-${i}`,
        text: origWord,
        clean: origClean,
        status: 'correct',
        recognizedAs: rawSpokenTokens[matchedIndex],
      });
      correctCount++;
      spokenIndex = matchedIndex + 1;
    } else if (matchedIndex !== -1 && bestSimilarity >= 0.45) {
      // Parola storpiata o mal articolata
      resultWords.push({
        id: `word-${i}`,
        text: origWord,
        clean: origClean,
        status: 'wrong',
        recognizedAs: rawSpokenTokens[matchedIndex],
      });
      wrongCount++;
      spokenIndex = matchedIndex + 1;
    } else {
      // Parola saltata / omessa
      resultWords.push({
        id: `word-${i}`,
        text: origWord,
        clean: origClean,
        status: 'omitted',
      });
      omittedCount++;
    }
  }

  // Parole pronunciate extra dall'utente
  const addedCount = Math.max(0, cleanSpoken.length - (correctCount + wrongCount));

  const totalWords = resultWords.length || 1;
  const rawScore = (correctCount / totalWords) * 100;
  // Piccolo malus per parole in più
  const penalty = Math.min(15, addedCount * 2);
  const accuracyScore = Math.max(0, Math.min(100, Math.round(rawScore - penalty)));

  // Generazione del giudizio vocale tecnico
  let feedbackNote = '';
  if (accuracyScore >= 95) {
    feedbackNote = '🌟 Livello Sala Doppiaggio! Articolazione impeccabile, ritmo e dizione al vertice.';
  } else if (accuracyScore >= 85) {
    feedbackNote = '👏 Ottima prova! Dizione molto pulita, solo piccolissime incertezze o vocali veloci.';
  } else if (accuracyScore >= 70) {
    feedbackNote = '👍 Buona articolazione generale. Rallenta leggermente il tempo e scandisci le consonanti doppie.';
  } else if (accuracyScore >= 50) {
    feedbackNote = '⚠️ Articolazione sotto sforzo. Esegui prima un lip-trill di riscaldamento ed enfatizza l\'apertura della bocca.';
  } else {
    feedbackNote = '🎯 Molte parole omesse o storpiate. Prova a ripetere lo scioglilingua sillabando a metronomo lento.';
  }

  return {
    accuracyScore,
    words: resultWords,
    spokenText,
    originalText,
    stats: {
      totalWords,
      correctWords: correctCount,
      wrongWords: wrongCount,
      omittedWords: omittedCount,
      addedWords: addedCount,
    },
    feedbackNote,
  };
}
