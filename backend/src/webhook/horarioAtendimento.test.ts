import { describe, expect, it } from 'vitest';
import { dentroDoHorario } from './horarioAtendimento.js';

function horas(h: number, m = 0): Date {
  const data = new Date('2026-01-01T00:00:00');
  data.setHours(h, m, 0, 0);
  return data;
}

describe('dentroDoHorario', () => {
  it('dentro do intervalo configurado', () => {
    expect(dentroDoHorario(horas(10), '08:00', '20:00')).toBe(true);
  });

  it('exatamente no início, já conta como dentro', () => {
    expect(dentroDoHorario(horas(8, 0), '08:00', '20:00')).toBe(true);
  });

  it('exatamente no fim, já conta como fora', () => {
    expect(dentroDoHorario(horas(20, 0), '08:00', '20:00')).toBe(false);
  });

  it('antes do início, fora', () => {
    expect(dentroDoHorario(horas(6, 30), '08:00', '20:00')).toBe(false);
  });

  it('depois do fim, fora', () => {
    expect(dentroDoHorario(horas(23), '08:00', '20:00')).toBe(false);
  });
});
