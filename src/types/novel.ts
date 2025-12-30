// ============================================
// CORE TYPES - Структура визуальной новеллы
// ============================================

// Уникальный идентификатор
export type UUID = string;

// ============================================
// ПЕРСОНАЖИ
// ============================================

export interface Character {
  id: UUID;
  name: string;
  displayName: string; // Имя для отображения (может меняться по сюжету)
  color: string; // Цвет имени в диалогах (HSL)
  sprites: CharacterSprite[];
}

export interface CharacterSprite {
  id: UUID;
  emotion: string; // "neutral", "happy", "sad", "angry", etc.
  imageUrl: string;
}

// ============================================
// АССЕТЫ
// ============================================

export interface Background {
  id: UUID;
  name: string;
  imageUrl: string;
}

export interface AudioAsset {
  id: UUID;
  name: string;
  type: 'bgm' | 'sfx'; // Background Music / Sound Effect
  audioUrl: string;
}

// ============================================
// УЗЛЫ СЦЕНЫ (Nodes)
// ============================================

// Базовый тип узла
export interface BaseNode {
  id: UUID;
  type: NodeType;
}

export type NodeType = 
  | 'dialogue' 
  | 'choice' 
  | 'narration' 
  | 'background' 
  | 'character' 
  | 'audio' 
  | 'jump';

// Диалог персонажа
export interface DialogueNode extends BaseNode {
  type: 'dialogue';
  characterId: UUID;
  emotion?: string;
  text: string;
}

// Текст от автора (без персонажа)
export interface NarrationNode extends BaseNode {
  type: 'narration';
  text: string;
}

// Выбор игрока
export interface ChoiceNode extends BaseNode {
  type: 'choice';
  prompt?: string; // Опциональный вопрос перед выборами
  options: ChoiceOption[];
}

export interface ChoiceOption {
  id: UUID;
  text: string;
  targetSceneId: UUID; // Куда ведёт выбор
  condition?: string; // Условие для показа (для будущего)
}

// Смена фона
export interface BackgroundNode extends BaseNode {
  type: 'background';
  backgroundId: UUID;
  transition?: 'fade' | 'instant' | 'dissolve';
}

// Появление/уход персонажа
export interface CharacterNode extends BaseNode {
  type: 'character';
  characterId: UUID;
  action: 'enter' | 'exit' | 'move';
  position?: 'left' | 'center' | 'right';
  emotion?: string;
}

// Управление звуком
export interface AudioNode extends BaseNode {
  type: 'audio';
  audioId: UUID;
  action: 'play' | 'stop' | 'fade-out';
}

// Переход на другую сцену
export interface JumpNode extends BaseNode {
  type: 'jump';
  targetSceneId: UUID;
}

// Объединённый тип узла
export type SceneNode = 
  | DialogueNode 
  | NarrationNode 
  | ChoiceNode 
  | BackgroundNode 
  | CharacterNode 
  | AudioNode 
  | JumpNode;

// ============================================
// СЦЕНЫ И ГЛАВЫ
// ============================================

export interface Scene {
  id: UUID;
  name: string;
  nodes: SceneNode[];
}

export interface Chapter {
  id: UUID;
  title: string;
  scenes: Scene[];
}

// ============================================
// НОВЕЛЛА (корневой объект)
// ============================================

export interface Novel {
  id: UUID;
  title: string;
  author: string;
  description: string;
  coverImageUrl?: string;
  
  // Ассеты
  characters: Character[];
  backgrounds: Background[];
  audio: AudioAsset[];
  
  // Контент
  chapters: Chapter[];
  
  // Метаданные
  startSceneId: UUID; // С какой сцены начинается игра
  createdAt: string;
  updatedAt: string;
}

// ============================================
// СОСТОЯНИЕ ИГРОКА (для сохранений)
// ============================================

export interface PlayerState {
  id: UUID;
  novelId: UUID;
  currentSceneId: UUID;
  currentNodeIndex: number;
  variables: Record<string, string | number | boolean>; // Переменные для условий
  history: string[]; // История посещённых сцен
  savedAt: string;
}
