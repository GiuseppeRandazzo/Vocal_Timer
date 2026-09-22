/**
 * Gestore del microfono e registrazione audio tramite MediaRecorder API e Web Audio Analyser.
 * Fornisce dati spettrali in tempo reale per il VU-Meter visivo a LED.
 */

export interface LiveAudioData {
  volume: number; // 0 to 100
  frequencyData: Uint8Array;
}

export class VoiceRecorderService {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private onAudioLevelCallback: ((data: LiveAudioData) => void) | null = null;

  public async startRecording(onAudioLevel?: (data: LiveAudioData) => void): Promise<void> {
    this.audioChunks = [];
    this.onAudioLevelCallback = onAudioLevel || null;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Per catturare le sfumature vocali
          autoGainControl: true,
        },
      });

      // Configurazione Web Audio Analyser per Live Metering
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtxClass();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyser);

      // Loop di analisi audio per VU-meter
      if (this.onAudioLevelCallback) {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevels = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);

          // Calcola volume medio
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          const normalizedVol = Math.min(100, Math.round((avg / 255) * 100 * 1.5));

          this.onAudioLevelCallback?.({
            volume: normalizedVol,
            frequencyData: dataArray,
          });

          this.animFrameId = requestAnimationFrame(updateLevels);
        };
        updateLevels();
      }

      // Configurazione MediaRecorder
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      const supportedMime = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';

      this.mediaRecorder = supportedMime
        ? new MediaRecorder(this.mediaStream, { mimeType: supportedMime })
        : new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // chunk ogni 100ms
    } catch (err) {
      this.cleanup();
      console.error('Errore accesso microfono:', err);
      throw new Error('Impossibile accedere al microfono. Verifica i permessi nel browser.');
    }
  }

  public async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        return reject(new Error('Nessuna registrazione in corso.'));
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanup();
        resolve(audioBlob);
      };

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        this.cleanup();
        reject(err);
      }
    });
  }

  public cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn(e);
      }
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {
        console.warn(e);
      }
      this.sourceNode = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        console.warn(e);
      }
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
    this.analyser = null;
  }
}
