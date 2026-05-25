import { createClient } from '@supabase/supabase-js';
import type { Database } from '@barbearia/shared';

// Fornece fallbacks seguros para evitar que o "next build" quebre por falta de variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    'Aviso: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não foram definidos no seu arquivo .env.local'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
