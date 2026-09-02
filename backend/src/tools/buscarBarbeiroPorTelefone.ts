import { supabase } from '../supabase/client.js';

interface BarbeiroIdentificado {
  id: string;
  nome: string;
}

export async function buscarBarbeiroPorTelefone(
  barbeariaId: string,
  telefone: string,
): Promise<BarbeiroIdentificado | null> {
  const { data } = await supabase
    .from('barbeiros')
    .select('id, nome')
    .eq('barbearia_id', barbeariaId)
    .eq('telefone', telefone)
    .eq('ativo', true)
    .maybeSingle();

  return data;
}
