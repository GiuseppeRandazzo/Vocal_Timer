/**
 * Servizio di Speech-to-Text per la trascrizione vocale.
 * Utilizza l'API Hugging Face Inference con il modello openai/whisper-large-v3.
 * Include fallback automatico su Web Speech Recognition API nativa del browser (Chrome, Edge, Safari).
 */

const HF_WHISPER_URL = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3';

export async function transcribeAudioWithHF(
  audioBlob: Blob,
  apiKey?: string
): Promise<string> {
  const activeKey = apiKey || import.meta.env.VITE_HF_API_KEY;

  if (!activeKey || activeKey.trim() === '' || activeKey === 'hf_your_huggingface_token_here') {
    throw new Error(
      'Token Hugging Face non configurato. Inserisci il token nelle Impostazioni (icona ingranaggio) oppure nel file .env.local.'
    );
  }

  try {
    const response = await fetch(HF_WHISPER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activeKey.trim()}`,
        'Content-Type': audioBlob.type || 'audio/webm',
      },
      body: audioBlob,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 503) {
        const estimatedTime = errorData?.estimated_time ? ` (attesa stimata: ${Math.round(errorData.estimated_time)}s)` : '';
        throw new Error(
          `Il modello Whisper si sta avviando sui server gratuiti di Hugging Face${estimatedTime}. Riprova tra pochi istanti.`
        );
      }
      const message = errorData?.error || `Errore HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Hugging Face API Error: ${message}`);
    }

    const data = await response.json();
    
    // Whisper HF restituisce solitamente { text: "Trascrizione..." }
    if (typeof data.text === 'string') {
      return data.text.trim();
    }
    
    if (Array.isArray(data) && data[0]?.text) {
      return data[0].text.trim();
    }

    throw new Error('Formato di risposta non riconosciuto da Hugging Face Whisper.');
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Errore imprevisto durante la trascrizione audio.');
  }
}

/**
 * Trascrizione tramite Web Speech API nativa del browser (fallback locale senza API Key).
 */
export function transcribeWithBrowserSpeech(): Promise<string> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return reject(new Error('Il tuo browser non supporta la Web Speech API nativa. Usa Google Chrome o Microsoft Edge, oppure inserisci la chiave Hugging Face.'));
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let fullTranscript = '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      fullTranscript = transcript;
    };

    recognition.onerror = (event: { error: string }) => {
      reject(new Error(`Errore riconoscimento vocale browser: ${event.error}`));
    };

    recognition.onend = () => {
      if (fullTranscript.trim()) {
        resolve(fullTranscript.trim());
      } else {
        reject(new Error('Nessun parlato rilevato dal microfono. Prova a parlare più vicino al microfono scandendo le parole.'));
      }
    };

    recognition.start();
  });
}
