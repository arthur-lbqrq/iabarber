import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes no .env');
}

// Anon key só é usada aqui pro login (Supabase Auth). Nenhuma consulta às tabelas de
// negócio (barbearias, barbeiros etc.) passa pela anon key neste app — tudo isso vai
// pelo backend (/api/admin/*), que confirma que quem está logado é mesmo um admin do
// Corte Certo antes de usar a service role key. A tabela `admins` em si tem RLS
// ligado sem nenhuma policy, então nem daria pra ler ela direto daqui.
export const supabase = createClient(url, anonKey);
