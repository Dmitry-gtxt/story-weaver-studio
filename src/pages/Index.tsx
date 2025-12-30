import { NovelPlayer } from '@/components/NovelPlayer';
import { mockNovel } from '@/data/mockNovel';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

const Index = () => {
  return (
    <div className="relative">
      <NovelPlayer novel={mockNovel} />
      <Link to="/editor" className="absolute top-4 right-4 z-50">
        <Button variant="ghost" size="sm" className="text-muted-foreground/70 hover:text-foreground">
          <Settings className="h-4 w-4 mr-1" />
          Редактор
        </Button>
      </Link>
    </div>
  );
};

export default Index;
