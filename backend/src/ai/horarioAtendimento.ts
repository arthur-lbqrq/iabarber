const HORA_ABERTURA = 8;
const HORA_FECHAMENTO = 20;

export const MENSAGEM_FORA_DO_HORARIO =
  'Nosso atendimento por aqui é das 8h às 20h. Assim que abrir de novo eu te respondo — pode deixar sua mensagem que não se perde.';

// Checagem simples de horário (não é o horário de funcionamento da barbearia em si,
// que já é tratado em horarios_disponiveis — isso aqui só evita acionar o Claude, e o
// custo que vem junto, fora do horário em que alguém da equipe acompanha o WhatsApp).
export function dentroDoHorarioDeAtendimento(agora: Date = new Date()): boolean {
  const hora = agora.getHours();
  return hora >= HORA_ABERTURA && hora < HORA_FECHAMENTO;
}
