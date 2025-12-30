import { supabase } from '@/integrations/supabase/client';
import { Novel, Character, CharacterSprite, Background, AudioAsset, Chapter, Scene, SceneNode } from '@/types/novel';

// Типы для базы данных
interface DbNovel {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  start_scene_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface DbCharacter {
  id: string;
  novel_id: string;
  name: string;
  display_name: string;
  color: string | null;
}

interface DbCharacterSprite {
  id: string;
  character_id: string;
  emotion: string;
  image_url: string | null;
}

interface DbBackground {
  id: string;
  novel_id: string;
  name: string;
  image_url: string | null;
}

interface DbAudioAsset {
  id: string;
  novel_id: string;
  name: string;
  type: 'bgm' | 'sfx';
  audio_url: string | null;
}

interface DbChapter {
  id: string;
  novel_id: string;
  title: string;
  order_index: number;
}

interface DbScene {
  id: string;
  chapter_id: string;
  name: string;
  order_index: number;
}

interface DbSceneNode {
  id: string;
  scene_id: string;
  type: string;
  data: Record<string, unknown>;
  order_index: number;
}

// Загрузка полной новеллы со всеми связями
export const loadNovelFromDb = async (novelId: string): Promise<Novel | null> => {
  // Загружаем новеллу
  const { data: novel, error: novelError } = await supabase
    .from('novels')
    .select('*')
    .eq('id', novelId)
    .maybeSingle();

  if (novelError || !novel) {
    console.error('Error loading novel:', novelError);
    return null;
  }

  // Загружаем персонажей со спрайтами
  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .eq('novel_id', novelId);

  const charactersWithSprites: Character[] = [];
  if (characters) {
    for (const char of characters as DbCharacter[]) {
      const { data: sprites } = await supabase
        .from('character_sprites')
        .select('*')
        .eq('character_id', char.id);

      charactersWithSprites.push({
        id: char.id,
        name: char.name,
        displayName: char.display_name,
        color: char.color || '#6366f1',
        sprites: (sprites as DbCharacterSprite[] || []).map(s => ({
          id: s.id,
          emotion: s.emotion,
          imageUrl: s.image_url || undefined,
        })),
      });
    }
  }

  // Загружаем фоны
  const { data: backgrounds } = await supabase
    .from('backgrounds')
    .select('*')
    .eq('novel_id', novelId);

  const bgList: Background[] = (backgrounds as DbBackground[] || []).map(b => ({
    id: b.id,
    name: b.name,
    imageUrl: b.image_url || '',
  }));

  // Загружаем аудио
  const { data: audioAssets } = await supabase
    .from('audio_assets')
    .select('*')
    .eq('novel_id', novelId);

  const audioList: AudioAsset[] = (audioAssets as DbAudioAsset[] || []).map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    audioUrl: a.audio_url || '',
  }));

  // Загружаем главы со сценами и узлами
  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('novel_id', novelId)
    .order('order_index');

  const chapterList: Chapter[] = [];
  if (chapters) {
    for (const ch of chapters as DbChapter[]) {
      const { data: scenes } = await supabase
        .from('scenes')
        .select('*')
        .eq('chapter_id', ch.id)
        .order('order_index');

      const sceneList: Scene[] = [];
      if (scenes) {
        for (const sc of scenes as DbScene[]) {
          const { data: nodes } = await supabase
            .from('scene_nodes')
            .select('*')
            .eq('scene_id', sc.id)
            .order('order_index');

          sceneList.push({
            id: sc.id,
            name: sc.name,
            nodes: (nodes as DbSceneNode[] || []).map(n => ({
              id: n.id,
              type: n.type,
              ...n.data,
            } as SceneNode)),
          });
        }
      }

      chapterList.push({
        id: ch.id,
        title: ch.title,
        scenes: sceneList,
      });
    }
  }

  const dbNovel = novel as DbNovel;
  return {
    id: dbNovel.id,
    title: dbNovel.title,
    author: dbNovel.author || '',
    description: dbNovel.description || '',
    characters: charactersWithSprites,
    backgrounds: bgList,
    audio: audioList,
    chapters: chapterList,
    startSceneId: dbNovel.start_scene_id || chapterList[0]?.scenes[0]?.id || '',
    createdAt: dbNovel.created_at,
    updatedAt: dbNovel.updated_at,
  };
};

