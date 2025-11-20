/**
 * Water sound effects utility
 * Creates realistic water drinking sounds using Web Audio API
 */

class WaterSoundEffect {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Play a "glug glug" water drinking sound
   */
  playDrinkingSound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Create multiple "glug" sounds
    for (let i = 0; i < 3; i++) {
      this.createGlugSound(now + i * 0.25);
    }
  }

  /**
   * Create a single "glug" sound
   */
  private createGlugSound(startTime: number) {
    if (!this.audioContext) return;

    // Create oscillator for the glug sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Configure oscillator
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, startTime + 0.1);

    // Configure filter for more realistic water sound
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, startTime);
    filter.Q.setValueAtTime(5, startTime);

    // Configure gain envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Play sound
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.15);

    // Add some bubbling noise
    this.createBubbleSound(startTime);
  }

  /**
   * Create bubble sound effect
   */
  private createBubbleSound(startTime: number) {
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise for bubbles
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    const noiseFilter = this.audioContext.createBiquadFilter();

    noise.buffer = buffer;
    
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(400, startTime);
    noiseFilter.Q.setValueAtTime(10, startTime);

    noiseGain.gain.setValueAtTime(0, startTime);
    noiseGain.gain.linearRampToValueAtTime(0.05, startTime + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);

    noise.start(startTime);
    noise.stop(startTime + 0.1);
  }

  /**
   * Play achievement sound when goal is reached
   */
  playAchievementSound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Create a pleasant chime sound
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G (major chord)
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.1);

      gainNode.gain.setValueAtTime(0, now + index * 0.1);
      gainNode.gain.linearRampToValueAtTime(0.2, now + index * 0.1 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.start(now + index * 0.1);
      oscillator.stop(now + index * 0.1 + 0.5);
    });
  }

  /**
   * Play splash sound for visual feedback
   */
  playSplashSound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.3);

    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }
}

// Create singleton instance
export const waterSound = new WaterSoundEffect();
