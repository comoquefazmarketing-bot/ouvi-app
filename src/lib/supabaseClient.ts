import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verifica se as chaves existem para alertar o desenvolvedor no console
export const supabaseConfigError =
  supabaseUrl && supabaseAnonKey
    ? null
    : "Supabase não configurado. Verifique seu arquivo .env.local.";

if (supabaseConfigError) {
  console.error(supabaseConfigError);
}

// Exportação garantida: evita erros de importação em outros componentes
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", // URL fallback para evitar crash no build
  supabaseAnonKey || "placeholder-key"
);