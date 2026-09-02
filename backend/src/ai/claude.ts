import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { env } from '../config/env.js';
import { supabase } from '../supabase/client.js';
import { BARBEARIA_PADRAO } from '../config/barbearia.js';
import { buscarBarbeiroPorTelefone } from '../tools/buscarBarbeiroPorTelefone.js';
import { FERRAMENTAS_CLIENTE, FERRAMENTAS_ADMIN, executarFerramenta } from './tools.js';
import { buscarAssinaturaAtivaPorTelefone, type AssinaturaAtivaInfo } from '../assinaturas/desconto.js';

const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });

const MODELO = 'claude-sonnet-5';
const MAX_TOKENS_RESPOSTA = 400;
const MAX_RODADAS_DE_FERRAMENTA = 4; // trava de segurança contra loop e custo

// Histórico da conversa por telefone, em memória do processo — cada chamada a
// gerarResposta partia do zero, então o Claude nunca via o que tinha sido dito antes.
// Guardar aqui (e não no banco) é suficiente pro estágio atual do MVP: some se o
// backend reiniciar, o que é uma perda aceitável agora, mas não seria numa versão que
// já dependesse de uptime contínuo em produção.
const HISTORICO_MAX_MENSAGENS = 20;
const historicoPorTelefone = new Map<string, MessageParam[]>();

function temToolResult(mensagem: MessageParam): boolean {
  return (
    Array.isArray(mensagem.content) &&
    mensagem.content.some((bloco) => typeof bloco === 'object' && bloco !== null && 'type' in bloco && bloco.type === 'tool_result')
  );
}

function salvarHistorico(telefone: string, mensagens: MessageParam[]): void {
  let recorte = mensagens.slice(-HISTORICO_MAX_MENSAGENS);
  // Um corte por contagem pode começar bem no meio de um par tool_use/tool_result —
  // a API rejeita um "tool_result" sem o "tool_use" correspondente na mensagem
  // anterior. Descarta do início até a primeira mensagem que não seja um resultado
  // órfão (foi exatamente esse bug que derrubou o backend com um erro 400 da Anthropic).
  while (recorte.length > 0 && temToolResult(recorte[0])) {
    recorte = recorte.slice(1);
  }
  historicoPorTelefone.set(telefone, recorte);
}

// Convenção comum em português do Brasil: 5h-12h bom dia, 12h-18h boa tarde, resto
// boa noite. Calculado em código e passado pronto pro prompt — mais confiável do que
// deixar o modelo inferir a saudação certa a partir só da hora numérica.
export function saudacaoAtual(agora: Date): string {
  const hora = agora.getHours();
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function contextoDeDataHora(agora: Date): string {
  const dataHoje = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const horaAgora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `Hoje é ${dataHoje}, agora são ${horaAgora} (fuso horário de Brasília). Saudação certa
pra esse horário: "${saudacaoAtual(agora)}" — use "${saudacaoAtual(agora)}" (não "oi"/"olá") quando
for natural cumprimentar (início da conversa, por exemplo), sem repetir em toda mensagem.`;
}

async function montarSystemPromptCliente(nomeBarbearia: string, statusAssinatura: AssinaturaAtivaInfo | null): Promise<string> {
  const agora = new Date();

  const linhaAssinatura = statusAssinatura
    ? `Este cliente TEM assinatura ativa (plano "${statusAssinatura.planoNome}"), com ${statusAssinatura.descontoPercentual}% de desconto nos serviços — o desconto já sai aplicado automaticamente ao agendar, não precisa calcular na mão. Pode mencionar isso se for relevante (ex: se perguntarem sobre preço ou assinatura).`
    : 'Este cliente não tem assinatura ativa hoje. Se perguntar sobre planos/assinatura, diga que a barbearia tem planos disponíveis, mas você ainda não tem como cadastrar uma assinatura nova pelo WhatsApp — é preciso falar com o barbeiro.';

  return `Você é o Bento, assistente de agendamento da ${nomeBarbearia}, respondendo
pelo WhatsApp. ${contextoDeDataHora(agora)} A barbearia tem dois profissionais: Igor
e Tinho.

${linhaAssinatura}

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
- Use "falar_com_atendente" quando o cliente pedir explicitamente uma pessoa, tiver uma
  reclamação, dúvida complexa, ou pedir algo que você não consegue resolver com as outras
  ferramentas — avisa o cliente que um atendente foi chamado e vai responder em breve.
- Responda sempre em português do Brasil, em texto simples (sem markdown), curto o
  suficiente pra uma mensagem de WhatsApp.`;
}

function montarSystemPromptAdmin(nomeBarbearia: string, nomeAdmin: string): string {
  const agora = new Date();

  return `Você é o Bento, falando agora com ${nomeAdmin}, que é um dos barbeiros/admins
da ${nomeBarbearia} — não um cliente. ${contextoDeDataHora(agora)}

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
    : await montarSystemPromptCliente(
        nomeBarbearia,
        await buscarAssinaturaAtivaPorTelefone(barbeariaId, telefoneRemetente),
      );

  const ferramentas = admin ? FERRAMENTAS_ADMIN : FERRAMENTAS_CLIENTE;
  const contexto = admin
    ? ({ tipo: 'admin' as const, barbeariaId, adminId: admin.id })
    : ({ tipo: 'cliente' as const, barbeariaId, clienteTelefone: telefoneRemetente });

  const mensagens: MessageParam[] = [
    ...(historicoPorTelefone.get(telefoneRemetente) ?? []),
    { role: 'user', content: mensagemDoUsuario },
  ];

  for (let rodada = 0; rodada < MAX_RODADAS_DE_FERRAMENTA; rodada++) {
    const resposta = await anthropic.messages.create({
      model: MODELO,
      max_tokens: MAX_TOKENS_RESPOSTA,
      system,
      tools: ferramentas,
      messages: mensagens,
    });

    if (resposta.stop_reason !== 'tool_use') {
      mensagens.push({ role: 'assistant', content: resposta.content });
      salvarHistorico(telefoneRemetente, mensagens);
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

  salvarHistorico(telefoneRemetente, mensagens);
  return 'Deixa eu confirmar isso com calma e já te respondo — pode mandar de novo em instantes?';
}
