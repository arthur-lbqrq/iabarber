// Sem gateway de pagamento nesta fase — o status muda por controle manual (endpoint
// admin/barbeiro) em vez de webhook de pagamento. Isolado numa função pura pra dar
// pra testar sem precisar subir o Express nem o Supabase.
export const STATUS_VALIDOS = ['ativa', 'atrasada', 'cancelada', 'pendente'] as const;
export type StatusAssinatura = (typeof STATUS_VALIDOS)[number];

export function statusValido(valor: unknown): valor is StatusAssinatura {
  return typeof valor === 'string' && (STATUS_VALIDOS as readonly string[]).includes(valor);
}
