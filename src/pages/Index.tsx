import { NovelPlayer } from '@/components/NovelPlayer';
import { mockNovel } from '@/data/mockNovel';

const Index = () => {
  return (
    <div className="relative">
      <NovelPlayer novel={mockNovel} />
    </div>
  );
};

export default Index;