// Создание новой новеллы
export const createNovel = async (userId: string, title: string = 'Новая новелла'): Promise<string | null> => {
  const { data: novel, error } = await supabase
    .from('novels')
    .insert({ user_id: userId, title })
    .select('id')
    .single();

  if (error || !novel) {
    console.error('Error creating novel:', error);
    return null;
  }

  // Создаем дефолтную главу
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .insert({ novel_id: novel.id, title: 'Глава 1', order_index: 0 })
    .select('id')
    .single();

  if (chapterError || !chapter) {
    console.error('Error creating chapter:', chapterError);
    return novel.id;
  }

  // Создаем дефолтную сцену
  await supabase
    .from('scenes')
    .insert({ chapter_id: chapter.id, name: 'Начало', order_index: 0 });

  return novel.id;
};

// Получение списка новелл пользователя
export const getUserNovels = async (userId: string) => {
  const { data, error } = await supabase
    .from('novels')
    .select('id, title, description, cover_url, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching novels:', error);
    return [];
  }

  return data || [];
};

// Удаление новеллы
export const deleteNovel = async (novelId: string) => {
  const { error } = await supabase
    .from('novels')
    .delete()
    .eq('id', novelId);

  return !error;
};

// Обновление метаданных новеллы
export const updateNovelMeta = async (novelId: string, updates: Partial<Pick<Novel, 'title' | 'author' | 'description' | 'startSceneId'>>) => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.author !== undefined) dbUpdates.author = updates.author;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.startSceneId !== undefined) dbUpdates.start_scene_id = updates.startSceneId;

  const { error } = await supabase
    .from('novels')
    .update(dbUpdates)
    .eq('id', novelId);

  return !error;
};

// === ПЕРСОНАЖИ ===

export const addCharacter = async (novelId: string, character: Omit<Character, 'sprites'>) => {
  const { data, error } = await supabase
    .from('characters')
    .insert({
      id: character.id,
      novel_id: novelId,
      name: character.name,
      display_name: character.displayName,
      color: character.color,
    })
    .select('id')
    .single();

  return error ? null : data?.id;
};

export const updateCharacter = async (characterId: string, updates: Partial<Character>) => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.color !== undefined) dbUpdates.color = updates.color;

  const { error } = await supabase
    .from('characters')
    .update(dbUpdates)
    .eq('id', characterId);

  return !error;
};

export const deleteCharacter = async (characterId: string) => {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId);

  return !error;
};

// === СПРАЙТЫ ===

export const addSprite = async (characterId: string, sprite: CharacterSprite) => {
  const { error } = await supabase
    .from('character_sprites')
    .insert({
      id: sprite.id,
      character_id: characterId,
      emotion: sprite.emotion,
      image_url: sprite.imageUrl,
    });

  return !error;
};

export const updateSprite = async (spriteId: string, updates: Partial<CharacterSprite>) => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.emotion !== undefined) dbUpdates.emotion = updates.emotion;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;

  const { error } = await supabase
    .from('character_sprites')
    .update(dbUpdates)
    .eq('id', spriteId);

  return !error;
};

export const deleteSprite = async (spriteId: string) => {
  const { error } = await supabase
    .from('character_sprites')
    .delete()
    .eq('id', spriteId);

  return !error;
};

// === ФОНЫ ===

export const addBackground = async (novelId: string, bg: Background) => {
  const { error } = await supabase
    .from('backgrounds')
    .insert({
      id: bg.id,
      novel_id: novelId,
      name: bg.name,
      image_url: bg.imageUrl,
    });

  return !error;
};

