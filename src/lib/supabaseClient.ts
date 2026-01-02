import { createClient } from '@supabase/supabase-js';

// As variáveis devem estar sem espaços extras na Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: Variáveis do Supabase não configuradas no ambiente!");
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Com as Origens JavaScript salvas, voltamos para o padrão seguro PKCE
    flowType: 'pkce', 
    storageKey: 'ouvi-auth-v1',
    cookieOptions: {
      name: 'ouvi-token',
      lifetime: 60 * 60 * 24 * 7, // 7 dias de sessão
      domain: 'ouvi.ia.br',
      path: '/',
      sameSite: 'lax',
    }
  }
});