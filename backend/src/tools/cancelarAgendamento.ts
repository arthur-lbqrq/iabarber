import { supabase } from '../supabase/client.js';

export type ResultadoCancelarAgendamento =
  | { ok: true }
  | { ok: false; motivo: 'agendamento_nao_encontrado' };

export async function cancelarAgendamento(
  agendamentoId: string,
): Promise<ResultadoCancelarAgendamento> {
  const { data, error } = await supabase
    .from('agendamentos')
    .update({ status: 'cancelado' })
    .eq('id', agendamentoId)
    .eq('status', 'confirmado')
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) return { ok: false, motivo: 'agendamento_nao_encontrado' };

  return { ok: true };
}
