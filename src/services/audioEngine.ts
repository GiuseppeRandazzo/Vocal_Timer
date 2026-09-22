/**
 * Audio Engine basato su Web Audio API nativa.
 * Genera segnali acustici di sincronismo da sala doppiaggio (Beep 1000Hz, Ciak percussivo, Accordo armonico)
 * senza richiedere asset audio esterni pesanti o dipendenze terze.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Beep di sincronismo da sala di doppiaggio (frequenza standard 1000Hz).
   * Utilizzato per il countdown 3-2-1 prima del via.
   */
  public playCountdownBeep(volume = 0.5): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (err) {
      console.warn('AudioEngine: errore riproduzione beep', err);
    }
  }

  /**
   * Ciak sonoro percussivo per l'avvio dell'esercizio ("Inizio take").
   */
  public playCiak(volume = 0.5): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Click rapido ad alta frequenza
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      gain.gain.setValueAtTime(volume * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (err) {
      console.warn('AudioEngine: errore riproduzione ciak', err);
    }
  }

  /**
   * Accordo armonico rilassante e professionale a fine esercizio.
   * Accordo C-Maggiore con armoniche aperte (C5, E5, G5, C6).
   */
  public playCompletionChime(volume = 0.5): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        const startTime = now + idx * 0.04;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime((volume * 0.3) / freqs.length, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.25);
      });
    } catch (err) {
      console.warn('AudioEngine: errore riproduzione chime', err);
    }
  }

  /**
   * Vibrazione su dispositivi mobili supportati (Vibration API).
   */
  public triggerVibration(pattern: number[] = [120, 80, 120]): void {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (err) {
        console.warn('Vibration API non consentita o non supportata', err);
      }
    }
  }
}

export const audioEngine = new AudioEngine();
