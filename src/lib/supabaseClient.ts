import { createClient } from '@supabase/supabase-js';

// Substitua pelas suas credenciais do painel do Supabase
const supabaseUrl = 'https://vaxjxggdnriwwllbxmoi.supabase.co';
const supabaseAnonKey = 'sb_publishable_V03W9a3XrM29SjZHt8TMyw_ozH6DW3x';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);