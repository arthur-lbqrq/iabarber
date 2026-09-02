import type Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../supabase/client.js';
import { consultarHorariosDisponiveis } from '../tools/consultarHorarios.js';
import { criarAgendamento } from '../tools/criarAgendamento.js';
import { cancelarAgendamento } from '../tools/cancelarAgendamento.js';
import { buscarProximoAgendamento } from '../tools/buscarAgendamentoCliente.js';
import {
  consultarAgendaCompleta,
  atualizarHorarioFuncionamento,
  atualizarServico,
  atualizarValorServico,
  resolverDiaSemana,
} from '../tools/adminBarbearia.js';

// ---------------------------------------------------------------------------
// Tools de cliente
// ---------------------------------------------------------------------------

export const FERRAMENTAS_CLIENTE: Anthropic.Tool[] = [
  {
    name: 'consultar_horarios_disponiveis',
    description:
      'Consulta os horários livres de um serviço numa data específica. Se "barbeiro" não for informado, retorna os horários livres de cada barbeiro separadamente.',
    input_schema: {
      type: 'object',
      properties: {
        servico: {
          type: 'string',
          description: 'Nome do serviço, ex: "Corte de cabelo", "Barba", "Sobrancelha".',
        },
        data: { type: 'string', description: 'Data no formato YYYY-MM-DD.' },
        barbeiro: {
          type: 'string',
          description: 'Nome do barbeiro (ex: "Igor" ou "Tinho"), se o cliente já tiver preferência.',
        },
      },
      required: ['servico', 'data'],
    },
  },
  {
    name: 'criar_agendamento',
    description:
      'Cria um agendamento confirmado pro cliente desta conversa. Só chame depois de confirmar barbeiro, dia, hora e serviço com o cliente.',
    input_schema: {
      type: 'object',
      properties: {
        barbeiro: { type: 'string', description: 'Nome do barbeiro (ex: "Igor" ou "Tinho").' },
        servico: { type: 'string', description: 'Nome do serviço.' },
        data: { type: 'string', description: 'Data no formato YYYY-MM-DD.' },
        hora: { type: 'string', description: 'Hora no formato HH:MM.' },
        cliente_nome: { type: 'string', description: 'Primeiro nome do cliente, se ele disse.' },
      },
      required: ['barbeiro', 'servico', 'data', 'hora'],
    },
  },
  {
    name: 'cancelar_agendamento',
    description: 'Cancela o próximo agendamento confirmado do cliente desta conversa.',
    input_schema: { type: 'object', properties: {} },
  },
];

// ---------------------------------------------------------------------------
// Tools de admin (só entram na conversa quando o número já foi verificado no
// backend como um barbeiro cadastrado — o modelo nunca decide isso sozinho)
// ---------------------------------------------------------------------------

