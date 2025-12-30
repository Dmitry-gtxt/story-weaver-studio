import { useRef, useCallback } from 'react';
import { AudioAsset } from '@/types/novel';

// Частоты для разных аудио-ассетов (заглушки)
const AUDIO_FREQUENCIES: Record<string, { frequency: number; type: OscillatorType }> = {
  'audio-bgm-1': { frequency: 220, type: 'sine' }, // Спокойная мелодия
  'audio-bgm-2': { frequency: 330, type: 'triangle' }, // Весёлая мелодия
  'audio-sfx-knock': { frequency: 150, type: 'square' }, // Стук
  'audio-sfx-alarm': { frequency: 880, type: 'sawtooth' }, // Будильник
};

export const useAudioManager = (audioAssets: AudioAsset[]) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentBgmRef = useRef<{ oscillator: OscillatorNode; gainNode: GainNode } | null>(null);
  const currentBgmIdRef = useRef<string | null>(null);

  // Инициализация AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  // Воспроизвести BGM (зацикленный тон)
  const playBgm = useCallback((audioId: string) => {
    // Если уже играет этот же трек — ничего не делаем
    if (currentBgmIdRef.current === audioId) return;

    // Останавливаем предыдущий BGM
    stopBgm();

    const audioContext = getAudioContext();
    const settings = AUDIO_FREQUENCIES[audioId] || { frequency: 261, type: 'sine' as OscillatorType };

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = settings.type;
    oscillator.frequency.setValueAtTime(settings.frequency, audioContext.currentTime);
    
    // Низкая громкость для фоновой музыки
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    currentBgmRef.current = { oscillator, gainNode };
    currentBgmIdRef.current = audioId;
  }, [getAudioContext]);

  // Остановить BGM
  const stopBgm = useCallback(() => {
    if (currentBgmRef.current) {
      const { oscillator, gainNode } = currentBgmRef.current;
      const audioContext = getAudioContext();
      
      // Плавное затухание
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      setTimeout(() => {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
      }, 300);
      
      currentBgmRef.current = null;
      currentBgmIdRef.current = null;
    }
  }, [getAudioContext]);

  // Fade out BGM
  const fadeOutBgm = useCallback(() => {
    if (currentBgmRef.current) {
      const { oscillator, gainNode } = currentBgmRef.current;
      const audioContext = getAudioContext();
      
      // Медленное затухание
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.5);
      setTimeout(() => {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
        currentBgmRef.current = null;
        currentBgmIdRef.current = null;
      }, 1500);
    }
  }, [getAudioContext]);

  // Воспроизвести SFX (короткий звук)
  const playSfx = useCallback((audioId: string) => {
    const audioContext = getAudioContext();
    const settings = AUDIO_FREQUENCIES[audioId] || { frequency: 440, type: 'sine' as OscillatorType };

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = settings.type;
    oscillator.frequency.setValueAtTime(settings.frequency, audioContext.currentTime);
    
    // Короткий звук с затуханием
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [getAudioContext]);

  // Получить текущий BGM ID
  const getCurrentBgmId = useCallback(() => currentBgmIdRef.current, []);

  return {
    playBgm,
    stopBgm,
    fadeOutBgm,
    playSfx,
    getCurrentBgmId,
  };
};
