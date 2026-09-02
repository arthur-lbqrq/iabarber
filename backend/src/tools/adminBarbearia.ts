import { supabase } from '../supabase/client.js';

const NOMES_DIA_SEMANA: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  'terça': 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
  'sábado': 6,
};

async function registrarAuditoria(
  barbeariaId: string,
  barbeiroId: string,
  acao: string,
  detalhes: Record<string, unknown>,
): Promise<void> {
  await supabase.from('auditoria_admin').insert({
    barbearia_id: barbeariaId,
    barbeiro_id: barbeiroId,
    acao,
    detalhes,
  });
}

export function resolverDiaSemana(diaTexto: string): number | null {
  const chave = diaTexto.trim().toLowerCase();
  return chave in NOMES_DIA_SEMANA ? NOMES_DIA_SEMANA[chave] : null;
}

interface AgendaDoDia {
  hora: string;
  cliente: string;
  barbeiro: string;
  servico: string;
  status: string;
}

export async function consultarAgendaCompleta(
  barbeariaId: string,
  data: string,
): Promise<AgendaDoDia[]> {
  const inicioDoDia = new Date(`${data}T00:00:00`);
  const fimDoDia = new Date(`${data}T23:59:59`);

  const { data: agendamentos, error } = await supabase
    .from('agendamentos')
    .select('inicio, status, clientes(nome, telefone), barbeiros(nome), servicos(nome)')
    .eq('barbearia_id', barbeariaId)
    .gte('inicio', inicioDoDia.toISOString())
    .lte('inicio', fimDoDia.toISOString())
    .order('inicio', { ascending: true });

  if (error) throw error;

  return ((agendamentos ?? []) as unknown as Array<{
    inicio: string;
    status: string;
    clientes: { nome: string | null; telefone: string } | null;
    barbeiros: { nome: string } | null;
    servicos: { nome: string } | null;
  }>).map((ag) => ({
    hora: new Date(ag.inicio).toTimeString().slice(0, 5),
    cliente: ag.clientes?.nome || ag.clientes?.telefone || 'desconhecido',
    barbeiro: ag.barbeiros?.nome ?? 'desconhecido',
    servico: ag.servicos?.nome ?? 'desconhecido',
    status: ag.status,
  }));
}

interface AtualizarHorarioParams {
  barbeariaId: string;
  barbeiroAlvoId: string;
  diaSemana: number;
  horaInicio?: string;
  horaFim?: string;
  fechado: boolean;
  adminId: string;
}

export async function atualizarHorarioFuncionamento({
  barbeariaId,
  barbeiroAlvoId,
  diaSemana,
  horaInicio,
  horaFim,
  fechado,
  adminId,
}: AtualizarHorarioParams): Promise<{ ok: true }> {
  await supabase
    .from('horarios_disponiveis')
    .delete()
    .eq('barbearia_id', barbeariaId)
    .eq('barbeiro_id', barbeiroAlvoId)
    .eq('dia_semana', diaSemana);

  if (!fechado) {
    if (!horaInicio || !horaFim) {
      throw new Error('hora_inicio e hora_fim são obrigatórios quando o dia não está fechado');
    }
    await supabase.from('horarios_disponiveis').insert({
      barbearia_id: barbeariaId,
      barbeiro_id: barbeiroAlvoId,
      dia_semana: diaSemana,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
    });
  }

  await registrarAuditoria(barbeariaId, adminId, 'atualizar_horario_funcionamento', {
    barbeiroAlvoId,
    diaSemana,
    horaInicio,
    horaFim,
    fechado,
  });

  return { ok: true };
}

interface AtualizarServicoParams {
  barbeariaId: string;
  servicoNome: string;
  novoNome?: string;
  novaDuracaoMinutos?: number;
  ativo?: boolean;
  adminId: string;
}

export async function atualizarServico({
  barbeariaId,
  servicoNome,
  novoNome,
  novaDuracaoMinutos,
  ativo,
  adminId,
}: AtualizarServicoParams): Promise<{ ok: boolean; motivo?: string }> {
  const { data: servico } = await supabase
    .from('servicos')
    .select('id')
    .eq('barbearia_id', barbeariaId)
    .ilike('nome', servicoNome)
    .maybeSingle();

  if (!servico) return { ok: false, motivo: 'servico_nao_encontrado' };

  const campos: Record<string, unknown> = {};
  if (novoNome) campos.nome = novoNome;
  if (novaDuracaoMinutos) campos.duracao_minutos = novaDuracaoMinutos;
  if (ativo !== undefined) campos.ativo = ativo;

  await supabase.from('servicos').update(campos).eq('id', servico.id);

  await registrarAuditoria(barbeariaId, adminId, 'atualizar_servico', {
    servicoNome,
    ...campos,
  });

  return { ok: true };
}

interface AtualizarValorServicoParams {
  barbeariaId: string;
  servicoNome: string;
  novoPrecoReais: number;
  precoVariavel?: boolean;
  adminId: string;
}

export async function atualizarValorServico({
  barbeariaId,
  servicoNome,
  novoPrecoReais,
  precoVariavel,
  adminId,
}: AtualizarValorServicoParams): Promise<{ ok: boolean; motivo?: string }> {
  const { data: servico } = await supabase
    .from('servicos')
    .select('id')
    .eq('barbearia_id', barbeariaId)
    .ilike('nome', servicoNome)
    .maybeSingle();

  if (!servico) return { ok: false, motivo: 'servico_nao_encontrado' };

  const campos: Record<string, unknown> = {
    preco_centavos: Math.round(novoPrecoReais * 100),
  };
  if (precoVariavel !== undefined) campos.preco_variavel = precoVariavel;

  await supabase.from('servicos').update(campos).eq('id', servico.id);

  await registrarAuditoria(barbeariaId, adminId, 'atualizar_valor_servico', {
    servicoNome,
    novoPrecoReais,
    precoVariavel,
  });

  return { ok: true };
}