export const FERRAMENTAS_ADMIN: Anthropic.Tool[] = [
  {
    name: 'consultar_agenda_completa',
    description: 'Lista todos os agendamentos (de qualquer barbeiro e status) numa data.',
    input_schema: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'Data no formato YYYY-MM-DD.' },
      },
      required: ['data'],
    },
  },
  {
    name: 'atualizar_horario_funcionamento',
    description:
      'Muda o horário de trabalho de um barbeiro num dia da semana, ou fecha o dia. Ação sensível: só chame com confirmado=true depois que a pessoa confirmar explicitamente os detalhes.',
    input_schema: {
      type: 'object',
      properties: {
        barbeiro: { type: 'string', description: 'Nome do barbeiro. Se omitido, assume quem está falando.' },
        dia_semana: {
          type: 'string',
          description: 'Dia da semana por extenso: domingo, segunda, terca, quarta, quinta, sexta ou sabado.',
        },
        fechado: { type: 'boolean', description: 'true pra fechar esse dia (não atende).' },
        hora_inicio: { type: 'string', description: 'HH:MM — obrigatório se fechado=false.' },
        hora_fim: { type: 'string', description: 'HH:MM — obrigatório se fechado=false.' },
        confirmado: { type: 'boolean', description: 'true somente depois da pessoa confirmar os detalhes.' },
      },
      required: ['dia_semana', 'fechado', 'confirmado'],
    },
  },
  {
    name: 'atualizar_servico',
    description:
      'Muda nome, duração ou se está ativo/inativo num serviço. Ação sensível: só chame com confirmado=true depois de confirmar com a pessoa.',
    input_schema: {
      type: 'object',
      properties: {
        servico: { type: 'string', description: 'Nome atual do serviço.' },
        novo_nome: { type: 'string' },
        nova_duracao_minutos: { type: 'number' },
        ativo: { type: 'boolean' },
        confirmado: { type: 'boolean', description: 'true somente depois da pessoa confirmar os detalhes.' },
      },
      required: ['servico', 'confirmado'],
    },
  },
  {
    name: 'atualizar_valor_servico',
    description:
      'Muda o preço de um serviço. Ação sensível: só chame com confirmado=true depois de confirmar com a pessoa.',
    input_schema: {
      type: 'object',
      properties: {
        servico: { type: 'string', description: 'Nome do serviço.' },
        novo_preco_reais: { type: 'number', description: 'Novo preço em reais, ex: 25 ou 25.50.' },
        preco_variavel: { type: 'boolean', description: 'true se o preço virou/continua "a partir de".' },
        confirmado: { type: 'boolean', description: 'true somente depois da pessoa confirmar os detalhes.' },
      },
      required: ['servico', 'novo_preco_reais', 'confirmado'],
    },
  },
];

interface Servico {
  id: string;
  nome: string;
  duracao_minutos: number;
}

interface Barbeiro {
  id: string;
  nome: string;
}

async function resolverServicoPorNome(barbeariaId: string, nome: string): Promise<Servico | null> {
  const { data } = await supabase
    .from('servicos')
    .select('id, nome, duracao_minutos')
    .eq('barbearia_id', barbeariaId)
    .eq('ativo', true)
    .ilike('nome', nome)
    .maybeSingle();
  return data;
}

async function resolverBarbeiroPorNome(barbeariaId: string, nome: string): Promise<Barbeiro | null> {
  const { data } = await supabase
    .from('barbeiros')
    .select('id, nome')
    .eq('barbearia_id', barbeariaId)
    .eq('ativo', true)
    .ilike('nome', `${nome}%`)
    .maybeSingle();
  return data;
}

async function listarBarbeirosAtivos(barbeariaId: string): Promise<Barbeiro[]> {
  const { data } = await supabase
    .from('barbeiros')
    .select('id, nome')
    .eq('barbearia_id', barbeariaId)
    .eq('ativo', true);
  return data ?? [];
}

const MENSAGEM_PRECISA_CONFIRMAR = {
  erro: 'precisa_confirmar',
  mensagem: 'Confirme os detalhes com a pessoa antes de chamar esta ferramenta de novo com confirmado=true.',
};

// ---------------------------------------------------------------------------
// Execução — dois contextos possíveis: cliente (identificado por telefone) ou
// admin (identificado por já ter sido verificado no backend, id do barbeiro em mãos)
// ---------------------------------------------------------------------------

interface ContextoCliente {
  tipo: 'cliente';
  barbeariaId: string;
  clienteTelefone: string;
}

interface ContextoAdmin {
  tipo: 'admin';
  barbeariaId: string;
  adminId: string;
}

export async function executarFerramenta(
  nomeFerramenta: string,
  input: Record<string, unknown>,
  contexto: ContextoCliente | ContextoAdmin,
): Promise<unknown> {
  if (contexto.tipo === 'cliente') {
    return executarFerramentaCliente(nomeFerramenta, input, contexto);
  }
  return executarFerramentaAdmin(nomeFerramenta, input, contexto);
}

