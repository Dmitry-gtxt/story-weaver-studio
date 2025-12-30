import { useCallback } from 'react';
import { PlayerState, UUID } from '@/types/novel';
import { toast } from 'sonner';

interface SaveData {
  currentSceneId: string;
  currentNodeIndex: number;
  onScreenCharacters: Array<{
    characterId: string;
    position: 'left' | 'center' | 'right';
    emotion?: string;
  }>;
  currentBackgroundId: string | null;
  currentBgmId: string | null;
  savedAt: string;
}

const SAVE_KEY_PREFIX = 'novel_save_';

export const useSaveSystem = (novelId: UUID) => {
  const getSaveKey = useCallback(() => `${SAVE_KEY_PREFIX}${novelId}`, [novelId]);

  const saveGame = useCallback((data: Omit<SaveData, 'savedAt'>) => {
    const saveData: SaveData = {
      ...data,
      savedAt: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(getSaveKey(), JSON.stringify(saveData));
      toast.success('Игра сохранена');
      return true;
    } catch (error) {
      toast.error('Ошибка сохранения');
      return false;
    }
  }, [getSaveKey]);

  const loadGame = useCallback((): SaveData | null => {
    try {
      const saved = localStorage.getItem(getSaveKey());
      if (!saved) {
        toast.error('Сохранение не найдено');
        return null;
      }
      const data = JSON.parse(saved) as SaveData;
      toast.success('Игра загружена');
      return data;
    } catch (error) {
      toast.error('Ошибка загрузки');
      return null;
    }
  }, [getSaveKey]);

  const hasSave = useCallback((): boolean => {
    return localStorage.getItem(getSaveKey()) !== null;
  }, [getSaveKey]);

  const deleteSave = useCallback(() => {
    localStorage.removeItem(getSaveKey());
    toast.success('Сохранение удалено');
  }, [getSaveKey]);

  const getSaveInfo = useCallback((): { savedAt: string } | null => {
    try {
      const saved = localStorage.getItem(getSaveKey());
      if (!saved) return null;
      const data = JSON.parse(saved) as SaveData;
      return { savedAt: data.savedAt };
    } catch {
      return null;
    }
  }, [getSaveKey]);

  return {
    saveGame,
    loadGame,
    hasSave,
    deleteSave,
    getSaveInfo,
  };
};

export type { SaveData };
