import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Isso te avisa no console se a Vercel não ler as chaves
  console.error("ERRO: Frequência do Supabase não encontrada!");
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // O padrão mais seguro para o Next.js 15
    storageKey: 'ouvi-session-v1'
    // Removi as 'cookieOptions' manuais para o Supabase usar o padrão estável dele
  }
});