import { Router } from 'express';
import { supabase } from '../supabase/client.js';
import { buscarChats } from '../webhook/evolutionClient.js';
import { BARBEARIA_PADRAO } from '../config/barbearia.js';
import { exigirBarbeiroLogado } from './auth.js';

export const conversasRouter = Router();

function extrairPreviaTexto(chat: Awaited<ReturnType<typeof buscarChats>>[number]): string {
  const mensagem = chat.lastMessage?.message;
  const texto = mensagem?.conversation ?? mensagem?.extendedTextMessage?.text;
  return texto ?? '[mídia ou mensagem sem texto]';
}

conversasRouter.get('/api/conversas', exigirBarbeiroLogado, async (_req, res) => {
  try {
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('id, nome, telefone')
      .eq('barbearia_id', BARBEARIA_PADRAO.barbeariaId);

    if (error) throw error;

    const chats = await buscarChats();
    const chatsPorTelefone = new Map(
      chats
        .filter((chat) => chat.remoteJid.endsWith('@s.whatsapp.net'))
        .map((chat) => [chat.remoteJid.replace('@s.whatsapp.net', ''), chat]),
    );

    const conversas = (clientes ?? [])
      .map((cliente) => {
        const chat = chatsPorTelefone.get(cliente.telefone);
        return {
          clienteId: cliente.id,
          nome: cliente.nome,
          telefone: cliente.telefone,
          ultimaMensagem: chat ? extrairPreviaTexto(chat) : null,
          fromMe: chat?.lastMessage?.key?.fromMe ?? null,
          atualizadoEm: chat?.updatedAt ?? null,
        };
      })
      .sort((a, b) => {
        if (!a.atualizadoEm) return 1;
        if (!b.atualizadoEm) return -1;
        return new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime();
      });

    res.json({ conversas });
  } catch (erro) {
    console.error('[api/conversas] erro:', erro);
    res.status(500).json({ erro: 'falha_ao_buscar_conversas' });
  }
});
