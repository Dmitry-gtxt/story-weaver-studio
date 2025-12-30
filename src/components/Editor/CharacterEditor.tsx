import { useState } from 'react';
import { Character, CharacterSprite, UUID } from '@/types/novel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  User, 
  Palette, 
  ImagePlus,
  X,
  Smile,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { uploadFile } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

interface CharacterEditorProps {
  characters: Character[];
  onAddCharacter: (character: Character) => void;
  onUpdateCharacter: (characterId: UUID, updates: Partial<Character>) => void;
  onDeleteCharacter: (characterId: UUID) => void;
  onAddSprite: (characterId: UUID, sprite: CharacterSprite) => void;
  onDeleteSprite: (characterId: UUID, spriteId: UUID) => void;
  onUpdateSprite: (characterId: UUID, spriteId: UUID, updates: Partial<CharacterSprite>) => Promise<boolean>;
  generateId: () => UUID;
  userId: string;
}

export const CharacterEditor = ({
  characters,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onAddSprite,
  onDeleteSprite,
  onUpdateSprite,
  generateId,
  userId,
}: CharacterEditorProps) => {
  const [uploadingSprite, setUploadingSprite] = useState<UUID | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<UUID | null>(
    characters[0]?.id || null
  );
  const [newEmotionName, setNewEmotionName] = useState('');
  const [newEmotionUrl, setNewEmotionUrl] = useState('');

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  const handleAddCharacter = () => {
    const newCharacter: Character = {
      id: generateId(),
      name: `character_${characters.length + 1}`,
      displayName: `Персонаж ${characters.length + 1}`,
      color: '220 70% 50%',
      sprites: [],
    };
    onAddCharacter(newCharacter);
    setSelectedCharacterId(newCharacter.id);
  };

  const handleAddSprite = () => {
    if (!selectedCharacterId || !newEmotionName.trim()) return;
    
    const sprite: CharacterSprite = {
      id: generateId(),
      emotion: newEmotionName.trim(),
      imageUrl: newEmotionUrl.trim() || '/placeholder.svg',
    };
    
    onAddSprite(selectedCharacterId, sprite);
    setNewEmotionName('');
    setNewEmotionUrl('');
  };

  const handleImageUpload = async (characterId: UUID, spriteId: UUID, file: File) => {
    setUploadingSprite(spriteId);
    try {
      const imageUrl = await uploadFile(userId, file, 'image');
      if (imageUrl) {
        const success = await onUpdateSprite(characterId, spriteId, { imageUrl });
        if (success) {
          toast({ title: 'Изображение загружено' });
        } else {
          toast({ title: 'Ошибка сохранения', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Ошибка загрузки', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' });
    } finally {
      setUploadingSprite(null);
    }
  };

  return (
    <div className="flex h-full">
      {/* Список персонажей */}
      <div className="w-64 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="font-medium text-sm">Персонажи</h3>
          <Button size="sm" variant="ghost" onClick={handleAddCharacter}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {characters.map(character => (
              <div
                key={character.id}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                  selectedCharacterId === character.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedCharacterId(character.id)}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `hsl(${character.color})` }}
                >
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{character.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{character.name}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Редактор персонажа */}
      <div className="flex-1 overflow-auto p-4">
        {selectedCharacter ? (
          <div className="space-y-6 max-w-2xl">
            {/* Основная информация */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Основная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Идентификатор</Label>
                    <Input
                      id="name"
                      value={selectedCharacter.name}
                      onChange={(e) => onUpdateCharacter(selectedCharacter.id, { name: e.target.value })}
                      placeholder="character_id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Отображаемое имя</Label>
                    <Input
                      id="displayName"
                      value={selectedCharacter.displayName}
                      onChange={(e) => onUpdateCharacter(selectedCharacter.id, { displayName: e.target.value })}
                      placeholder="Имя персонажа"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Цвет имени в диалогах
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={selectedCharacter.color}
                      onChange={(e) => onUpdateCharacter(selectedCharacter.id, { color: e.target.value })}
                      placeholder="220 70% 50%"
                      className="flex-1"
                    />
                    <div
                      className="w-10 h-10 rounded-md border border-border"
                      style={{ backgroundColor: `hsl(${selectedCharacter.color})` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Формат HSL: оттенок насыщенность% яркость%
                  </p>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDeleteCharacter(selectedCharacter.id);
                    const remaining = characters.filter(c => c.id !== selectedCharacter.id);
                    setSelectedCharacterId(remaining[0]?.id || null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить персонажа
                </Button>
              </CardContent>
            </Card>

            {/* Эмоции и спрайты */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Smile className="h-4 w-4" />
                  Эмоции и спрайты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Существующие эмоции */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedCharacter.sprites.map(sprite => (
                    <div
                      key={sprite.id}
                      className="relative group border border-border rounded-lg p-2"
                    >
                      <div className="aspect-square bg-muted rounded-md overflow-hidden mb-2">
                        <img
                          src={sprite.imageUrl}
                          alt={sprite.emotion}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Badge variant="secondary" className="w-full justify-center">
                        {sprite.emotion}
                      </Badge>
                      
                      {/* Кнопки управления */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {uploadingSprite === sprite.id ? (
                          <div className="p-1 bg-primary text-primary-foreground rounded-md">
                            <Loader2 className="h-3 w-3 animate-spin" />
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(selectedCharacter.id, sprite.id, file);
                                }
                              }}
                            />
                            <div className="p-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                              <ImagePlus className="h-3 w-3" />
                            </div>
                          </label>
                        )}
                        <button
                          className="p-1 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                          onClick={() => onDeleteSprite(selectedCharacter.id, sprite.id)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Добавить новую эмоцию */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить эмоцию
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Новая эмоция</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="emotionName">Название эмоции</Label>
                        <Input
                          id="emotionName"
                          value={newEmotionName}
                          onChange={(e) => setNewEmotionName(e.target.value)}
                          placeholder="happy, sad, angry..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emotionUrl">URL изображения (опционально)</Label>
                        <Input
                          id="emotionUrl"
                          value={newEmotionUrl}
                          onChange={(e) => setNewEmotionUrl(e.target.value)}
                          placeholder="https://..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Оставьте пустым для загрузки позже
                        </p>
                      </div>
                      <Button onClick={handleAddSprite} className="w-full">
                        Добавить
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <User className="h-12 w-12 mb-4" />
            <p>Выберите персонажа или создайте нового</p>
            <Button variant="outline" className="mt-4" onClick={handleAddCharacter}>
              <Plus className="h-4 w-4 mr-2" />
              Создать персонажа
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
