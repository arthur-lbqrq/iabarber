import { supabase } from '../supabase/client.js';

interface ProximoAgendamento {
  id: string;
  inicio: string;
}

export async function buscarProximoAgendamento(
  barbeariaId: string,
  telefone: string,
): Promise<ProximoAgendamento | null> {
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('barbearia_id', barbeariaId)
    .eq('telefone', telefone)
    .maybeSingle();
  if (!cliente) return null;

  const { data: agendamento } = await supabase
    .from('agendamentos')
    .select('id, inicio')
    .eq('barbearia_id', barbeariaId)
    .eq('cliente_id', cliente.id)
    .eq('status', 'confirmado')
    .gte('inicio', new Date().toISOString())
    .order('inicio', { ascending: true })
    .limit(1)
    .maybeSingle();

  return agendamento;
}
