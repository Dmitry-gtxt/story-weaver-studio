-- Таблица профилей пользователей
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Триггер для автосоздания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Таблица новелл
CREATE TABLE public.novels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Новая новелла',
  author TEXT,
  description TEXT,
  cover_url TEXT,
  start_scene_id TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own novels" ON public.novels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view published novels" ON public.novels
  FOR SELECT USING (is_published = true);

CREATE POLICY "Users can insert own novels" ON public.novels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own novels" ON public.novels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own novels" ON public.novels
  FOR DELETE USING (auth.uid() = user_id);

-- Таблица персонажей
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own characters" ON public.characters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.novels WHERE novels.id = characters.novel_id AND novels.user_id = auth.uid())
  );

-- Таблица спрайтов персонажей
CREATE TABLE public.character_sprites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  emotion TEXT NOT NULL DEFAULT 'normal',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.character_sprites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sprites" ON public.character_sprites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.characters c
      JOIN public.novels n ON n.id = c.novel_id
      WHERE c.id = character_sprites.character_id AND n.user_id = auth.uid()
    )
  );

-- Таблица фонов
CREATE TABLE public.backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.backgrounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own backgrounds" ON public.backgrounds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.novels WHERE novels.id = backgrounds.novel_id AND novels.user_id = auth.uid())
  );

-- Таблица аудио
CREATE TABLE public.audio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bgm', 'sfx')),
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audio_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own audio" ON public.audio_assets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.novels WHERE novels.id = audio_assets.novel_id AND novels.user_id = auth.uid())
  );

-- Таблица глав
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Глава 1',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chapters" ON public.chapters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.novels WHERE novels.id = chapters.novel_id AND novels.user_id = auth.uid())
  );

-- Таблица сцен
CREATE TABLE public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Новая сцена',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scenes" ON public.scenes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chapters c
      JOIN public.novels n ON n.id = c.novel_id
      WHERE c.id = scenes.chapter_id AND n.user_id = auth.uid()
    )
  );

-- Таблица узлов сцен (диалоги, выборы и т.д.)
CREATE TABLE public.scene_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scene_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nodes" ON public.scene_nodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.scenes s
      JOIN public.chapters c ON c.id = s.chapter_id
      JOIN public.novels n ON n.id = c.novel_id
      WHERE s.id = scene_nodes.scene_id AND n.user_id = auth.uid()
    )
  );

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_novels_updated_at
  BEFORE UPDATE ON public.novels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket для медиа-файлов
INSERT INTO storage.buckets (id, name, public) VALUES ('novel-assets', 'novel-assets', true);

-- Политики для storage
CREATE POLICY "Anyone can view novel assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'novel-assets');

CREATE POLICY "Authenticated users can upload assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'novel-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'novel-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'novel-assets' AND auth.uid()::text = (storage.foldername(name))[1]);