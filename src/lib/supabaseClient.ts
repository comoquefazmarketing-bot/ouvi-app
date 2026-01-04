import { createClient } from '@supabase/supabase-js';

// Função auxiliar para garantir que o código só rode se houver chaves
const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // No servidor (Vercel Build), isso ajuda a identificar o erro no log
    throw new Error("🚨 CRÍTICO: Chaves do Supabase ausentes no Ambiente de Execução!");
  }
  return { url, key };
};

const { url, key } = getSupabaseConfig();

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});