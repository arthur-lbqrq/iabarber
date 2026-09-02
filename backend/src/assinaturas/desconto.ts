import { supabase } from '../supabase/client.js';

// Regra de negócio: assinante com assinatura ativa tem desconto no serviço, no
// percentual configurado no plano dele. Função pura (sem I/O) pra ser fácil de testar
// isoladamente — quem busca o percentual no banco é buscarAssinaturaAtiva, abaixo.
export function calcularPrecoComDesconto(precoCentavos: number, descontoPercentual: number): number {
  if (descontoPercentual <= 0) return precoCentavos;
  const desconto = Math.round((precoCentavos * descontoPercentual) / 100);
  return Math.max(0, precoCentavos - desconto);
}

export interface AssinaturaAtivaInfo {
  planoNome: string;
  descontoPercentual: number;
}

async function buscarAssinaturaAtiva(barbeariaId: string, clienteId: string): Promise<AssinaturaAtivaInfo | null> {
  const { data } = await supabase
    .from('assinaturas')
    .select('planos(nome, desconto_percentual)')
    .eq('barbearia_id', barbeariaId)
    .eq('cliente_id', clienteId)
    .eq('status', 'ativa')
    .limit(1)
    .maybeSingle<{ planos: { nome: string; desconto_percentual: number } | null }>();

  if (!data?.planos) return null;
  return { planoNome: data.planos.nome, descontoPercentual: data.planos.desconto_percentual };
}

export async function buscarDescontoAtivo(barbeariaId: string, clienteId: string): Promise<number> {
  const info = await buscarAssinaturaAtiva(barbeariaId, clienteId);
  return info?.descontoPercentual ?? 0;
}

// Usado pra dar contexto de assinatura pra IA numa conversa — aqui só temos o
// telefone (o cliente pode nem existir ainda em `clientes`, se for a primeira
// mensagem dele), diferente de buscarDescontoAtivo, que já é chamado depois do
// cliente ser resolvido/criado dentro de criarAgendamento.
export async function buscarAssinaturaAtivaPorTelefone(
  barbeariaId: string,
  telefone: string,
): Promise<AssinaturaAtivaInfo | null> {
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('barbearia_id', barbeariaId)
    .eq('telefone', telefone)
    .maybeSingle();

  if (!cliente) return null;
  return buscarAssinaturaAtiva(barbeariaId, cliente.id);
}
