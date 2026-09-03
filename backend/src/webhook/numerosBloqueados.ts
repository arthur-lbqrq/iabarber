import { supabase } from '../supabase/client.js';

export async function numeroBloqueado(barbeariaId: string, telefone: string): Promise<boolean> {
  const { data } = await supabase
    .from('numeros_bloqueados')
    .select('id')
    .eq('barbearia_id', barbeariaId)
    .eq('telefone', telefone)
    .maybeSingle();
  return data !== null;
}
