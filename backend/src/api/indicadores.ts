import { Router } from 'express';
import { supabase } from '../supabase/client.js';
import { exigirBarbeiroLogado } from './auth.js';
import { calcularRecompraPorCliente } from '../indicadores/recompra.js';
import { calcularRankingBarbeiros } from '../indicadores/ranking.js';
import type { AtendimentoRealizado } from '../indicadores/tipos.js';

export const indicadoresRouter = Router();
indicadoresRouter.use('/api/indicadores', exigirBarbeiroLogado);

async function buscarAtendimentosRealizados(barbeariaId: string): Promise<AtendimentoRealizado[]> {
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

async function buscarClientesComAgendamentoFuturo(barbeariaId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('agendamentos')
    .select('cliente_id')
    .eq('barbearia_id', barbeariaId)
    .eq('status', 'confirmado')
    .gt('inicio', new Date().toISOString());

  return new Set((data ?? []).map((a) => a.cliente_id));
}

// Período de recompra por cliente + sinalização de quem está atrasado.
indicadoresRouter.get('/api/indicadores/recompra', async (req, res) => {
  try {
    const barbeariaId = req.barbeiro!.barbearia_id;
    const atendimentos = await buscarAtendimentosRealizados(barbeariaId);
    const status = calcularRecompraPorCliente(atendimentos);

    const idsClientes = status.map((s) => s.clienteId);
    const { data: clientes } = await supabase.from('clientes').select('id, nome, telefone').in('id', idsClientes);
    const nomesPorId = new Map((clientes ?? []).map((c) => [c.id, c]));

    const resultado = status
      .map((s) => ({ ...s, cliente: nomesPorId.get(s.clienteId) ?? null }))
      .sort((a, b) => b.diasDesdeUltimoAtendimento - a.diasDesdeUltimoAtendimento);

    res.json({ recompra: resultado });
  } catch (erro) {
    res.status(500).json({ erro: erro instanceof Error ? erro.message : 'erro_desconhecido' });
  }
});

// Ranking de barbeiro: faturamento, número de atendimentos, taxa de recompra dos
// clientes atendidos por cada um.
indicadoresRouter.get('/api/indicadores/ranking-barbeiros', async (req, res) => {
  try {
    const barbeariaId = req.barbeiro!.barbearia_id;
    const atendimentos = await buscarAtendimentosRealizados(barbeariaId);
    const ranking = calcularRankingBarbeiros(atendimentos);

    const idsBarbeiros = ranking.map((r) => r.barbeiroId);
    const { data: barbeiros } = await supabase.from('barbeiros').select('id, nome').in('id', idsBarbeiros);
    const nomesPorId = new Map((barbeiros ?? []).map((b) => [b.id, b.nome]));

    const resultado = ranking.map((r) => ({ ...r, nome: nomesPorId.get(r.barbeiroId) ?? '—' }));
    res.json({ ranking: resultado });
  } catch (erro) {
    res.status(500).json({ erro: erro instanceof Error ? erro.message : 'erro_desconhecido' });
  }
});

// Clientes inativos/churn: atrasados em relação ao próprio padrão E que ainda não
// têm um novo agendamento marcado (se já remarcaram sozinhos, não precisam de
// contato de retenção).
indicadoresRouter.get('/api/indicadores/churn', async (req, res) => {
  try {
    const barbeariaId = req.barbeiro!.barbearia_id;
    const [atendimentos, comFuturo] = await Promise.all([
      buscarAtendimentosRealizados(barbeariaId),
      buscarClientesComAgendamentoFuturo(barbeariaId),
    ]);

    const status = calcularRecompraPorCliente(atendimentos);
    const emChurn = status.filter((s) => s.atrasado && !comFuturo.has(s.clienteId));

    const idsClientes = emChurn.map((s) => s.clienteId);
    const { data: clientes } = await supabase.from('clientes').select('id, nome, telefone').in('id', idsClientes);
    const nomesPorId = new Map((clientes ?? []).map((c) => [c.id, c]));

    const resultado = emChurn
      .map((s) => ({ ...s, cliente: nomesPorId.get(s.clienteId) ?? null }))
      .sort((a, b) => b.diasDesdeUltimoAtendimento - a.diasDesdeUltimoAtendimento);

    res.json({ churn: resultado });
  } catch (erro) {
    res.status(500).json({ erro: erro instanceof Error ? erro.message : 'erro_desconhecido' });
  }
});
