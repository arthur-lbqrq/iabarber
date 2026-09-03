import { supabase } from '../supabase/client.js';

// Config antes espalhada entre código fixo (nome "Bento", horário 24/7) e variável
// de ambiente (RETENCAO_AUTOMATICA_ATIVA) — agora tudo mora na própria barbearia no
// banco, editável pela tela de Configurações sem precisar mexer em servidor.
export interface ConfiguracaoIA {
  nomeBarbearia: string;
  iaNome: string;
  iaTomVoz: string | null;
  retencaoAutomaticaAtiva: boolean;
  retencaoMensagemTemplate: string | null;
  retencaoJanelaDias: number;
  atendimento24h: boolean;
  atendimentoHoraInicio: string;
  atendimentoHoraFim: string;
}

export async function buscarConfiguracaoIA(barbeariaId: string): Promise<ConfiguracaoIA | null> {
  const { data } = await supabase
    .from('barbearias')
    .select(
      'nome, ia_nome, ia_tom_voz, retencao_automatica_ativa, retencao_mensagem_template, retencao_janela_dias, atendimento_24h, atendimento_hora_inicio, atendimento_hora_fim',
    )
    .eq('id', barbeariaId)
    .single();

  if (!data) return null;

  return {
    nomeBarbearia: data.nome,
    iaNome: data.ia_nome,
    iaTomVoz: data.ia_tom_voz,
    retencaoAutomaticaAtiva: data.retencao_automatica_ativa,
    retencaoMensagemTemplate: data.retencao_mensagem_template,
    retencaoJanelaDias: data.retencao_janela_dias,
    atendimento24h: data.atendimento_24h,
    atendimentoHoraInicio: data.atendimento_hora_inicio,
    atendimentoHoraFim: data.atendimento_hora_fim,
  };
}
