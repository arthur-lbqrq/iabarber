import { describe, expect, it } from 'vitest';
import { precisaLembreteDeRetencao } from './regra.js';

describe('precisaLembreteDeRetencao', () => {
  it('sem intervalo médio calculado (só 1 atendimento), nunca precisa de lembrete', () => {
    const status = { clienteId: 'c1', intervaloMedioDias: null, diasDesdeUltimoAtendimento: 200, atrasado: false };
    expect(precisaLembreteDeRetencao(status)).toBe(false);
  });

  it('longe da data prevista de retorno, não precisa de lembrete ainda', () => {
    // padrão de 30 dias, só se passaram 10 -> faltam 20, bem acima da janela padrão de 2
    const status = { clienteId: 'c1', intervaloMedioDias: 30, diasDesdeUltimoAtendimento: 10, atrasado: false };
    expect(precisaLembreteDeRetencao(status)).toBe(false);
  });

  it('bem perto da data prevista (dentro da janela), precisa de lembrete', () => {
    // padrão de 30 dias, já se passaram 29 -> falta só 1 dia, dentro da janela de 2
    const status = { clienteId: 'c1', intervaloMedioDias: 30, diasDesdeUltimoAtendimento: 29, atrasado: false };
    expect(precisaLembreteDeRetencao(status)).toBe(true);
  });

  it('já atrasado (passou da data prevista), também precisa de lembrete', () => {
    const status = { clienteId: 'c1', intervaloMedioDias: 30, diasDesdeUltimoAtendimento: 45, atrasado: true };
    expect(precisaLembreteDeRetencao(status)).toBe(true);
  });

  it('respeita uma janela customizada', () => {
    const status = { clienteId: 'c1', intervaloMedioDias: 30, diasDesdeUltimoAtendimento: 20, atrasado: false };
    expect(precisaLembreteDeRetencao(status, 5)).toBe(false); // faltam 10, janela é 5
    expect(precisaLembreteDeRetencao(status, 15)).toBe(true); // faltam 10, janela é 15
  });
});
