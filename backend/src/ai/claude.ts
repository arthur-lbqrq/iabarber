import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { env } from '../config/env.js';
import { supabase } from '../supabase/client.js';
import { BARBEARIA_PADRAO } from '../config/barbearia.js';
import { buscarBarbeiroPorTelefone } from '../tools/buscarBarbeiroPorTelefone.js';
import { FERRAMENTAS_CLIENTE, FERRAMENTAS_ADMIN, executarFerramenta } from './tools.js';

const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });

const MODELO = 'claude-sonnet-5';
const MAX_TOKENS_RESPOSTA = 400;
const MAX_RODADAS_DE_FERRAMENTA = 4; // trava de segurança contra loop e custo

async function montarSystemPromptCliente(nomeBarbearia: string): Promise<string> {
  const agora = new Date();
  const dataHoje = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `Você é o Bento, assistente de agendamento da ${nomeBarbearia}, respondendo
pelo WhatsApp. Hoje é ${dataHoje} (fuso horário de Brasília). A barbearia tem dois
profissionais: Igor e Tinho.

Tom de voz: direto, caloroso, confiável. Chame a pessoa pelo primeiro nome quando souber.
Frases curtas. Uma pergunta por mensagem. Nunca diga que é um robô, mas também nunca finja
que não é se perguntarem. Se perguntarem seu nome, é Bento.

Regras:
- Use "consultar_horarios_disponiveis" antes de sugerir ou confirmar qualquer horário —
  nunca invente horário livre.
- Se o cliente não disser com qual profissional quer (Igor ou Tinho), pergunte, ou
  consulte os dois e apresente as opções de cada um.
- Só chame "criar_agendamento" depois que o cliente confirmar profissional, dia, hora
  e serviço.
- "cancelar_agendamento" cancela o próximo agendamento confirmado do cliente atual —
  confirme com a pessoa antes de cancelar.
- Se um horário pedido não estiver livre, ofereça as opções mais próximas que estiverem.
- Responda sempre em português do Brasil, em texto simples (sem markdown), curto o
  suficiente pra uma mensagem de WhatsApp.`;
}

function montarSystemPromptAdmin(nomeBarbearia: string, nomeAdmin: string): string {
  const agora = new Date();
  const dataHoje = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `Você é o Bento, falando agora com ${nomeAdmin}, que é um dos barbeiros/admins
da ${nomeBarbearia} — não um cliente. Hoje é ${dataHoje} (fuso horário de Brasília).

Neste modo você ajuda a gerenciar a barbearia: ver a agenda completa, mudar horário de
funcionamento, mudar dados ou preço de um serviço.

Regras importantes:
- Ações de mudança (atualizar_horario_funcionamento, atualizar_servico,
  atualizar_valor_servico) são sensíveis. NUNCA chame essas ferramentas com
  confirmado=true de primeira — primeiro descreva exatamente o que vai mudar e
  pergunte se está certo. Só chame com confirmado=true depois que ${nomeAdmin}
  confirmar explicitamente (ex: "sim", "confirma", "pode mudar").
- Tom direto e objetivo — é uma conversa de trabalho, não precisa ser tão caloroso
  quanto com cliente.
- Responda sempre em português do Brasil, em texto simples (sem markdown), curto o
  suficiente pra uma mensagem de WhatsApp.`;
}

export async function gerarResposta(
  telefoneRemetente: string,
  mensagemDoUsuario: string,
): Promise<string> {
  const { barbeariaId } = BARBEARIA_PADRAO;

  const { data: barbearia } = await supabase
    .from('barbearias')
    .select('nome')
    .eq('id', barbeariaId)
    .single();
  const nomeBarbearia = barbearia?.nome ?? 'barbearia';

  const admin = await buscarBarbeiroPorTelefone(barbeariaId, telefoneRemetente);

  const system = admin
    ? montarSystemPromptAdmin(nomeBarbearia, admin.nome)
    : await montarSystemPromptCliente(nomeBarbearia);

  const ferramentas = admin ? FERRAMENTAS_ADMIN : FERRAMENTAS_CLIENTE;
  const contexto = admin
    ? ({ tipo: 'admin' as const, barbeariaId, adminId: admin.id })
    : ({ tipo: 'cliente' as const, barbeariaId, clienteTelefone: telefoneRemetente });

  const mensagens: MessageParam[] = [{ role: 'user', content: mensagemDoUsuario }];

  for (let rodada = 0; rodada < MAX_RODADAS_DE_FERRAMENTA; rodada++) {
    const resposta = await anthropic.messages.create({
      model: MODELO,
      max_tokens: MAX_TOKENS_RESPOSTA,
      system,
      tools: ferramentas,
      messages: mensagens,
    });

    if (resposta.stop_reason !== 'tool_use') {
      const bloco = resposta.content.find((b) => b.type === 'text');
      return bloco?.type === 'text' ? bloco.text : '(resposta sem texto)';
    }

    mensagens.push({ role: 'assistant', content: resposta.content });

    const blocosDeFerramenta = resposta.content.filter((b) => b.type === 'tool_use');
    const resultados = await Promise.all(
      blocosDeFerramenta.map(async (bloco) => {
        const resultado = await executarFerramenta(
          bloco.name,
          bloco.input as Record<string, unknown>,
          contexto,
        );
        console.log(`[claude] (${contexto.tipo}) tool_use: ${bloco.name}`, bloco.input, '->', resultado);
        return {
          type: 'tool_result' as const,
          tool_use_id: bloco.id,
          content: JSON.stringify(resultado),
        };
      }),
    );

    mensagens.push({ role: 'user', content: resultados });
  }

  return 'Deixa eu confirmar isso com calma e já te respondo — pode mandar de novo em instantes?';
}
