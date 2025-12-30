import { useState } from 'react';
import { Scene, SceneNode, Character, UUID, DialogueNode, NarrationNode, ChoiceNode, BackgroundNode, CharacterNode, AudioNode, JumpNode, Background, AudioAsset } from '@/types/novel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, MessageSquare, FileText, GitBranch, GripVertical, ChevronUp, ChevronDown, Eye, EyeOff, Image, User, Music, ArrowRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface NodeEditorProps {
  scene: Scene | undefined;
  allScenes: Scene[];
  characters: Character[];
  backgrounds: Background[];
  audioAssets: AudioAsset[];
  onAddNode: (node: SceneNode) => void;
  onDeleteNode: (nodeId: UUID) => void;
  onUpdateNode: (nodeId: UUID, updates: Partial<SceneNode>) => void;
  onReorderNodes: (fromIndex: number, toIndex: number) => void;
  generateId: () => string;
}

export const NodeEditor = ({
  scene,
  allScenes,
  characters,
  backgrounds,
  audioAssets,
  onAddNode,
  onDeleteNode,
  onUpdateNode,
  onReorderNodes,
  generateId,
}: NodeEditorProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!scene) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Выберите сцену для редактирования
      </div>
    );
  }

  // Обработчики добавления узлов
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

  const handleAddBackground = () => {
    const node: BackgroundNode = {
      id: generateId(),
      type: 'background',
      backgroundId: backgrounds[0]?.id || '',
      transition: 'fade',
    };
    onAddNode(node);
  };

  const handleAddCharacter = () => {
    const node: CharacterNode = {
      id: generateId(),
      type: 'character',
      characterId: characters[0]?.id || '',
      action: 'enter',
      position: 'center',
    };
    onAddNode(node);
  };

  const handleAddAudio = () => {
    const node: AudioNode = {
      id: generateId(),
      type: 'audio',
      audioId: audioAssets[0]?.id || '',
      action: 'play',
    };
    onAddNode(node);
  };

  const handleAddJump = () => {
    const node: JumpNode = {
      id: generateId(),
      type: 'jump',
      targetSceneId: allScenes[0]?.id || '',
    };
    onAddNode(node);
  };

  const handleMoveNode = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < scene.nodes.length) {
      onReorderNodes(index, newIndex);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorderNodes(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'dialogue':
        return <MessageSquare className="h-4 w-4" />;
      case 'narration':
        return <FileText className="h-4 w-4" />;
      case 'choice':
        return <GitBranch className="h-4 w-4" />;
      case 'background':
        return <Image className="h-4 w-4" />;
      case 'character':
        return <User className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'jump':
        return <ArrowRight className="h-4 w-4" />;
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
        return (
          <div className="space-y-2">
            <Select
              value={dialogueNode.characterId}
              onValueChange={(value) => onUpdateNode(node.id, { characterId: value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Персонаж" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
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
                  <Select
                    value={option.targetSceneId || 'none'}
                    onValueChange={(value) => {
                      const newOptions = [...choiceNode.options];
                      newOptions[optIdx] = { ...option, targetSceneId: value === 'none' ? '' : value };
                      onUpdateNode(node.id, { options: newOptions });
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Целевая сцена" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="none">
                        <span className="text-muted-foreground">Не выбрано</span>
                      </SelectItem>
                      {allScenes.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      if (choiceNode.options.length > 1) {
                        const newOptions = choiceNode.options.filter((_, i) => i !== optIdx);
                        onUpdateNode(node.id, { options: newOptions });
                      }
                    }}
                    disabled={choiceNode.options.length <= 1}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
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
      case 'background': {
        const bgNode = node as BackgroundNode;
        const bg = backgrounds.find(b => b.id === bgNode.backgroundId);
        return (
          <div className="flex gap-3">
            <Select
              value={bgNode.backgroundId || 'none'}
              onValueChange={(value) => onUpdateNode(node.id, { backgroundId: value === 'none' ? '' : value })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Выберите фон" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none">
                  <span className="text-muted-foreground">Не выбрано</span>
                </SelectItem>
                {backgrounds.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={bgNode.transition || 'fade'}
              onValueChange={(value) => onUpdateNode(node.id, { transition: value as 'fade' | 'instant' | 'dissolve' })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Переход" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="fade">Плавно</SelectItem>
                <SelectItem value="instant">Мгновенно</SelectItem>
                <SelectItem value="dissolve">Растворение</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      }
      case 'character': {
        const charNode = node as CharacterNode;
        const char = characters.find(c => c.id === charNode.characterId);
        return (
          <div className="flex flex-wrap gap-3">
            <Select
              value={charNode.characterId || 'none'}
              onValueChange={(value) => onUpdateNode(node.id, { characterId: value === 'none' ? '' : value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Персонаж" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none">
                  <span className="text-muted-foreground">Не выбрано</span>
                </SelectItem>
                {characters.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <span style={{ color: `hsl(${c.color})` }}>{c.displayName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={charNode.action}
              onValueChange={(value) => onUpdateNode(node.id, { action: value as 'enter' | 'exit' | 'move' })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Действие" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="enter">Появление</SelectItem>
                <SelectItem value="exit">Уход</SelectItem>
                <SelectItem value="move">Перемещение</SelectItem>
              </SelectContent>
            </Select>
            {charNode.action !== 'exit' && (
              <Select
                value={charNode.position || 'center'}
                onValueChange={(value) => onUpdateNode(node.id, { position: value as 'left' | 'center' | 'right' })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Позиция" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="left">Слева</SelectItem>
                  <SelectItem value="center">По центру</SelectItem>
                  <SelectItem value="right">Справа</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Input
              value={charNode.emotion || ''}
              onChange={(e) => onUpdateNode(node.id, { emotion: e.target.value })}
              placeholder="Эмоция (опционально)"
              className="w-40"
            />
          </div>
        );
      }
      case 'audio': {
        const audioNode = node as AudioNode;
        const audio = audioAssets.find(a => a.id === audioNode.audioId);
        return (
          <div className="flex gap-3">
            <Select
              value={audioNode.audioId || 'none'}
              onValueChange={(value) => onUpdateNode(node.id, { audioId: value === 'none' ? '' : value })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Аудио" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none">
                  <span className="text-muted-foreground">Не выбрано</span>
                </SelectItem>
                {audioAssets.filter(a => a.type === 'bgm').length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Музыка</DropdownMenuLabel>
                    {audioAssets.filter(a => a.type === 'bgm').map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        🎵 {a.name}
                      </SelectItem>
                    ))}
                  </>
                )}
                {audioAssets.filter(a => a.type === 'sfx').length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Звуки</DropdownMenuLabel>
                    {audioAssets.filter(a => a.type === 'sfx').map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        🔊 {a.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <Select
              value={audioNode.action}
              onValueChange={(value) => onUpdateNode(node.id, { action: value as 'play' | 'stop' | 'fade-out' })}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Действие" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="play">Воспроизвести</SelectItem>
                <SelectItem value="stop">Остановить</SelectItem>
                <SelectItem value="fade-out">Затухание</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      }
      case 'jump': {
        const jumpNode = node as JumpNode;
        const targetScene = allScenes.find(s => s.id === jumpNode.targetSceneId);
        return (
          <Select
            value={jumpNode.targetSceneId || 'none'}
            onValueChange={(value) => onUpdateNode(node.id, { targetSceneId: value === 'none' ? '' : value })}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Целевая сцена" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="none">
                <span className="text-muted-foreground">Не выбрано</span>
              </SelectItem>
              {allScenes.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      default: {
        const unknownNode = node as { type: string };
        return (
          <div className="text-sm text-muted-foreground">
            Неизвестный тип узла: {unknownNode.type}
          </div>
        );
      }
    }
  };

  // Рендер превью узла
  const renderNodePreview = (node: SceneNode) => {
    switch (node.type) {
      case 'dialogue': {
        const dialogueNode = node as DialogueNode;
        const character = characters.find(c => c.id === dialogueNode.characterId);
        return (
          <div className="text-sm">
            <span style={{ color: character ? `hsl(${character.color})` : undefined }} className="font-medium">
              {character?.displayName || 'Персонаж'}:
            </span>{' '}
            <span className="text-muted-foreground">{dialogueNode.text || '...'}</span>
          </div>
        );
      }
      case 'narration': {
        const narrationNode = node as NarrationNode;
        return (
          <div className="text-sm italic text-muted-foreground">
            {narrationNode.text || '...'}
          </div>
        );
      }
      case 'choice': {
        const choiceNode = node as ChoiceNode;
        return (
          <div className="text-sm space-y-1">
            {choiceNode.prompt && <div className="text-muted-foreground">{choiceNode.prompt}</div>}
            <div className="flex flex-wrap gap-2">
              {choiceNode.options.map(opt => (
                <span key={opt.id} className="px-2 py-1 bg-primary/10 rounded text-xs">
                  {opt.text || '...'}
                </span>
              ))}
            </div>
          </div>
        );
      }
      case 'background': {
        const bgNode = node as BackgroundNode;
        const bg = backgrounds.find(b => b.id === bgNode.backgroundId);
        return (
          <div className="text-sm text-muted-foreground">
            Фон: <span className="font-medium">{bg?.name || 'не выбран'}</span>
            <span className="text-xs ml-2">({bgNode.transition})</span>
          </div>
        );
      }
      case 'character': {
        const charNode = node as CharacterNode;
        const char = characters.find(c => c.id === charNode.characterId);
        const actionLabels = { enter: 'появляется', exit: 'уходит', move: 'перемещается' };
        const posLabels = { left: 'слева', center: 'по центру', right: 'справа' };
        return (
          <div className="text-sm text-muted-foreground">
            <span style={{ color: char ? `hsl(${char.color})` : undefined }} className="font-medium">
              {char?.displayName || 'Персонаж'}
            </span>{' '}
            {actionLabels[charNode.action]}
            {charNode.action !== 'exit' && charNode.position && ` ${posLabels[charNode.position]}`}
          </div>
        );
      }
      case 'audio': {
        const audioNode = node as AudioNode;
        const audio = audioAssets.find(a => a.id === audioNode.audioId);
        const actionLabels = { play: '▶', stop: '⏹', 'fade-out': '🔉' };
        return (
          <div className="text-sm text-muted-foreground">
            {actionLabels[audioNode.action]} {audio?.name || 'не выбрано'}
          </div>
        );
      }
      case 'jump': {
        const jumpNode = node as JumpNode;
        const targetScene = allScenes.find(s => s.id === jumpNode.targetSceneId);
        return (
          <div className="text-sm text-muted-foreground">
            → Переход в: <span className="font-medium">{targetScene?.name || 'не выбрано'}</span>
          </div>
        );
      }
      default: {
        const unknownNode = node as { type: string };
        return <div className="text-sm text-muted-foreground">[{unknownNode.type}]</div>;
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Заголовок */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{scene.name} — Узлы</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="text-muted-foreground"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="ml-1 text-xs">{showPreview ? 'Редактор' : 'Превью'}</span>
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Добавить узел
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Контент</DropdownMenuLabel>
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
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Сцена</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleAddBackground}>
              <Image className="h-4 w-4 mr-2" />
              Фон
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddCharacter}>
              <User className="h-4 w-4 mr-2" />
              Персонаж
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddAudio}>
              <Music className="h-4 w-4 mr-2" />
              Звук
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Навигация</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleAddJump}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Переход
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Список узлов */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {scene.nodes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет узлов. Нажмите "Добавить узел" чтобы начать.
            </div>
          ) : showPreview ? (
            // Режим превью
            scene.nodes.map((node, index) => (
              <div
                key={node.id}
                className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                  {getNodeIcon(node.type)}
                  <span className="text-xs">#{index + 1}</span>
                </div>
                <div className="flex-1">{renderNodePreview(node)}</div>
              </div>
            ))
          ) : (
            // Режим редактирования
            scene.nodes.map((node, index) => (
              <div
                key={node.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`border border-border rounded-lg p-4 bg-card transition-all ${
                  draggedIndex === index ? 'opacity-50 border-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    {getNodeIcon(node.type)}
                    <span>{getNodeLabel(node.type)}</span>
                    <span className="text-muted-foreground">#{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleMoveNode(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleMoveNode(index, 'down')}
                      disabled={index === scene.nodes.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onDeleteNode(node.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
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