export const updateBackground = async (bgId: string, updates: Partial<Background>) => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;

  const { error } = await supabase
    .from('backgrounds')
    .update(dbUpdates)
    .eq('id', bgId);

  return !error;
};

export const deleteBackground = async (bgId: string) => {
  const { error } = await supabase
    .from('backgrounds')
    .delete()
    .eq('id', bgId);

  return !error;
};

// === АУДИО ===

export const addAudioAsset = async (novelId: string, audio: AudioAsset) => {
  const { error } = await supabase
    .from('audio_assets')
    .insert({
      id: audio.id,
      novel_id: novelId,
      name: audio.name,
      type: audio.type,
      audio_url: audio.audioUrl,
    });

  return !error;
};

export const updateAudioAsset = async (audioId: string, updates: Partial<AudioAsset>) => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.audioUrl !== undefined) dbUpdates.audio_url = updates.audioUrl;

  const { error } = await supabase
    .from('audio_assets')
    .update(dbUpdates)
    .eq('id', audioId);

  return !error;
};

export const deleteAudioAsset = async (audioId: string) => {
  const { error } = await supabase
    .from('audio_assets')
    .delete()
    .eq('id', audioId);

  return !error;
};

// === ГЛАВЫ ===

export const addChapter = async (novelId: string, chapter: { id: string; title: string; orderIndex: number }) => {
  const { error } = await supabase
    .from('chapters')
    .insert({
      id: chapter.id,
      novel_id: novelId,
      title: chapter.title,
      order_index: chapter.orderIndex,
    });

  return !error;
};

export const updateChapter = async (chapterId: string, updates: { title?: string; orderIndex?: number }) => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

  const { error } = await supabase
    .from('chapters')
    .update(dbUpdates)
    .eq('id', chapterId);

  return !error;
};

export const deleteChapter = async (chapterId: string) => {
  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId);

  return !error;
};

// === СЦЕНЫ ===

export const addScene = async (chapterId: string, scene: { id: string; name: string; orderIndex: number }) => {
  const { error } = await supabase
    .from('scenes')
    .insert({
      id: scene.id,
      chapter_id: chapterId,
      name: scene.name,
      order_index: scene.orderIndex,
    });

  return !error;
};

export const updateScene = async (sceneId: string, updates: { name?: string; orderIndex?: number }) => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

  const { error } = await supabase
    .from('scenes')
    .update(dbUpdates)
    .eq('id', sceneId);

  return !error;
};

export const deleteScene = async (sceneId: string) => {
  const { error } = await supabase
    .from('scenes')
    .delete()
    .eq('id', sceneId);

  return !error;
};

// === УЗЛЫ СЦЕН ===

export const addSceneNode = async (sceneId: string, node: SceneNode, orderIndex: number) => {
  const { id, type, ...rest } = node;
  
  const { error } = await supabase
    .from('scene_nodes')
    .insert([{
      id,
      scene_id: sceneId,
      type,
      data: JSON.parse(JSON.stringify(rest)),
      order_index: orderIndex,
    }]);

  return !error;
};

export const updateSceneNode = async (nodeId: string, node: Partial<SceneNode>, orderIndex?: number) => {
  const { id, type, ...data } = node as SceneNode;
  const dbUpdates: Record<string, unknown> = { data };
  if (type) dbUpdates.type = type;
  if (orderIndex !== undefined) dbUpdates.order_index = orderIndex;

  const { error } = await supabase
    .from('scene_nodes')
    .update(dbUpdates)
    .eq('id', nodeId);

  return !error;
};

export const deleteSceneNode = async (nodeId: string) => {
  const { error } = await supabase
    .from('scene_nodes')
    .delete()
    .eq('id', nodeId);

  return !error;
};

export const reorderSceneNodes = async (sceneId: string, nodeIds: string[]) => {
  const updates = nodeIds.map((id, index) => 
    supabase
      .from('scene_nodes')
      .update({ order_index: index })
      .eq('id', id)
  );

  await Promise.all(updates);
  return true;
};
