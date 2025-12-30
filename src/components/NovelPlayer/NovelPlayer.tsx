import { useState, useMemo, useEffect, useCallback } from 'react';
import { Novel, Scene, SceneNode, DialogueNode, NarrationNode, CharacterNode, ChoiceNode, BackgroundNode, AudioNode, JumpNode } from '@/types/novel';
import { Button } from '@/components/ui/button';
import { ChevronRight, Volume2, Save, FolderOpen } from 'lucide-react';
import { useAudioManager } from '@/hooks/useAudioManager';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useSaveSystem } from '@/hooks/useSaveSystem';

interface NovelPlayerProps {
  novel: Novel;
}

type CharacterPosition = 'left' | 'center' | 'right';

interface OnScreenCharacter {
  characterId: string;
  position: CharacterPosition;
  emotion?: string;
}

const DEFAULT_GRADIENT = 'linear-gradient(to bottom, hsl(220 20% 20%), hsl(220 30% 10%))';

export const NovelPlayer = ({ novel }: NovelPlayerProps) => {
  const [currentSceneId, setCurrentSceneId] = useState(novel.startSceneId);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [onScreenCharacters, setOnScreenCharacters] = useState<OnScreenCharacter[]>([]);
  const [currentBackgroundId, setCurrentBackgroundId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Аудио менеджер
  const { playBgm, stopBgm, fadeOutBgm, playSfx, getCurrentBgmId } = useAudioManager(novel.audio);

  // Система сохранений
  const { saveGame, loadGame, hasSave } = useSaveSystem(novel.id);

  // Найти текущую сцену
  const currentScene = useMemo((): Scene | undefined => {
    for (const chapter of novel.chapters) {
      const scene = chapter.scenes.find(s => s.id === currentSceneId);
      if (scene) return scene;
    }
    return undefined;
  }, [novel, currentSceneId]);

  const currentNode = currentScene?.nodes[currentNodeIndex];

  // Получить текст текущего узла для typewriter
  const getCurrentText = useCallback(() => {
    if (!currentNode) return '';
    if (currentNode.type === 'dialogue') return (currentNode as DialogueNode).text;
    if (currentNode.type === 'narration') return (currentNode as NarrationNode).text;
    return '';
  }, [currentNode]);

  const { displayedText, isComplete: isTextComplete, skipToEnd } = useTypewriter({
    text: getCurrentText(),
    speed: 25,
  });

  // Получить персонажа по ID
  const getCharacter = (characterId: string) => {
    return novel.characters.find(c => c.id === characterId);
  };

  // Получить спрайт персонажа по эмоции
  const getCharacterSprite = (characterId: string, emotion?: string) => {
    const char = getCharacter(characterId);
    if (!char || char.sprites.length === 0) return null;
    
    // Ищем спрайт по эмоции
    if (emotion) {
      const sprite = char.sprites.find(s => s.emotion === emotion);
      if (sprite?.imageUrl && sprite.imageUrl !== '/placeholder.svg') {
        return sprite.imageUrl;
      }
    }
    
    // Fallback: первый спрайт с реальным URL
    const firstValidSprite = char.sprites.find(s => s.imageUrl && s.imageUrl !== '/placeholder.svg');
    return firstValidSprite?.imageUrl || null;
  };

  // Получить фон по ID
  const getBackground = (backgroundId: string) => {
    return novel.backgrounds.find(b => b.id === backgroundId);
  };

  // Получить URL или градиент фона
  const getBackgroundStyle = (): { backgroundImage?: string; background?: string } => {
    if (currentBackgroundId) {
      const bg = getBackground(currentBackgroundId);
      if (bg?.imageUrl) {
        return { backgroundImage: `url(${bg.imageUrl})` };
      }
    }
    return { background: DEFAULT_GRADIENT };
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

  // Обработка узла 'jump'
  const processJumpNode = (node: JumpNode) => {
    setCurrentSceneId(node.targetSceneId);
    setCurrentNodeIndex(0);
    setOnScreenCharacters([]);
  };

  // Автоматически показать персонажа при его диалоге (если его ещё нет на экране)
  const ensureCharacterOnScreen = (characterId: string, emotion?: string) => {
    setOnScreenCharacters(prev => {
      const existing = prev.find(c => c.characterId === characterId);
      if (existing) {
        // Обновить эмоцию если указана
        if (emotion && existing.emotion !== emotion) {
          return prev.map(c => c.characterId === characterId ? { ...c, emotion } : c);
        }
        return prev;
      }
      
      // Определить позицию для нового персонажа (чтобы не перекрывались)
      const positions: CharacterPosition[] = ['center', 'left', 'right'];
      const usedPositions = prev.map(c => c.position);
      const freePosition = positions.find(p => !usedPositions.includes(p)) || 'center';
      
      return [...prev, { characterId, position: freePosition, emotion }];
    });
  };

  // Перейти к следующему узлу
  const handleNext = () => {
    // Если текст ещё печатается — показать весь текст
    if (!isTextComplete && (currentNode?.type === 'dialogue' || currentNode?.type === 'narration')) {
      skipToEnd();
      return;
    }

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
      } else if (nextNode.type === 'jump') {
        processJumpNode(nextNode as JumpNode);
      } else if (nextNode.type === 'dialogue') {
        // Автоматически показать персонажа при его диалоге
        const dialogueNode = nextNode as DialogueNode;
        ensureCharacterOnScreen(dialogueNode.characterId, dialogueNode.emotion);
        setCurrentNodeIndex(nextIndex);
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

  // Сохранение игры
  const handleSave = () => {
    saveGame({
      currentSceneId,
      currentNodeIndex,
      onScreenCharacters,
      currentBackgroundId,
      currentBgmId: getCurrentBgmId(),
    });
  };

  // Загрузка игры
  const handleLoad = () => {
    const data = loadGame();
    if (data) {
      setIsLoading(true);
      stopBgm();
      
      setCurrentSceneId(data.currentSceneId);
      setCurrentNodeIndex(data.currentNodeIndex);
      setOnScreenCharacters(data.onScreenCharacters);
      setCurrentBackgroundId(data.currentBackgroundId);
      
      // Восстановить музыку
      if (data.currentBgmId) {
        setTimeout(() => playBgm(data.currentBgmId!), 100);
      }
      
      setTimeout(() => setIsLoading(false), 100);
    }
  };

  // Найти первый текстовый нод (dialogue, narration, choice)
  const findFirstTextNodeIndex = useCallback((scene: Scene): number => {
    for (let i = 0; i < scene.nodes.length; i++) {
      const node = scene.nodes[i];
      if (node.type === 'dialogue' || node.type === 'narration' || node.type === 'choice') {
        return i;
      }
    }
    return -1; // Нет текстовых нодов
  }, []);

  // Не обрабатывать начальные узлы при загрузке сохранения
  useEffect(() => {
    if (isLoading) return;
    
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
        } else if (node.type === 'jump') {
          // Jump в начале сцены — сразу переходим
          processJumpNode(node as JumpNode);
          return;
        } else {
          break;
        }
      }
      
      // Если первый текстовый нод — диалог, показать персонажа
      if (idx < currentScene.nodes.length) {
        const firstTextNode = currentScene.nodes[idx];
        if (firstTextNode.type === 'dialogue') {
          const dialogueNode = firstTextNode as DialogueNode;
          ensureCharacterOnScreen(dialogueNode.characterId, dialogueNode.emotion);
        }
      }
      
      if (idx > 0 && idx < currentScene.nodes.length) {
        setCurrentNodeIndex(idx);
      } else if (idx >= currentScene.nodes.length) {
        // Все ноды служебные — устанавливаем индекс на последний
        setCurrentNodeIndex(currentScene.nodes.length - 1);
      }
    }
  }, [currentSceneId, isLoading]);

  // Рендер текущего узла с typewriter
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
            <p className="text-lg leading-relaxed">
              {displayedText}
              {!isTextComplete && <span className="animate-pulse">|</span>}
            </p>
          </div>
        );
      }
      case 'narration': {
        return (
          <p className="text-lg leading-relaxed italic text-muted-foreground">
            {displayedText}
            {!isTextComplete && <span className="animate-pulse">|</span>}
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

  if (!currentScene) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Сцена не найдена</p>
      </div>
    );
  }

  // Проверка, есть ли текстовые ноды в сцене
  const hasTextNodes = currentScene.nodes.some(n => 
    n.type === 'dialogue' || n.type === 'narration' || n.type === 'choice'
  );

  if (!hasTextNodes) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Сцена пуста — добавьте диалоги или нарратив в редакторе</p>
      </div>
    );
  }

  // Если currentNode не найден (все ноды обработаны), показать последний служебный
  const nodeToRender = currentNode || currentScene.nodes[currentScene.nodes.length - 1];

  const isLastNode = currentNodeIndex === currentScene.nodes.length - 1;
  const isChoiceNode = currentNode.type === 'choice';

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Фон */}
      <div 
        className="absolute inset-0 transition-all duration-500 bg-cover bg-center bg-no-repeat"
        style={getBackgroundStyle()}
      />
      
      {/* Область персонажей */}
      <div className="absolute inset-x-0 bottom-48 top-16 flex items-end justify-center">
        <div className="relative w-full max-w-5xl h-full flex items-end px-8">
          {/* Left position */}
          <div className="absolute left-8 bottom-0">
            {onScreenCharacters.filter(c => c.position === 'left').map(({ characterId, emotion }) => {
              const char = getCharacter(characterId);
              if (!char) return null;
              const spriteUrl = getCharacterSprite(characterId, emotion);
              
              return (
                <div
                  key={characterId}
                  className="flex flex-col items-center"
                >
                  {spriteUrl ? (
                    <img 
                      src={spriteUrl} 
                      alt={char.displayName}
                      className="max-h-[60vh] w-auto object-contain drop-shadow-lg"
                    />
                  ) : (
                    <div 
                      className="w-24 h-48 rounded-t-full flex items-center justify-center text-sm font-medium text-white shadow-lg"
                      style={{ backgroundColor: `hsl(${char.color})` }}
                    >
                      <span className="text-center px-2">
                        {char.displayName}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Center position */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
            {onScreenCharacters.filter(c => c.position === 'center').map(({ characterId, emotion }) => {
              const char = getCharacter(characterId);
              if (!char) return null;
              const spriteUrl = getCharacterSprite(characterId, emotion);
              
              return (
                <div
                  key={characterId}
                  className="flex flex-col items-center"
                >
                  {spriteUrl ? (
                    <img 
                      src={spriteUrl} 
                      alt={char.displayName}
                      className="max-h-[60vh] w-auto object-contain drop-shadow-lg"
                    />
                  ) : (
                    <div 
                      className="w-24 h-48 rounded-t-full flex items-center justify-center text-sm font-medium text-white shadow-lg"
                      style={{ backgroundColor: `hsl(${char.color})` }}
                    >
                      <span className="text-center px-2">
                        {char.displayName}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right position */}
          <div className="absolute right-8 bottom-0">
            {onScreenCharacters.filter(c => c.position === 'right').map(({ characterId, emotion }) => {
              const char = getCharacter(characterId);
              if (!char) return null;
              const spriteUrl = getCharacterSprite(characterId, emotion);
              
              return (
                <div
                  key={characterId}
                  className="flex flex-col items-center"
                >
                  {spriteUrl ? (
                    <img 
                      src={spriteUrl} 
                      alt={char.displayName}
                      className="max-h-[60vh] w-auto object-contain drop-shadow-lg"
                    />
                  ) : (
                    <div 
                      className="w-24 h-48 rounded-t-full flex items-center justify-center text-sm font-medium text-white shadow-lg"
                      style={{ backgroundColor: `hsl(${char.color})` }}
                    >
                      <span className="text-center px-2">
                        {char.displayName}
                      </span>
                    </div>
                  )}
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

      {/* Заголовок сцены и управление */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground/50">
          <span>{currentScene.name}</span>
          {getCurrentBgmId() && (
            <Volume2 className="h-4 w-4 animate-pulse" />
          )}
        </div>
        
        {/* Кнопки сохранения/загрузки */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground/70 hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
          >
            <Save className="h-4 w-4 mr-1" />
            Сохранить
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground/70 hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleLoad();
            }}
            disabled={!hasSave()}
          >
            <FolderOpen className="h-4 w-4 mr-1" />
            Загрузить
          </Button>
        </div>
      </div>
    </div>
  );
};