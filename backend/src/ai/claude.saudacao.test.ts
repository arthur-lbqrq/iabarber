import { describe, expect, it } from 'vitest';
import { saudacaoAtual } from './claude.js';

function horas(h: number): Date {
  const data = new Date('2026-01-01T00:00:00');
  data.setHours(h, 0, 0, 0);
  return data;
}

describe('saudacaoAtual', () => {
  it('madrugada (antes das 5h) é boa noite', () => {
    expect(saudacaoAtual(horas(3))).toBe('Boa noite');
  });

  it('início da manhã (5h) já é bom dia', () => {
    expect(saudacaoAtual(horas(5))).toBe('Bom dia');
  });

  it('fim da manhã (11h) ainda é bom dia', () => {
    expect(saudacaoAtual(horas(11))).toBe('Bom dia');
  });

  it('meio-dia (12h) já é boa tarde', () => {
    expect(saudacaoAtual(horas(12))).toBe('Boa tarde');
  });

  it('fim da tarde (17h) ainda é boa tarde', () => {
    expect(saudacaoAtual(horas(17))).toBe('Boa tarde');
  });

  it('noite (18h) já é boa noite', () => {
    expect(saudacaoAtual(horas(18))).toBe('Boa noite');
  });

  it('perto da meia-noite (23h) é boa noite', () => {
    expect(saudacaoAtual(horas(23))).toBe('Boa noite');
  });
});
