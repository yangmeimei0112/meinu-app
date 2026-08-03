import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 建立並匯出 Supabase 客戶端實例
export const supabase = createClient(supabaseUrl, supabaseAnonKey);