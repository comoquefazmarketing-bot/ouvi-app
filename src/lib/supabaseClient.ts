import { createClient } from '@supabase/supabase-js';

// No Next.js, as chaves de ambiente devem começar com NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 Erro: Chaves do Supabase não encontradas! Verifique o .env ou o painel da Vercel.");
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);