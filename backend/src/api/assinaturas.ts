import { Router } from 'express';
import { supabase } from '../supabase/client.js';
import { exigirBarbeiroLogado } from './auth.js';
import { statusValido } from '../assinaturas/status.js';

export const assinaturasRouter = Router();
assinaturasRouter.use(['/api/planos', '/api/assinaturas'], exigirBarbeiroLogado);

// --- Planos ---

assinaturasRouter.get('/api/planos', async (req, res) => {
  const { data, error } = await supabase
    .from('planos')
    .select('id, nome, preco_centavos, periodicidade, descricao, desconto_percentual, ativo, plano_servicos(servico_id)')
    .eq('barbearia_id', req.barbeiro!.barbearia_id)
    .order('nome');

  if (error) {
    res.status(500).json({ erro: error.message });
    return;
  }
  res.json({ planos: data });
});

assinaturasRouter.post('/api/planos', async (req, res) => {
  const { nome, preco_centavos, periodicidade, descricao, desconto_percentual, servico_ids } = req.body as {
    nome?: string;
    preco_centavos?: number;
    periodicidade?: string;
    descricao?: string;
    desconto_percentual?: number;
    servico_ids?: string[];
  };

  if (!nome?.trim() || typeof preco_centavos !== 'number' || preco_centavos < 0) {
    res.status(400).json({ erro: 'campos_invalidos' });
    return;
  }

  const { data: plano, error } = await supabase
    .from('planos')
    .insert({
      barbearia_id: req.barbeiro!.barbearia_id,
      nome: nome.trim(),
      preco_centavos,
      periodicidade: periodicidade ?? 'mensal',
      descricao: descricao?.trim() || null,
      desconto_percentual: desconto_percentual ?? 0,
    })
    .select()
    .single();

  if (error || !plano) {
    res.status(500).json({ erro: error?.message ?? 'falha_ao_criar' });
    return;
  }

  if (servico_ids && servico_ids.length > 0) {
    const { error: erroVinculo } = await supabase.from('plano_servicos').insert(
      servico_ids.map((servicoId) => ({
        barbearia_id: req.barbeiro!.barbearia_id,
        plano_id: plano.id,
        servico_id: servicoId,
      })),
    );
    if (erroVinculo) {
      res.status(500).json({ erro: erroVinculo.message });
      return;
    }
  }

  res.status(201).json({ plano });
});

assinaturasRouter.patch('/api/planos/:id', async (req, res) => {
  const { nome, preco_centavos, descricao, desconto_percentual, ativo } = req.body as {
    nome?: string;
    preco_centavos?: number;
    descricao?: string | null;
    desconto_percentual?: number;
    ativo?: boolean;
  };

  const campos: Record<string, unknown> = {};
  if (nome !== undefined) campos.nome = nome.trim();
  if (preco_centavos !== undefined) campos.preco_centavos = preco_centavos;
  if (descricao !== undefined) campos.descricao = descricao?.trim() || null;
  if (desconto_percentual !== undefined) campos.desconto_percentual = desconto_percentual;
  if (ativo !== undefined) campos.ativo = ativo;

  const { data, error } = await supabase
    .from('planos')
    .update(campos)
    .eq('id', req.params.id)
    .eq('barbearia_id', req.barbeiro!.barbearia_id)
    .select()
    .single();

  if (error || !data) {
    res.status(500).json({ erro: error?.message ?? 'falha_ao_atualizar' });
    return;
  }
  res.json({ plano: data });
});

// --- Assinaturas ---

assinaturasRouter.get('/api/assinaturas', async (req, res) => {
  const { data, error } = await supabase
    .from('assinaturas')
    .select('id, status, inicio, fim, proximo_vencimento, metodo_pagamento, clientes(id, nome, telefone), planos(id, nome, preco_centavos)')
    .eq('barbearia_id', req.barbeiro!.barbearia_id)
    .order('inicio', { ascending: false });

  if (error) {
    res.status(500).json({ erro: error.message });
    return;
  }
  res.json({ assinaturas: data });
});

assinaturasRouter.post('/api/assinaturas', async (req, res) => {
  const { cliente_id, plano_id, proximo_vencimento } = req.body as {
    cliente_id?: string;
    plano_id?: string;
    proximo_vencimento?: string;
  };

  if (!cliente_id || !plano_id) {
    res.status(400).json({ erro: 'campos_invalidos' });
    return;
  }

  const { data, error } = await supabase
    .from('assinaturas')
    .insert({
      barbearia_id: req.barbeiro!.barbearia_id,
      cliente_id,
      plano_id,
      proximo_vencimento: proximo_vencimento ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    res.status(500).json({ erro: error?.message ?? 'falha_ao_criar' });
    return;
  }
  res.status(201).json({ assinatura: data });
});

// Controle manual de status — sem gateway de pagamento, é o admin/barbeiro que marca
// como paga (ativa), atrasada ou cancelada.
assinaturasRouter.patch('/api/assinaturas/:id/status', async (req, res) => {
  const { status, proximo_vencimento, metodo_pagamento, id_transacao_externa } = req.body as {
    status?: string;
    proximo_vencimento?: string | null;
    metodo_pagamento?: string | null;
    id_transacao_externa?: string | null;
  };

  if (!statusValido(status)) {
    res.status(400).json({ erro: 'status_invalido' });
    return;
  }

  const campos: Record<string, unknown> = { status };
  if (proximo_vencimento !== undefined) campos.proximo_vencimento = proximo_vencimento;
  if (metodo_pagamento !== undefined) campos.metodo_pagamento = metodo_pagamento;
  if (id_transacao_externa !== undefined) campos.id_transacao_externa = id_transacao_externa;

  const { data, error } = await supabase
    .from('assinaturas')
    .update(campos)
    .eq('id', req.params.id)
    .eq('barbearia_id', req.barbeiro!.barbearia_id)
    .select()
    .single();

  if (error || !data) {
    res.status(500).json({ erro: error?.message ?? 'falha_ao_atualizar' });
    return;
  }
  res.json({ assinatura: data });
});
