import { Router } from 'express';
import { gerarResposta } from '../ai/claude.js';
import { enviarMensagemTexto } from './evolutionClient.js';
import { numeroBloqueado } from './numerosBloqueados.js';
import { dentroDoHorario, mensagemForaDoHorario } from './horarioAtendimento.js';
import { BARBEARIA_PADRAO } from '../config/barbearia.js';
import { buscarConfiguracaoIA } from '../config/configuracaoIA.js';

interface EvolutionWebhookPayload {
  event: string;
  data: {
    key: { remoteJid: string; fromMe: boolean; id: string };
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
    };
  };
}

export const whatsappWebhookRouter = Router();

whatsappWebhookRouter.post('/webhook/whatsapp*', async (req, res) => {
  res.status(200).end();

  const payload = req.body as EvolutionWebhookPayload;
  if (payload.event !== 'messages.upsert') return;

  const { key, message } = payload.data;
  if (key.fromMe) return;
  if (key.remoteJid.endsWith('@g.us')) return;

  const texto = message?.conversation ?? message?.extendedTextMessage?.text;
  if (!texto) return;

  const numero = key.remoteJid.replace('@s.whatsapp.net', '');

  console.log(`[whatsapp] mensagem de ${numero}: ${texto}`);

  if (await numeroBloqueado(BARBEARIA_PADRAO.barbeariaId, numero)) {
    console.log(`[whatsapp] ${numero} está na lista de bloqueados — ignorando, sem chamar a IA`);
    return;
  }

  const config = await buscarConfiguracaoIA(BARBEARIA_PADRAO.barbeariaId);
  if (config && !config.atendimento24h && !dentroDoHorario(new Date(), config.atendimentoHoraInicio, config.atendimentoHoraFim)) {
    console.log(`[whatsapp] fora do horário de atendimento configurado — resposta padrão pra ${numero}, sem chamar a IA`);
    await enviarMensagemTexto(numero, mensagemForaDoHorario(config.atendimentoHoraInicio, config.atendimentoHoraFim));
    return;
  }

  try {
    const resposta = await gerarResposta(numero, texto);
    await enviarMensagemTexto(numero, resposta);
    console.log(`[whatsapp] respondido pra ${numero}`);
  } catch (error) {
    console.error('[whatsapp] erro ao processar mensagem:', error);
  }
});
