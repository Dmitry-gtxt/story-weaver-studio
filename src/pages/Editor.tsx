import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Novel, Scene, SceneNode, UUID, Character, CharacterSprite, Background, AudioAsset } from '@/types/novel';
import { ScenesList } from '@/components/Editor/ScenesList';
import { NodeEditor } from '@/components/Editor/NodeEditor';
import { CharacterEditor } from '@/components/Editor/CharacterEditor';
import { AssetsEditor } from '@/components/Editor/AssetsEditor';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Play, Film, Users, FolderOpen, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import * as api from '@/lib/novelApi';
import { uploadFile } from '@/lib/storage';

type EditorTab = 'scenes' | 'characters' | 'assets';

const Editor = () => {
  const { novelId } = useParams<{ novelId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('scenes');
  const [selectedSceneId, setSelectedSceneId] = useState<UUID | null>(null);

  // Редирект если не авторизован
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Загрузка новеллы
  useEffect(() => {
    const loadNovel = async () => {
      if (!novelId || !user) return;
      
      setIsLoading(true);
      const data = await api.loadNovelFromDb(novelId);
      
      if (!data) {
        toast.error('Новелла не найдена');
        navigate('/novels');
        return;
      }
      
      setNovel(data);
      setSelectedSceneId(data.chapters[0]?.scenes[0]?.id || null);
      setIsLoading(false);
    };

    if (user && novelId) {
      loadNovel();
    }
  }, [novelId, user, navigate]);

  // Найти выбранную сцену
  const selectedScene = novel?.chapters
    .flatMap(ch => ch.scenes)
    .find(s => s.id === selectedSceneId);

  // Все сцены для выбора в dropdown
  const allScenes = novel?.chapters.flatMap(ch => ch.scenes) || [];

  // Генерация уникального ID
  const generateId = () => crypto.randomUUID();

  // === СЦЕНЫ ===
  const handleAddScene = async () => {
    if (!novel || !novelId) return;
    
    const chapterId = novel.chapters[0]?.id;
    if (!chapterId) return;

    const newScene: Scene = {
      id: generateId(),
      name: `Новая сцена ${novel.chapters[0].scenes.length + 1}`,
      nodes: [],
    };

    setIsSaving(true);
    const success = await api.addScene(chapterId, {
      id: newScene.id,
      name: newScene.name,
      orderIndex: novel.chapters[0].scenes.length,
    });
    setIsSaving(false);

    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        chapters: prev.chapters.map((ch, idx) =>
          idx === 0 ? { ...ch, scenes: [...ch.scenes, newScene] } : ch
        ),
      } : null);
      setSelectedSceneId(newScene.id);
      toast.success('Сцена добавлена');
    } else {
      toast.error('Ошибка добавления сцены');
    }
  };

  const handleDeleteScene = async (sceneId: UUID) => {
    if (!novel) return;

    setIsSaving(true);
    const success = await api.deleteScene(sceneId);
    setIsSaving(false);

    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        chapters: prev.chapters.map(ch => ({
          ...ch,
          scenes: ch.scenes.filter(s => s.id !== sceneId),
        })),
      } : null);

      if (selectedSceneId === sceneId) {
        const remainingScenes = novel.chapters.flatMap(ch => ch.scenes).filter(s => s.id !== sceneId);
        setSelectedSceneId(remainingScenes[0]?.id || null);
      }
      toast.success('Сцена удалена');
    } else {
      toast.error('Ошибка удаления');
    }
  };

  const handleRenameScene = async (sceneId: UUID, newName: string) => {
    const success = await api.updateScene(sceneId, { name: newName });
    
    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        chapters: prev.chapters.map(ch => ({
          ...ch,
          scenes: ch.scenes.map(s =>
            s.id === sceneId ? { ...s, name: newName } : s
          ),
        })),
      } : null);
    }
  };

  // === УЗЛЫ ===
  const handleAddNode = async (sceneId: UUID, node: SceneNode) => {
    if (!novel) return;
    
    const scene = novel.chapters.flatMap(ch => ch.scenes).find(s => s.id === sceneId);
    const orderIndex = scene?.nodes.length || 0;

    const success = await api.addSceneNode(sceneId, node, orderIndex);
    
    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        chapters: prev.chapters.map(ch => ({
          ...ch,
          scenes: ch.scenes.map(s =>
            s.id === sceneId ? { ...s, nodes: [...s.nodes, node] } : s
          ),
        })),
      } : null);
    } else {
      toast.error('Ошибка добавления узла');
    }
  };

  const handleDeleteNode = async (sceneId: UUID, nodeId: UUID) => {
    const success = await api.deleteSceneNode(nodeId);
    
    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        chapters: prev.chapters.map(ch => ({
          ...ch,
          scenes: ch.scenes.map(s =>
            s.id === sceneId ? { ...s, nodes: s.nodes.filter(n => n.id !== nodeId) } : s
          ),
        })),
      } : null);
    }
  };

  const handleUpdateNode = async (sceneId: UUID, nodeId: UUID, updates: Partial<SceneNode>) => {
    const scene = novel?.chapters.flatMap(ch => ch.scenes).find(s => s.id === sceneId);
    const node = scene?.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const updatedNode = { ...node, ...updates } as SceneNode;
    await api.updateSceneNode(nodeId, updatedNode);
    
    setNovel(prev => prev ? {
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        scenes: ch.scenes.map(s =>
          s.id === sceneId
            ? { ...s, nodes: s.nodes.map(n => n.id === nodeId ? updatedNode : n) }
            : s
        ),
      })),
    } : null);
  };

  const handleReorderNodes = async (sceneId: UUID, fromIndex: number, toIndex: number) => {
    if (!novel) return;

    const scene = novel.chapters.flatMap(ch => ch.scenes).find(s => s.id === sceneId);
    if (!scene) return;

    const newNodes = [...scene.nodes];
    const [movedNode] = newNodes.splice(fromIndex, 1);
    newNodes.splice(toIndex, 0, movedNode);

    setNovel(prev => prev ? {
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        scenes: ch.scenes.map(s =>
          s.id === sceneId ? { ...s, nodes: newNodes } : s
        ),
      })),
    } : null);

    await api.reorderSceneNodes(sceneId, newNodes.map(n => n.id));
  };

  // === ПЕРСОНАЖИ ===
  const handleAddCharacter = async (character: Character) => {
    if (!novelId) return;

    const success = await api.addCharacter(novelId, character);
    
    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        characters: [...prev.characters, character],
      } : null);
      toast.success('Персонаж добавлен');
    } else {
      toast.error('Ошибка добавления');
    }
  };

  const handleUpdateCharacter = async (characterId: UUID, updates: Partial<Character>) => {
    await api.updateCharacter(characterId, updates);
    
    setNovel(prev => prev ? {
      ...prev,
      characters: prev.characters.map(c =>
        c.id === characterId ? { ...c, ...updates } : c
      ),
    } : null);
  };

  const handleDeleteCharacter = async (characterId: UUID) => {
    const success = await api.deleteCharacter(characterId);
    
    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        characters: prev.characters.filter(c => c.id !== characterId),
      } : null);
      toast.success('Персонаж удалён');
    }
  };

  const handleAddSprite = async (characterId: UUID, sprite: CharacterSprite) => {
    const success = await api.addSprite(characterId, sprite);
    
    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        characters: prev.characters.map(c =>
          c.id === characterId ? { ...c, sprites: [...c.sprites, sprite] } : c
        ),
      } : null);
    }
  };

  const handleDeleteSprite = async (characterId: UUID, spriteId: UUID) => {
    const success = await api.deleteSprite(spriteId);
    
    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        characters: prev.characters.map(c =>
          c.id === characterId ? { ...c, sprites: c.sprites.filter(s => s.id !== spriteId) } : c
        ),
      } : null);
    }
  };

  // === ФОНЫ ===
  const handleAddBackground = async (bg: Background) => {
    if (!novelId) return;

    const success = await api.addBackground(novelId, bg);
    
    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        backgrounds: [...prev.backgrounds, bg],
      } : null);
      toast.success('Фон добавлен');
    }
  };

  const handleUpdateBackground = async (bgId: UUID, updates: Partial<Background>) => {
    await api.updateBackground(bgId, updates);
    
    setNovel(prev => prev ? {
      ...prev,
      backgrounds: prev.backgrounds.map(b =>
        b.id === bgId ? { ...b, ...updates } : b
      ),
    } : null);
  };

  const handleDeleteBackground = async (bgId: UUID) => {
    const success = await api.deleteBackground(bgId);
    
    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        backgrounds: prev.backgrounds.filter(b => b.id !== bgId),
      } : null);
      toast.success('Фон удалён');
    }
  };

  // === АУДИО ===
  const handleAddAudio = async (audio: AudioAsset) => {
    if (!novelId) return;

    const success = await api.addAudioAsset(novelId, audio);
    
    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        audio: [...prev.audio, audio],
      } : null);
      toast.success('Аудио добавлено');
    }
  };

  const handleUpdateAudio = async (audioId: UUID, updates: Partial<AudioAsset>) => {
    await api.updateAudioAsset(audioId, updates);
    
    setNovel(prev => prev ? {
      ...prev,
      audio: prev.audio.map(a =>
        a.id === audioId ? { ...a, ...updates } : a
      ),
    } : null);
  };

  const handleDeleteAudio = async (audioId: UUID) => {
    const success = await api.deleteAudioAsset(audioId);
    
    if (success) {
      setNovel(prev => prev ? {
        ...prev,
        audio: prev.audio.filter(a => a.id !== audioId),
      } : null);
      toast.success('Аудио удалено');
    }
  };

  // Загрузка файлов
  const handleUploadFile = useCallback(async (file: File, type: 'image' | 'audio'): Promise<string | null> => {
    if (!user) return null;
    return await uploadFile(user.id, file, type);
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Новелла не найдена</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <Link to="/novels">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              К списку
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">{novel.title}</h1>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
          
          <Link to={`/play/${novelId}`}>
            <Button size="sm">
              <Play className="h-4 w-4 mr-2" />
              Играть
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'scenes' ? (
          <>
            <ScenesList
              chapters={novel.chapters}
              selectedSceneId={selectedSceneId}
              onSelectScene={setSelectedSceneId}
              onAddScene={handleAddScene}
              onDeleteScene={handleDeleteScene}
              onRenameScene={handleRenameScene}
            />
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
