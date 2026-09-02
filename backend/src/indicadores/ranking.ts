import type { AtendimentoRealizado } from './tipos.js';

export interface RankingBarbeiro {
  barbeiroId: string;
  faturamentoCentavos: number;
  numeroAtendimentos: number;
  // % de clientes atendidos por esse barbeiro que voltaram mais de uma vez.
  taxaRecompraPercentual: number;
}

export function calcularRankingBarbeiros(atendimentos: AtendimentoRealizado[]): RankingBarbeiro[] {
  const porBarbeiro = new Map<string, { faturamento: number; total: number; clientes: Map<string, number> }>();

  for (const a of atendimentos) {
    const atual = porBarbeiro.get(a.barbeiroId) ?? { faturamento: 0, total: 0, clientes: new Map<string, number>() };
    atual.faturamento += a.precoCentavos ?? 0;
    atual.total += 1;
    atual.clientes.set(a.clienteId, (atual.clientes.get(a.clienteId) ?? 0) + 1);
    porBarbeiro.set(a.barbeiroId, atual);
  }

  return Array.from(porBarbeiro.entries())
    .map(([barbeiroId, dados]) => {
      const totalClientes = dados.clientes.size;
      const clientesRecorrentes = Array.from(dados.clientes.values()).filter((n) => n > 1).length;
      const taxaRecompraPercentual = totalClientes > 0 ? Math.round((clientesRecorrentes / totalClientes) * 100) : 0;

      return {
        barbeiroId,
        faturamentoCentavos: dados.faturamento,
        numeroAtendimentos: dados.total,
        taxaRecompraPercentual,
      };
    })
    .sort((a, b) => b.faturamentoCentavos - a.faturamentoCentavos);
}
