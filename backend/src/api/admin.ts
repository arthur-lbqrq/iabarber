import { Router } from 'express';
import { supabase } from '../supabase/client.js';
import { exigirAdminCorteCerto } from './adminAuth.js';

export const adminRouter = Router();
adminRouter.use('/api/admin', exigirAdminCorteCerto);

async function registrarAuditoria(
  adminId: string,
  barbeariaId: string,
  acao: string,
  detalhes: Record<string, unknown>,
): Promise<void> {
  await supabase.from('auditoria_admin').insert({ admin_id: adminId, barbearia_id: barbeariaId, acao, detalhes });
}

// Confirma que o token é de um admin de verdade e devolve os dados dele — o
// frontend usa isso logo após o login pra saber se deixa entrar ou desloga (a
// tabela `admins` tem RLS sem nenhuma policy, então não dá pra checar isso direto
// do frontend com a anon key).
adminRouter.get('/api/admin/me', async (req, res) => {
  res.json({ admin: req.admin });
});

// --- Barbearias ---

adminRouter.get('/api/admin/barbearias', async (_req, res) => {
  const [{ data: barbearias, error }, { data: barbeiros }] = await Promise.all([
    supabase.from('barbearias').select('id, nome, telefone, ativo, created_at').order('created_at', { ascending: false }),
    supabase.from('barbeiros').select('id, barbearia_id, ativo'),
  ]);

  if (error) {
    res.status(500).json({ erro: error.message });
    return;
  }

  const contagens = new Map<string, { total: number; ativos: number }>();
  for (const b of barbeiros ?? []) {
    const atual = contagens.get(b.barbearia_id) ?? { total: 0, ativos: 0 };
    atual.total += 1;
    if (b.ativo) atual.ativos += 1;
    contagens.set(b.barbearia_id, atual);
  }

  const resultado = (barbearias ?? []).map((b) => ({
    ...b,
    barbeiros_total: contagens.get(b.id)?.total ?? 0,
    barbeiros_ativos: contagens.get(b.id)?.ativos ?? 0,
  }));

  res.json({ barbearias: resultado });
});

adminRouter.post('/api/admin/barbearias', async (req, res) => {
  const { nome, telefone } = req.body as { nome?: string; telefone?: string };
  if (!nome?.trim()) {
    res.status(400).json({ erro: 'nome_obrigatorio' });
    return;
  }

  const { data, error } = await supabase
    .from('barbearias')
    .insert({ nome: nome.trim(), telefone: telefone?.trim() || null })
    .select()
    .single();

  if (error || !data) {
    res.status(500).json({ erro: error?.message ?? 'falha_ao_criar' });
    return;
  }

  await registrarAuditoria(req.admin!.id, data.id, 'criar_barbearia', { nome: data.nome });
  res.status(201).json({ barbearia: data });
});

adminRouter.get('/api/admin/barbearias/:id', async (req, res) => {
  const { id } = req.params;

  const [{ data: barbearia, error }, { data: barbeiros }, { count: servicosCount }, { count: agendamentosCount }] =
    await Promise.all([
      supabase.from('barbearias').select('*').eq('id', id).single(),
      supabase.from('barbeiros').select('id, nome, telefone, ativo, user_id').eq('barbearia_id', id).order('nome'),
      supabase.from('servicos').select('id', { count: 'exact', head: true }).eq('barbearia_id', id),
      supabase.from('agendamentos').select('id', { count: 'exact', head: true }).eq('barbearia_id', id),
    ]);

  if (error || !barbearia) {
    res.status(404).json({ erro: 'barbearia_nao_encontrada' });
    return;
  }

  res.json({
    barbearia,
    barbeiros: barbeiros ?? [],
    servicos_total: servicosCount ?? 0,
    agendamentos_total: agendamentosCount ?? 0,
  });
});

adminRouter.patch('/api/admin/barbearias/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, telefone, ativo } = req.body as { nome?: string; telefone?: string | null; ativo?: boolean };

  const campos: Record<string, unknown> = {};
  if (nome !== undefined) campos.nome = nome.trim();
  if (telefone !== undefined) campos.telefone = telefone?.trim() || null;
  if (ativo !== undefined) campos.ativo = ativo;

  const { data, error } = await supabase.from('barbearias').update(campos).eq('id', id).select().single();

  if (error || !data) {
    res.status(500).json({ erro: error?.message ?? 'falha_ao_atualizar' });
    return;
  }

  await registrarAuditoria(req.admin!.id, id, 'atualizar_barbearia', campos);
  res.json({ barbearia: data });
});

// --- Barbeiros de uma barbearia ---

adminRouter.post('/api/admin/barbearias/:id/barbeiros', async (req, res) => {
  const { id: barbeariaId } = req.params;
  const { nome, telefone, email, senha } = req.body as {
    nome?: string;
    telefone?: string;
    email?: string;
    senha?: string;
  };

  if (!nome?.trim() || !email?.trim() || !senha || senha.length < 6) {
    res.status(400).json({ erro: 'campos_invalidos' });
    return;
  }

  const { data: usuario, error: erroUsuario } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password: senha,
    email_confirm: true,
  });

  if (erroUsuario || !usuario.user) {
    res.status(500).json({ erro: erroUsuario?.message ?? 'falha_ao_criar_login' });
    return;
  }

  const { data: barbeiro, error: erroBarbeiro } = await supabase
    .from('barbeiros')
    .insert({
      barbearia_id: barbeariaId,
      user_id: usuario.user.id,
      nome: nome.trim(),
      telefone: telefone?.trim() || null,
      ativo: true,
    })
    .select()
    .single();

  if (erroBarbeiro || !barbeiro) {
    // Login já foi criado — desfaz pra não deixar um usuário órfão sem barbeiro.
    await supabase.auth.admin.deleteUser(usuario.user.id);
    res.status(500).json({ erro: erroBarbeiro?.message ?? 'falha_ao_criar_barbeiro' });
    return;
  }

  await registrarAuditoria(req.admin!.id, barbeariaId, 'criar_barbeiro', { nome: barbeiro.nome, email });
  res.status(201).json({ barbeiro });
});

adminRouter.patch('/api/admin/barbearias/:id/barbeiros/:barbeiroId', async (req, res) => {
  const { id: barbeariaId, barbeiroId } = req.params;
  const { nome, telefone, ativo } = req.body as { nome?: string; telefone?: string | null; ativo?: boolean };

  const campos: Record<string, unknown> = {};
  if (nome !== undefined) campos.nome = nome.trim();
  if (telefone !== undefined) campos.telefone = telefone?.trim() || null;
  if (ativo !== undefined) campos.ativo = ativo;

  const { data, error } = await supabase
    .from('barbeiros')
    .update(campos)
    .eq('id', barbeiroId)
    .eq('barbearia_id', barbeariaId)
    .select()
    .single();

  if (error || !data) {
    res.status(500).json({ erro: error?.message ?? 'falha_ao_atualizar' });
    return;
  }

  await registrarAuditoria(req.admin!.id, barbeariaId, 'atualizar_barbeiro', { barbeiro_id: barbeiroId, ...campos });
  res.json({ barbeiro: data });
});
