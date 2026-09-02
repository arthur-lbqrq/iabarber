import { env } from '../config/env.js';

export async function enviarMensagemTexto(numero: string, texto: string): Promise<void> {
  const url = `${env.evolutionApiUrl}/message/sendText/${env.evolutionInstanceName}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.evolutionApiKey,
    },
    body: JSON.stringify({ number: numero, text: texto }),
  });

  if (!response.ok) {
    const corpo = await response.text();
    throw new Error(`Falha ao enviar mensagem via Evolution API (${response.status}): ${corpo}`);
  }
}
