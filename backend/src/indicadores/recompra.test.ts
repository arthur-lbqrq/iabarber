import { describe, expect, it } from 'vitest';
import { calcularStatusRecompra, calcularRecompraPorCliente } from './recompra.js';

const AGORA = new Date('2026-09-02T12:00:00Z');
const diasAtras = (dias: number) => new Date(AGORA.getTime() - dias * 86_400_000);

describe('calcularStatusRecompra', () => {
  it('sem nenhum atendimento, retorna null (não tem o que calcular)', () => {
    expect(calcularStatusRecompra('c1', [], AGORA)).toBeNull();
  });

  it('com só 1 atendimento, não marca como atrasado (sem histórico suficiente)', () => {
    const status = calcularStatusRecompra('c1', [diasAtras(90)], AGORA);
    expect(status?.intervaloMedioDias).toBeNull();
    expect(status?.atrasado).toBe(false);
    expect(status?.diasDesdeUltimoAtendimento).toBe(90);
  });

  it('cliente com padrão de 30 em 30 dias, dentro do prazo, não está atrasado', () => {
    // veio há 30, 60 e 90 dias — intervalo médio 30 dias, último foi há 30 dias: em dia
    const status = calcularStatusRecompra('c1', [diasAtras(90), diasAtras(60), diasAtras(30)], AGORA);
    expect(status?.intervaloMedioDias).toBe(30);
    expect(status?.atrasado).toBe(false);
  });

  it('cliente com padrão de 30 em 30 dias, mas já se passaram 45 dias, está atrasado', () => {
    const status = calcularStatusRecompra('c1', [diasAtras(105), diasAtras(75), diasAtras(45)], AGORA);
    expect(status?.intervaloMedioDias).toBe(30);
    expect(status?.atrasado).toBe(true);
    expect(status?.diasDesdeUltimoAtendimento).toBe(45);
  });

  it('funciona com as datas fora de ordem (ordena antes de calcular)', () => {
    const status = calcularStatusRecompra('c1', [diasAtras(30), diasAtras(90), diasAtras(60)], AGORA);
    expect(status?.intervaloMedioDias).toBe(30);
  });
});

describe('calcularRecompraPorCliente', () => {
  it('agrupa atendimentos por cliente e calcula o status de cada um separadamente', () => {
    const atendimentos = [
      { clienteId: 'c1', barbeiroId: 'b1', inicio: diasAtras(90).toISOString(), precoCentavos: 2500 },
      { clienteId: 'c1', barbeiroId: 'b1', inicio: diasAtras(30).toISOString(), precoCentavos: 2500 },
      { clienteId: 'c2', barbeiroId: 'b1', inicio: diasAtras(5).toISOString(), precoCentavos: 2500 },
    ];

    const resultado = calcularRecompraPorCliente(atendimentos, AGORA);
    expect(resultado).toHaveLength(2);

    const c1 = resultado.find((r) => r.clienteId === 'c1');
    const c2 = resultado.find((r) => r.clienteId === 'c2');
    expect(c1?.intervaloMedioDias).toBe(60);
    expect(c2?.intervaloMedioDias).toBeNull(); // só 1 atendimento
  });
});
