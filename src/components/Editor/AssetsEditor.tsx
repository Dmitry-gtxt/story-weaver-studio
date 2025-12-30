import { useState } from 'react';
import { Background, AudioAsset, UUID } from '@/types/novel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Music, 
  Volume2,
  Upload,
  Play,
  Pause,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useRef } from 'react';

interface AssetsEditorProps {
  backgrounds: Background[];
  audioAssets: AudioAsset[];
  onAddBackground: (bg: Background) => void;
  onUpdateBackground: (id: UUID, updates: Partial<Background>) => void;
  onDeleteBackground: (id: UUID) => void;
  onAddAudio: (audio: AudioAsset) => void;
  onUpdateAudio: (id: UUID, updates: Partial<AudioAsset>) => void;
  onDeleteAudio: (id: UUID) => void;
  generateId: () => UUID;
}

export const AssetsEditor = ({
  backgrounds,
  audioAssets,
  onAddBackground,
  onUpdateBackground,
  onDeleteBackground,
  onAddAudio,
  onUpdateAudio,
  onDeleteAudio,
  generateId,
}: AssetsEditorProps) => {
  const [editingId, setEditingId] = useState<UUID | null>(null);
  const [editingName, setEditingName] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<UUID | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAddBackground = () => {
    const newBg: Background = {
      id: generateId(),
      name: `Фон ${backgrounds.length + 1}`,
      imageUrl: '/placeholder.svg',
    };
    onAddBackground(newBg);
  };

  const handleAddAudio = (type: 'bgm' | 'sfx') => {
    const newAudio: AudioAsset = {
      id: generateId(),
      name: type === 'bgm' ? `Музыка ${audioAssets.filter(a => a.type === 'bgm').length + 1}` : `Звук ${audioAssets.filter(a => a.type === 'sfx').length + 1}`,
      type,
      audioUrl: '',
    };
    onAddAudio(newAudio);
  };

  const handleImageUpload = (bgId: UUID, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      onUpdateBackground(bgId, { imageUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleAudioUpload = (audioId: UUID, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const audioUrl = e.target?.result as string;
      onUpdateAudio(audioId, { audioUrl });
    };
    reader.readAsDataURL(file);
  };

  const startEditing = (id: UUID, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveEditing = (type: 'background' | 'audio') => {
    if (editingId && editingName.trim()) {
      if (type === 'background') {
        onUpdateBackground(editingId, { name: editingName.trim() });
      } else {
        onUpdateAudio(editingId, { name: editingName.trim() });
      }
    }
    setEditingId(null);
    setEditingName('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const toggleAudioPlay = (audioId: UUID, audioUrl: string) => {
    if (playingAudioId === audioId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingAudioId(null);
      setPlayingAudioId(audioId);
    }
  };

  const bgmAssets = audioAssets.filter(a => a.type === 'bgm');
  const sfxAssets = audioAssets.filter(a => a.type === 'sfx');

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <Tabs defaultValue="backgrounds">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backgrounds" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Фоны ({backgrounds.length})
            </TabsTrigger>
            <TabsTrigger value="bgm" className="gap-2">
              <Music className="h-4 w-4" />
              Музыка ({bgmAssets.length})
            </TabsTrigger>
            <TabsTrigger value="sfx" className="gap-2">
              <Volume2 className="h-4 w-4" />
              Звуки ({sfxAssets.length})
            </TabsTrigger>
          </TabsList>

          {/* Фоны */}
          <TabsContent value="backgrounds" className="mt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Фоновые изображения</CardTitle>
                <Button size="sm" onClick={handleAddBackground}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить фон
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {backgrounds.map(bg => (
                    <div
                      key={bg.id}
                      className="group relative border border-border rounded-lg overflow-hidden"
                    >
                      <div className="aspect-video bg-muted">
                        <img
                          src={bg.imageUrl}
                          alt={bg.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Название */}
                      <div className="p-2 bg-background">
                        {editingId === bg.id ? (
                          <div className="flex gap-1">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-7 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditing('background');
                                if (e.key === 'Escape') cancelEditing();
                              }}
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEditing('background')}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditing}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate">{bg.name}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={() => startEditing(bg.id, bg.name)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Оверлей с действиями */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(bg.id, file);
                            }}
                          />
                          <div className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                            <Upload className="h-4 w-4" />
                          </div>
                        </label>
                        <button
                          className="p-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                          onClick={() => onDeleteBackground(bg.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {backgrounds.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Нет фоновых изображений</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Музыка (BGM) */}
          <TabsContent value="bgm" className="mt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Фоновая музыка</CardTitle>
                <Button size="sm" onClick={() => handleAddAudio('bgm')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить музыку
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {bgmAssets.map(audio => (
                      <AudioItem
                        key={audio.id}
                        audio={audio}
                        isPlaying={playingAudioId === audio.id}
                        isEditing={editingId === audio.id}
                        editingName={editingName}
                        onPlay={() => toggleAudioPlay(audio.id, audio.audioUrl)}
                        onEdit={() => startEditing(audio.id, audio.name)}
                        onSave={() => saveEditing('audio')}
                        onCancel={cancelEditing}
                        onEditNameChange={setEditingName}
                        onUpload={(file) => handleAudioUpload(audio.id, file)}
                        onDelete={() => onDeleteAudio(audio.id)}
                      />
                    ))}

                    {bgmAssets.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Нет музыкальных треков</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Звуковые эффекты (SFX) */}
          <TabsContent value="sfx" className="mt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Звуковые эффекты</CardTitle>
                <Button size="sm" onClick={() => handleAddAudio('sfx')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить звук
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {sfxAssets.map(audio => (
                      <AudioItem
                        key={audio.id}
                        audio={audio}
                        isPlaying={playingAudioId === audio.id}
                        isEditing={editingId === audio.id}
                        editingName={editingName}
                        onPlay={() => toggleAudioPlay(audio.id, audio.audioUrl)}
                        onEdit={() => startEditing(audio.id, audio.name)}
                        onSave={() => saveEditing('audio')}
                        onCancel={cancelEditing}
                        onEditNameChange={setEditingName}
                        onUpload={(file) => handleAudioUpload(audio.id, file)}
                        onDelete={() => onDeleteAudio(audio.id)}
                      />
                    ))}

                    {sfxAssets.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Volume2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Нет звуковых эффектов</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Компонент для отображения аудио-файла
interface AudioItemProps {
  audio: AudioAsset;
  isPlaying: boolean;
  isEditing: boolean;
  editingName: string;
  onPlay: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditNameChange: (name: string) => void;
  onUpload: (file: File) => void;
  onDelete: () => void;
}

const AudioItem = ({
  audio,
  isPlaying,
  isEditing,
  editingName,
  onPlay,
  onEdit,
  onSave,
  onCancel,
  onEditNameChange,
  onUpload,
  onDelete,
}: AudioItemProps) => {
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg group hover:bg-muted/50">
      {/* Иконка типа */}
      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
        {audio.type === 'bgm' ? (
          <Music className="h-5 w-5 text-primary" />
        ) : (
          <Volume2 className="h-5 w-5 text-primary" />
        )}
      </div>

      {/* Название */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex gap-1">
            <Input
              value={editingName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave();
                if (e.key === 'Escape') onCancel();
              }}
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div>
            <p className="font-medium truncate">{audio.name}</p>
            <p className="text-xs text-muted-foreground">
              {audio.audioUrl ? 'Файл загружен' : 'Файл не загружен'}
            </p>
          </div>
        )}
      </div>

      {/* Кнопки действий */}
      {!isEditing && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {audio.audioUrl && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onPlay}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
            <div className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent">
              <Upload className="h-4 w-4" />
            </div>
          </label>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
