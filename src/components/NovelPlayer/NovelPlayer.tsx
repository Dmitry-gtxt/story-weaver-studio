import { useState, useMemo } from 'react';
import { Novel, Scene, SceneNode, DialogueNode, NarrationNode } from '@/types/novel';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface NovelPlayerProps {
  novel: Novel;
}

export const NovelPlayer = ({ novel }: NovelPlayerProps) => {
  const [currentSceneId, setCurrentSceneId] = useState(novel.startSceneId);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);

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

  // Перейти к следующему узлу
  const handleNext = () => {
    if (!currentScene) return;
    
    if (currentNodeIndex < currentScene.nodes.length - 1) {
      setCurrentNodeIndex(prev => prev + 1);
    } else {
      // Конец сцены
      setCurrentNodeIndex(0);
    }
  };

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
      
      {/* Область персонажей (заглушка) */}
      <div className="absolute inset-0 flex items-end justify-center pb-48">
        <div className="text-muted-foreground/30 text-sm">
          [ Здесь будут персонажи ]
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
