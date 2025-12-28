import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vaxjxggdnriwwllbxmoi.supabase.co';
const supabaseAnonKey = 'sb_publishable_V03W9a3XrM29SjZHt8TMyw_ozH6DW3x';

// Exportação nominal obrigatória para resolver o erro de build
export const supabase = createClient(supabaseUrl, supabaseAnonKey);