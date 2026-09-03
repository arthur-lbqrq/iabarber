import { Router } from 'express';
import { supabase } from '../supabase/client.js';
import { exigirBarbeiroLogado } from './auth.js';
import { buscarConfiguracaoIA } from '../config/configuracaoIA.js';

export const configuracaoIARouter = Router();
configuracaoIARouter.use('/api/configuracao-ia', exigirBarbeiroLogado);

configuracaoIARouter.get('/api/configuracao-ia', async (req, res) => {
  const config = await buscarConfiguracaoIA(req.barbeiro!.barbearia_id);
  if (!config) {
    res.status(404).json({ erro: 'barbearia_nao_encontrada' });
    return;
  }
  res.json({ configuracao: config });
});

interface CorpoAtualizacao {
  ia_nome?: string;
  ia_tom_voz?: string | null;
  retencao_automatica_ativa?: boolean;
  retencao_mensagem_template?: string | null;
  retencao_janela_dias?: number;
  atendimento_24h?: boolean;
  atendimento_hora_inicio?: string;
  atendimento_hora_fim?: string;
}

const CAMPOS_PERMITIDOS = [
  'ia_nome',
  'ia_tom_voz',
  'retencao_automatica_ativa',
  'retencao_mensagem_template',
  'retencao_janela_dias',
  'atendimento_24h',
  'atendimento_hora_inicio',
  'atendimento_hora_fim',
] as const;

configuracaoIARouter.patch('/api/configuracao-ia', async (req, res) => {
  const corpo = req.body as CorpoAtualizacao;

  const campos: Record<string, unknown> = {};
  for (const chave of CAMPOS_PERMITIDOS) {
    if (corpo[chave] !== undefined) campos[chave] = corpo[chave];
  }

  if (Object.keys(campos).length === 0) {
    res.status(400).json({ erro: 'nenhum_campo_valido' });
    return;
  }

  if (campos.ia_nome !== undefined && !String(campos.ia_nome).trim()) {
    res.status(400).json({ erro: 'ia_nome_nao_pode_ser_vazio' });
    return;
  }

  const { error } = await supabase
    .from('barbearias')
    .update(campos)
    .eq('id', req.barbeiro!.barbearia_id);

  if (error) {
    res.status(500).json({ erro: error.message });
    return;
  }

  const config = await buscarConfiguracaoIA(req.barbeiro!.barbearia_id);
  res.json({ configuracao: config });
});
