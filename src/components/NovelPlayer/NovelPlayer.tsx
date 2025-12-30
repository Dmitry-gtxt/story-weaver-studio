import { useState, useMemo, useEffect } from 'react';
import { Novel, Scene, SceneNode, DialogueNode, NarrationNode, CharacterNode } from '@/types/novel';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface NovelPlayerProps {
  novel: Novel;
}

type CharacterPosition = 'left' | 'center' | 'right';

interface OnScreenCharacter {
  characterId: string;
  position: CharacterPosition;
  emotion?: string;
}

export const NovelPlayer = ({ novel }: NovelPlayerProps) => {
  const [currentSceneId, setCurrentSceneId] = useState(novel.startSceneId);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [onScreenCharacters, setOnScreenCharacters] = useState<OnScreenCharacter[]>([]);

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

  // Обработка узла 'character'
  const processCharacterNode = (node: CharacterNode) => {
    const { characterId, action, position = 'center', emotion } = node;

    setOnScreenCharacters(prev => {
      switch (action) {
        case 'enter':
          // Добавить персонажа если его нет
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

  // Перейти к следующему узлу
  const handleNext = () => {
    if (!currentScene) return;
    
    if (currentNodeIndex < currentScene.nodes.length - 1) {
      const nextIndex = currentNodeIndex + 1;
      const nextNode = currentScene.nodes[nextIndex];
      
      // Если следующий узел - character, обработать и пропустить
      if (nextNode.type === 'character') {
        processCharacterNode(nextNode as CharacterNode);
        setCurrentNodeIndex(nextIndex);
        // Рекурсивно проверяем следующий
        setTimeout(() => handleNext(), 50);
      } else {
        setCurrentNodeIndex(nextIndex);
      }
    } else {
      // Конец сцены - сброс
      setCurrentNodeIndex(0);
      setOnScreenCharacters([]);
    }
  };

  // Обработать начальные узлы типа character
  useEffect(() => {
    if (currentScene && currentNodeIndex === 0) {
      let idx = 0;
      while (idx < currentScene.nodes.length && currentScene.nodes[idx].type === 'character') {
        processCharacterNode(currentScene.nodes[idx] as CharacterNode);
        idx++;
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

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Фон */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />
      
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
          onClick={handleNext}
        >
          {/* Контент */}
          <div className="min-h-[100px]">
            {renderNode(currentNode)}
          </div>

          {/* Кнопка "Далее" */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {currentNodeIndex + 1} / {currentScene.nodes.length}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              {isLastNode ? 'Начать сначала' : 'Далее'}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Заголовок сцены */}
      <div className="absolute top-4 left-4 text-sm text-muted-foreground/50">
        {currentScene.name}
      </div>
    </div>
  );
};
