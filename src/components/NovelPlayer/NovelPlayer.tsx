import { useState, useMemo, useEffect } from 'react';
import { Novel, Scene, SceneNode, DialogueNode, NarrationNode, CharacterNode, ChoiceNode, BackgroundNode, AudioNode } from '@/types/novel';
import { Button } from '@/components/ui/button';
import { ChevronRight, Volume2 } from 'lucide-react';
import { useAudioManager } from '@/hooks/useAudioManager';

interface NovelPlayerProps {
  novel: Novel;
}

type CharacterPosition = 'left' | 'center' | 'right';

interface OnScreenCharacter {
  characterId: string;
  position: CharacterPosition;
  emotion?: string;
}

// Градиенты-заглушки для разных фонов
const BACKGROUND_GRADIENTS: Record<string, string> = {
  'bg-1': 'linear-gradient(to bottom, hsl(220 40% 30%), hsl(220 50% 20%))', // Комната - тёмно-синий
  'bg-2': 'linear-gradient(to bottom, hsl(40 60% 70%), hsl(30 50% 50%))', // Кухня - тёплый
  'bg-3': 'linear-gradient(to bottom, hsl(200 80% 70%), hsl(200 60% 40%))', // Улица - голубой
};

const DEFAULT_GRADIENT = 'linear-gradient(to bottom, hsl(220 20% 20%), hsl(220 30% 10%))';

