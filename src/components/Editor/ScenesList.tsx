import { Chapter, UUID } from '@/types/novel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface ScenesListProps {
  chapters: Chapter[];
  selectedSceneId: UUID | null;
  onSelectScene: (sceneId: UUID) => void;
  onAddScene: () => void;
  onDeleteScene: (sceneId: UUID) => void;
  onRenameScene: (sceneId: UUID, newName: string) => void;
}

export const ScenesList = ({
  chapters,
  selectedSceneId,
  onSelectScene,
  onAddScene,
  onDeleteScene,
  onRenameScene,
}: ScenesListProps) => {
  const [editingSceneId, setEditingSceneId] = useState<UUID | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (sceneId: UUID, currentName: string) => {
    setEditingSceneId(sceneId);
    setEditName(currentName);
  };

  const handleFinishEdit = (sceneId: UUID) => {
    if (editName.trim()) {
      onRenameScene(sceneId, editName.trim());
    }
    setEditingSceneId(null);
  };

  return (
    <div className="w-64 border-r border-border flex flex-col bg-muted/30">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium">Сцены</span>
        <Button variant="ghost" size="sm" onClick={onAddScene}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chapters.map(chapter => (
            <div key={chapter.id}>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {chapter.title}
              </div>
              {chapter.scenes.map(scene => (
                <div
                  key={scene.id}
                  className={cn(
                    'group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors',
                    selectedSceneId === scene.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => onSelectScene(scene.id)}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  
                  {editingSceneId === scene.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleFinishEdit(scene.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishEdit(scene.id);
                        if (e.key === 'Escape') setEditingSceneId(null);
                      }}
                      className="h-6 text-sm py-0 px-1"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="flex-1 text-sm truncate"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(scene.id, scene.name);
                      }}
                    >
                      {scene.name}
                    </span>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {scene.nodes.length}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScene(scene.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
