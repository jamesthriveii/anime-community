import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Picture = {
  id: string;
  title: string;
  category: string;
  image_url: string;
  full_url: string;
  artist: string | null;
  tags: string[];
  anime_name: string | null;
  character_name: string | null;
  storage_path: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  picture_id: string;
  created_at: string;
};
