import { supabase } from '../supabase/client.js';
import type { AtendimentoRealizado } from './tipos.js';

export async function buscarAtendimentosRealizados(barbeariaId: string): Promise<AtendimentoRealizado[]> {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('cliente_id, barbeiro_id, inicio, preco_centavos')
    .eq('barbearia_id', barbeariaId)
    .in('status', ['confirmado', 'concluido'])
    .lte('inicio', new Date().toISOString());

  if (error) throw error;

  return (data ?? []).map((a) => ({
    clienteId: a.cliente_id,
    barbeiroId: a.barbeiro_id,
    inicio: a.inicio,
    precoCentavos: a.preco_centavos,
  }));
}

export async function buscarClientesComAgendamentoFuturo(barbeariaId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('agendamentos')
    .select('cliente_id')
    .eq('barbearia_id', barbeariaId)
    .eq('status', 'confirmado')
    .gt('inicio', new Date().toISOString());

  return new Set((data ?? []).map((a) => a.cliente_id));
}