export const NovelPlayer = ({ novel }: NovelPlayerProps) => {
  const [currentSceneId, setCurrentSceneId] = useState(novel.startSceneId);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [onScreenCharacters, setOnScreenCharacters] = useState<OnScreenCharacter[]>([]);
  const [currentBackgroundId, setCurrentBackgroundId] = useState<string | null>(null);

  // Аудио менеджер
  const { playBgm, stopBgm, fadeOutBgm, playSfx, getCurrentBgmId } = useAudioManager(novel.audio);

  // Найти текущую сцену
  const currentScene = useMemo((): Scene | undefined => {
    for (const chapter of novel.chapters) {
      const scene = chapter.scenes.find(s => s.id === currentSceneId);
      if (scene) return scene;
    }
    return undefined;
  }, [novel, currentSceneId]);

  const currentNode = currentScene?.nodes[currentNodeIndex];

  // Получить персонажа по ID
  const getCharacter = (characterId: string) => {
    return novel.characters.find(c => c.id === characterId);
  };

  // Получить градиент фона
  const getBackgroundStyle = () => {
    if (currentBackgroundId && BACKGROUND_GRADIENTS[currentBackgroundId]) {
      return BACKGROUND_GRADIENTS[currentBackgroundId];
    }
    return DEFAULT_GRADIENT;
  };

  // Обработка узла 'character'
  const processCharacterNode = (node: CharacterNode) => {
    const { characterId, action, position = 'center', emotion } = node;

    setOnScreenCharacters(prev => {
      switch (action) {
        case 'enter':
          if (prev.find(c => c.characterId === characterId)) {
            return prev.map(c => 
              c.characterId === characterId 
                ? { ...c, position, emotion } 
                : c
            );
          }
          return [...prev, { characterId, position, emotion }];
        
        case 'exit':
          return prev.filter(c => c.characterId !== characterId);
        
        case 'move':
          return prev.map(c => 
            c.characterId === characterId 
              ? { ...c, position, emotion: emotion ?? c.emotion } 
              : c
          );
        
        default:
          return prev;
      }
    });
  };

  // Обработка узла 'background'
  const processBackgroundNode = (node: BackgroundNode) => {
    setCurrentBackgroundId(node.backgroundId);
  };

  // Обработка узла 'audio'
  const processAudioNode = (node: AudioNode) => {
    const audioAsset = novel.audio.find(a => a.id === node.audioId);
    if (!audioAsset) return;

    if (audioAsset.type === 'bgm') {
      switch (node.action) {
        case 'play':
          playBgm(node.audioId);
          break;
        case 'stop':
          stopBgm();
          break;
        case 'fade-out':
          fadeOutBgm();
          break;
      }
    } else if (audioAsset.type === 'sfx' && node.action === 'play') {
      playSfx(node.audioId);
    }
  };

  // Перейти к следующему узлу
  const handleNext = () => {
    if (!currentScene) return;
    
    if (currentNodeIndex < currentScene.nodes.length - 1) {
      const nextIndex = currentNodeIndex + 1;
      const nextNode = currentScene.nodes[nextIndex];
      
      if (nextNode.type === 'character') {
        processCharacterNode(nextNode as CharacterNode);
        setCurrentNodeIndex(nextIndex);
        setTimeout(() => handleNext(), 50);
      } else if (nextNode.type === 'background') {
        processBackgroundNode(nextNode as BackgroundNode);
        setCurrentNodeIndex(nextIndex);
        setTimeout(() => handleNext(), 50);
      } else if (nextNode.type === 'audio') {
        processAudioNode(nextNode as AudioNode);
        setCurrentNodeIndex(nextIndex);
        setTimeout(() => handleNext(), 50);
      } else {
        setCurrentNodeIndex(nextIndex);
      }
    }
  };

  // Переход на другую сцену по выбору
  const handleChoice = (targetSceneId: string) => {
    setCurrentSceneId(targetSceneId);
    setCurrentNodeIndex(0);
    setOnScreenCharacters([]);
  };

  // Обработать начальные узлы типа character, background и audio
  useEffect(() => {
    if (currentScene && currentNodeIndex === 0) {
      let idx = 0;
      while (idx < currentScene.nodes.length) {
        const node = currentScene.nodes[idx];
        if (node.type === 'character') {
          processCharacterNode(node as CharacterNode);
          idx++;
        } else if (node.type === 'background') {
          processBackgroundNode(node as BackgroundNode);
          idx++;
        } else if (node.type === 'audio') {
          processAudioNode(node as AudioNode);
          idx++;
        } else {
          break;
        }
      }
      if (idx > 0) {
        setCurrentNodeIndex(idx);
      }
    }
  }, [currentSceneId]);

  // Рендер текущего узла
  const renderNode = (node: SceneNode) => {
    switch (node.type) {
      case 'dialogue': {
        const dialogueNode = node as DialogueNode;
        const character = getCharacter(dialogueNode.characterId);
        return (
          <div className="space-y-2">
            {character && (
              <span 
                className="font-bold text-lg"
                style={{ color: `hsl(${character.color})` }}
              >
                {character.displayName}
              </span>
            )}
            <p className="text-lg leading-relaxed">{dialogueNode.text}</p>
          </div>
        );
      }
      case 'narration': {
        const narrationNode = node as NarrationNode;
        return (
          <p className="text-lg leading-relaxed italic text-muted-foreground">
            {narrationNode.text}
          </p>
        );
      }
      case 'choice': {
        const choiceNode = node as ChoiceNode;
        return (
          <div className="space-y-4">
            {choiceNode.prompt && (
              <p className="text-lg text-center font-medium">{choiceNode.prompt}</p>
            )}
            <div className="flex flex-col gap-3">
              {choiceNode.options.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  className="w-full py-6 text-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChoice(option.targetSceneId);
                  }}
                >
                  {option.text}
                </Button>
              ))}
            </div>
          </div>
        );
      }
      default:
        return <p className="text-muted-foreground">[ {node.type} ]</p>;
    }
  };

  if (!currentScene || !currentNode) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Сцена не найдена</p>
      </div>
    );
  }

  const isLastNode = currentNodeIndex === currentScene.nodes.length - 1;
  const isChoiceNode = currentNode.type === 'choice';

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Фон */}
      <div 
        className="absolute inset-0 transition-all duration-500"
        style={{ background: getBackgroundStyle() }}
      />
      
      {/* Область персонажей */}
      <div className="absolute inset-x-0 bottom-48 top-16 flex items-end justify-center">
        <div className="relative w-full max-w-5xl h-full flex items-end px-8">
          {/* Left position */}
          <div className="absolute left-8 bottom-0 w-32">
            {onScreenCharacters.filter(c => c.position === 'left').map(({ characterId, emotion }) => {
              const char = getCharacter(characterId);
              if (!char) return null;
              return (
                <div
                  key={characterId}
                  className="flex flex-col items-center transition-all duration-300"
                >
                  <div 
                    className="w-24 h-48 rounded-t-full flex items-center justify-center text-sm font-medium text-white shadow-lg"
                    style={{ backgroundColor: `hsl(${char.color})` }}
                  >
                    <span className="rotate-0 text-center px-2">
                      {char.displayName}
                      {emotion && <span className="block text-xs opacity-75">{emotion}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center position */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-32">
            {onScreenCharacters.filter(c => c.position === 'center').map(({ characterId, emotion }) => {
              const char = getCharacter(characterId);
              if (!char) return null;
              return (
                <div
                  key={characterId}
                  className="flex flex-col items-center transition-all duration-300"
                >
                  <div 
                    className="w-24 h-48 rounded-t-full flex items-center justify-center text-sm font-medium text-white shadow-lg"
                    style={{ backgroundColor: `hsl(${char.color})` }}
                  >
                    <span className="rotate-0 text-center px-2">
                      {char.displayName}
                      {emotion && <span className="block text-xs opacity-75">{emotion}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right position */}
          <div className="absolute right-8 bottom-0 w-32">
            {onScreenCharacters.filter(c => c.position === 'right').map(({ characterId, emotion }) => {
              const char = getCharacter(characterId);
              if (!char) return null;
              return (
                <div
                  key={characterId}
                  className="flex flex-col items-center transition-all duration-300"
                >
                  <div 
                    className="w-24 h-48 rounded-t-full flex items-center justify-center text-sm font-medium text-white shadow-lg"
                    style={{ backgroundColor: `hsl(${char.color})` }}
                  >
                    <span className="rotate-0 text-center px-2">
                      {char.displayName}
                      {emotion && <span className="block text-xs opacity-75">{emotion}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Текстовый блок */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div 
          className="relative mx-auto max-w-4xl rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm p-6 shadow-2xl cursor-pointer"
          onClick={!isChoiceNode ? handleNext : undefined}
        >
          {/* Контент */}
          <div className="min-h-[100px]">
            {renderNode(currentNode)}
          </div>

          {/* Кнопка "Далее" - скрыта при выборе */}
          {!isChoiceNode && (
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {currentNodeIndex + 1} / {currentScene.nodes.length}
              </span>
              {!isLastNode && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                >
                  Далее
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
              {isLastNode && (
                <span className="text-sm text-muted-foreground">— Конец —</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Заголовок сцены и индикатор звука */}
      <div className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground/50">
        <span>{currentScene.name}</span>
        {getCurrentBgmId() && (
          <Volume2 className="h-4 w-4 animate-pulse" />
        )}
      </div>
    </div>
  );
};