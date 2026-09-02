import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes no .env');
}

// Anon key: seguro expor no frontend por design — quem protege os dados é a RLS
// do banco (cada barbeiro só enxerga a própria barbearia), não o segredo da chave.
export const supabase = createClient(url, anonKey);
