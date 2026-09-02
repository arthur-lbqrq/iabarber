import { Router } from 'express';
import { supabase } from '../supabase/client.js';
import { falarComAtendente } from '../tools/falarComAtendente.js';

// Diferente das rotas /api/* (painel, autenticado por sessão de barbeiro) — essas
// aqui são pensadas pra abrir direto por um link mandado pro próprio cliente, sem
// login nenhum. A "autenticação" é só saber o token (UUID de 128 bits, não
// adivinhável), por isso o CORS libera qualquer origem — não tem sessão/cookie
// ambiente pra proteger, só o token na própria URL.
export const publicoRouter = Router();

publicoRouter.use('/publico', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

interface ClientePublico {
  id: string;
  barbearia_id: string;
  nome: string | null;
  telefone: string;
}

async function buscarClientePorToken(token: string): Promise<ClientePublico | null> {
  const { data } = await supabase
    .from('clientes')
    .select('id, barbearia_id, nome, telefone')
    .eq('token_publico', token)
    .maybeSingle();
  return data;
}

publicoRouter.get('/publico/clientes/:token', async (req, res) => {
  const cliente = await buscarClientePorToken(req.params.token);
  if (!cliente) {
    res.status(404).json({ erro: 'token_invalido' });
    return;
  }

  const [{ data: agendamentos }, { data: assinatura }, { data: barbearia }] = await Promise.all([
    supabase
      .from('agendamentos')
      .select('id, inicio, fim, status, preco_centavos, servicos(nome), barbeiros(nome)')
      .eq('cliente_id', cliente.id)
      .order('inicio', { ascending: false }),
    supabase
      .from('assinaturas')
      .select('status, inicio, fim, proximo_vencimento, planos(nome, preco_centavos, desconto_percentual)')
      .eq('cliente_id', cliente.id)
      .eq('status', 'ativa')
      .maybeSingle(),
    supabase.from('barbearias').select('nome').eq('id', cliente.barbearia_id).single(),
  ]);

  res.json({
    cliente: { nome: cliente.nome, telefone: cliente.telefone },
    barbearia: barbearia?.nome ?? null,
    agendamentos: agendamentos ?? [],
    assinatura: assinatura ?? null,
  });
});

publicoRouter.post('/publico/clientes/:token/solicitar-reagendamento', async (req, res) => {
  const cliente = await buscarClientePorToken(req.params.token);
  if (!cliente) {
    res.status(404).json({ erro: 'token_invalido' });
    return;
  }

  const { mensagem } = req.body as { mensagem?: string };

  // Reaproveita o mesmo mecanismo de "falar com atendente" da IA (etapa 2) — avisa
  // os barbeiros ativos por WhatsApp, em vez de criar uma fila de solicitações nova
  // que ninguém teria como ver ainda (não foi pedida nenhuma tela pra isso).
  await falarComAtendente({
    barbeariaId: cliente.barbearia_id,
    clienteTelefone: cliente.telefone,
    motivo: mensagem
      ? `Pediu reagendamento pela página pública: "${mensagem}"`
      : 'Pediu reagendamento pela página pública.',
  });

  res.json({ ok: true, mensagem: 'Solicitação enviada! Alguém vai te responder por aqui ou pelo WhatsApp em breve.' });
});
