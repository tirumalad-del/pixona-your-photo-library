// UI Sound Effects System
import { db } from './db';

class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private enabled: boolean = true;
  private volume: number = 0.3;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    try {
      // Wait for database to be ready
      await db.init();
      
      // Load sound enabled setting from database
      const soundEnabled = await db.getSetting<boolean>('soundEnabled');
      this.enabled = soundEnabled !== undefined ? soundEnabled : true;

      const soundVolume = await db.getSetting<number>('soundVolume');
      this.volume = soundVolume !== undefined ? soundVolume : 0.3;
      
      this.initialized = true;
    } catch (error) {
      console.warn('Sound manager initialization failed:', error);
      // Use defaults on failure
      this.initialized = true;
    }
  }

  private createSound(name: string, frequency: number, duration: number, type: OscillatorType = 'sine') {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      
      gainNode.gain.setValueAtTime(this.volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      // Silently fail if audio context creation fails
    }
  }

  async setEnabled(enabled: boolean) {
    this.enabled = enabled;
    try {
      await db.init();
      await db.setSetting('soundEnabled', enabled);
    } catch (error) {
      console.warn('Failed to save sound setting:', error);
    }
  }

  async setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    try {
      await db.init();
      await db.setSetting('soundVolume', this.volume);
    } catch (error) {
      console.warn('Failed to save volume setting:', error);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }

  play(soundName: 'click' | 'open' | 'close' | 'success' | 'error' | 'select' | 'delete' | 'navigate' | 'hover') {
    if (!this.enabled) return;

    // Initialize on first play if needed (non-blocking)
    if (!this.initialized) {
      this.init();
    }

    switch (soundName) {
      case 'click':
        this.createSound('click', 800, 0.04, 'sine');
        break;
      case 'hover':
        this.createSound('hover', 1200, 0.02, 'sine');
        break;
      case 'open':
        this.createSound('open', 600, 0.08, 'sine');
        setTimeout(() => this.createSound('open2', 900, 0.08, 'sine'), 40);
        break;
      case 'close':
        this.createSound('close', 900, 0.08, 'sine');
        setTimeout(() => this.createSound('close2', 600, 0.08, 'sine'), 40);
        break;
      case 'success':
        this.createSound('success1', 523, 0.08, 'sine'); // C
        setTimeout(() => this.createSound('success2', 659, 0.08, 'sine'), 80); // E
        setTimeout(() => this.createSound('success3', 784, 0.12, 'sine'), 160); // G
        break;
      case 'error':
        this.createSound('error', 200, 0.15, 'sawtooth');
        break;
      case 'select':
        this.createSound('select', 1000, 0.04, 'sine');
        break;
      case 'delete':
        this.createSound('delete', 400, 0.12, 'triangle');
        break;
      case 'navigate':
        this.createSound('navigate', 700, 0.05, 'sine');
        break;
    }
  }
}

export const soundManager = new SoundManager();

// Initialize on load (non-blocking)
if (typeof window !== 'undefined') {
  // Defer initialization to not block app startup
  setTimeout(() => {
    soundManager.init().catch(() => {
      // Silently handle init failure
    });
  }, 100);
}
