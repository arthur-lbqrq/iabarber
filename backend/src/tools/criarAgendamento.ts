import { supabase } from '../supabase/client.js';
import { buscarDescontoAtivo, calcularPrecoComDesconto } from '../assinaturas/desconto.js';

const CODIGO_POSTGRES_CONFLITO_HORARIO = '23P01'; // exclusion_violation

interface CriarAgendamentoParams {
  barbeariaId: string;
  barbeiroId: string;
  servicoId: string;
  clienteTelefone: string;
  clienteNome?: string;
  inicioISO: string;
}

export type ResultadoCriarAgendamento =
  | { ok: true; agendamentoId: string; precoCentavos: number }
  | { ok: false; motivo: 'horario_ocupado' | 'servico_nao_encontrado' };

export async function criarAgendamento({
  barbeariaId,
  barbeiroId,
  servicoId,
  clienteTelefone,
  clienteNome,
  inicioISO,
}: CriarAgendamentoParams): Promise<ResultadoCriarAgendamento> {
  const { data: servico, error: erroServico } = await supabase
    .from('servicos')
    .select('duracao_minutos, preco_centavos')
    .eq('id', servicoId)
    .single();
  if (erroServico || !servico) {
    return { ok: false, motivo: 'servico_nao_encontrado' };
  }

  const inicio = new Date(inicioISO);
  const fim = new Date(inicio.getTime() + servico.duracao_minutos * 60_000);

  const { data: cliente, error: erroCliente } = await supabase
    .from('clientes')
    .upsert(
      { barbearia_id: barbeariaId, telefone: clienteTelefone, nome: clienteNome },
      { onConflict: 'barbearia_id,telefone', ignoreDuplicates: false },
    )
    .select('id')
    .single();
  if (erroCliente || !cliente) throw erroCliente;

  const descontoPercentual = await buscarDescontoAtivo(barbeariaId, cliente.id);
  const precoCentavos = calcularPrecoComDesconto(servico.preco_centavos, descontoPercentual);

  const { data: agendamento, error: erroAgendamento } = await supabase
    .from('agendamentos')
    .insert({
      barbearia_id: barbeariaId,
      barbeiro_id: barbeiroId,
      cliente_id: cliente.id,
      servico_id: servicoId,
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      preco_centavos: precoCentavos,
    })
    .select('id')
    .single();

  if (erroAgendamento) {
    if (erroAgendamento.code === CODIGO_POSTGRES_CONFLITO_HORARIO) {
      return { ok: false, motivo: 'horario_ocupado' };
    }
    throw erroAgendamento;
  }

  return { ok: true, agendamentoId: agendamento.id, precoCentavos };
}
