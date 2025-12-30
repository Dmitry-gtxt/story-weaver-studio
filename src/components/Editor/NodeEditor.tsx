import { Scene, SceneNode, Character, UUID, DialogueNode, NarrationNode, ChoiceNode } from '@/types/novel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, MessageSquare, FileText, GitBranch } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NodeEditorProps {
  scene: Scene | undefined;
  characters: Character[];
  onAddNode: (node: SceneNode) => void;
  onDeleteNode: (nodeId: UUID) => void;
  onUpdateNode: (nodeId: UUID, updates: Partial<SceneNode>) => void;
  generateId: () => string;
}

export const NodeEditor = ({
  scene,
  characters,
  onAddNode,
  onDeleteNode,
  onUpdateNode,
  generateId,
}: NodeEditorProps) => {
  if (!scene) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Выберите сцену для редактирования
      </div>
    );
  }

  const handleAddDialogue = () => {
    const node: DialogueNode = {
      id: generateId(),
      type: 'dialogue',
      characterId: characters[0]?.id || '',
      text: '',
    };
    onAddNode(node);
  };

  const handleAddNarration = () => {
    const node: NarrationNode = {
      id: generateId(),
      type: 'narration',
      text: '',
    };
    onAddNode(node);
  };

  const handleAddChoice = () => {
    const node: ChoiceNode = {
      id: generateId(),
      type: 'choice',
      prompt: '',
      options: [
        { id: generateId(), text: 'Вариант 1', targetSceneId: '' },
        { id: generateId(), text: 'Вариант 2', targetSceneId: '' },
      ],
    };
    onAddNode(node);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'dialogue':
        return <MessageSquare className="h-4 w-4" />;
      case 'narration':
        return <FileText className="h-4 w-4" />;
      case 'choice':
        return <GitBranch className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getNodeLabel = (type: string) => {
    switch (type) {
      case 'dialogue':
        return 'Диалог';
      case 'narration':
        return 'Нарратив';
      case 'choice':
        return 'Выбор';
      case 'background':
        return 'Фон';
      case 'character':
        return 'Персонаж';
      case 'audio':
        return 'Звук';
      case 'jump':
        return 'Переход';
      default:
        return type;
    }
  };

  const renderNodeEditor = (node: SceneNode, index: number) => {
    switch (node.type) {
      case 'dialogue': {
        const dialogueNode = node as DialogueNode;
        const character = characters.find(c => c.id === dialogueNode.characterId);
        return (
          <div className="space-y-2">
            <Select
              value={dialogueNode.characterId}
              onValueChange={(value) => onUpdateNode(node.id, { characterId: value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Персонаж" />
              </SelectTrigger>
              <SelectContent>
                {characters.map(char => (
                  <SelectItem key={char.id} value={char.id}>
                    <span style={{ color: `hsl(${char.color})` }}>{char.displayName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={dialogueNode.text}
              onChange={(e) => onUpdateNode(node.id, { text: e.target.value })}
              placeholder="Текст диалога..."
              className="min-h-[80px]"
            />
          </div>
        );
      }
      case 'narration': {
        const narrationNode = node as NarrationNode;
        return (
          <Textarea
            value={narrationNode.text}
            onChange={(e) => onUpdateNode(node.id, { text: e.target.value })}
            placeholder="Текст нарратива..."
            className="min-h-[80px]"
          />
        );
      }
      case 'choice': {
        const choiceNode = node as ChoiceNode;
        return (
          <div className="space-y-3">
            <Input
              value={choiceNode.prompt || ''}
              onChange={(e) => onUpdateNode(node.id, { prompt: e.target.value })}
              placeholder="Вопрос перед выбором (опционально)"
            />
            <div className="space-y-2">
              {choiceNode.options.map((option, optIdx) => (
                <div key={option.id} className="flex gap-2">
                  <Input
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...choiceNode.options];
                      newOptions[optIdx] = { ...option, text: e.target.value };
                      onUpdateNode(node.id, { options: newOptions });
                    }}
                    placeholder={`Вариант ${optIdx + 1}`}
                    className="flex-1"
                  />
                  <Input
                    value={option.targetSceneId}
                    onChange={(e) => {
                      const newOptions = [...choiceNode.options];
                      newOptions[optIdx] = { ...option, targetSceneId: e.target.value };
                      onUpdateNode(node.id, { options: newOptions });
                    }}
                    placeholder="ID сцены"
                    className="w-32"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [
                    ...choiceNode.options,
                    { id: generateId(), text: '', targetSceneId: '' },
                  ];
                  onUpdateNode(node.id, { options: newOptions });
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Добавить вариант
              </Button>
            </div>
          </div>
        );
      }
      default:
        return (
          <div className="text-sm text-muted-foreground">
            Редактирование узла типа "{node.type}" пока не поддерживается
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Заголовок */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium">{scene.name} — Узлы</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Добавить узел
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleAddDialogue}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Диалог
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddNarration}>
              <FileText className="h-4 w-4 mr-2" />
              Нарратив
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddChoice}>
              <GitBranch className="h-4 w-4 mr-2" />
              Выбор
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Список узлов */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {scene.nodes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет узлов. Нажмите "Добавить узел" чтобы начать.
            </div>
          ) : (
            scene.nodes.map((node, index) => (
              <div
                key={node.id}
                className="border border-border rounded-lg p-4 bg-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {getNodeIcon(node.type)}
                    <span>{getNodeLabel(node.type)}</span>
                    <span className="text-muted-foreground">#{index + 1}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteNode(node.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {renderNodeEditor(node, index)}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
