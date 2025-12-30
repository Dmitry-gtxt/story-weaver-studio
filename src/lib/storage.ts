import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'novel-assets';

export const uploadFile = async (
  userId: string,
  file: File,
  type: 'image' | 'audio'
): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const fileName = `${userId}/${type}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  // Извлекаем путь файла из URL
  const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
  if (urlParts.length < 2) return false;
  
  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  return !error;
};
