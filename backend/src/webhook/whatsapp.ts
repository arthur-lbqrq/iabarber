import { Router } from 'express';
import { gerarResposta } from '../ai/claude.js';
import { enviarMensagemTexto } from './evolutionClient.js';

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

  try {
    const resposta = await gerarResposta(numero, texto);
    await enviarMensagemTexto(numero, resposta);
    console.log(`[whatsapp] respondido pra ${numero}`);
  } catch (error) {
    console.error('[whatsapp] erro ao processar mensagem:', error);
  }
});