async function executarFerramentaCliente(
  nomeFerramenta: string,
  input: Record<string, unknown>,
  { barbeariaId, clienteTelefone }: ContextoCliente,
): Promise<unknown> {
  if (nomeFerramenta === 'consultar_horarios_disponiveis') {
    const servico = await resolverServicoPorNome(barbeariaId, String(input.servico));
    if (!servico) return { erro: 'servico_nao_encontrado' };

    const barbeiros = input.barbeiro
      ? [await resolverBarbeiroPorNome(barbeariaId, String(input.barbeiro))].filter(
          (b): b is Barbeiro => b !== null,
        )
      : await listarBarbeirosAtivos(barbeariaId);

    if (barbeiros.length === 0) return { erro: 'barbeiro_nao_encontrado' };

    const resultado: Record<string, string[]> = {};
    for (const barbeiro of barbeiros) {
      resultado[barbeiro.nome] = await consultarHorariosDisponiveis({
        barbeiroId: barbeiro.id,
        servicoId: servico.id,
        data: String(input.data),
      });
    }
    return { horarios_livres_por_barbeiro: resultado };
  }

  if (nomeFerramenta === 'criar_agendamento') {
    const servico = await resolverServicoPorNome(barbeariaId, String(input.servico));
    if (!servico) return { erro: 'servico_nao_encontrado' };

    const barbeiro = await resolverBarbeiroPorNome(barbeariaId, String(input.barbeiro));
    if (!barbeiro) return { erro: 'barbeiro_nao_encontrado' };

    return criarAgendamento({
      barbeariaId,
      barbeiroId: barbeiro.id,
      servicoId: servico.id,
      clienteTelefone,
      clienteNome: input.cliente_nome ? String(input.cliente_nome) : undefined,
      inicioISO: `${input.data}T${input.hora}:00`,
    });
  }

  if (nomeFerramenta === 'cancelar_agendamento') {
    const proximo = await buscarProximoAgendamento(barbeariaId, clienteTelefone);
    if (!proximo) return { erro: 'nenhum_agendamento_futuro' };
    return cancelarAgendamento(proximo.id);
  }

  return { erro: `ferramenta_desconhecida: ${nomeFerramenta}` };
}

async function executarFerramentaAdmin(
  nomeFerramenta: string,
  input: Record<string, unknown>,
  { barbeariaId, adminId }: ContextoAdmin,
): Promise<unknown> {
  if (nomeFerramenta === 'consultar_agenda_completa') {
    return consultarAgendaCompleta(barbeariaId, String(input.data));
  }

  if (nomeFerramenta === 'atualizar_horario_funcionamento') {
    if (input.confirmado !== true) return MENSAGEM_PRECISA_CONFIRMAR;

    const diaSemana = resolverDiaSemana(String(input.dia_semana));
    if (diaSemana === null) return { erro: 'dia_semana_invalido' };

    const barbeiroAlvo = input.barbeiro
      ? await resolverBarbeiroPorNome(barbeariaId, String(input.barbeiro))
      : { id: adminId, nome: '' };
    if (!barbeiroAlvo) return { erro: 'barbeiro_nao_encontrado' };

    return atualizarHorarioFuncionamento({
      barbeariaId,
      barbeiroAlvoId: barbeiroAlvo.id,
      diaSemana,
      horaInicio: input.hora_inicio ? String(input.hora_inicio) : undefined,
      horaFim: input.hora_fim ? String(input.hora_fim) : undefined,
      fechado: Boolean(input.fechado),
      adminId,
    });
  }

  if (nomeFerramenta === 'atualizar_servico') {
    if (input.confirmado !== true) return MENSAGEM_PRECISA_CONFIRMAR;

    return atualizarServico({
      barbeariaId,
      servicoNome: String(input.servico),
      novoNome: input.novo_nome ? String(input.novo_nome) : undefined,
      novaDuracaoMinutos: input.nova_duracao_minutos ? Number(input.nova_duracao_minutos) : undefined,
      ativo: input.ativo !== undefined ? Boolean(input.ativo) : undefined,
      adminId,
    });
  }

  if (nomeFerramenta === 'atualizar_valor_servico') {
    if (input.confirmado !== true) return MENSAGEM_PRECISA_CONFIRMAR;

    return atualizarValorServico({
      barbeariaId,
      servicoNome: String(input.servico),
      novoPrecoReais: Number(input.novo_preco_reais),
      precoVariavel: input.preco_variavel !== undefined ? Boolean(input.preco_variavel) : undefined,
      adminId,
    });
  }

  return { erro: `ferramenta_desconhecida: ${nomeFerramenta}` };
}
