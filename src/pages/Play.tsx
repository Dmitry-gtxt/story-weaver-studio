import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NovelPlayer } from '@/components/NovelPlayer';
import { loadNovelFromDb } from '@/lib/novelApi';
import { Novel } from '@/types/novel';
import { Loader2 } from 'lucide-react';

const Play = () => {
  const { novelId } = useParams<{ novelId: string }>();
  const navigate = useNavigate();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNovel = async () => {
      if (!novelId) {
        setError('ID новеллы не указан');
        setLoading(false);
        return;
      }

      try {
        console.log('Loading novel:', novelId);
        const loadedNovel = await loadNovelFromDb(novelId);
        console.log('Loaded novel:', loadedNovel);
        console.log('Chapters:', loadedNovel?.chapters);
        console.log('First scene:', loadedNovel?.chapters?.[0]?.scenes?.[0]);
        console.log('Start scene ID:', loadedNovel?.startSceneId);
        
        if (loadedNovel) {
          if (!loadedNovel.startSceneId || loadedNovel.chapters.length === 0) {
            setError('Новелла пуста — добавьте сцены в редакторе');
          } else {
            setNovel(loadedNovel);
          }
        } else {
          setError('Новелла не найдена или недоступна');
        }
      } catch (err) {
        console.error('Error loading novel:', err);
        setError('Ошибка загрузки новеллы');
      } finally {
        setLoading(false);
      }
    };

    loadNovel();
  }, [novelId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !novel) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <p className="text-muted-foreground">{error || 'Новелла не найдена'}</p>
        <button 
          onClick={() => navigate('/')}
          className="text-primary hover:underline"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return <NovelPlayer novel={novel} />;
};

export default Play;
