import { env } from '../config/env.js';

interface ChatEvolution {
  remoteJid: string;
  updatedAt: string;
  lastMessage?: {
    message?: { conversation?: string; extendedTextMessage?: { text: string } };
    key?: { fromMe: boolean };
    messageTimestamp?: number;
  };
}

export async function buscarChats(): Promise<ChatEvolution[]> {
  const url = `${env.evolutionApiUrl}/chat/findChats/${env.evolutionInstanceName}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.evolutionApiKey,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const corpo = await response.text();
    throw new Error(`Falha ao buscar chats na Evolution API (${response.status}): ${corpo}`);
  }

  return response.json();
}

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
