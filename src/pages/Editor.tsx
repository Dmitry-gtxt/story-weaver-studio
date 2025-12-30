import { useState } from 'react';
import { Novel, Scene, SceneNode, UUID, Character, CharacterSprite, Background, AudioAsset } from '@/types/novel';
import { mockNovel } from '@/data/mockNovel';
import { ScenesList } from '@/components/Editor/ScenesList';
import { NodeEditor } from '@/components/Editor/NodeEditor';
import { CharacterEditor } from '@/components/Editor/CharacterEditor';
import { AssetsEditor } from '@/components/Editor/AssetsEditor';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Play, Film, Users, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

type EditorTab = 'scenes' | 'characters' | 'assets';

const Editor = () => {
  const [novel, setNovel] = useState<Novel>(mockNovel);
  const [activeTab, setActiveTab] = useState<EditorTab>('scenes');
  const [selectedSceneId, setSelectedSceneId] = useState<UUID | null>(
    novel.chapters[0]?.scenes[0]?.id || null
  );

  // Найти выбранную сцену
  const selectedScene = novel.chapters
    .flatMap(ch => ch.scenes)
    .find(s => s.id === selectedSceneId);

  // Все сцены для выбора в dropdown
  const allScenes = novel.chapters.flatMap(ch => ch.scenes);

  // Генерация уникального ID
  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Добавить новую сцену
  const handleAddScene = () => {
    const newScene: Scene = {
      id: generateId(),
      name: `Новая сцена ${novel.chapters[0].scenes.length + 1}`,
      nodes: [],
    };

    setNovel(prev => ({
      ...prev,
      chapters: prev.chapters.map((ch, idx) =>
        idx === 0
          ? { ...ch, scenes: [...ch.scenes, newScene] }
          : ch
      ),
    }));

    setSelectedSceneId(newScene.id);
  };

  // Удалить сцену
  const handleDeleteScene = (sceneId: UUID) => {
    setNovel(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        scenes: ch.scenes.filter(s => s.id !== sceneId),
      })),
    }));

    if (selectedSceneId === sceneId) {
      const remainingScenes = novel.chapters.flatMap(ch => ch.scenes).filter(s => s.id !== sceneId);
      setSelectedSceneId(remainingScenes[0]?.id || null);
    }
  };

  // Переименовать сцену
  const handleRenameScene = (sceneId: UUID, newName: string) => {
    setNovel(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        scenes: ch.scenes.map(s =>
          s.id === sceneId ? { ...s, name: newName } : s
        ),
      })),
    }));
  };

  // Добавить узел в сцену
  const handleAddNode = (sceneId: UUID, node: SceneNode) => {
    setNovel(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        scenes: ch.scenes.map(s =>
          s.id === sceneId
            ? { ...s, nodes: [...s.nodes, node] }
            : s
        ),
      })),
    }));
  };

  // Удалить узел из сцены
  const handleDeleteNode = (sceneId: UUID, nodeId: UUID) => {
    setNovel(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        scenes: ch.scenes.map(s =>
          s.id === sceneId
            ? { ...s, nodes: s.nodes.filter(n => n.id !== nodeId) }
            : s
        ),
      })),
    }));
  };

  // Обновить узел
  const handleUpdateNode = (sceneId: UUID, nodeId: UUID, updates: Partial<SceneNode>) => {
    setNovel(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        scenes: ch.scenes.map(s =>
          s.id === sceneId
            ? {
                ...s,
                nodes: s.nodes.map(n =>
                  n.id === nodeId ? { ...n, ...updates } as SceneNode : n
                ),
              }
            : s
        ),
      })),
    }));
  };

  // Изменить порядок узлов
  const handleReorderNodes = (sceneId: UUID, fromIndex: number, toIndex: number) => {
    setNovel(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        scenes: ch.scenes.map(s => {
          if (s.id !== sceneId) return s;
          const newNodes = [...s.nodes];
          const [movedNode] = newNodes.splice(fromIndex, 1);
          newNodes.splice(toIndex, 0, movedNode);
          return { ...s, nodes: newNodes };
        }),
      })),
    }));
  };

  // Добавить персонажа
  const handleAddCharacter = (character: Character) => {
    setNovel(prev => ({
      ...prev,
      characters: [...prev.characters, character],
    }));
  };

  // Обновить персонажа
  const handleUpdateCharacter = (characterId: UUID, updates: Partial<Character>) => {
    setNovel(prev => ({
      ...prev,
      characters: prev.characters.map(c =>
        c.id === characterId ? { ...c, ...updates } : c
      ),
    }));
  };

  // Удалить персонажа
  const handleDeleteCharacter = (characterId: UUID) => {
    setNovel(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== characterId),
    }));
  };

  // Добавить спрайт персонажу
  const handleAddSprite = (characterId: UUID, sprite: CharacterSprite) => {
    setNovel(prev => ({
      ...prev,
      characters: prev.characters.map(c =>
        c.id === characterId
          ? { ...c, sprites: [...c.sprites, sprite] }
          : c
      ),
    }));
  };

  // Удалить спрайт
  const handleDeleteSprite = (characterId: UUID, spriteId: UUID) => {
    setNovel(prev => ({
      ...prev,
      characters: prev.characters.map(c =>
        c.id === characterId
          ? { ...c, sprites: c.sprites.filter(s => s.id !== spriteId) }
          : c
      ),
    }));
  };

  // Добавить фон
  const handleAddBackground = (bg: Background) => {
    setNovel(prev => ({
      ...prev,
      backgrounds: [...prev.backgrounds, bg],
    }));
  };

  // Обновить фон
  const handleUpdateBackground = (bgId: UUID, updates: Partial<Background>) => {
    setNovel(prev => ({
      ...prev,
      backgrounds: prev.backgrounds.map(b =>
        b.id === bgId ? { ...b, ...updates } : b
      ),
    }));
  };

  // Удалить фон
  const handleDeleteBackground = (bgId: UUID) => {
    setNovel(prev => ({
      ...prev,
      backgrounds: prev.backgrounds.filter(b => b.id !== bgId),
    }));
  };

  // Добавить аудио
  const handleAddAudio = (audio: AudioAsset) => {
    setNovel(prev => ({
      ...prev,
      audio: [...prev.audio, audio],
    }));
  };

  // Обновить аудио
  const handleUpdateAudio = (audioId: UUID, updates: Partial<AudioAsset>) => {
    setNovel(prev => ({
      ...prev,
      audio: prev.audio.map(a =>
        a.id === audioId ? { ...a, ...updates } : a
      ),
    }));
  };

  // Удалить аудио
  const handleDeleteAudio = (audioId: UUID) => {
    setNovel(prev => ({
      ...prev,
      audio: prev.audio.filter(a => a.id !== audioId),
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Заголовок */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              К плееру
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">{novel.title} — Редактор</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EditorTab)}>
            <TabsList>
              <TabsTrigger value="scenes" className="gap-2">
                <Film className="h-4 w-4" />
                Сцены
              </TabsTrigger>
              <TabsTrigger value="characters" className="gap-2">
                <Users className="h-4 w-4" />
                Персонажи
              </TabsTrigger>
              <TabsTrigger value="assets" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Ассеты
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Link to="/">
            <Button size="sm">
              <Play className="h-4 w-4 mr-2" />
              Запустить
            </Button>
          </Link>
        </div>
      </header>

      {/* Основная область */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'scenes' ? (
          <>
            {/* Левая панель — список сцен */}
            <ScenesList
              chapters={novel.chapters}
              selectedSceneId={selectedSceneId}
              onSelectScene={setSelectedSceneId}
              onAddScene={handleAddScene}
              onDeleteScene={handleDeleteScene}
              onRenameScene={handleRenameScene}
            />

            {/* Правая панель — редактор узлов */}
            <NodeEditor
              scene={selectedScene}
              allScenes={allScenes}
              characters={novel.characters}
              backgrounds={novel.backgrounds}
              audioAssets={novel.audio}
              onAddNode={(node) => selectedSceneId && handleAddNode(selectedSceneId, node)}
              onDeleteNode={(nodeId) => selectedSceneId && handleDeleteNode(selectedSceneId, nodeId)}
              onUpdateNode={(nodeId, updates) => selectedSceneId && handleUpdateNode(selectedSceneId, nodeId, updates)}
              onReorderNodes={(from, to) => selectedSceneId && handleReorderNodes(selectedSceneId, from, to)}
              generateId={generateId}
            />
          </>
        ) : activeTab === 'characters' ? (
          <CharacterEditor
            characters={novel.characters}
            onAddCharacter={handleAddCharacter}
            onUpdateCharacter={handleUpdateCharacter}
            onDeleteCharacter={handleDeleteCharacter}
            onAddSprite={handleAddSprite}
            onDeleteSprite={handleDeleteSprite}
            generateId={generateId}
          />
        ) : (
          <AssetsEditor
            backgrounds={novel.backgrounds}
            audioAssets={novel.audio}
            onAddBackground={handleAddBackground}
            onUpdateBackground={handleUpdateBackground}
            onDeleteBackground={handleDeleteBackground}
            onAddAudio={handleAddAudio}
            onUpdateAudio={handleUpdateAudio}
            onDeleteAudio={handleDeleteAudio}
            generateId={generateId}
          />
        )}
      </div>
    </div>
  );
};

export default Editor;
