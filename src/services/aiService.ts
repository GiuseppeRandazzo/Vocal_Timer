import { Exercise, AIGenerationParams } from '../types';

/**
 * Servizio AI per la generazione di esercizi e scioglilingua personalizzati.
 * Utilizza Groq API con modello Llama 3 ad altissima velocità di inferenza.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

interface GroqResponsePayload {
  title: string;
  category: 'respirazione' | 'articolazione' | 'risonanza' | 'scioglilingua' | 'dizione-vocali' | 'velocita';
  targetPhoneme: string;
  difficulty: 'principiante' | 'intermedio' | 'estremo';
  text: string;
  tips: string;
  durationSeconds: number;
}

export async function generateExerciseWithAI(
  params: AIGenerationParams,
  apiKey?: string
): Promise<Exercise> {
  const activeKey = apiKey || import.meta.env.VITE_GROQ_API_KEY;

  if (!activeKey || activeKey.trim() === '' || activeKey === 'gsk_your_groq_api_key_here') {
    throw new Error(
      'Chiave Groq API non configurata. Inserisci la tua chiave API nelle Impostazioni (icona ingranaggio) oppure nel file .env.local.'
    );
  }

  const systemPrompt = `Sei un maestro di dizione e acting coach per doppiatori professionisti italiani.
Il tuo compito è creare un esercizio fonetico o uno scioglilingua inedito, calibrato con precisione chirurgica sulla lingua italiana e sulle regole fonetiche ufficiali (distinzione tra aperte/chiuse, sorde/sonore, raddoppiamenti).

DEVI rispondere ESCLUSIVAMENTE con un oggetto JSON valido, senza testo o markdown prima o dopo, avente la seguente struttura esatta:
{
  "title": "Titolo originale e stimolante dell'esercizio",
  "category": "scioglilingua" (oppure "articolazione", "dizione-vocali", "velocita", "respirazione"),
  "targetPhoneme": "Descrizione del fonema target (es. R vibrante, Sibilante sorda, ecc.)",
  "difficulty": "principiante" | "intermedio" | "estremo",
  "text": "Il testo completo dello scioglilingua o dell'esercizio da pronunciare (in lingua italiana, ritmico, sfidante)",
  "tips": "Consiglio tecnico specifico su muscoli facciali, appoggio del diaframma, posizione della lingua o della mandibola",
  "durationSeconds": 60 (durata stimata compresa tra 45 e 90)
}`;

  const userPrompt = `Crea un esercizio per:
- Fonema / Lettera / Problema target: "${params.targetPhoneme}"
- Livello di difficoltà: "${params.difficulty}"
- Categoria richiesta: "${params.category}"
${params.customContext ? `- Requisito addizionale: "${params.customContext}"` : ''}

Assicurati che il testo contenga un'alta densità del fonema target e sia perfetto per l'articolazione in sala doppiaggio.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeKey.trim()}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error?.message || `Errore HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Groq API Error: ${message}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Nessuna risposta ricevuta da Groq API.');
    }

    const parsed: GroqResponsePayload = JSON.parse(content);

    const exercise: Exercise = {
      id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: parsed.title || `Esercizio AI: ${params.targetPhoneme}`,
      category: parsed.category || params.category,
      targetPhoneme: parsed.targetPhoneme || params.targetPhoneme,
      difficulty: parsed.difficulty || params.difficulty,
      text: parsed.text,
      tips: parsed.tips || 'Mantieni una buona respirazione e scandisci con precisione.',
      durationSeconds: Number(parsed.durationSeconds) || 60,
      isCustom: true,
      isAIGenerated: true,
      createdAt: new Date().toISOString(),
    };

    return exercise;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Errore sconosciuto durante la generazione dell\'esercizio AI.');
  }
}

/**
 * Generatore offline di riserva (Fallback se la chiave Groq non è presente o offline).
 * Permette all'utente di provare la feature anche prima di inserire la chiave.
 */
export function getOfflineFallbackExercise(params: AIGenerationParams): Exercise {
  const fallbacks: Record<string, { title: string; text: string; tips: string }> = {
    R: {
      title: 'Vibrazione Rapida della R (Offline Mode)',
      text: 'Corrono rapidi i ramarri radenti le ripe ripide, rincorrendo rametti rotti nel rigagnolo rumoroso.',
      tips: 'Allena la punta della lingua a rimbalzare sugli alveoli superiori senza contrarre la gola.',
    },
    S: {
      title: 'Sussurri e Sibilanti (Offline Mode)',
      text: 'Sei saggi scimmie scivolano svelte sul sentiero scosceso, spiando sette serpenti sonnolenti nel silenzio.',
      tips: 'Mantieni l\'aria incanalata al centro della lingua senza farla sfiatare dai lati.',
    },
    Z: {
      title: 'Zingari e Zanzare (Offline Mode)',
      text: 'Zeffiro zappa lo zenzero nello zodiaco, mentre zanzare zelanti zonzano senza sosta sullo zoccolo.',
      tips: 'Distingui lo scatto dentale della Z sorda dal ronzio melodioso della Z sonora.',
    },
    Doppie: {
      title: 'Occlusioni e Doppie Labiali (Offline Mode)',
      text: 'Babbo becca bibite buone, battendo botti ben piene con bacchette brillanti.',
      tips: 'Fai percepire lo stacco netto delle doppie lettere aumentando l\'escursione muscolare.',
    },
  };

  const selectedKey = Object.keys(fallbacks).find((k) =>
    params.targetPhoneme.toLowerCase().includes(k.toLowerCase())
  ) || 'R';

  const template = fallbacks[selectedKey];

  return {
    id: `fallback-${Date.now()}`,
    title: `${template.title} [Preset Locale]`,
    category: params.category,
    targetPhoneme: params.targetPhoneme,
    difficulty: params.difficulty,
    text: template.text,
    tips: `${template.tips} (Generato dalla libreria locale di riserva. Inserisci la chiave Groq per scioglilingua AI infiniti).`,
    durationSeconds: 60,
    isCustom: true,
    isAIGenerated: false,
    createdAt: new Date().toISOString(),
  };
}
