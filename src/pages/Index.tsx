import { NovelPlayer } from '@/components/NovelPlayer';
import { mockNovel } from '@/data/mockNovel';

const Index = () => {
  return <NovelPlayer novel={mockNovel} />;
};

export default Index;
