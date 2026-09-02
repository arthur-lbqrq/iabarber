import type { StatusRecompraCliente } from '../indicadores/recompra.js';

// Regra de negócio: manda lembrete de retenção pra quem está perto da data prevista
// de retorno (dentro de `janelaDias`) OU já passou dela — não só pra quem já está
// definitivamente atrasado, porque o objetivo é chegar ANTES do cliente sumir de vez.
// Sem intervalo médio calculado (só 1 atendimento no histórico), não dá pra saber
// quando "deveria" voltar, então nunca entra na régua de retenção.
export function precisaLembreteDeRetencao(status: StatusRecompraCliente, janelaDias = 2): boolean {
  if (status.intervaloMedioDias === null) return false;
  const diasParaProximoEsperado = status.intervaloMedioDias - status.diasDesdeUltimoAtendimento;
  return diasParaProximoEsperado <= janelaDias;
}
