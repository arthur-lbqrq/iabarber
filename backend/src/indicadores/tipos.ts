// Um "atendimento realizado" é um agendamento confirmado/concluído cujo horário já
// passou — cancelado e no_show não contam (não aconteceu de verdade), e um
// agendamento confirmado no futuro também não (ainda não foi atendido).
export interface AtendimentoRealizado {
  clienteId: string;
  barbeiroId: string;
  inicio: string; // ISO
  precoCentavos: number | null;
}
