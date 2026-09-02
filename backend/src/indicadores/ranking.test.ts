import { describe, expect, it } from 'vitest';
import { calcularRankingBarbeiros } from './ranking.js';

describe('calcularRankingBarbeiros', () => {
  it('soma faturamento e conta atendimentos por barbeiro', () => {
    const atendimentos = [
      { clienteId: 'c1', barbeiroId: 'igor', inicio: '2026-08-01', precoCentavos: 2500 },
      { clienteId: 'c2', barbeiroId: 'igor', inicio: '2026-08-05', precoCentavos: 3000 },
      { clienteId: 'c3', barbeiroId: 'tinho', inicio: '2026-08-10', precoCentavos: 1000 },
    ];

    const ranking = calcularRankingBarbeiros(atendimentos);
    const igor = ranking.find((r) => r.barbeiroId === 'igor');
    const tinho = ranking.find((r) => r.barbeiroId === 'tinho');

    expect(igor?.faturamentoCentavos).toBe(5500);
    expect(igor?.numeroAtendimentos).toBe(2);
    expect(tinho?.faturamentoCentavos).toBe(1000);
  });

  it('trata preço nulo (agendamento antigo, de antes do snapshot de preço) como zero, sem quebrar', () => {
    const atendimentos = [{ clienteId: 'c1', barbeiroId: 'igor', inicio: '2026-08-01', precoCentavos: null }];
    const ranking = calcularRankingBarbeiros(atendimentos);
    expect(ranking[0].faturamentoCentavos).toBe(0);
  });

  it('calcula taxa de recompra: cliente que voltou mais de uma vez conta, quem veio só 1x não', () => {
    const atendimentos = [
      { clienteId: 'c1', barbeiroId: 'igor', inicio: '2026-08-01', precoCentavos: 2000 },
      { clienteId: 'c1', barbeiroId: 'igor', inicio: '2026-08-20', precoCentavos: 2000 }, // c1 voltou
      { clienteId: 'c2', barbeiroId: 'igor', inicio: '2026-08-05', precoCentavos: 2000 }, // c2 só veio 1x
    ];
    const ranking = calcularRankingBarbeiros(atendimentos);
    // 1 de 2 clientes distintos voltou = 50%
    expect(ranking[0].taxaRecompraPercentual).toBe(50);
  });

  it('ordena do maior faturamento pro menor', () => {
    const atendimentos = [
      { clienteId: 'c1', barbeiroId: 'tinho', inicio: '2026-08-01', precoCentavos: 1000 },
      { clienteId: 'c2', barbeiroId: 'igor', inicio: '2026-08-01', precoCentavos: 9000 },
    ];
    const ranking = calcularRankingBarbeiros(atendimentos);
    expect(ranking[0].barbeiroId).toBe('igor');
    expect(ranking[1].barbeiroId).toBe('tinho');
  });

  it('sem atendimentos, retorna lista vazia', () => {
    expect(calcularRankingBarbeiros([])).toEqual([]);
  });
});
