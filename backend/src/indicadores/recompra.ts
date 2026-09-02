import type { AtendimentoRealizado } from './tipos.js';

const MS_POR_DIA = 86_400_000;

export interface StatusRecompraCliente {
  clienteId: string;
  intervaloMedioDias: number | null; // null = só teve 1 atendimento, sem histórico suficiente pra calcular
  diasDesdeUltimoAtendimento: number;
  atrasado: boolean;
}

// Regra de negócio: um cliente está "atrasado" quando já passou mais tempo desde o
// último atendimento do que o intervalo médio entre os atendimentos dele mesmo (não
// um número fixo pra todo mundo — cada cliente tem o próprio padrão de recorrência).
// Com só 1 atendimento no histórico não dá pra calcular um intervalo médio pessoal,
// então nunca marca como atrasado nesse caso (sem dado suficiente pra afirmar isso).
export function calcularStatusRecompra(
  clienteId: string,
  datasAtendimentos: Date[],
  agora: Date = new Date(),
): StatusRecompraCliente | null {
  if (datasAtendimentos.length === 0) return null;

  const ordenadas = [...datasAtendimentos].sort((a, b) => a.getTime() - b.getTime());
  const ultimo = ordenadas[ordenadas.length - 1];
  const diasDesdeUltimoAtendimento = Math.floor((agora.getTime() - ultimo.getTime()) / MS_POR_DIA);

  if (ordenadas.length < 2) {
    return { clienteId, intervaloMedioDias: null, diasDesdeUltimoAtendimento, atrasado: false };
  }

  const intervalos: number[] = [];
  for (let i = 1; i < ordenadas.length; i++) {
    intervalos.push((ordenadas[i].getTime() - ordenadas[i - 1].getTime()) / MS_POR_DIA);
  }
  const intervaloMedioDias = intervalos.reduce((soma, dias) => soma + dias, 0) / intervalos.length;

  return {
    clienteId,
    intervaloMedioDias: Math.round(intervaloMedioDias),
    diasDesdeUltimoAtendimento,
    atrasado: diasDesdeUltimoAtendimento > intervaloMedioDias,
  };
}

export function calcularRecompraPorCliente(
  atendimentos: AtendimentoRealizado[],
  agora: Date = new Date(),
): StatusRecompraCliente[] {
  const porCliente = new Map<string, Date[]>();
  for (const a of atendimentos) {
    const lista = porCliente.get(a.clienteId) ?? [];
    lista.push(new Date(a.inicio));
    porCliente.set(a.clienteId, lista);
  }

  const resultado: StatusRecompraCliente[] = [];
  for (const [clienteId, datas] of porCliente) {
    const status = calcularStatusRecompra(clienteId, datas, agora);
    if (status) resultado.push(status);
  }
  return resultado;
}
