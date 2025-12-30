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
            // Алиса появляется в центре
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
            // Боб появляется справа
            {
              id: 'node-3b',
              type: 'character',
              characterId: 'char-2',
              action: 'enter',
              position: 'right',
              emotion: 'neutral',
            },
            // Алиса двигается влево
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
              text: 'Алиса! Ты проспишь завтрак!',
            },
            {
              id: 'node-5',
              type: 'dialogue',
              characterId: 'char-1',
              emotion: 'happy',
              text: 'Уже иду, Боб!',
            },
            // Боб уходит
            {
              id: 'node-5b',
              type: 'character',
              characterId: 'char-2',
              action: 'exit',
            },
            {
              id: 'node-6',
              type: 'narration',
              text: 'Так начался этот необычный день...',
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
