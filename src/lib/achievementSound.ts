/**
 * Achievement sound effects utility
 * Creates celebratory sounds for completed actions
 */

class AchievementSoundEffect {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Play a triumphant sound when workout is completed
   */
  playWorkoutCompleteSound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Create ascending notes for victory fanfare
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.12);

      gainNode.gain.setValueAtTime(0, now + index * 0.12);
      gainNode.gain.linearRampToValueAtTime(0.25, now + index * 0.12 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.12 + 0.6);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.start(now + index * 0.12);
      oscillator.stop(now + index * 0.12 + 0.6);
    });

    // Add a sustained final chord
    setTimeout(() => {
      this.createChord([523.25, 659.25, 783.99], now + 0.5, 0.8, 0.15);
    }, 500);
  }

  /**
   * Play achievement sound when goal is reached
   */
  playGoalReachedSound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Create a pleasant ascending arpeggio
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C (major chord)
    
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
   * Play a quick positive feedback sound for set completion
   */
  playSetCompleteSound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Two quick ascending notes
    const frequencies = [659.25, 783.99]; // E, G
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.08);

      gainNode.gain.setValueAtTime(0, now + index * 0.08);
      gainNode.gain.linearRampToValueAtTime(0.15, now + index * 0.08 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.start(now + index * 0.08);
      oscillator.stop(now + index * 0.08 + 0.2);
    });
  }

  /**
   * Create a harmonious chord
   */
  private createChord(frequencies: number[], startTime: number, duration: number, volume: number) {
    if (!this.audioContext) return;

    frequencies.forEach((freq) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(volume * 0.7, startTime + duration * 0.7);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }
}

// Create singleton instance
export const achievementSound = new AchievementSoundEffect();
