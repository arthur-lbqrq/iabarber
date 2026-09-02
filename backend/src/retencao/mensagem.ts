// Template fixo (não passa pelo Claude) de propósito: é um disparo em lote, sem
// gatilho do cliente — melhor previsível e revisável do que gerado na hora, e evita
// custo de API pra cada mensagem de um job automático.
export function formatarMensagemRetencao(nomeCliente: string | null, nomeBarbearia: string): string {
  const saudacao = nomeCliente ? `Oi, ${nomeCliente}!` : 'Oi!';
  return `${saudacao} Faz um tempo que você não vem na ${nomeBarbearia}.
Bora marcar um novo horário? É só responder aqui que eu já te mostro os horários livres.`;
}
