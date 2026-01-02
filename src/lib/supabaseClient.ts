import { createClient } from '@supabase/supabase-js';

// Verifique se estas variáveis estão corretas no seu .env.local e na Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vaxjxggdnriwwllbxmoi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Essencial para evitar o loop de redirecionamento
    storageKey: 'ouvi-auth-token', // Garante que o cookie não se perca entre domínios
  }
});