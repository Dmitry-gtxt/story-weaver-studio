import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getUserNovels, createNovel, deleteNovel } from '@/lib/novelApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BookOpen, Trash2, Edit, LogOut, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface NovelItem {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  updated_at: string;
}

const NovelsList = () => {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [novels, setNovels] = useState<NovelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadNovels = async () => {
      if (!user) return;
      setIsLoading(true);
      const data = await getUserNovels(user.id);
      setNovels(data);
      setIsLoading(false);
    };

    if (user) {
      loadNovels();
    }
  }, [user]);

  const handleCreateNovel = async () => {
    if (!user) return;
    setIsCreating(true);
    const novelId = await createNovel(user.id);
    setIsCreating(false);

    if (novelId) {
      toast.success('Новелла создана');
      navigate(`/editor/${novelId}`);
    } else {
      toast.error('Ошибка создания новеллы');
    }
  };

  const handleDeleteNovel = async (novelId: string) => {
    const success = await deleteNovel(novelId);
    if (success) {
      setNovels(prev => prev.filter(n => n.id !== novelId));
      toast.success('Новелла удалена');
    } else {
      toast.error('Ошибка удаления');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Мои новеллы</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={handleCreateNovel} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Создать новеллу
              </>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : novels.length === 0 ? (
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CardTitle>У вас пока нет новелл</CardTitle>
              <CardDescription>
                Создайте свою первую визуальную новеллу
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateNovel} disabled={isCreating}>
                <Plus className="h-4 w-4 mr-2" />
                Создать новеллу
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {novels.map(novel => (
              <Card key={novel.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{novel.title}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/play/${novel.id}`)}
                        title="Играть"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/editor/${novel.id}`)}
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить новеллу?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Это действие нельзя отменить. Все данные новеллы будут удалены.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteNovel(novel.id)}>
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {novel.description || 'Без описания'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Обновлено: {new Date(novel.updated_at).toLocaleDateString('ru-RU')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NovelsList;
