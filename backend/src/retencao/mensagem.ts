// Template padrão (não passa pelo Claude, de propósito — disparo em lote, sem gatilho
// do cliente, então previsível/revisável é melhor do que gerado na hora, e evita custo
// de API pra cada mensagem de um job automático). O dono da barbearia pode substituir
// por um template próprio na tela de Configurações — aceita os tokens {nome} e
// {barbearia}, os únicos dois dados que a mensagem tem disponível nesse ponto.
const TEMPLATE_PADRAO =
  'Oi, {nome}! Faz um tempo que você não vem na {barbearia}.\nBora marcar um novo horário? É só responder aqui que eu já te mostro os horários livres.';

export function formatarMensagemRetencao(
  nomeCliente: string | null,
  nomeBarbearia: string,
  templatePersonalizado?: string | null,
): string {
  const template = templatePersonalizado?.trim() || TEMPLATE_PADRAO;
  return template.replaceAll('{nome}', nomeCliente ?? 'você').replaceAll('{barbearia}', nomeBarbearia);
}
