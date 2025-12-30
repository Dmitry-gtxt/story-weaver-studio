import { Novel } from '@/types/novel';

export const mockNovel: Novel = {
  id: 'novel-1',
  title: 'Тестовая новелла',
  author: 'Разработчик',
  description: 'Демонстрация работы плеера',
  
  characters: [
    {
      id: 'char-1',
      name: 'alice',
      displayName: 'Алиса',
      color: '340 82% 52%',
      sprites: [
        { id: 'sprite-1', emotion: 'neutral', imageUrl: '' },
        { id: 'sprite-2', emotion: 'happy', imageUrl: '' },
      ],
    },
    {
      id: 'char-2',
      name: 'bob',
      displayName: 'Боб',
      color: '210 90% 50%',
      sprites: [
        { id: 'sprite-3', emotion: 'neutral', imageUrl: '' },
      ],
    },
  ],
  
  backgrounds: [
    { id: 'bg-1', name: 'Комната', imageUrl: '' },
    { id: 'bg-2', name: 'Кухня', imageUrl: '' },
    { id: 'bg-3', name: 'Улица', imageUrl: '' },
  ],
  
  audio: [],
  
  chapters: [
    {
      id: 'chapter-1',
      title: 'Глава 1: Начало',
      scenes: [
        {
          id: 'scene-1',
          name: 'Встреча',
          nodes: [
            {
              id: 'node-bg-1',
              type: 'background',
              backgroundId: 'bg-1',
              transition: 'fade',
            },
            {
              id: 'node-0',
              type: 'character',
              characterId: 'char-1',
              action: 'enter',
              position: 'center',
              emotion: 'neutral',
            },
            {
              id: 'node-1',
              type: 'narration',
              text: 'Утро выдалось солнечным. Алиса проснулась от звука будильника.',
            },
            {
              id: 'node-2',
              type: 'dialogue',
              characterId: 'char-1',
              emotion: 'neutral',
              text: 'Уже утро? Не хочу вставать...',
            },
            {
              id: 'node-3',
              type: 'narration',
              text: 'В дверь постучали.',
            },
            {
              id: 'node-3b',
              type: 'character',
              characterId: 'char-2',
              action: 'enter',
              position: 'right',
              emotion: 'neutral',
            },
            {
              id: 'node-3c',
              type: 'character',
              characterId: 'char-1',
              action: 'move',
              position: 'left',
            },
            {
              id: 'node-4',
              type: 'dialogue',
              characterId: 'char-2',
              emotion: 'neutral',
              text: 'Алиса! Завтрак готов. Идёшь?',
            },
            {
              id: 'node-5',
              type: 'choice',
              prompt: 'Что ответить Бобу?',
              options: [
                {
                  id: 'choice-1',
                  text: 'Да, уже иду!',
                  targetSceneId: 'scene-2',
                },
                {
                  id: 'choice-2',
                  text: 'Нет, хочу ещё поспать...',
                  targetSceneId: 'scene-3',
                },
              ],
            },
          ],
        },
        {
          id: 'scene-2',
          name: 'На кухне',
          nodes: [
            {
              id: 'node-s2-bg',
              type: 'background',
              backgroundId: 'bg-2',
              transition: 'fade',
            },
            {
              id: 'node-s2-0',
              type: 'character',
              characterId: 'char-1',
              action: 'enter',
              position: 'left',
              emotion: 'happy',
            },
            {
              id: 'node-s2-0b',
              type: 'character',
              characterId: 'char-2',
              action: 'enter',
              position: 'right',
              emotion: 'neutral',
            },
            {
              id: 'node-s2-1',
              type: 'narration',
              text: 'Алиса быстро оделась и спустилась на кухню.',
            },
            {
              id: 'node-s2-2',
              type: 'dialogue',
              characterId: 'char-1',
              emotion: 'happy',
              text: 'Ммм, как вкусно пахнет!',
            },
            {
              id: 'node-s2-3',
              type: 'dialogue',
              characterId: 'char-2',
              emotion: 'neutral',
              text: 'Я приготовил твои любимые блинчики.',
            },
            {
              id: 'node-s2-4',
              type: 'narration',
              text: 'День начался отлично. Конец демо.',
            },
          ],
        },
        {
          id: 'scene-3',
          name: 'Снова в кровати',
          nodes: [
            {
              id: 'node-s3-bg',
              type: 'background',
              backgroundId: 'bg-1',
              transition: 'instant',
            },
            {
              id: 'node-s3-0',
              type: 'character',
              characterId: 'char-1',
              action: 'enter',
              position: 'center',
              emotion: 'neutral',
            },
            {
              id: 'node-s3-1',
              type: 'narration',
              text: 'Алиса накрылась одеялом с головой.',
            },
            {
              id: 'node-s3-2',
              type: 'dialogue',
              characterId: 'char-1',
              emotion: 'neutral',
              text: 'Ещё пять минуточек...',
            },
            {
              id: 'node-s3-3',
              type: 'narration',
              text: 'Она проспала до обеда. Конец демо.',
            },
          ],
        },
      ],
    },
  ],
  
  startSceneId: 'scene-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
